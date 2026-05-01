// =============================================================================
// STEAM SYNC SERVICE — Standalone sync logic callable by routes AND background jobs
// =============================================================================
// This module extracts the core Steam sync operations out of the route handlers
// so they can be reused by:
//   1. Route handlers (for direct user-initiated syncs via API)
//   2. Background job workers (for automatic retries on failure)
//
// None of these functions depend on Express req/res — they only need a userId.
// =============================================================================

const { pool } = require('../config/dbConfig');
const {
    getSteamPlayerSummaries,
    getSteamOwnedGames,
    getSteamPlayerAchievements
} = require('./externalApis');

/**
 * Syncs all relevant Steam profile fields from GetPlayerSummaries to the profiles table.
 * Always syncs public fields (avatar, personaname, profileurl, lastlogoff).
 * Only syncs private-gated fields (timecreated, loccountrycode) when the profile is public
 * (communityvisibilitystate === 3).
 *
 * @param {string} steamId - The user's SteamID64.
 * @param {string} userId  - The plasmaUserID (UUID).
 * @returns {{ synced: boolean, isPrivate: boolean }} Sync result.
 */
async function syncSteamProfile(steamId, userId) {
    const summaries = await getSteamPlayerSummaries(steamId);
    if (!summaries || summaries.length === 0) {
        return { synced: false, isPrivate: false };
    }

    const player = summaries[0];

    // --- Always-public fields (available even on private profiles) ---
    const avatarURL = player.avatarfull || null;
    const personaName = player.personaname || null;
    const profileURL = player.profileurl || null;
    const lastLogoff = player.lastlogoff
        ? new Date(player.lastlogoff * 1000)
        : null;

    // --- Privacy-gated fields (only present when communityvisibilitystate === 3) ---
    const isPublic = player.communityvisibilitystate === 3;
    const steamMemberSince = isPublic && player.timecreated
        ? new Date(player.timecreated * 1000)
        : null;
    const countryCode = isPublic && player.loccountrycode
        ? player.loccountrycode
        : null;

    await pool.query(`
        UPDATE "profiles" SET
            "avatarURL"         = COALESCE($1, "avatarURL"),
            "steamPersonaName"  = COALESCE($2, "steamPersonaName"),
            "steamProfileURL"   = COALESCE($3, "steamProfileURL"),
            "lastLogoff"        = COALESCE($4, "lastLogoff"),
            "steamMemberSince"  = COALESCE($5, "steamMemberSince"),
            "countryCode"       = COALESCE($6, "countryCode"),
            "isSteamProfilePrivate" = $7
        WHERE "plasmaUserID" = $8
    `, [avatarURL, personaName, profileURL, lastLogoff, steamMemberSince, countryCode, !isPublic, userId]);

    return { synced: true, isPrivate: !isPublic };
}

/**
 * Syncs a user's Steam library (profile avatar + owned games).
 * Extracted from the POST /api/library/sync/steam route handler.
 *
 * @param {string} userId - The plasmaUserID (UUID) of the user to sync.
 * @returns {{ syncedGames: number }} Number of games synced.
 * @throws If the user has no Steam account linked or if Steam API fails.
 */
async function syncSteamLibrary(userId) {
    // 1. Get user's steamId64
    const user = await pool.query(
        'SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1',
        [userId]
    );
    if (user.rows.length === 0 || !user.rows[0].steamID64) {
        throw new Error('Steam account not linked');
    }
    const steamId = user.rows[0].steamID64;

    // 2. Sync full profile from Steam (avatar, personaName, etc.)
    const { isPrivate } = await syncSteamProfile(steamId, userId);
    if (isPrivate) {
        console.log(`[Steam] User ${userId} has a private profile. Library fetch might return partial/empty data.`);
    }

    // 3. Fetch Owned Games (Library Sync)
    const games = await getSteamOwnedGames(steamId);
    let addedCount = 0;

    if (games && games.length > 0) {
        addedCount = games.length;

        const appIds = games.map(g => g.appid.toString());
        const titles = games.map(g => g.name);
        const coverArts = appIds.map(
            appId => `https://steamcdn-a.akamaihd.net/steam/apps/${appId}/library_600x900.jpg`
        );

        // Batch insert missing games into the global games table
        await pool.query(`
            INSERT INTO "games" ("appID", "title", "platform", "coverArtURL")
            SELECT id, title, 'STEAM', cover
            FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, title, cover)
            ON CONFLICT ("appID") DO UPDATE SET
                "coverArtURL" = EXCLUDED."coverArtURL"
        `, [appIds, titles, coverArts]);

        // Batch insert/update user library entries
        const userIds = Array(games.length).fill(userId);
        const hoursPlayed = games.map(g => (g.playtime_forever / 60).toFixed(2));

        await pool.query(`
            INSERT INTO "library_entries" ("userID", "appID", "hoursPlayed")
            SELECT uid, aid, hrs::numeric
            FROM unnest($1::uuid[], $2::text[], $3::text[]) AS t(uid, aid, hrs)
            ON CONFLICT ("userID", "appID") DO UPDATE SET
                "hoursPlayed" = EXCLUDED."hoursPlayed"
        `, [userIds, appIds, hoursPlayed]);
    }

    return { syncedGames: addedCount };
}

/**
 * Syncs Steam achievements for ALL games in a user's library.
 * Extracted from the POST /api/steam/sync/achievements route handler.
 *
 * @param {string} userId - The plasmaUserID (UUID) of the user.
 * @returns {{ totalSynced: number, gamesProcessed: number, failedGames: Array<{appId: string, reason: string, httpStatus: number|null}> }}
 * @throws If the user has no Steam account linked.
 */
async function syncSteamAchievements(userId) {
    // 1. Get user's steamID64
    const user = await pool.query(
        'SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1',
        [userId]
    );
    if (user.rows.length === 0 || !user.rows[0].steamID64) {
        throw new Error('Steam account not linked');
    }
    const steamId = user.rows[0].steamID64;

    // 1b. Sync full profile from Steam
    try {
        const { isPrivate } = await syncSteamProfile(steamId, userId);
        if (isPrivate) {
            console.log(`[Steam] User ${userId} profile is private. Achievements will likely be inaccessible.`);
        }
    } catch (profileErr) {
        // Non-critical: log and continue with achievement sync
        console.warn('[Steam] Profile sync failed during background achievement sync:', profileErr.message);
    }

    // 2. Get all STEAM games in this user's library
    const libraryResult = await pool.query(`
        SELECT g."appID" FROM "library_entries" le
        JOIN "games" g ON le."appID" = g."appID"
        WHERE le."userID" = $1 AND g."platform" = 'STEAM'
    `, [userId]);

    let totalSynced = 0;
    let gamesProcessed = 0;
    let newAchievements = [];
    let newUserAchievements = [];
    let failedGames = [];

    // Run Steam API requests sequentially to avoid rate limiting
    for (const row of libraryResult.rows) {
        const appId = row.appID;
        try {
            const achievementData = await getSteamPlayerAchievements(steamId, appId);
            if (!achievementData || !achievementData.achievements) continue;

            gamesProcessed++;

            for (const ach of achievementData.achievements) {
                if (ach.achieved !== 1) continue;

                const achievementID = `steam_${appId}_${ach.apiname}`;
                const unlockedAt = ach.unlocktime || Math.floor(Date.now() / 1000);
                const title = ach.name || ach.apiname;

                newAchievements.push({ achievementID, appId, title });
                newUserAchievements.push({ userID: userId, achievementID, unlockedAt });
                totalSynced++;
            }
        } catch (gameErr) {
            // Steam returns 400 for apps that don't support stats/achievements — skip silently
            if (gameErr.response && gameErr.response.status === 400) {
                continue;
            }
            // Log the EXACT reason for failure (HTTP status, message)
            failedGames.push({
                appId,
                reason: gameErr.message || 'Unknown error',
                httpStatus: gameErr.response?.status || null
            });
        }
    }

    // Execute bulk inserts if any achievements were found
    if (newAchievements.length > 0) {
        const achIds = newAchievements.map(a => a.achievementID);
        const appIds = newAchievements.map(a => a.appId);
        const titles = newAchievements.map(a => a.title);

        await pool.query(`
            INSERT INTO "achievements" ("achievementID", "appID", "title", "rarityWeight", "plasmaXP")
            SELECT id, app, title, 1.0, 25
            FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, app, title)
            ON CONFLICT ("achievementID") DO NOTHING
        `, [achIds, appIds, titles]);

        const userIds = newUserAchievements.map(a => a.userID);
        const uAchIds = newUserAchievements.map(a => a.achievementID);
        const unlockedAts = newUserAchievements.map(a => a.unlockedAt);

        await pool.query(`
            INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
            SELECT uid, aid, to_timestamp(ts)
            FROM unnest($1::uuid[], $2::text[], $3::bigint[]) AS t(uid, aid, ts)
            ON CONFLICT ("userID", "achievementID") DO NOTHING
        `, [userIds, uAchIds, unlockedAts]);
    }

    // Update profile XP
    const xpResult = await pool.query(`
        SELECT COALESCE(SUM(a."plasmaXP"), 0) as "totalXP"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        WHERE ua."userID" = $1
    `, [userId]);

    await pool.query(`
        UPDATE "profiles" SET "totalPlasmaXP" = $1 WHERE "plasmaUserID" = $2
    `, [parseInt(xpResult.rows[0].totalXP) || 0, userId]);

    return { totalSynced, gamesProcessed, failedGames };
}

/**
 * Syncs Steam achievements for a SPECIFIC list of games (used by the job queue
 * to retry only the games that previously failed).
 *
 * @param {string} userId - The plasmaUserID (UUID).
 * @param {string[]} appIds - List of Steam appIDs to retry.
 * @returns {{ totalSynced: number, gamesProcessed: number, failedGames: Array }}
 * @throws If the user has no Steam account linked.
 */
async function syncSteamAchievementsForGames(userId, appIds) {
    const user = await pool.query(
        'SELECT "steamID64" FROM "users" WHERE "plasmaUserID" = $1',
        [userId]
    );
    if (user.rows.length === 0 || !user.rows[0].steamID64) {
        throw new Error('Steam account not linked');
    }
    const steamId = user.rows[0].steamID64;

    let totalSynced = 0;
    let gamesProcessed = 0;
    let newAchievements = [];
    let newUserAchievements = [];
    let failedGames = [];

    for (const appId of appIds) {
        try {
            const achievementData = await getSteamPlayerAchievements(steamId, appId);
            if (!achievementData || !achievementData.achievements) continue;

            gamesProcessed++;

            for (const ach of achievementData.achievements) {
                if (ach.achieved !== 1) continue;

                const achievementID = `steam_${appId}_${ach.apiname}`;
                const unlockedAt = ach.unlocktime || Math.floor(Date.now() / 1000);
                const title = ach.name || ach.apiname;

                newAchievements.push({ achievementID, appId, title });
                newUserAchievements.push({ userID: userId, achievementID, unlockedAt });
                totalSynced++;
            }
        } catch (gameErr) {
            if (gameErr.response && gameErr.response.status === 400) continue;
            failedGames.push({
                appId,
                reason: gameErr.message || 'Unknown error',
                httpStatus: gameErr.response?.status || null
            });
        }
    }

    if (newAchievements.length > 0) {
        const achIdArr = newAchievements.map(a => a.achievementID);
        const appIdArr = newAchievements.map(a => a.appId);
        const titleArr = newAchievements.map(a => a.title);

        await pool.query(`
            INSERT INTO "achievements" ("achievementID", "appID", "title", "rarityWeight", "plasmaXP")
            SELECT id, app, title, 1.0, 25
            FROM unnest($1::text[], $2::text[], $3::text[]) AS t(id, app, title)
            ON CONFLICT ("achievementID") DO NOTHING
        `, [achIdArr, appIdArr, titleArr]);

        const userIdArr = newUserAchievements.map(a => a.userID);
        const uAchIdArr = newUserAchievements.map(a => a.achievementID);
        const unlockedArr = newUserAchievements.map(a => a.unlockedAt);

        await pool.query(`
            INSERT INTO "user_achievements" ("userID", "achievementID", "unlockedAt")
            SELECT uid, aid, to_timestamp(ts)
            FROM unnest($1::uuid[], $2::text[], $3::bigint[]) AS t(uid, aid, ts)
            ON CONFLICT ("userID", "achievementID") DO NOTHING
        `, [userIdArr, uAchIdArr, unlockedArr]);
    }

    // Update profile XP after partial sync
    const xpResult = await pool.query(`
        SELECT COALESCE(SUM(a."plasmaXP"), 0) as "totalXP"
        FROM "user_achievements" ua
        JOIN "achievements" a ON ua."achievementID" = a."achievementID"
        WHERE ua."userID" = $1
    `, [userId]);

    await pool.query(`
        UPDATE "profiles" SET "totalPlasmaXP" = $1 WHERE "plasmaUserID" = $2
    `, [parseInt(xpResult.rows[0].totalXP) || 0, userId]);

    return { totalSynced, gamesProcessed, failedGames };
}

module.exports = {
    syncSteamLibrary,
    syncSteamAchievements,
    syncSteamAchievementsForGames
};
