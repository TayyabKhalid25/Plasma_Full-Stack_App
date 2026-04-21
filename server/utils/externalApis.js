const axios = require('axios');

// Fetch Steam environment variables
const STEAM_API_KEY = process.env.STEAM_API_KEY || '';
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || '';
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET || '';

// Caching logic for IGDB
let igdbToken = null;
let igdbTokenExpiresAt = 0;

/**
 * Ensures we have a valid IGDB access token
 */
async function getIgdbToken() {
    if (igdbToken && Date.now() < igdbTokenExpiresAt) {
        return igdbToken;
    }
    
    if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
        throw new Error('IGDB credentials are missing');
    }

    try {
        const response = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`);
        igdbToken = response.data.access_token;
        // Expire slightly before the actual expiration to be safe (usually 60 days)
        igdbTokenExpiresAt = Date.now() + (response.data.expires_in - 3600) * 1000;
        return igdbToken;
    } catch (error) {
        console.error('Failed to get IGDB Token:', error.message);
        throw new Error('IGDB Auth Failed');
    }
}

/**
 * Searches IGDB for games using their query language
 */
async function searchIgdbGames(query) {
    const token = await getIgdbToken();
    try {
        const response = await axios({
            url: 'https://api.igdb.com/v4/games',
            method: 'POST',
            headers: {
                'Client-ID': IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain',
            },
            data: `fields name,cover.url,url,platforms; search "${query}"; limit 20;`
        });
        
        // Transform the cover URLs to be 1080p
        return response.data.map(game => {
            if (game.cover && game.cover.url) {
                game.cover.url = game.cover.url.replace('t_thumb', 't_1080p').replace('//', 'https://');
            }
            return game;
        });
    } catch (error) {
        console.error('IGDB Search Error:', error.message);
        throw error;
    }
}

/**
 * Double-Lookup Strategy: Find an IGDB game based on its Steam AppID
 */
async function fetchHighResCover(steamAppId) {
    const token = await getIgdbToken();
    try {
        // Query external_games endpoint for Category 1 (Steam)
        const response = await axios({
            url: 'https://api.igdb.com/v4/external_games',
            method: 'POST',
            headers: {
                'Client-ID': IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain',
            },
            data: `fields game.cover.url; where uid = "${steamAppId}" & category = 1; limit 1;`
        });
        
        if (response.data && response.data.length > 0 && response.data[0].game && response.data[0].game.cover) {
            let url = response.data[0].game.cover.url;
            return url.replace('t_thumb', 't_1080p').replace('//', 'https://');
        }
        return null;
    } catch (error) {
        console.error(`IGDB Cover Lookup Error for SteamAppId ${steamAppId}:`, error.message);
        return null;
    }
}

/**
 * Fetch player summaries from Steam
 * @param {string} steamIds - Comma separated list of steamId64
 */
async function getSteamPlayerSummaries(steamIds) {
    if (!STEAM_API_KEY) throw new Error('Steam API Key missing');
    try {
        const response = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamIds}`);
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
        const response = await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&format=json`);
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
        const response = await axios.get(`http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid=${appId}&key=${STEAM_API_KEY}&steamid=${steamId}`);
        return response.data.playerstats;
    } catch (error) {
        console.error(`Steam Achievements Error for app ${appId}:`, error.message);
        throw error;
    }
}

module.exports = {
    getIgdbToken,
    searchIgdbGames,
    fetchHighResCover,
    getSteamPlayerSummaries,
    getSteamOwnedGames,
    getSteamPlayerAchievements
};
