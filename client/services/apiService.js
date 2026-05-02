import { validationService } from "./validationService";

const API_BASE = "http://localhost:5000";

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("plasma_token");
  }
  return null;
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const apiService = {
  createRally: async (payload) => {
    const { isValid, errors, sanitized } = validationService.validateRallyData(payload);
    if (!isValid) throw { status: 400, errors };
    
    const roleSum = sanitized.roles.reduce((sum, r) => sum + r.totalSlots, 0);
    const maxCapacity = roleSum > 0 ? roleSum : (parseInt(payload.maxCapacity) || 5);

    const body = {
      title: sanitized.title,
      description: payload.description || "",
      scheduledStartUTC: `${sanitized.date}T${sanitized.time}:00Z`,
      maxCapacity,
      requiredIntent: sanitized.intent === "COMP" ? "COMPETITIVE" : sanitized.intent,
      gameId: sanitized.gameId,
      roles: sanitized.roles,
    };

    const res = await fetch(`${API_BASE}/api/rallies`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to create rally" } };
    }
    return data;
  },

  updateRally: async (eventId, payload) => {
    const { isValid, errors, sanitized } = validationService.validateRallyData(payload);
    if (!isValid) throw { status: 400, errors };

    const roleSum = sanitized.roles.reduce((sum, r) => sum + r.totalSlots, 0);
    const maxCapacity = roleSum > 0 ? roleSum : (parseInt(payload.maxCapacity) || 5);

    const body = {
      title: sanitized.title,
      description: payload.description || "",
      scheduledStartUTC: `${sanitized.date}T${sanitized.time}:00Z`,
      maxCapacity,
      requiredIntent: sanitized.intent === "COMP" ? "COMPETITIVE" : sanitized.intent,
      gameId: sanitized.gameId,
      roles: sanitized.roles,
    };

    const res = await fetch(`${API_BASE}/api/rallies/${eventId}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to update rally" } };
    }
    return data;
  },

  deleteRally: async (eventId) => {
    const res = await fetch(`${API_BASE}/api/rallies/${eventId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to delete rally" } };
    }
    return data;
  },

  changePassword: async (payload) => {
    const { isValid, errors } = validationService.validatePasswordChange(payload);

    if (!isValid) {
      throw { status: 400, errors };
    }

    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to change password" } };
    }
    return data;
  },

  confirmDangerAction: async (input, requiredString) => {
    const { isValid, errors } = validationService.validateDangerAction(input, requiredString);

    if (!isValid) {
      throw { status: 400, errors };
    }

    return { success: true };
  },

  sendMessage: async (friendId, messageText) => {
    const { isValid, errors, sanitized } = validationService.validateMessage(messageText);

    if (!isValid) {
      throw { status: 400, errors };
    }

    const res = await fetch(`${API_BASE}/api/messages/${friendId}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content: sanitized.text }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to send message" } };
    }
    return data;
  },

  updateHallOfFame: async (achievementIds) => {
    if (!Array.isArray(achievementIds) || achievementIds.length > 5) {
      throw { status: 400, errors: { main: "You can select up to 5 items." } };
    }

    const res = await fetch(`${API_BASE}/api/prestige/me/hall-of-fame`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ achievementIds }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to update Hall of Fame" } };
    }
    return data;
  },

  searchIGDB: async (query) => {
    const sanitized = validationService.sanitizeText(query);
    if (!sanitized) return [];

    const res = await fetch(`${API_BASE}/api/library/igdb/search?q=${encodeURIComponent(sanitized)}`, {
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok || !data.success) return [];

    return data.data.map(g => ({
      id: g.id,
      title: g.title,
      platform: "Multi",
      cover: g.coverArtURL,
    }));
  },

  addGameToLibrary: async (gameData) => {
    if (!gameData.id) throw { status: 400, errors: { main: "Invalid game selected." } };

    const res = await fetch(`${API_BASE}/api/library/manual`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        gameId: gameData.id,
        title: gameData.title,
        coverArtURL: gameData.cover,
        isCurrentlyPlaying: false,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw { status: res.status, errors: { main: data.message || "Failed to add game" } };
    }
    return data;
  },
};
