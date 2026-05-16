// =============================================================================
// HTTP CLIENT — Single source of truth for API communication
// =============================================================================
// Centralizes API_BASE derivation and authenticated fetch logic.
// All client-side files should import from here instead of computing
// API_BASE or auth headers independently.
// =============================================================================

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";

/** Base URL for all API requests, guaranteed to have no trailing slash. */
export const API_BASE = rawApiBase.endsWith("/") ? rawApiBase.slice(0, -1) : rawApiBase;

/**
 * Returns the current JWT token from localStorage (browser only).
 * @returns {string|null}
 */
export function getToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("plasma_token");
    }
    return null;
}

/**
 * Returns standard auth headers including Content-Type and Bearer token.
 * @returns {Record<string, string>}
 */
export function authHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

/**
 * Authenticated fetch wrapper. Attaches JWT and parses JSON response.
 * Throws on non-OK responses with the server's error message.
 *
 * @param {string}        endpoint - API path (e.g. "/api/feed")
 * @param {RequestInit}   [options={}] - Standard fetch options
 * @returns {Promise<any>} Parsed JSON response body
 * @throws {Error} With server error message or status code
 */
export async function apiFetch(endpoint, options = {}) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `API error ${res.status}`);
    }

    return res.json();
}
