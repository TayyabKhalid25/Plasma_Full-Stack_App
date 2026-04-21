import { validationService } from "./validationService";

/**
 * Dummy API Service that integrates the validation service
 * Simulates network latency and robust client-side validation failures
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {
  createRally: async (payload) => {
    const { isValid, errors, sanitized } = validationService.validateRallyData(payload);
    
    if (!isValid) {
      throw { status: 400, errors };
    }

    await delay(800);
    return { success: true, data: { id: `rally-${Date.now()}`, ...sanitized } };
  },

  changePassword: async (payload) => {
    const { isValid, errors } = validationService.validatePasswordChange(payload);

    if (!isValid) {
      throw { status: 400, errors };
    }

    await delay(1000);
    return { success: true };
  },

  confirmDangerAction: async (input, requiredString) => {
    const { isValid, errors } = validationService.validateDangerAction(input, requiredString);

    if (!isValid) {
      throw { status: 400, errors };
    }

    await delay(1200);
    return { success: true };
  },

  sendMessage: async (friendId, messageText) => {
    const { isValid, errors, sanitized } = validationService.validateMessage(messageText);

    if (!isValid) {
      throw { status: 400, errors };
    }

    await delay(500);
    return { success: true, data: { id: Date.now(), text: sanitized.text, time: "Just now" } };
  },

  updateHallOfFame: async (achievementIds) => {
    if (!Array.isArray(achievementIds) || achievementIds.length > 5) {
      throw { status: 400, errors: { main: "You can select up to 5 items." } };
    }

    await delay(600);
    return { success: true };
  },

  searchIGDB: async (query) => {
    const sanitized = validationService.sanitizeText(query);
    if (!sanitized) return [];

    await delay(600);
    // Return dummy IGDB results
    return [
      { id: "igdb-1", title: `${sanitized} Original`, platform: "PC", cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7f.jpg" },
      { id: "igdb-2", title: `${sanitized} Remastered`, platform: "PS5", cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2lbd.jpg" },
      { id: "igdb-3", title: `${sanitized} DLC`, platform: "Xbox", cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2vxe.jpg" }
    ];
  },

  addGameToLibrary: async (gameData) => {
    if (!gameData.id) throw { status: 400, errors: { main: "Invalid game selected." } };
    await delay(800);
    return { success: true };
  }
};
