const fs = require('fs');
const file = 'Combined Plasma APIs — Complete.postman_collection.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// 1. Add /health
const hasHealth = data.item.find(i => i.name === '11. System Health');
if (!hasHealth) {
    data.item.push({
        name: '11. System Health',
        item: [
            {
                name: "Health Check",
                request: {
                    method: "GET",
                    header: [],
                    url: {
                        raw: "{{API_BASE_URL}}/health",
                        host: ["{{API_BASE_URL}}"],
                        path: ["health"]
                    },
                    description: "Returns precise status of each dependency. Used by monitoring, load balancers, and CI pipelines to determine if the server is truly healthy."
                },
                response: [
                    {
                        name: "200 Healthy",
                        originalRequest: {
                            method: "GET",
                            header: [],
                            url: {
                                raw: "{{API_BASE_URL}}/health",
                                host: ["{{API_BASE_URL}}"],
                                path: ["health"]
                            }
                        },
                        status: "OK",
                        code: 200,
                        _postman_previewlanguage: "json",
                        header: [ { key: "Content-Type", value: "application/json" } ],
                        body: JSON.stringify({
                            "status": "healthy",
                            "timestamp": "2026-05-01T22:50:00.000Z",
                            "uptime": 120.5,
                            "checks": {
                                "server": { "status": "online" },
                                "database": { "status": "online", "latencyMs": 15 }
                            }
                        }, null, 4)
                    }
                ]
            }
        ]
    });
}

// 2. Update Sync Achievements
const steamFolder = data.item.find(i => i.name === '4. Steam Integration');
if (steamFolder && steamFolder.item) {
    const syncAch = steamFolder.item.find(i => i.name === 'Sync Achievements' || i.name.includes('Sync Achievements'));
    if (syncAch) {
        if (syncAch.response && syncAch.response.length > 0) {
            syncAch.response[0].body = JSON.stringify({
                "success": true,
                "message": "Synced 10 achievements across 2 games",
                "syncedAchievements": 10,
                "gamesProcessed": 2,
                "failedGames": ["123", "456"],
                "retriesEnqueued": 2
            }, null, 4);
            syncAch.request.description = "Syncs Steam achievements for all games in user's library into DB. Transients failures automatically trigger background retries. Private profiles (403) are skipped.";
        }
    }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Postman file updated successfully');
