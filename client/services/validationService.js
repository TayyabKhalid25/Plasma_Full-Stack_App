/**
 * Validation Service for client-side robust validation and stripping
 */

export const validationService = {
  // Strip and sanitize basic text inputs
  sanitizeText: (input) => {
    if (typeof input !== "string") return "";
    return input.trim(); // Add more sanitization as needed (e.g., stripping bad HTML)
  },

  // Rally Data Validation
  validateRallyData: (data) => {
    const errors = {};
    const sanitized = { ...data };

    sanitized.title = validationService.sanitizeText(data.title);
    if (!sanitized.title) errors.title = "Title is required.";
    else if (sanitized.title.length < 3) errors.title = "Title must be at least 3 characters.";

    sanitized.gameId = validationService.sanitizeText(data.gameId);
    if (!sanitized.gameId) errors.gameId = "Please select a game.";

    if (!data.date) errors.date = "Date is required.";
    else {
      // Basic future date validation
      const selectedDate = new Date(`${data.date}T${data.time || "00:00"}`);
      if (selectedDate < new Date()) {
        errors.date = "Rally must be scheduled in the future.";
      }
    }

    if (!data.time) errors.time = "Time is required.";

    if (!data.intent) errors.intent = "Intent is required.";

    if (!data.roles || data.roles.length === 0) {
      errors.roles = "At least one role must be defined.";
    } else {
      const validRoles = data.roles.filter(r => validationService.sanitizeText(r.name) !== "" && r.totalSlots > 0);
      if (validRoles.length === 0) errors.roles = "Roles must have a name and at least 1 slot.";
      sanitized.roles = validRoles.map(r => ({ ...r, name: validationService.sanitizeText(r.name) }));
    }

    return { isValid: Object.keys(errors).length === 0, errors, sanitized };
  },

  // Settings Validation
  validatePasswordChange: (data) => {
    const errors = {};
    if (!data.currentPassword) errors.currentPassword = "Current password is required.";
    
    if (!data.newPassword) {
      errors.newPassword = "New password is required.";
    } else if (data.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters.";
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  },

  // Message Validation
  validateMessage: (message) => {
    const text = validationService.sanitizeText(message);
    if (!text) return { isValid: false, errors: { message: "Message cannot be empty." }, sanitized: { text } };
    return { isValid: true, errors: {}, sanitized: { text } };
  },

  // Destructive Action Validation
  validateDangerAction: (input, requiredString) => {
    const errors = {};
    if (input !== requiredString) {
      errors.confirmation = `You must type exactly "${requiredString}".`;
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }
};
