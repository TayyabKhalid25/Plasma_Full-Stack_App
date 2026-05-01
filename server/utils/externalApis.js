const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Fetch Steam environment variables
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || '';
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || '';

// --- Persistent IGDB Token Cache ---
const TOKEN_CACHE_PATH = path.join(__dirname, '..', '.igdb_token.json');
let igdbToken = null;
let igdbTokenExpiresAt = 0;

/**
 * Loads a cached IGDB token from disk if available and not expired.
 */
function loadCachedToken() {
    try {
        if (fs.existsSync(TOKEN_CACHE_PATH)) {
            const cached = JSON.parse(fs.readFileSync(TOKEN_CACHE_PATH, 'utf8'));
            if (cached.token && cached.expiresAt && Date.now() < cached.expiresAt) {
                igdbToken = cached.token;
                igdbTokenExpiresAt = cached.expiresAt;
                console.log('[IGDB] Loaded valid token from cache.');
                return true;
            }
        }
    } catch (err) {
        console.warn('[IGDB] Failed to read token cache, will fetch fresh token:', err.message);
    }
    return false;
}

/**
 * Saves the current IGDB token to disk for persistence across restarts.
 */
function saveCachedToken() {
    try {
        fs.writeFileSync(TOKEN_CACHE_PATH, JSON.stringify({
            token: igdbToken,
            expiresAt: igdbTokenExpiresAt,
            savedAt: new Date().toISOString()
        }), 'utf8');
    } catch (err) {
        console.warn('[IGDB] Failed to write token cache:', err.message);
    }
}

// Attempt to load cached token on module initialization
loadCachedToken();

/**
 * Ensures we have a valid IGDB access token
 */
async function getIgdbToken(forceRefresh = false) {
    // Return cached in-memory token if still valid and not forced
    if (!forceRefresh && igdbToken && Date.now() < igdbTokenExpiresAt) {
        return igdbToken;
    }
    
    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
        throw new Error('IGDB credentials are missing. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in .env');
    }

    // Retry token acquisition up to 3 times with backoff to avoid accidental bans
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await axios.post(
                `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
                null,
                { timeout: 10000 }
            );
            igdbToken = response.data.access_token;
            // Expire 1 hour before actual expiration for safety (tokens last ~60 days)
            igdbTokenExpiresAt = Date.now() + (response.data.expires_in - 3600) * 1000;
            saveCachedToken();
            console.log(`[IGDB] Successfully acquired new token (attempt ${attempt}).`);
            return igdbToken;
        } catch (error) {
            lastError = error;
            console.error(`[IGDB] Token request failed (attempt ${attempt}/3):`, error.message);
            if (attempt < 3) {
                const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw new Error(`IGDB Auth Failed after 3 attempts: ${lastError.message}`);
}

/**
 * Helper to wrap IGDB API calls with retry logic, exponential backoff, timeouts,
 * and automatic token refresh on 401 Unauthorized.
 */
async function igdbApiRequest(config, retries = 3, backoff = 1000) {
    try {
        const token = await getIgdbToken();
        const response = await axios({
            ...config,
            headers: {
                ...config.headers,
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain'
            }
        });
        return response;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            igdbToken = null;
            if (retries > 0) return igdbApiRequest(config, retries - 1, backoff);
        }
        
        if (error.response && error.response.data) {
            console.error('[IGDB] API Error Data:', JSON.stringify(error.response.data));
        }

        if (retries > 0) {
            console.log(`[IGDB] Request failed, retrying in ${backoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return igdbApiRequest(config, retries - 1, backoff * 2);
        }
        throw error;
    }
}

/**
 * Searches IGDB for games using their query language
 */
async function searchIgdbGames(query) {
    try {
        // Reordering fields to the front and removing newlines.
        // Removed 'popularity' as it's not a valid field in this context.
        const body = `fields name,cover.url,url,platforms,first_release_date,category; search "${query}"; limit 50;`;
        
        const response = await igdbApiRequest({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            data: body
        });
        
        if (!response.data || !Array.isArray(response.data)) return [];

        // Filter by category in JS
        const allowedCategories = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11];
        
        const filtered = response.data
            .filter(game => game.category !== undefined && allowedCategories.includes(game.category));

        console.log(`[IGDB] Results for "${query}" (top 15 after JS filtering):`, 
            filtered.slice(0, 15).map(g => ({ name: g.name, cat: g.category }))
        );

        return filtered
            .slice(0, 15) 
            .map(game => {
                if (game.cover && game.cover.url) {
                    game.cover.url = game.cover.url.replace('t_thumb', 't_1080p').replace('//', 'https://');
                }
                return {
                    id: game.id,
                    name: game.name,
                    cover: game.cover,
                    url: game.url,
                    releaseDate: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
                    platforms: game.platforms
                };
            });
    } catch (error) {
        console.error('[IGDB] Search Error:', error.message);
        throw error;
    }
}

/**
 * Double-Lookup Strategy: Find an IGDB game based on its Steam AppID
 */
async function fetchHighResCover(steamAppId) {
    try {
        // Query external_games endpoint for Category 1 (Steam)
        const response = await igdbApiRequest({
            url: 'https://api.igdb.com/v4/external_games',
            method: 'POST',
            data: `fields game.cover.url; where uid = "${steamAppId}" & category = 1; limit 1;`
        });
        
        if (response.data && response.data.length > 0 && response.data[0].game && response.data[0].game.cover) {
            let url = response.data[0].game.cover.url;
            return url.replace('t_thumb', 't_1080p').replace('//', 'https://');
        }
        return null;
    } catch (error) {
        console.error(`[IGDB] Cover Lookup Error for SteamAppId ${steamAppId}:`, error.message);
        return null;
    }
}

/**
 * Helper to wrap Steam API calls with retry logic, exponential backoff, and timeouts.
 */
async function steamApiRequest(url, retries = 3, backoff = 1000) {
    try {
        const response = await axios.get(url, { timeout: 10000 });
        return response;
    } catch (error) {
        if (retries > 0) {
            console.log(`Steam API request failed, retrying in ${backoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return steamApiRequest(url, retries - 1, backoff * 2);
        }
        throw error;
    }
}

/**
 * Fetch player summaries from Steam
 * @param {string} steamIds - Comma separated list of steamId64
 */
async function getSteamPlayerSummaries(steamIds) {
    if (!STEAM_API_KEY) throw new Error('Steam API Key missing');
    try {
        const response = await steamApiRequest(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamIds}`);
        return response.data.response.players;
    } catch (error) {
        console.error('Steam Player Summaries Error:', error.message);
        throw error;
    }
}

/**
 * Fetch owned games for a Steam user
 * @param {string} steamId - steamId64
 */
async function getSteamOwnedGames(steamId) {
    if (!STEAM_API_KEY) throw new Error('Steam API Key missing');
    try {
        const response = await steamApiRequest(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`);
        return response.data.response.games || [];
    } catch (error) {
        console.error('Steam Owned Games Error:', error.message);
        throw error;
    }
}

/**
 * Fetch achievements for a specific game and user
 */
async function getSteamPlayerAchievements(steamId, appId) {
    if (!STEAM_API_KEY) throw new Error('Steam API Key missing');
    try {
        const response = await steamApiRequest(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${steamId}`);
        return response.data.playerstats;
    } catch (error) {
        console.error(`Steam Achievements Error for app ${appId}:`, error.message);
        throw error;
    }
}

async function getIgdbGameById(gameId) {
    try {
        const response = await igdbApiRequest({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            data: `fields name,cover.url,summary,first_release_date,platforms.name,genres.name,screenshots.url,videos.video_id; where id = ${gameId};`
        });
        
        if (!response.data || response.data.length === 0) return null;
        
        const game = response.data[0];
        if (game.cover && game.cover.url) {
            game.cover.url = game.cover.url.replace('t_thumb', 't_1080p').replace('//', 'https://');
        }
        if (game.screenshots) {
            game.screenshots = game.screenshots.map(s => s.url.replace('t_thumb', 't_1080p').replace('//', 'https://'));
        }
        return game;
    } catch (error) {
        console.error(`[IGDB] Detail Lookup Error for ID ${gameId}:`, error.message);
        return null;
    }
}

module.exports = {
    getIgdbToken,
    searchIgdbGames,
    getIgdbGameById,
    fetchHighResCover,
    getSteamPlayerSummaries,
    getSteamOwnedGames,
    getSteamPlayerAchievements
};
