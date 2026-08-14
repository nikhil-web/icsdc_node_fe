/**
 * builder-api.js
 * ──────────────
 * Admin-side API client for builder CRUD + publish + preview + versions.
 * Uses the JWT stored by the existing admin login flow.
 */

const JWT_KEY = 'icsdc_admin_jwt';

function authHeaders() {
    const jwt = sessionStorage.getItem(JWT_KEY);
    return {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (jwt || ''),
    };
}

async function jsonOrThrow(res) {
    if (res.status === 401) {
        sessionStorage.removeItem(JWT_KEY);
        sessionStorage.removeItem('icsdc_admin_user');
        window.location.href = '/admin';
        throw new Error('Session expired');
    }
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : {};
    if (!res.ok) {
        const msg = body?.error?.message || body?.error || res.statusText;
        throw new Error(typeof msg === 'string' ? msg : 'Request failed');
    }
    return body;
}

export const BuilderAPI = {
    listPages: async () => {
        const r = await fetch('/api/admin/builder/pages', { headers: authHeaders() });
        return jsonOrThrow(r);
    },
    getPage: async (documentId) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId, { headers: authHeaders() });
        return jsonOrThrow(r);
    },
    createPage: async (payload) => {
        const r = await fetch('/api/admin/builder/pages', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return jsonOrThrow(r);
    },
    updatePage: async (documentId, payload) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return jsonOrThrow(r);
    },
    publishPage: async (documentId) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId + '/publish', {
            method: 'POST',
            headers: authHeaders(),
        });
        return jsonOrThrow(r);
    },
    // Kick off a crawler-snapshot rebuild for one path (reuses the prerender admin endpoint).
    rebuildSnapshot: async (path) => {
        const r = await fetch('/api/admin/prerender', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ path }),
        });
        return { ok: r.ok, status: r.status };
    },
    deletePage: async (documentId) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId, {
            method: 'DELETE',
            headers: authHeaders(),
        });
        if (r.status === 204) return { ok: true };
        return jsonOrThrow(r);
    },
    createPreviewToken: async (payload) => {
        const r = await fetch('/api/admin/builder/preview-token', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload),
        });
        return jsonOrThrow(r);
    },
    listVersions: async (documentId) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId + '/versions', {
            headers: authHeaders(),
        });
        return jsonOrThrow(r);
    },
    rollback: async (documentId, versionNumber) => {
        const r = await fetch('/api/admin/builder/pages/' + documentId + '/rollback', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ versionNumber }),
        });
        return jsonOrThrow(r);
    },
    // ── Media library ──────────────────────────────────────────
    listMedia: async (search) => {
        const qs = search ? '?search=' + encodeURIComponent(search) : '';
        const r = await fetch('/api/admin/builder/media' + qs, { headers: authHeaders() });
        return jsonOrThrow(r);
    },
    uploadMedia: async (file) => {
        const jwt = sessionStorage.getItem(JWT_KEY);
        const fd = new FormData();
        fd.append('file', file);
        // NB: don't set Content-Type manually — the browser sets multipart boundary.
        const r = await fetch('/api/admin/builder/media', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + (jwt || '') },
            body: fd,
        });
        return jsonOrThrow(r);
    },
};
