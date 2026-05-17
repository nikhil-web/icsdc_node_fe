// ══════════════════════════════════════════════════════════
//  strapiClient.js
//  Central API client for Strapi v5
//  Usage: import { fetchAPI, uploadURL } from './strapiClient.js'
// ══════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────
// API calls go through the local Express proxy (/api/strapi) — token is server-side only.
// STRAPI_URL is still used by uploadURL() to resolve media file paths.
const BASE_URL = (typeof STRAPI_URL !== "undefined" ? STRAPI_URL : "http://localhost:1337");

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
};

// ── Core fetch helper ─────────────────────────────────────
/**
 * fetchAPI(path)
 * @param {string} path  — e.g. "/api/testimonials?populate=avatar"
 * @returns {Promise<object>}  parsed Strapi JSON response
 * @throws  on non-2xx HTTP status
 */
export async function fetchAPI(path) {
    const url = `/api/strapi${path}`;
    const response = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!response.ok) {
        throw new Error(`[strapiClient] HTTP ${response.status} on "${path}" — ${response.statusText}`);
    }
    try {
        return await response.json();
    } catch (parseErr) {
        throw new Error(`[strapiClient] Failed to parse JSON from "${path}": ${parseErr.message}`);
    }
}

// ── Media URL helper ──────────────────────────────────────
/**
 * uploadURL(mediaObj, format?)
 * Converts a Strapi media object to an absolute URL.
 *
 * @param {object|null}  mediaObj  — the Strapi media response object
 * @param {string}       format    — preferred format key: "thumbnail"|"small"|"medium"|"large"
 * @returns {string}  absolute URL, or "" if media is null/undefined
 *
 * @example
 *   const src = uploadURL(data.avatar, "medium");
 *   img.src = src || "./assets/images/placeholder.png";
 */
export function uploadURL(mediaObj, format = "medium") {
    if (!mediaObj) return "";
    const url =
        mediaObj?.formats?.[format]?.url
        ?? mediaObj?.formats?.small?.url
        ?? mediaObj?.url
        ?? "";
    return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

// ── POST helper (contact form → Strapi) ───────────────────
/**
 * postAPI(path, payload)
 * @param {string} path     — e.g. "/api/contact-submissions"
 * @param {object} payload  — data to POST
 * @returns {Promise<object>}
 */
export async function postAPI(path, payload) {
    const url = `/api/strapi${path}`;
    const response = await fetch(url, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ data: payload }),
    });
    if (!response.ok) {
        throw new Error(`[strapiClient] POST failed on "${path}" — HTTP ${response.status}`);
    }
    return response.json();
}
