require('dotenv').config();

const express = require('express');
const http    = require('http');
const { Server: SocketServer } = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();

const publicPath = path.join(__dirname, 'public/ICSDC_Frontend');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

// Allow large JSON bodies for builder pages (sections array can be sizeable).
app.use(express.json({ limit: '2mb' }));

// ── Page registry cache ───────────────────────────────────
// slug → isLive (boolean). Populated on startup, refreshed on every toggle.
const pageCache = new Map();

async function refreshPageCache() {
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/page-registries?pagination[pageSize]=200`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        if (!r.ok) return;
        const { data } = await r.json();
        pageCache.clear();
        (data || []).forEach(function (item) {
            const d = item.attributes || item;
            if (d.slug) pageCache.set(d.slug, d.isLive !== false);
        });
        console.log(`[page-cache] ${pageCache.size} entries loaded`);
    } catch (err) {
        console.error('[page-cache] refresh failed:', err.message);
    }
}

// Proxy: /api/strapi/* → Strapi (token stays server-side)
app.use('/api/strapi', async (req, res) => {
    const target = `${STRAPI_URL}${req.url}`;
    try {
        const opts = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRAPI_TOKEN}`,
            },
        };
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            opts.body = JSON.stringify(req.body);
        }
        const upstream = await fetch(target, opts);
        const contentType = upstream.headers.get('content-type') || '';
        const data = contentType.includes('application/json')
            ? await upstream.json()
            : { error: await upstream.text() };
        res.status(upstream.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Strapi proxy error', detail: err.message });
    }
});

// ── Admin auth middleware ─────────────────────────────────
async function requireAdminAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const r = await fetch(`${STRAPI_URL}/api/users/me`, {
            headers: { Authorization: auth },
        });
        if (!r.ok) return res.status(401).json({ error: 'Invalid or expired token' });
        req.adminUser = await r.json();
        next();
    } catch {
        res.status(502).json({ error: 'Auth check failed' });
    }
}

// ── Admin: login ──────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
    try {
        const r = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: req.body.identifier,
                password: req.body.password,
            }),
        });
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Login failed', detail: err.message });
    }
});

// ── Admin: contact submissions ────────────────────────────
app.get('/api/admin/submissions', requireAdminAuth, async (req, res) => {
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/contact-submissions?sort=createdAt:desc&pagination[pageSize]=100`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch submissions', detail: err.message });
    }
});

// ── Admin: page registry ──────────────────────────────────
app.get('/api/admin/pages', requireAdminAuth, async (req, res) => {
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/page-registries?sort=displayName:asc&pagination[pageSize]=100`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch pages', detail: err.message });
    }
});

// ── Admin: health ─────────────────────────────────────────
app.get('/api/admin/health', requireAdminAuth, async (req, res) => {
    let strapiStatus = 'ok';
    try {
        const r = await fetch(`${STRAPI_URL}/_health`);
        if (!r.ok) strapiStatus = 'down';
    } catch {
        strapiStatus = 'down';
    }
    res.json({ express: 'ok', strapi: strapiStatus });
});

// ── Admin: toggle page live status ───────────────────────
app.patch('/api/admin/pages/:id', requireAdminAuth, async (req, res) => {
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/page-registries/${req.params.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${STRAPI_TOKEN}`,
                },
                body: JSON.stringify({ data: { isLive: req.body.isLive } }),
            }
        );
        const data = await r.json();
        if (r.ok) {
            // Keep cache in sync without a full round-trip
            refreshPageCache();
        }
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to update page', detail: err.message });
    }
});

// ══════════════════════════════════════════════════════════
//  BUILDER PAGES — Admin API + Public Renderer
// ══════════════════════════════════════════════════════════

// Strapi helper — wraps fetch + bearer token
async function strapi(reqPath, opts = {}) {
    const target = `${STRAPI_URL}${reqPath}`;
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_TOKEN}`,
        ...(opts.headers || {}),
    };
    return fetch(target, { ...opts, headers });
}

// ── Builder: list all pages (drafts + published) ─────────
app.get('/api/admin/builder/pages', requireAdminAuth, async (req, res) => {
    try {
        const r = await strapi(
            '/api/builder-pages?sort=updatedAt:desc&pagination[pageSize]=200&status=draft'
        );
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch builder pages', detail: err.message });
    }
});

// ── Builder: get single page (returns draft if exists, else published) ──
app.get('/api/admin/builder/pages/:documentId', requireAdminAuth, async (req, res) => {
    try {
        const r = await strapi(
            `/api/builder-pages/${req.params.documentId}?status=draft`
        );
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch builder page', detail: err.message });
    }
});

// ── Builder: create new page ─────────────────────────────
app.post('/api/admin/builder/pages', requireAdminAuth, async (req, res) => {
    try {
        const { title, slug, sections, metaTitle, metaDescription, templateId } = req.body || {};
        if (!title || !slug) {
            return res.status(400).json({ error: 'title and slug are required' });
        }
        const r = await strapi('/api/builder-pages', {
            method: 'POST',
            body: JSON.stringify({
                data: {
                    title,
                    slug,
                    sections: Array.isArray(sections) ? sections : [],
                    metaTitle: metaTitle || title,
                    metaDescription: metaDescription || '',
                    templateId: templateId || null,
                    currentVersion: 1,
                    publishedVersion: 0,
                },
            }),
        });
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to create builder page', detail: err.message });
    }
});

// ── Builder: update (save draft) ─────────────────────────
app.put('/api/admin/builder/pages/:documentId', requireAdminAuth, async (req, res) => {
    try {
        const { title, sections, metaTitle, metaDescription, changeSummary } = req.body || {};
        const documentId = req.params.documentId;

        // Fetch current document to read currentVersion
        const cur = await strapi(`/api/builder-pages/${documentId}?status=draft`);
        const curData = await cur.json();
        const currentDoc = curData?.data || {};
        const nextVersion = (currentDoc.currentVersion || 1) + 1;

        // PUT update to Strapi
        const r = await strapi(`/api/builder-pages/${documentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: {
                    title: title !== undefined ? title : currentDoc.title,
                    sections: Array.isArray(sections) ? sections : currentDoc.sections,
                    metaTitle: metaTitle !== undefined ? metaTitle : currentDoc.metaTitle,
                    metaDescription: metaDescription !== undefined ? metaDescription : currentDoc.metaDescription,
                    currentVersion: nextVersion,
                },
            }),
        });
        const data = await r.json();

        // Write version snapshot (best-effort — never block save if it fails)
        if (r.ok) {
            writeVersionSnapshot({
                documentId,
                versionNumber: nextVersion,
                sections: Array.isArray(sections) ? sections : currentDoc.sections || [],
                title: title || currentDoc.title || '',
                changeSummary: changeSummary || 'Draft saved',
                createdById: req.adminUser?.id || null,
            }).catch((err) => console.error('[builder] snapshot write failed:', err.message));
        }

        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to update builder page', detail: err.message });
    }
});

// ── Builder: publish page ────────────────────────────────
app.post('/api/admin/builder/pages/:documentId/publish', requireAdminAuth, async (req, res) => {
    try {
        const documentId = req.params.documentId;

        // Read current doc
        const cur = await strapi(`/api/builder-pages/${documentId}?status=draft`);
        const curData = await cur.json();
        const currentDoc = curData?.data;
        if (!currentDoc) return res.status(404).json({ error: 'Page not found' });

        // Strapi 5: trigger publish action
        const r = await strapi(`/api/builder-pages/${documentId}/actions/publish`, {
            method: 'POST',
            body: JSON.stringify({}),
        });
        // If the actions/publish endpoint is not available in this Strapi config,
        // fall back to PUT with publishedAt:
        let data;
        if (r.status === 404 || r.status === 405) {
            const fallback = await strapi(`/api/builder-pages/${documentId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    data: {
                        publishedAt: new Date().toISOString(),
                        publishedVersion: currentDoc.currentVersion || 1,
                    },
                }),
            });
            data = await fallback.json();
            res.status(fallback.status).json(data);
        } else {
            data = await r.json();
            // Also bump publishedVersion field
            await strapi(`/api/builder-pages/${documentId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    data: { publishedVersion: currentDoc.currentVersion || 1 },
                }),
            }).catch(() => {});
            res.status(r.status).json(data);
        }

        // Write a "published" snapshot
        writeVersionSnapshot({
            documentId,
            versionNumber: currentDoc.currentVersion || 1,
            sections: currentDoc.sections || [],
            title: currentDoc.title || '',
            changeSummary: 'Published',
            createdById: req.adminUser?.id || null,
        }).catch((err) => console.error('[builder] publish snapshot failed:', err.message));
    } catch (err) {
        res.status(502).json({ error: 'Failed to publish builder page', detail: err.message });
    }
});

// ── Builder: delete page ─────────────────────────────────
app.delete('/api/admin/builder/pages/:documentId', requireAdminAuth, async (req, res) => {
    try {
        const r = await strapi(`/api/builder-pages/${req.params.documentId}`, {
            method: 'DELETE',
        });
        if (r.status === 204) return res.status(204).end();
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to delete builder page', detail: err.message });
    }
});

// ── Builder: list versions for a page ────────────────────
app.get('/api/admin/builder/pages/:documentId/versions', requireAdminAuth, async (req, res) => {
    try {
        const knex = global.__builderKnex || null;
        if (!knex) return res.json({ data: [] });
        const rows = await knex('builder_page_versions')
            .where({ page_document_id: req.params.documentId })
            .orderBy('version_number', 'desc')
            .limit(50);
        res.json({ data: rows });
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch versions', detail: err.message });
    }
});

// ── Builder: rollback to a specific version ──────────────
app.post('/api/admin/builder/pages/:documentId/rollback', requireAdminAuth, async (req, res) => {
    try {
        const { versionNumber } = req.body || {};
        if (!versionNumber) return res.status(400).json({ error: 'versionNumber is required' });

        const knex = global.__builderKnex || null;
        if (!knex) return res.status(500).json({ error: 'Version store not initialised' });

        const snap = await knex('builder_page_versions')
            .where({ page_document_id: req.params.documentId, version_number: versionNumber })
            .first();
        if (!snap) return res.status(404).json({ error: 'Version not found' });

        // Restore as a new draft version
        const cur = await strapi(`/api/builder-pages/${req.params.documentId}?status=draft`);
        const curDoc = (await cur.json())?.data || {};
        const nextVersion = (curDoc.currentVersion || 1) + 1;

        const r = await strapi(`/api/builder-pages/${req.params.documentId}`, {
            method: 'PUT',
            body: JSON.stringify({
                data: {
                    title: snap.title_snapshot,
                    sections: snap.sections_snapshot,
                    currentVersion: nextVersion,
                },
            }),
        });
        const data = await r.json();

        writeVersionSnapshot({
            documentId: req.params.documentId,
            versionNumber: nextVersion,
            sections: snap.sections_snapshot,
            title: snap.title_snapshot,
            changeSummary: `Rolled back to version ${versionNumber}`,
            createdById: req.adminUser?.id || null,
        }).catch(() => {});

        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Rollback failed', detail: err.message });
    }
});

// ── Builder: preview tokens (in-memory; replace with Redis in Phase 3) ──
const previewTokens = new Map(); // token → { sections, title, expiresAt }
const PREVIEW_TTL_MS = 15 * 60 * 1000;

function cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, entry] of previewTokens) {
        if (entry.expiresAt < now) previewTokens.delete(token);
    }
}

// ── Admin: media library (Strapi upload proxy) ───────────────────────
function absolutifyMediaUrls(file) {
    if (!file || typeof file !== 'object') return file;
    // Strapi 5 sometimes wraps responses as { id, attributes: {...} }
    const target = file.attributes && typeof file.attributes === 'object' ? file.attributes : file;
    if (target.url && !/^https?:/i.test(target.url)) target.url = STRAPI_URL.replace(/\/$/, '') + target.url;
    if (target.formats && typeof target.formats === 'object') {
        Object.keys(target.formats).forEach((k) => {
            const f = target.formats[k];
            if (f && f.url && !/^https?:/i.test(f.url)) f.url = STRAPI_URL.replace(/\/$/, '') + f.url;
        });
    }
    return file;
}

// List uploaded files (supports ?search= and ?folder=)
app.get('/api/admin/builder/media', requireAdminAuth, async (req, res) => {
    try {
        const qs = new URLSearchParams();
        if (req.query.search) qs.set('_q', String(req.query.search));
        qs.set('sort', 'createdAt:desc');
        const r = await fetch(`${STRAPI_URL}/api/upload/files?${qs}`, {
            headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
        });
        const data = await r.json();
        // Strapi /upload/files returns either an array or a paginated object
        if (Array.isArray(data)) data.forEach(absolutifyMediaUrls);
        else if (data && Array.isArray(data.results)) data.results.forEach(absolutifyMediaUrls);
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Media list failed', detail: err.message });
    }
});

// Upload file → Strapi /upload (multipart forwarding)
const multer = require('multer');
const uploadMW = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

app.post('/api/admin/builder/media', requireAdminAuth, uploadMW.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    try {
        const fd = new FormData();
        // Wrap the multer buffer in a Blob so undici's FormData accepts it with a filename.
        const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' });
        fd.append('files', blob, req.file.originalname);

        const r = await fetch(`${STRAPI_URL}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
            body: fd,
        });
        const text = await r.text();
        let data;
        try { data = JSON.parse(text); } catch { data = { raw: text }; }
        if (Array.isArray(data)) data.forEach(absolutifyMediaUrls);
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Upload failed', detail: err.message });
    }
});

// Delete media file
app.delete('/api/admin/builder/media/:id', requireAdminAuth, async (req, res) => {
    try {
        const r = await fetch(`${STRAPI_URL}/api/upload/files/${encodeURIComponent(req.params.id)}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${STRAPI_TOKEN}` },
        });
        const data = await r.json().catch(() => ({}));
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Delete failed', detail: err.message });
    }
});

app.post('/api/admin/builder/preview-token', requireAdminAuth, (req, res) => {
    cleanupExpiredTokens();
    const { slug, sections, title, metaTitle, metaDescription } = req.body || {};
    if (!slug || !Array.isArray(sections)) {
        return res.status(400).json({ error: 'slug and sections are required' });
    }
    const token = 'pbk_' + crypto.randomBytes(16).toString('hex');
    previewTokens.set(token, {
        slug,
        sections,
        title: title || '',
        metaTitle: metaTitle || '',
        metaDescription: metaDescription || '',
        expiresAt: Date.now() + PREVIEW_TTL_MS,
    });
    res.json({ token, expiresInMs: PREVIEW_TTL_MS });
});

// Public preview endpoint — token IS the auth
app.get('/api/builder/preview/:slug', (req, res) => {
    cleanupExpiredTokens();
    const token = req.query.token;
    const entry = previewTokens.get(token);
    if (!entry || entry.expiresAt < Date.now() || entry.slug !== req.params.slug) {
        return res.status(401).json({ error: 'Preview token expired or invalid' });
    }
    res.json({
        data: {
            slug: entry.slug,
            title: entry.title,
            metaTitle: entry.metaTitle,
            metaDescription: entry.metaDescription,
            sections: entry.sections,
            _isPreview: true,
        },
    });
});

// ── Builder: public page renderer (must come BEFORE /:page catch-all) ──
app.get('/builder/:slug', (req, res) => {
    res.sendFile(path.join(publicPath, 'builder-template.html'));
});

// Also serve preview URLs through the same template
app.get('/builder/preview/:slug', (req, res) => {
    res.sendFile(path.join(publicPath, 'builder-template.html'));
});

// ── Version snapshot writer (uses Strapi's knex via global) ──
async function writeVersionSnapshot({ documentId, versionNumber, sections, title, changeSummary, createdById }) {
    const knex = global.__builderKnex;
    if (!knex) return;
    try {
        await knex('builder_page_versions').insert({
            page_document_id: documentId,
            version_number: versionNumber,
            sections_snapshot: JSON.stringify(sections),
            title_snapshot: title,
            change_summary: changeSummary,
            created_by_id: createdById,
        });
    } catch (err) {
        // ON CONFLICT — silently skip if (documentId, version) already exists
        if (!/unique|duplicate/i.test(err.message)) throw err;
    }
}

// ── Lazy knex acquisition for the versions table ─────────
// We connect to the same Postgres DB Strapi uses, via DATABASE_URL.
// If the env var is not set (dev SQLite), version history is disabled silently.
(function initBuilderKnex() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.log('[builder] DATABASE_URL not set — version history disabled');
        return;
    }
    try {
        const knex = require('knex')({
            client: 'pg',
            connection: dbUrl,
            pool: { min: 0, max: 4 },
        });
        global.__builderKnex = knex;
        console.log('[builder] knex connection established for versions table');
    } catch (err) {
        console.warn('[builder] knex unavailable — version history disabled:', err.message);
    }
})();

// ══════════════════════════════════════════════════════════
//  SITEMAP
// ══════════════════════════════════════════════════════════

const STATIC_PAGES = [
    // Home
    { path: '/',                            priority: 1.0, changefreq: 'weekly'  },
    // Core hosting
    { path: '/cloud-hosting',               priority: 0.9, changefreq: 'weekly'  },
    { path: '/cpanel-hosting',              priority: 0.9, changefreq: 'weekly'  },
    { path: '/reseller-hosting',            priority: 0.9, changefreq: 'weekly'  },
    { path: '/wordpress-hosting',           priority: 0.9, changefreq: 'weekly'  },
    { path: '/shared-hosting',              priority: 0.9, changefreq: 'weekly'  },
    { path: '/web-hosting',                 priority: 0.9, changefreq: 'weekly'  },
    // VPS
    { path: '/vps-hosting',                 priority: 0.9, changefreq: 'weekly'  },
    { path: '/linux-vps-hosting',           priority: 0.8, changefreq: 'weekly'  },
    { path: '/windows-vps-hosting',         priority: 0.8, changefreq: 'weekly'  },
    { path: '/managed-vps-hosting',         priority: 0.8, changefreq: 'weekly'  },
    { path: '/vps-cpanel',                  priority: 0.8, changefreq: 'weekly'  },
    { path: '/vps-hosting-trial',           priority: 0.7, changefreq: 'weekly'  },
    // Dedicated
    { path: '/dedicated-server',            priority: 0.9, changefreq: 'weekly'  },
    { path: '/bare-metal-server',           priority: 0.8, changefreq: 'weekly'  },
    { path: '/linux-dedicated-server',      priority: 0.8, changefreq: 'weekly'  },
    { path: '/windows-dedicated-server',    priority: 0.8, changefreq: 'weekly'  },
    { path: '/managed-dedicated-server',    priority: 0.8, changefreq: 'weekly'  },
    { path: '/gpu-dedicated-server',        priority: 0.8, changefreq: 'weekly'  },
    { path: '/nvme-dedicated-servers',      priority: 0.7, changefreq: 'weekly'  },
    // Cloud
    { path: '/managed-cloud-hosting',       priority: 0.8, changefreq: 'weekly'  },
    { path: '/linux-cloud-hosting',         priority: 0.8, changefreq: 'weekly'  },
    { path: '/windows-cloud-hosting',       priority: 0.8, changefreq: 'weekly'  },
    { path: '/gpu-cloud-hosting',           priority: 0.8, changefreq: 'weekly'  },
    { path: '/aws-cloud-hosting',           priority: 0.8, changefreq: 'weekly'  },
    { path: '/azure-cloud-hosting',         priority: 0.8, changefreq: 'weekly'  },
    { path: '/google-cloud-hosting',        priority: 0.8, changefreq: 'weekly'  },
    { path: '/virtual-machine',             priority: 0.7, changefreq: 'weekly'  },
    { path: '/cloud-storage',               priority: 0.7, changefreq: 'weekly'  },
    // Email & Workspace
    { path: '/email-hosting',               priority: 0.8, changefreq: 'weekly'  },
    { path: '/google-workspace',            priority: 0.8, changefreq: 'weekly'  },
    { path: '/microsoft-365',               priority: 0.8, changefreq: 'weekly'  },
    { path: '/zimbra-hosting',              priority: 0.7, changefreq: 'weekly'  },
    // Domain & SSL
    { path: '/domain-registration',         priority: 0.8, changefreq: 'weekly'  },
    { path: '/domain-transfer',             priority: 0.7, changefreq: 'weekly'  },
    { path: '/ssl-certificate',             priority: 0.7, changefreq: 'weekly'  },
    // Security
    { path: '/firewall-security',           priority: 0.7, changefreq: 'weekly'  },
    { path: '/vapt',                        priority: 0.7, changefreq: 'weekly'  },
    { path: '/pam-mfa',                     priority: 0.7, changefreq: 'weekly'  },
    // Backup
    { path: '/acronis-backup',              priority: 0.7, changefreq: 'weekly'  },
    { path: '/veeam-backup',               priority: 0.7, changefreq: 'weekly'  },
    // Specialty
    { path: '/forex-vps',                   priority: 0.7, changefreq: 'weekly'  },
    { path: '/tally-on-cloud',              priority: 0.7, changefreq: 'weekly'  },
    // Info
    { path: '/about-us',                    priority: 0.6, changefreq: 'monthly' },
    { path: '/contact-us',                  priority: 0.8, changefreq: 'monthly' },
    { path: '/pricing',                     priority: 0.7, changefreq: 'weekly'  },
];

async function buildSitemapEntries(req) {
    const baseUrl = process.env.SITE_URL ||
        (req ? `${req.protocol}://${req.get('host')}` : 'https://icsdc.in');
    const today = new Date().toISOString().split('T')[0];

    const entries = STATIC_PAGES.map(function (p) {
        return {
            loc:        baseUrl + p.path,
            lastmod:    today,
            changefreq: p.changefreq,
            priority:   p.priority,
            type:       'static',
        };
    });

    // Append published builder pages
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/builder-pages?` +
            `publicationState=live&fields[0]=slug&fields[1]=updatedAt&pagination[pageSize]=500`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        if (r.ok) {
            const { data } = await r.json();
            (data || []).forEach(function (item) {
                const d = item.attributes || item;
                if (!d.slug) return;
                entries.push({
                    loc:        baseUrl + '/builder/' + d.slug,
                    lastmod:    d.updatedAt ? d.updatedAt.split('T')[0] : today,
                    changefreq: 'weekly',
                    priority:   0.7,
                    type:       'builder',
                });
            });
        }
    } catch (_) { /* builder pages unavailable — skip */ }

    return entries;
}

// Public: serve sitemap.xml
app.get('/sitemap.xml', async function (req, res) {
    try {
        const entries = await buildSitemapEntries(req);
        const rows = entries.map(function (e) {
            return `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`;
        }).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    } catch (err) {
        console.error('[sitemap] error:', err.message);
        res.status(500).send('Error generating sitemap');
    }
});

// Admin: return sitemap data as JSON
app.get('/api/admin/sitemap', requireAdminAuth, async function (req, res) {
    try {
        const entries     = await buildSitemapEntries(req);
        const sitemapUrl  = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`) + '/sitemap.xml';
        res.json({
            entries,
            sitemapUrl,
            generatedAt: new Date().toISOString(),
            counts: {
                total:   entries.length,
                static:  entries.filter(function (e) { return e.type === 'static';  }).length,
                builder: entries.filter(function (e) { return e.type === 'builder'; }).length,
            },
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate sitemap data' });
    }
});

// ══════════════════════════════════════════════════════════
//  ADMIN SPA (existing)
// ══════════════════════════════════════════════════════════
const adminPath = path.join(__dirname, 'public/admin');
app.use('/admin', express.static(adminPath));
app.get('/admin', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));
app.get('/admin/*path', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));

// Redirect .html URLs to clean URLs
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const cleanUrl = req.path.replace('.html', '');
        return res.redirect(301, cleanUrl);
    }
    next();
});

// Serve static assets
app.use(express.static(publicPath));

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Dynamic routes — gate on page registry cache
app.get('/:page', (req, res) => {
    const slug = req.params.page;

    // If the slug is registered and marked offline → 404 immediately
    if (pageCache.has(slug) && !pageCache.get(slug)) {
        return res.status(404).sendFile(path.join(publicPath, '404.html'));
    }

    const filePath = path.join(publicPath, `${slug}.html`);
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).sendFile(path.join(publicPath, '404.html'));
        }
        res.sendFile(filePath);
    });
});

// ══════════════════════════════════════════════════════════
//  LIVE CHAT — Socket.io + bot state machine
// ══════════════════════════════════════════════════════════

const BOT_STEPS = [
    { field: 'name',        type: 'text',     question: "Hi! 👋 Welcome to ICSDC. I'm here to help. What's your name?" },
    { field: 'phone',       type: 'tel',      question: null },   // dynamic — set at runtime
    { field: 'service',     type: 'chips',    question: 'Which service are you interested in?',
      options: ['Cloud Hosting', 'VPS Hosting', 'Dedicated Server', 'Email Hosting', 'Domain & SSL', 'Security', 'Other'] },
    { field: 'company',     type: 'text',     question: 'Your company name? (optional)', optional: true },
    { field: 'requirement', type: 'textarea', question: 'Tell us about your requirement:' },
    { field: 'budget',      type: 'chips',    question: 'Approximate monthly budget?',
      options: ['Under ₹5K', '₹5K–₹20K', '₹20K–₹50K', '₹50K+', 'Not sure'] },
];

// In-memory chat sessions  { sessionId → session }
const chatSessions = new Map();

function makeSession(sessionId) {
    return {
        sessionId,
        step: 0,
        status: 'bot',
        data: { name: '', phone: '', service: '', company: '', requirement: '', budget: '' },
        messages: [],
        visitorSocketId: null,
        adminSocketId:   null,
        strapiDocId:     null,
        createdAt:       new Date().toISOString(),
    };
}

function addMsg(session, role, text) {
    session.messages.push({ role, text, ts: new Date().toISOString() });
}

function currentStep(session) {
    return BOT_STEPS[session.step] || null;
}

function buildBotQuestion(step, data) {
    if (step.field === 'phone') {
        return { ...step, question: `Nice to meet you, ${data.name}! What's your phone number?` };
    }
    return step;
}

// Persist / update in Strapi
async function upsertChatSession(session) {
    try {
        const body = {
            data: {
                sessionId:   session.sessionId,
                name:        session.data.name,
                phone:       session.data.phone,
                service:     session.data.service,
                company:     session.data.company,
                requirement: session.data.requirement,
                budget:      session.data.budget,
                status:      session.status,
                messages:    session.messages,
            },
        };
        if (session.strapiDocId) {
            // Update existing
            await fetch(
                `${STRAPI_URL}/api/chat-sessions/${session.strapiDocId}`,
                { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` }, body: JSON.stringify(body) }
            );
        } else {
            // Create new
            const r = await fetch(
                `${STRAPI_URL}/api/chat-sessions`,
                { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${STRAPI_TOKEN}` }, body: JSON.stringify(body) }
            );
            if (r.ok) {
                const json = await r.json();
                session.strapiDocId = (json.data && (json.data.documentId || json.data.id)) || null;
            }
        }
    } catch (err) {
        console.error('[chat] Strapi upsert failed:', err.message);
    }
}

// Broadcast a summary of a session to all connected admins
function broadcastSessionToAdmins(io, session, event) {
    io.to('room:admins').emit(event, serializeSession(session));
}

function serializeSession(session) {
    return {
        sessionId:  session.sessionId,
        name:       session.data.name,
        phone:      session.data.phone,
        service:    session.data.service,
        company:    session.data.company,
        requirement:session.data.requirement,
        budget:     session.data.budget,
        status:     session.status,
        messages:   session.messages,
        createdAt:  session.createdAt,
        visitorOnline: !!session.visitorSocketId,
    };
}

// ── Socket.io setup ───────────────────────────────────────
function initSocketIO(io) {
    io.on('connection', function (socket) {

        // ── VISITOR EVENTS ────────────────────────────────
        socket.on('chat:init', function ({ sessionId }) {
            if (!sessionId) return;

            let session = chatSessions.get(sessionId);
            if (!session) {
                session = makeSession(sessionId);
                chatSessions.set(sessionId, session);
            }
            session.visitorSocketId = socket.id;
            socket.join('session:' + sessionId);

            // Send the current (or first) bot question
            const step = currentStep(session);
            if (step && session.status === 'bot') {
                const q = buildBotQuestion(step, session.data);
                socket.emit('chat:bot-message', q);
            }
        });

        socket.on('chat:message', async function ({ sessionId, text }) {
            if (!sessionId || !text) return;
            const session = chatSessions.get(sessionId);
            if (!session) return;

            addMsg(session, 'visitor', text);

            if (session.status === 'live') {
                // Forward to admin
                if (session.adminSocketId) {
                    io.to(session.adminSocketId).emit('admin:visitor-message', { sessionId, text });
                }
                broadcastSessionToAdmins(io, session, 'admin:session-update');
                return;
            }

            // Bot mode — record answer and advance
            const step = currentStep(session);
            if (step) {
                session.data[step.field] = text;
                session.step += 1;
            }

            const nextStep = currentStep(session);
            if (nextStep) {
                const q = buildBotQuestion(nextStep, session.data);
                addMsg(session, 'bot', q.question);
                socket.emit('chat:bot-message', q);
            } else {
                // All steps complete
                const doneMsg = `Thanks ${session.data.name}! 🎉 Our team will reach out to you at ${session.data.phone} shortly.`;
                addMsg(session, 'bot', doneMsg);
                socket.emit('chat:complete', { text: doneMsg });
                session.status = 'closed';
                await upsertChatSession(session);
                broadcastSessionToAdmins(io, session, 'admin:session-new');
                return;
            }

            // Upsert progress every step so data isn't lost
            await upsertChatSession(session);
            broadcastSessionToAdmins(io, session,
                session.messages.length <= 3 ? 'admin:session-new' : 'admin:session-update');
        });

        // ── ADMIN EVENTS ──────────────────────────────────
        socket.on('admin:auth', async function ({ token }) {
            if (!token) return;
            try {
                const r = await fetch(`${STRAPI_URL}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!r.ok) { socket.emit('admin:auth-fail'); return; }
                socket.join('room:admins');
                socket.emit('admin:auth-ok');
                // Send current session list
                const sessions = [...chatSessions.values()].map(serializeSession)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                socket.emit('admin:session-list', sessions);
            } catch { socket.emit('admin:auth-fail'); }
        });

        socket.on('admin:takeover', function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session) return;
            session.status = 'live';
            session.adminSocketId = socket.id;
            socket.join('session:' + sessionId);
            // Notify visitor
            if (session.visitorSocketId) {
                io.to(session.visitorSocketId).emit('chat:agent-joined', {
                    text: "You're now connected with a support agent. 👤",
                });
            }
            broadcastSessionToAdmins(io, session, 'admin:session-update');
        });

        socket.on('admin:message', async function ({ sessionId, text }) {
            if (!sessionId || !text) return;
            const session = chatSessions.get(sessionId);
            if (!session) return;
            addMsg(session, 'admin', text);
            if (session.visitorSocketId) {
                io.to(session.visitorSocketId).emit('chat:admin-message', { text });
            }
            await upsertChatSession(session);
            broadcastSessionToAdmins(io, session, 'admin:session-update');
        });

        socket.on('admin:close', async function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session) return;
            session.status = 'closed';
            if (session.visitorSocketId) {
                io.to(session.visitorSocketId).emit('chat:ended', {
                    text: 'This chat has been closed by our support team. We\'ll follow up soon!',
                });
            }
            session.adminSocketId   = null;
            await upsertChatSession(session);
            broadcastSessionToAdmins(io, session, 'admin:session-update');
        });

        // ── DISCONNECT ────────────────────────────────────
        socket.on('disconnect', function () {
            // Find any session this socket owned as visitor
            for (const session of chatSessions.values()) {
                if (session.visitorSocketId === socket.id) {
                    session.visitorSocketId = null;
                    io.to('room:admins').emit('admin:visitor-status', { sessionId: session.sessionId, online: false });
                }
                if (session.adminSocketId === socket.id) {
                    session.adminSocketId = null;
                }
            }
        });
    });
}

// ── Admin REST endpoints for chat ─────────────────────────
app.get('/api/admin/chat/sessions', requireAdminAuth, function (req, res) {
    const sessions = [...chatSessions.values()]
        .map(serializeSession)
        .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
    res.json({ data: sessions });
});

app.get('/api/admin/chat/sessions/:sessionId', requireAdminAuth, function (req, res) {
    const session = chatSessions.get(req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ data: serializeSession(session) });
});

// ══════════════════════════════════════════════════════════
//  BOOT
// ══════════════════════════════════════════════════════════
const PORT   = process.env.PORT || 3000;
const server = http.createServer(app);
const io     = new SocketServer(server, { cors: { origin: '*' } });
initSocketIO(io);

server.listen(PORT, function () {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('[socket.io] Live chat ready');
    refreshPageCache();
});
