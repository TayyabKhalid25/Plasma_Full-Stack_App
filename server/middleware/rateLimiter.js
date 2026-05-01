const rateLimit = require('express-rate-limit');

// =============================================================================
// RATE LIMITER MIDDLEWARE — Tiered Protection
// =============================================================================
// Three tiers are defined based on the risk profile of each endpoint category:
//   1. globalLimiter  — Broad DDoS / abuse protection for the entire API.
//   2. authLimiter    — Strict limit on login/register to prevent brute-force.
//   3. syncLimiter    — Prevents hammering Steam/IGDB external APIs (key bans).
//
// All limiters return standardized JSON (not Express's default HTML error page).
// =============================================================================

/**
 * Global Limiter — Applied to ALL routes.
 * 300 requests per 10 minutes per IP. This is generous enough for normal usage
 * (page loads, API calls, WebSocket polling) but blocks automated abuse.
 */
const globalLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10-minute window
    max: 300,                    // 300 requests per window per IP
    standardHeaders: true,       // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,        // Disable the `X-RateLimit-*` headers (deprecated)
    message: {
        success: false,
        errorType: 'RateLimitExceeded',
        message: 'Too many requests from this IP address. Please wait a few minutes before trying again.',
        retryAfterMs: 10 * 60 * 1000
    }
});

/**
 * Auth Limiter — Applied ONLY to /api/auth/login and /api/auth/register.
 * 10 attempts per 15 minutes per IP. Prevents brute-force password attacks
 * while still allowing a user a reasonable number of typos.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15-minute window
    max: 10,                     // 10 attempts per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorType: 'AuthRateLimitExceeded',
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
        retryAfterMs: 15 * 60 * 1000
    }
});

/**
 * Sync Limiter — Applied to Steam/IGDB sync endpoints.
 * 3 requests per 10 minutes per IP. A user's Steam library does not change
 * frequently, so there is no legitimate reason to sync more often than this.
 * This protects our Steam API key from being rate-limited or banned by Valve.
 */
const syncLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,   // 10-minute window
    max: 3,                      // 3 sync requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        errorType: 'SyncRateLimitExceeded',
        message: 'Steam/IGDB sync is limited to prevent API abuse. Please wait before syncing again.',
        retryAfterMs: 10 * 60 * 1000
    }
});

module.exports = { globalLimiter, authLimiter, syncLimiter };
