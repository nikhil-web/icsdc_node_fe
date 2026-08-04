require('dotenv').config();

const express = require('express');
const http    = require('http');
const { Server: SocketServer } = require('socket.io');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');

const app = express();

const publicPath = path.join(__dirname, 'public/ICSDC_Frontend');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
// STRAPI_URL is how THIS SERVER reaches Strapi (often http://localhost:1337 when
// Node and Strapi run as sibling services on the same box — fast + no public
// exposure needed for that hop). It must never be handed to a BROWSER: a remote
// admin's browser resolves "localhost" to their OWN machine, not the server, so
// any URL built from STRAPI_URL and sent in an API response 404s/refuses for
// everyone except someone who happens to run Strapi locally on their own port
// 1337 too. STRAPI_PUBLIC_URL is the address a browser can actually reach —
// falls back to STRAPI_URL for pure-local dev where they're the same host.
const STRAPI_PUBLIC_URL = process.env.STRAPI_PUBLIC_URL || STRAPI_URL;

// ── Crawler prerendering (dynamic rendering) ──────────────
// Fully-rendered static snapshots (built by prerender.js) live in /prerendered and
// are served to known crawlers so non-JS bots get real content. Humans get the SPA.
const prerenderDir = path.join(publicPath, 'prerendered');
const BOT_UA_RE = /(ClaudeBot|anthropic-ai|Claude-Web|Claude-User|Claude-SearchBot|GPTBot|ChatGPT-User|OAI-SearchBot|PerplexityBot|CCBot|Google-Extended|Googlebot|Google-InspectionTool|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Applebot|Amazonbot|meta-externalagent|facebookexternalhit|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|redditbot)/i;

// Map a request path → snapshot file. MUST match snapshotFile() in prerender.js.
function snapshotFileForPath(p) {
    if (!p || p === '/') return path.join(prerenderDir, 'home.html');
    p = p.replace(/\/$/, '');
    if (p.startsWith('/legal/')) return path.join(prerenderDir, 'legal', p.slice('/legal/'.length) + '.html');
    return path.join(prerenderDir, p.replace(/^\//, '') + '.html');
}

// Tracks an in-progress admin-triggered prerender build.
const prerenderState = { running: false, startedAt: null, finishedAt: null, exitCode: null, log: '' };

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
            // Keep cache in sync, THEN rewrite the static sitemap so the
            // hide/unhide takes effect for crawlers within seconds.
            refreshPageCache()
                .then(function () { return writeSitemapFile(req); })
                .catch(function (e) { console.warn('[sitemap] post-toggle regen failed:', e.message); });
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
// Slugs that builder pages may never take: every static page file, legal,
// admin/api/assets plumbing. Builder pages publish at top-level /<slug>
// (2026-07-03), so collisions would shadow real pages.
function isReservedBuilderSlug(slug) {
    const s = String(slug || '').toLowerCase().replace(/^\/+|\/+$/g, '');
    if (!s || !/^[a-z0-9-]+$/.test(s)) return true;                 // invalid chars → reject
    const RESERVED = ['legal', 'admin', 'api', 'assets', 'builder', 'prerendered',
        'sitemap', 'robots', 'socket.io', 'index', 'home', '404'];
    if (RESERVED.includes(s)) return true;
    try {
        if (fs.existsSync(path.join(publicPath, s + '.html'))) return true;   // static page exists
    } catch (_) {}
    return false;
}

app.post('/api/admin/builder/pages', requireAdminAuth, async (req, res) => {
    try {
        const { title, slug, sections, metaTitle, metaDescription, templateId } = req.body || {};
        if (!title || !slug) {
            return res.status(400).json({ error: 'title and slug are required' });
        }
        if (isReservedBuilderSlug(slug)) {
            return res.status(400).json({ error: 'This slug is reserved or already used by an existing site page. Choose another.' });
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

        bustBuilderMetaCache();   // new/updated meta must show at top-level URL immediately

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
        bustBuilderMetaCache();   // top-level serving must reflect the delete immediately
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
// Builds URLs that go straight into a browser <img src> and can also be saved
// permanently into builder-page props (shared across every environment reading
// that content) — must use STRAPI_PUBLIC_URL, never the server-internal STRAPI_URL.
function absolutifyMediaUrls(file) {
    if (!file || typeof file !== 'object') return file;
    // Strapi 5 sometimes wraps responses as { id, attributes: {...} }
    const target = file.attributes && typeof file.attributes === 'object' ? file.attributes : file;
    if (target.url && !/^https?:/i.test(target.url)) target.url = STRAPI_PUBLIC_URL.replace(/\/$/, '') + target.url;
    if (target.formats && typeof target.formats === 'object') {
        Object.keys(target.formats).forEach((k) => {
            const f = target.formats[k];
            if (f && f.url && !/^https?:/i.test(f.url)) f.url = STRAPI_PUBLIC_URL.replace(/\/$/, '') + f.url;
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
// Since 2026-07-03 builder pages live at top-level /<slug>; legacy
// /builder/<slug> URLs 301 there. __canvas is the editor's WYSIWYG
// canvas shell (rendered via postMessage — see canvas-mode.js).
app.get('/builder/:slug', (req, res) => {
    if (req.params.slug === '__canvas') {
        return res.sendFile(path.join(publicPath, 'builder-template.html'));
    }
    res.redirect(301, '/' + encodeURIComponent(req.params.slug));
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
    { path: '/',                            priority: 1.0, changefreq: 'daily'    },
    // Core hosting
    { path: '/cloud-hosting',               priority: 0.9, changefreq: 'daily'    },
    { path: '/cpanel-hosting',              priority: 0.9, changefreq: 'daily'    },
    { path: '/reseller-hosting',            priority: 0.9, changefreq: 'daily'    },
    { path: '/wordpress-hosting',           priority: 0.9, changefreq: 'daily'    },
    { path: '/shared-hosting',              priority: 0.9, changefreq: 'daily'    },
    { path: '/web-hosting',                 priority: 0.9, changefreq: 'daily'    },
    // VPS
    { path: '/vps-hosting',                 priority: 0.9, changefreq: 'daily'    },
    { path: '/linux-vps-hosting',           priority: 0.8, changefreq: 'daily'    },
    { path: '/windows-vps-hosting',         priority: 0.8, changefreq: 'daily'    },
    { path: '/managed-vps-hosting',         priority: 0.8, changefreq: 'daily'    },
    { path: '/vps-cpanel',                  priority: 0.8, changefreq: 'daily'    },
    { path: '/vps-hosting-trial',           priority: 0.7, changefreq: 'daily'    },
    // Dedicated
    { path: '/dedicated-server',            priority: 0.9, changefreq: 'daily'    },
    { path: '/bare-metal-server',           priority: 0.8, changefreq: 'daily'    },
    { path: '/linux-dedicated-server',      priority: 0.8, changefreq: 'daily'    },
    { path: '/windows-dedicated-server',    priority: 0.8, changefreq: 'daily'    },
    { path: '/managed-dedicated-server',    priority: 0.8, changefreq: 'daily'    },
    { path: '/gpu-dedicated-server',        priority: 0.8, changefreq: 'daily'    },
    { path: '/nvme-dedicated-servers',      priority: 0.7, changefreq: 'daily'    },
    // Cloud
    { path: '/managed-cloud-hosting',       priority: 0.8, changefreq: 'daily'    },
    { path: '/linux-cloud-hosting',         priority: 0.8, changefreq: 'daily'    },
    { path: '/windows-cloud-hosting',       priority: 0.8, changefreq: 'daily'    },
    { path: '/gpu-cloud-hosting',           priority: 0.8, changefreq: 'daily'    },
    { path: '/aws-cloud-hosting',           priority: 0.8, changefreq: 'daily'    },
    { path: '/azure-cloud-hosting',         priority: 0.8, changefreq: 'daily'    },
    { path: '/google-cloud-hosting',        priority: 0.8, changefreq: 'daily'    },
    { path: '/virtual-machine',             priority: 0.7, changefreq: 'daily'    },
    { path: '/cloud-storage',               priority: 0.7, changefreq: 'daily'    },
    // Email & Workspace
    { path: '/email-hosting',               priority: 0.8, changefreq: 'daily'    },
    { path: '/google-workspace',            priority: 0.8, changefreq: 'daily'    },
    { path: '/microsoft-365',               priority: 0.8, changefreq: 'daily'    },
    { path: '/zimbra-hosting',              priority: 0.7, changefreq: 'daily'    },
    // Domain & SSL
    { path: '/domain-registration',         priority: 0.8, changefreq: 'daily'    },
    { path: '/domain-transfer',             priority: 0.7, changefreq: 'daily'    },
    { path: '/ssl-certificate',             priority: 0.7, changefreq: 'daily'    },
    // Security
    { path: '/firewall-security',           priority: 0.7, changefreq: 'daily'    },
    { path: '/vapt',                        priority: 0.7, changefreq: 'daily'    },
    { path: '/pam-mfa',                     priority: 0.7, changefreq: 'daily'    },
    // Backup
    { path: '/acronis-backup',              priority: 0.7, changefreq: 'daily'    },
    { path: '/veeam-backup',               priority: 0.7, changefreq: 'daily'    },
    // Specialty
    { path: '/forex-vps',                   priority: 0.7, changefreq: 'daily'    },
    { path: '/tally-on-cloud',              priority: 0.7, changefreq: 'daily'    },
    // Info
    { path: '/about-us',                    priority: 0.6, changefreq: 'daily'   },
    { path: '/contact-us',                  priority: 0.8, changefreq: 'daily'   },
    { path: '/pricing',                     priority: 0.7, changefreq: 'daily'    },
    // Legal
    { path: '/legal/terms-conditions',      priority: 0.3, changefreq: 'yearly'  },
    { path: '/legal/privacy-policy',        priority: 0.3, changefreq: 'yearly'  },
    { path: '/legal/refund-policy',         priority: 0.3, changefreq: 'yearly'  },
    { path: '/legal/msa',                   priority: 0.3, changefreq: 'yearly'  },
    { path: '/legal/aup',                   priority: 0.3, changefreq: 'yearly'  },
    { path: '/legal/sla',                   priority: 0.3, changefreq: 'yearly'  },
];

// Derive a page-registry slug from a STATIC_PAGES path so we can consult pageCache.
// '/'                   → 'index'  (matches index.html — the homepage file)
// '/dedicated-server'   → 'dedicated-server'
// If no matching row exists in pageCache, isPageLive() defaults to include,
// so the homepage stays in the sitemap whether or not it has a registry row.
function slugFromPath(p) {
    if (!p || p === '/' || p === '') return 'index';
    return p.replace(/^\//, '').replace(/\/$/, '');
}

// Page-registry: include unless explicitly toggled to isLive=false.
// Pages absent from the cache default to visible (preserves current behaviour
// for any page not yet registered in Strapi).
function isPageLive(slug) {
    return pageCache.has(slug) ? pageCache.get(slug) !== false : true;
}

async function buildSitemapEntries(req) {
    // Always emit absolute https URLs for the canonical domain. req.protocol is
    // unreliable — it is http when Node runs behind a TLS-terminating proxy or on
    // localhost, which previously made regenerated sitemaps use http://. SITE_URL
    // (https://icsdc.com) wins when set; otherwise fall back to the canonical https URL.
    const baseUrl = process.env.SITE_URL || 'https://icsdc.com';
    const today = new Date().toISOString().split('T')[0];

    const entries = STATIC_PAGES
        // Homepage ('/') and legal pages are always included regardless of
        // Page Registry state. Every other static page passes through the
        // registry filter.
        .filter(function (p) {
            if (p.path === '/' || p.path.startsWith('/legal/')) return true;
            return isPageLive(slugFromPath(p.path));
        })
        .map(function (p) {
            return {
                loc:        baseUrl + p.path,
                lastmod:    today,
                changefreq: p.changefreq,
                priority:   p.priority,
                type:       'static',
            };
        });

    // Append published builder pages (also filtered by Page Registry)
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
                if (!isPageLive(d.slug)) return;        // honour Page Registry hidden state
                entries.push({
                    loc:        baseUrl + '/' + d.slug,   // top-level URL (2026-07-03)
                    lastmod:    d.updatedAt ? d.updatedAt.split('T')[0] : today,
                    changefreq: 'daily',
                    priority:   0.7,
                    type:       'builder',
                });
            });
        }
    } catch (_) { /* builder pages unavailable — skip */ }

    return entries;
}

// ── Write public/sitemap.xml ──────────────────────────────
// Called on server boot, after Page Registry toggles, and from the manual
// "Regenerate" admin button. Express's static middleware then serves the
// file with proper Last-Modified / ETag headers (SEO win — free 304s).
async function writeSitemapFile(req) {
    try {
        const entries = await buildSitemapEntries(req);
        const rows = entries.map(function (e) {
            return `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority.toFixed(1)}</priority>\n  </url>`;
        }).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
        const file = path.join(publicPath, 'sitemap.xml');
        await fs.promises.writeFile(file, xml, 'utf8');
        console.log(`[sitemap] wrote ${entries.length} entries to ${file}`);
        return { count: entries.length, file };
    } catch (err) {
        console.error('[sitemap] write failed:', err.message);
        throw err;
    }
}

// Public: serve sitemap.xml
// Normal path: express.static(publicPath) (registered later) serves the real
// file at public/ICSDC_Frontend/sitemap.xml with Last-Modified + ETag for free.
// This route is a one-shot fallback that fires only if the file is missing
// (e.g. the moment between server boot and the first write).
app.get('/sitemap.xml', async function (req, res, next) {
    const file = path.join(publicPath, 'sitemap.xml');
    if (fs.existsSync(file)) return next();          // fall through to static middleware
    try {
        await writeSitemapFile(req);
        return res.sendFile(file);
    } catch (err) {
        return res.status(500).send('Error generating sitemap');
    }
});

// Admin: force-regenerate the static sitemap.xml file.
// Refreshes the page-registry cache first so any in-flight CMS edits are
// reflected, then rewrites the file.
app.post('/api/admin/sitemap/regenerate', requireAdminAuth, async function (req, res) {
    try {
        await refreshPageCache();
        const result = await writeSitemapFile(req);
        res.json({ ok: true, generatedAt: new Date().toISOString(), count: result.count });
    } catch (err) {
        res.status(500).json({ error: 'Failed to regenerate sitemap', detail: err.message });
    }
});

// Admin: return sitemap data as JSON
app.get('/api/admin/sitemap', requireAdminAuth, async function (req, res) {
    try {
        const entries     = await buildSitemapEntries(req);
        const sitemapUrl  = (process.env.SITE_URL || 'https://icsdc.com') + '/sitemap.xml';
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
//  ADMIN: PRERENDER / CRAWLER SNAPSHOTS
// ══════════════════════════════════════════════════════════
// List the live pages + each one's snapshot status (built timestamp / size).
app.get('/api/admin/prerender', requireAdminAuth, async function (req, res) {
    try {
        const entries = await buildSitemapEntries(req);
        const pages = entries
            .filter(function (e) { return e.type !== 'builder'; })   // builder pages out of scope
            .map(function (e) {
                let p; try { p = new URL(e.loc).pathname; } catch (_) { p = e.loc; }
                const file = snapshotFileForPath(p);
                let builtAt = null, bytes = null;
                try { const st = fs.statSync(file); builtAt = st.mtime.toISOString(); bytes = st.size; } catch (_) { /* not built */ }
                return { path: p, builtAt: builtAt, bytes: bytes };
            });
        res.json({
            running:    prerenderState.running,
            startedAt:  prerenderState.startedAt,
            finishedAt: prerenderState.finishedAt,
            exitCode:   prerenderState.exitCode,
            log:        prerenderState.log.slice(-4000),
            total:      pages.length,
            built:      pages.filter(function (x) { return x.builtAt; }).length,
            pages:      pages,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read prerender status', detail: err.message });
    }
});

// Trigger a prerender build (all live pages, or a single { path }). Spawns prerender.js.
app.post('/api/admin/prerender', requireAdminAuth, function (req, res) {
    if (prerenderState.running) return res.status(409).json({ error: 'A build is already running' });
    const target = req.body && req.body.path ? String(req.body.path) : '';
    // Only clean site paths — no dots/traversal (target ends up in a filesystem write in prerender.js)
    if (target && !/^\/?[a-z0-9-]+(\/[a-z0-9-]+)*$/i.test(target) && target !== '/') {
        return res.status(400).json({ error: 'Invalid path' });
    }
    const args = ['prerender.js'];
    if (target) args.push(target);

    prerenderState.running = true;
    prerenderState.startedAt = new Date().toISOString();
    prerenderState.finishedAt = null;
    prerenderState.exitCode = null;
    prerenderState.log = '';

    let child;
    try {
        child = spawn(process.execPath, args, { cwd: __dirname, env: process.env });
    } catch (e) {
        prerenderState.running = false;
        return res.status(500).json({ error: 'Failed to start build', detail: e.message });
    }
    child.stdout.on('data', function (d) { prerenderState.log += d.toString(); });
    child.stderr.on('data', function (d) { prerenderState.log += d.toString(); });
    child.on('close', function (code) {
        prerenderState.running = false;
        prerenderState.exitCode = code;
        prerenderState.finishedAt = new Date().toISOString();
    });
    child.on('error', function (e) {
        prerenderState.running = false;
        prerenderState.exitCode = -1;
        prerenderState.log += '\n[spawn error] ' + e.message;
        prerenderState.finishedAt = new Date().toISOString();
    });

    res.json({ ok: true, started: true, target: target || 'all' });
});

// ══════════════════════════════════════════════════════════
//  ADMIN: ROBOTS.TXT EDITOR
//  Reads/writes the flat robots.txt served by express.static.
//  Path is hardcoded (no traversal); both routes require admin auth.
// ══════════════════════════════════════════════════════════
const ROBOTS_PATH = path.join(publicPath, 'robots.txt');
const ROBOTS_DEFAULT = 'User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ' +
    (process.env.SITE_URL || 'https://icsdc.com').replace(/\/+$/, '') + '/sitemap.xml\n';
const ROBOTS_MAX_BYTES = 64 * 1024; // 64KB guard

app.get('/api/admin/robots', requireAdminAuth, async function (req, res) {
    try {
        let content, exists = true;
        try {
            content = await fs.promises.readFile(ROBOTS_PATH, 'utf8');
        } catch (e) {
            if (e.code === 'ENOENT') { content = ROBOTS_DEFAULT; exists = false; }
            else throw e;
        }
        res.json({ content, exists, path: '/robots.txt' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to read robots.txt', detail: err.message });
    }
});

app.post('/api/admin/robots', requireAdminAuth, async function (req, res) {
    try {
        var content = req.body && req.body.content;
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Body must include a string "content" field' });
        }
        if (Buffer.byteLength(content, 'utf8') > ROBOTS_MAX_BYTES) {
            return res.status(413).json({ error: 'robots.txt is too large (max 64KB)' });
        }
        // Normalise to a single trailing newline.
        var normalized = content.replace(/\r\n/g, '\n').replace(/\n*$/, '') + '\n';
        await fs.promises.writeFile(ROBOTS_PATH, normalized, 'utf8');
        res.json({ ok: true, savedAt: new Date().toISOString(), bytes: Buffer.byteLength(normalized, 'utf8') });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save robots.txt', detail: err.message });
    }
});

// ══════════════════════════════════════════════════════════
//  ADMIN SPA (existing)
// ══════════════════════════════════════════════════════════
const adminPath = path.join(__dirname, 'public/admin');
// Deliberately NOT cached like the public site: a stale copy of the builder's
// editor scripts is a real failure mode here (it silently blanks the WYSIWYG
// canvas — see the retry notice in canvas-bridge.js), and the admin is a handful
// of internal users, so there's no meaningful bandwidth win to trade for it.
// Revalidate every load; ETag still yields a cheap 304 when nothing changed.
app.use('/admin', express.static(adminPath, {
    setHeaders(res, filePath) {
        if (/\.(js|mjs|css|html?)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=2592000');
        }
    },
}));
app.get('/admin', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));
app.get('/admin/*path', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));

// ══════════════════════════════════════════════════════════
//  SERVER-SIDE SEO INJECTION
//  The page <body> is rendered client-side from Strapi, but search
//  engines / social scrapers / SEO tools that don't run JS need the
//  SEO <head> in the RAW HTML (View Source). This reads each page's
//  HTML, pulls its SEO from Strapi (cached), and injects a real
//  <title>, meta description, canonical, OpenGraph/Twitter tags, and
//  JSON-LD (Organization + WebSite + WebPage) before sending.
// ══════════════════════════════════════════════════════════
const SEO_SITE_URL = (process.env.SITE_URL || 'https://icsdc.com').replace(/\/+$/, '');
const SEO_OG_IMAGE = SEO_SITE_URL + '/assets/images/main_logo.png';
const SEO_ORG_NAME = 'ICSDC';
const SEO_ORG_ALT = 'Indian Cloud Services & Data Centre';

// clean slug → Strapi single-type. Default convention: `${slug}-page`.
const SEO_ENDPOINT_OVERRIDES = {
    home: 'home-page',
    'nvme-dedicated-servers': 'nvme-dedicated-server-page',
};
function seoEndpointForSlug(slug) {
    return SEO_ENDPOINT_OVERRIDES[slug] || `${slug}-page`;
}

const seoCache = new Map();              // slug → { value, expires }
const SEO_TTL = 10 * 60 * 1000;          // 10 min

/* The hero image is the LCP element on most pages, but it's rendered
   client-side from Strapi — so it isn't in the initial HTML and the browser
   can't start fetching it until main.js has run AND the API has answered.
   Lighthouse scores that as "Request is discoverable in initial document: no".
   Since this server already has the page's Strapi payload in hand, it can emit
   a <link rel=preload> for that exact image and cut a whole round-trip out of LCP.

   Preloading a DIFFERENT derivative than the <img> ends up requesting would
   download the image twice — worse than not preloading at all. The two client
   renderers disagree on their fallback chain (cms-helpers' populateHero goes
   large -> medium -> small; homepage-cms' mediaURL('large') goes large ->
   small), so the only pick guaranteed to match both is `large` itself. When
   there's no large derivative we simply skip the preload rather than gamble. */
function heroPreloadUrl(data) {
    const media = data && data.heroImage && data.heroImage.image;
    if (!media) return null;
    const large = media.formats && media.formats.large;
    if (!large || !large.url) return null;
    let url = large.url;
    if (!/^https?:/i.test(url)) url = STRAPI_PUBLIC_URL.replace(/\/$/, '') + url;
    // Never preload a server-internal origin: the browser resolves "localhost"
    // to the visitor's own machine, so the preload would 404 AND still not match
    // the URL the client script builds from window.STRAPI_URL.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/i.test(url)) return null;
    return url;
}

async function fetchSeo(slug) {
    const cached = seoCache.get(slug);
    if (cached && cached.expires > Date.now()) return cached.value;
    let value = null;
    try {
        const endpoint = seoEndpointForSlug(slug);
        const seoField = endpoint === 'home-page' ? 'SEO' : 'seo';
        const r = await fetch(
            `${STRAPI_URL}/api/${endpoint}?populate[${seoField}]=*&populate[heroImage][populate][image]=true`, {
            headers: STRAPI_TOKEN ? { Authorization: `Bearer ${STRAPI_TOKEN}` } : {},
        });
        if (r.ok) {
            const json = await r.json();
            const data = json && json.data;
            const seo = data && (data.seo || data.SEO);
            if (seo) {
                value = {
                    title: seo.metaTitle || null,
                    description: seo.metaDescription || null,
                    canonicalUrl: seo.canonicalUrl || null,
                };
            }
            const heroUrl = heroPreloadUrl(data);
            if (heroUrl) value = Object.assign(value || {}, { heroImageUrl: heroUrl });
        }
    } catch (e) { /* Strapi down / no such page — fall back to static */ }
    seoCache.set(slug, { value, expires: Date.now() + SEO_TTL });
    return value;
}

function seoEsc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
        .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function seoCanonical(cleanPath, seo) {
    if (seo && seo.canonicalUrl) {
        return /^https?:\/\//.test(seo.canonicalUrl)
            ? seo.canonicalUrl
            : SEO_SITE_URL + (seo.canonicalUrl.charAt(0) === '/' ? '' : '/') + seo.canonicalUrl;
    }
    return SEO_SITE_URL + (cleanPath === '/' ? '/' : cleanPath);
}

function seoJsonLd(canonical, title, description) {
    const graph = [
        {
            '@type': 'Organization', '@id': SEO_SITE_URL + '/#organization',
            name: SEO_ORG_NAME, alternateName: SEO_ORG_ALT,
            url: SEO_SITE_URL, logo: SEO_OG_IMAGE,
        },
        {
            '@type': 'WebSite', '@id': SEO_SITE_URL + '/#website',
            url: SEO_SITE_URL, name: SEO_ORG_NAME,
            publisher: { '@id': SEO_SITE_URL + '/#organization' }, inLanguage: 'en',
        },
        {
            '@type': 'WebPage', '@id': canonical + '#webpage',
            url: canonical, name: title || SEO_ORG_NAME, description: description || '',
            isPartOf: { '@id': SEO_SITE_URL + '/#website' }, inLanguage: 'en',
        },
    ];
    return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

// Read a page HTML file, inject SEO <head>, and send it.
// ── Builder pages at top-level URLs (2026-07-03) ───────────
// Published builder pages are served at /<slug>. This helper resolves a slug
// to its SEO meta (or null if no published builder page exists). Cached 2 min.
const builderMetaCache = new Map();   // slug → { ts, val }
const BUILDER_META_TTL = 2 * 60 * 1000;

// Called by the builder publish/delete admin routes so top-level /<slug>
// serving reflects changes immediately (defined here; hoisted for earlier use).
function bustBuilderMetaCache() { builderMetaCache.clear(); }

async function fetchBuilderPageMeta(slug) {
    const hit = builderMetaCache.get(slug);
    if (hit && Date.now() - hit.ts < BUILDER_META_TTL) return hit.val;
    let val = null;
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/builder-pages?filters[slug][$eq]=${encodeURIComponent(slug)}` +
            `&fields[0]=title&fields[1]=metaTitle&fields[2]=metaDescription&pagination[pageSize]=1`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        if (r.ok) {
            const json = await r.json();
            const d = (json.data && json.data[0]) || null;
            if (d) val = { title: d.metaTitle || d.title || slug, description: d.metaDescription || '' };
        }
    } catch (_) { /* Strapi down → treat as no builder page */ }
    builderMetaCache.set(slug, { ts: Date.now(), val });
    return val;
}

async function sendPageWithSeo(req, res, filePath, slug, cleanPath, seoOverride) {
    let html;
    try {
        html = await fs.promises.readFile(filePath, 'utf8');
    } catch (e) {
        return res.status(404).sendFile(path.join(publicPath, '404.html'));
    }

    const seo = seoOverride || await fetchSeo(slug);

    const curTitleM = html.match(/<title>([\s\S]*?)<\/title>/i);
    const curDescM = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);

    const title = (seo && seo.title) || (curTitleM && curTitleM[1].trim()) || SEO_ORG_NAME;
    const description = (seo && seo.description) || (curDescM && curDescM[1].trim()) || '';
    const canonical = seoCanonical(cleanPath, seo);

    const headTags = [
        // Preload first: it's only useful if the browser sees it early.
        // `media` matters: style.css hides .hero-right below 1366px, so on phones
        // and tablets this image is never painted. An unconditional preload still
        // downloads it at high priority there (measured: a 771 KB PNG fetched and
        // decoded while display:none), stealing bandwidth from the real mobile LCP.
        // Gating on the same breakpoint keeps the desktop LCP win without the
        // mobile cost. Keep this query in sync with the .hero-right rule in style.css.
        ...(seo && seo.heroImageUrl
            ? [`<link rel="preload" as="image" fetchpriority="high" media="(min-width: 1366px)" href="${seoEsc(seo.heroImageUrl)}">`]
            : []),
        `<link rel="canonical" href="${seoEsc(canonical)}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:site_name" content="${SEO_ORG_NAME}">`,
        `<meta property="og:title" content="${seoEsc(title)}">`,
        `<meta property="og:description" content="${seoEsc(description)}">`,
        `<meta property="og:url" content="${seoEsc(canonical)}">`,
        `<meta property="og:image" content="${seoEsc(SEO_OG_IMAGE)}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${seoEsc(title)}">`,
        `<meta name="twitter:description" content="${seoEsc(description)}">`,
        `<meta name="twitter:image" content="${seoEsc(SEO_OG_IMAGE)}">`,
        `<script type="application/ld+json">${seoJsonLd(canonical, title, description)}</script>`,
    ].join('\n    ');

    // Replace <title>
    if (curTitleM) html = html.replace(curTitleM[0], `<title>${seoEsc(title)}</title>`);
    // Replace or insert meta description
    if (curDescM) {
        html = html.replace(curDescM[0], `<meta name="description" content="${seoEsc(description)}">`);
    } else if (description) {
        html = html.replace(/<\/head>/i, `    <meta name="description" content="${seoEsc(description)}">\n</head>`);
    }
    // Inject canonical + OG/Twitter + JSON-LD before </head>
    html = html.replace(/<\/head>/i, `    ${headTags}\n</head>`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    // Explicit, because "no Cache-Control" is not the same as "don't cache":
    // browsers fall back to heuristic freshness (a fraction of Last-Modified age)
    // and would serve a stale shell — with stale server-injected SEO tags and CMS
    // copy — after a content update. ETag still gives a cheap 304 when unchanged.
    res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    res.send(html);
}

// Redirect .html URLs to clean URLs
app.use((req, res, next) => {
    if (req.path.endsWith('.html')) {
        const cleanUrl = req.path.replace('.html', '');
        return res.redirect(301, cleanUrl);
    }
    next();
});

// Serve prerendered snapshots to known crawlers (dynamic rendering). Humans fall
// through to the normal client-rendered app below. Content is identical → not cloaking.
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.includes('.')) return next();                       // assets/files → let static handle
    res.set('Vary', 'User-Agent');                                   // response differs by UA → keep caches honest
    if (!BOT_UA_RE.test(req.headers['user-agent'] || '')) return next();
    const file = snapshotFileForPath(req.path);
    fs.access(file, fs.constants.F_OK, (err) => {
        if (err) return next();                                       // no snapshot → normal SSR path
        res.set('X-Prerendered', '1');
        res.sendFile(file);
    });
});

// ── Static asset caching ──────────────────────────────────
// Assets here are NOT content-hashed (style.css keeps its name across deploys),
// so an aggressive immutable max-age would strand users on stale CSS/JS after a
// release. Tiered instead:
//   images/fonts — 30d. Big win (Lighthouse flagged ~790 KiB of re-fetching) and
//                  low risk: these are replaced far less often, and a swapped
//                  image is usually uploaded under a new name anyway.
//   css/js       — 1d, so a deploy propagates within a day; ETag/Last-Modified
//                  still give instant 304s inside that window.
//   html         — must-revalidate. Never cache the shell: it carries the
//                  server-injected SEO head and CMS-driven copy.
const STATIC_ASSET_RE = /\.(png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf|eot|mp4|webm)$/i;

function setStaticCacheHeaders(res, filePath) {
    if (STATIC_ASSET_RE.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=2592000');      // 30 days
    } else if (/\.(css|js|mjs)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400');        // 1 day
    } else if (/\.html?$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
}

// Serve static assets. index:false so "/" falls through to the SEO-injecting
// homepage route below instead of static auto-serving index.html.
app.use(express.static(publicPath, { index: false, setHeaders: setStaticCacheHeaders }));

// Homepage (SEO-injected)
app.get('/', (req, res) => {
    sendPageWithSeo(req, res, path.join(publicPath, 'index.html'), 'home', '/');
});

// Legal pages — serve from legal/ subdirectory (SEO-injected; no Strapi → static
// title + computed canonical + Organization/WebSite/WebPage JSON-LD)
app.get('/legal/:page', (req, res) => {
    const slug = req.params.page;
    sendPageWithSeo(req, res, path.join(publicPath, 'legal', `${slug}.html`), `legal-${slug}`, `/legal/${slug}`);
});

// Dynamic routes — gate on page registry cache (SEO-injected)
app.get('/:page', async (req, res) => {
    const slug = req.params.page;

    // If the slug is registered and marked offline → 404 immediately
    if (pageCache.has(slug) && !pageCache.get(slug)) {
        return res.status(404).sendFile(path.join(publicPath, '404.html'));
    }

    const filePath = path.join(publicPath, `${slug}.html`);

    // No static page file → maybe a published builder page lives at this slug
    if (!fs.existsSync(filePath)) {
        const bp = await fetchBuilderPageMeta(slug);
        if (bp) {
            return sendPageWithSeo(req, res, path.join(publicPath, 'builder-template.html'), slug, `/${slug}`, bp);
        }
    }

    sendPageWithSeo(req, res, filePath, slug, `/${slug}`);
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

// ── Chat DB helpers (direct PostgreSQL via knex) ──────────
// Reuses global.__builderKnex which is initialised by initBuilderKnex() above.
// Falls back to a no-op if DATABASE_URL is not set (dev without pg).

async function initChatDb() {
    const knex = global.__builderKnex;
    if (!knex) { console.warn('[chat] DATABASE_URL not set — chat sessions will not persist across restarts'); return; }
    try {
        await knex.schema.createTableIfNotExists('app_chat_sessions', function (t) {
            t.text('session_id').primary();
            t.text('name');
            t.text('phone');
            t.text('service');
            t.text('company');
            t.text('requirement');
            t.text('budget');
            t.text('status').notNullable().defaultTo('bot');
            t.integer('step').notNullable().defaultTo(0);
            t.jsonb('messages').notNullable().defaultTo('[]');
            t.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
            t.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        });
        console.log('[chat] app_chat_sessions table ready');
        // Table is named app_chat_sessions (not chat_sessions) so it does NOT
        // collide with the legacy Strapi chat-session collection's table.
    } catch (err) {
        console.warn('[chat] Could not create app_chat_sessions table:', err.message);
    }
}

async function upsertChatSession(session) {
    const knex = global.__builderKnex;
    if (!knex) return;
    try {
        await knex('app_chat_sessions')
            .insert({
                session_id:  session.sessionId,
                name:        session.data.name        || null,
                phone:       session.data.phone       || null,
                service:     session.data.service     || null,
                company:     session.data.company     || null,
                requirement: session.data.requirement || null,
                budget:      session.data.budget      || null,
                status:      session.status,
                step:        session.step,
                messages:    JSON.stringify(session.messages),
                created_at:  session.createdAt || new Date().toISOString(),
                updated_at:  new Date().toISOString(),
            })
            .onConflict('session_id')
            .merge(['name', 'phone', 'service', 'company', 'requirement', 'budget',
                    'status', 'step', 'messages', 'updated_at']);
    } catch (err) {
        console.error('[chat] DB upsert failed:', err.message);
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
        createdAt:  session.createdAt || new Date().toISOString(),
        visitorOnline: !!session.visitorSocketId,
    };
}

// ── Restore sessions from PostgreSQL on startup ───────────
async function loadSessionsFromDB() {
    const knex = global.__builderKnex;
    if (!knex) return;
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const rows = await knex('app_chat_sessions')
            .where(function () {
                this.where('status', '!=', 'closed')
                    .orWhere('updated_at', '>', since);
            })
            .orderBy('created_at', 'desc')
            .limit(200);
        for (const row of rows) {
            if (chatSessions.has(row.session_id)) continue;
            const messages = Array.isArray(row.messages) ? row.messages : (JSON.parse(row.messages || '[]'));
            chatSessions.set(row.session_id, {
                sessionId:      row.session_id,
                step:           row.step || 0,
                status:         row.status || 'bot',
                data: {
                    name:        row.name        || '',
                    phone:       row.phone       || '',
                    service:     row.service     || '',
                    company:     row.company     || '',
                    requirement: row.requirement || '',
                    budget:      row.budget      || '',
                },
                messages,
                visitorSocketId: null,
                adminSocketId:   null,
                createdAt:       row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
            });
        }
        console.log(`[chat] Restored ${chatSessions.size} session(s) from PostgreSQL`);
    } catch (err) {
        console.warn('[chat] Session restore failed:', err.message);
    }
}

// ── Socket.io setup ───────────────────────────────────────
function initSocketIO(io) {
    io.on('connection', function (socket) {

        // ── VISITOR EVENTS ────────────────────────────────
        socket.on('chat:init', function ({ sessionId }) {
            if (!sessionId) return;

            const isNew = !chatSessions.has(sessionId);
            let session = chatSessions.get(sessionId);
            if (!session) {
                session = makeSession(sessionId);
                chatSessions.set(sessionId, session);
            }
            session.visitorSocketId = socket.id;
            socket.join('session:' + sessionId);

            // Notify admins
            if (isNew) {
                broadcastSessionToAdmins(io, session, 'admin:session-new');
            } else {
                io.to('room:admins').emit('admin:visitor-status', { sessionId, online: true });
            }

            if (isNew) {
                // Brand-new session — ask the first bot question fresh
                const step = currentStep(session);
                if (step) {
                    const q = buildBotQuestion(step, session.data);
                    addMsg(session, 'bot', q.question);
                    socket.emit('chat:bot-message', q);
                }
            } else {
                // Reconnecting visitor — send full history so the widget can
                // re-render cleanly without duplicating any messages
                const step = currentStep(session);
                socket.emit('chat:restore', {
                    messages:    session.messages,
                    status:      session.status,
                    currentStep: step ? buildBotQuestion(step, session.data) : null,
                });
            }
        });

        socket.on('chat:message', async function ({ sessionId, text }) {
            if (!sessionId || !text) return;
            const session = chatSessions.get(sessionId);
            if (!session) return;

            // Defensive dedup: drop an identical visitor message arriving
            // within 1.5s of the previous one (covers double-emit cases).
            const last = session.messages[session.messages.length - 1];
            if (last && last.role === 'visitor' && last.text === text &&
                (Date.now() - new Date(last.ts).getTime()) < 1500) {
                return;
            }

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
                // All steps complete — notify visitor but keep status 'bot' so admin can still take over
                const doneMsg = `Thanks ${session.data.name}! 🎉 Our team will reach out to you at ${session.data.phone} shortly. Feel free to wait if you'd like to chat with us now.`;
                addMsg(session, 'bot', doneMsg);
                socket.emit('chat:complete', { text: doneMsg });
                // status stays 'bot' — admin can take over anytime
                await upsertChatSession(session);
                broadcastSessionToAdmins(io, session, 'admin:session-update');
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
            // Bug 3: prevent two admins from taking over the same session
            if (session.status === 'live' && session.adminSocketId && session.adminSocketId !== socket.id) {
                socket.emit('admin:takeover-fail', { reason: 'Another agent is already handling this chat.' });
                return;
            }
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
            // Defensive dedup: drop an identical admin message arriving within
            // 1.5s of the previous one (covers double-click / cached optimistic
            // append re-emit / network retry). Doesn't block legitimate repeats.
            const last = session.messages[session.messages.length - 1];
            if (last && last.role === 'admin' && last.text === text &&
                (Date.now() - new Date(last.ts).getTime()) < 1500) {
                return;
            }
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

        // ── TYPING INDICATORS ─────────────────────────────
        socket.on('visitor:typing', function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session || !session.adminSocketId) return;
            io.to(session.adminSocketId).emit('visitor:typing', { sessionId });
        });

        socket.on('visitor:typing-stop', function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session || !session.adminSocketId) return;
            io.to(session.adminSocketId).emit('visitor:typing-stop', { sessionId });
        });

        socket.on('admin:typing', function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session || !session.visitorSocketId) return;
            io.to(session.visitorSocketId).emit('admin:typing');
        });

        socket.on('admin:typing-stop', function ({ sessionId }) {
            const session = chatSessions.get(sessionId);
            if (!session || !session.visitorSocketId) return;
            io.to(session.visitorSocketId).emit('admin:typing-stop');
        });

        // ── DISCONNECT ────────────────────────────────────
        socket.on('disconnect', function () {
            for (const session of chatSessions.values()) {

                if (session.visitorSocketId === socket.id) {
                    session.visitorSocketId = null;
                    io.to('room:admins').emit('admin:visitor-status', { sessionId: session.sessionId, online: false });
                    // Bug 2: clear any lingering typing indicator on the admin side
                    if (session.adminSocketId) {
                        io.to(session.adminSocketId).emit('visitor:typing-stop', { sessionId: session.sessionId });
                    }
                }

                if (session.adminSocketId === socket.id) {
                    session.adminSocketId = null;
                    // Bug 1: if admin drops during live chat, revert session so visitor is
                    // notified and the session re-appears as available in the admin list
                    if (session.status === 'live') {
                        session.status = 'bot';
                        if (session.visitorSocketId) {
                            io.to(session.visitorSocketId).emit('chat:admin-disconnected', {
                                text: "Our support agent disconnected. Someone will follow up with you shortly. 🙏",
                            });
                        }
                        broadcastSessionToAdmins(io, session, 'admin:session-update');
                    }
                }
            }
        });
    });
}

// ── Admin: WhatsApp leads (Strapi proxy) ──────────────────
app.get('/api/admin/whatsapp-leads', requireAdminAuth, async (req, res) => {
    try {
        const r = await fetch(
            `${STRAPI_URL}/api/whatsapp-leads?sort=createdAt:desc&pagination[pageSize]=100`,
            { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } }
        );
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Failed to fetch WhatsApp leads', detail: err.message });
    }
});

// ── Admin: unified leads aggregator ───────────────────────
// Merges contact submissions + WhatsApp leads + chat sessions into one stream
// sorted by createdAt desc. Each item carries a `source` discriminator so the
// admin UI can render a per-source badge and per-source action buttons.
app.get('/api/admin/leads', requireAdminAuth, async (req, res) => {
    const headers = { Authorization: `Bearer ${STRAPI_TOKEN}` };

    async function safeJson(url) {
        try {
            const r = await fetch(url, { headers });
            if (!r.ok) return { data: [] };
            return r.json();
        } catch { return { data: [] }; }
    }

    try {
        const [submissionsResp, whatsappResp] = await Promise.all([
            safeJson(`${STRAPI_URL}/api/contact-submissions?sort=createdAt:desc&pagination[pageSize]=100`),
            safeJson(`${STRAPI_URL}/api/whatsapp-leads?sort=createdAt:desc&pagination[pageSize]=100`),
        ]);

        const contactRows = (submissionsResp.data || []).map((it) => {
            const d = it.attributes || it;
            return {
                id:        'contact-' + (it.id || d.id || ''),
                source:    'contact',
                name:      d.name || '',
                email:     d.email || null,
                phone:     d.phone || null,
                company:   d.company || null,
                subject:   d.subject || null,
                message:   d.message || '',
                status:    'new',
                createdAt: d.createdAt || new Date().toISOString(),
                raw:       d,
            };
        });

        const waRows = (whatsappResp.data || []).map((it) => {
            const d = it.attributes || it;
            return {
                id:        'whatsapp-' + (it.id || d.id || ''),
                source:    'whatsapp',
                name:      d.name || '',
                email:     null,
                phone:     d.phone || null,
                company:   null,
                subject:   null,
                message:   d.message || '',
                status:    d.status || 'new',
                sourceUrl: d.sourceUrl || null,
                createdAt: d.createdAt || new Date().toISOString(),
                raw:       d,
            };
        });

        const chatRows = [...chatSessions.values()].slice(0, 100).map((session) => {
            const s = serializeSession(session);
            return {
                id:         'chat-' + s.sessionId,
                source:     'chat',
                name:       s.name || 'Visitor',
                email:      null,
                phone:      s.phone || null,
                company:    s.company || null,
                subject:    s.service || null,
                message:    s.requirement || (s.messages && s.messages.length ? s.messages[s.messages.length - 1].text : ''),
                status:     s.status,
                sessionId:  s.sessionId,
                createdAt:  s.createdAt || new Date().toISOString(),
                raw:        s,
            };
        });

        const all = contactRows.concat(waRows).concat(chatRows)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const counts = {
            contact:  contactRows.length,
            whatsapp: waRows.length,
            chat:     chatRows.length,
            total:    all.length,
        };

        // This-week counts (last 7 days)
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const inWeek = (r) => new Date(r.createdAt).getTime() > weekAgo;
        const weekCounts = {
            contact:  contactRows.filter(inWeek).length,
            whatsapp: waRows.filter(inWeek).length,
            chat:     chatRows.filter(inWeek).length,
        };

        res.json({ data: all, counts, weekCounts });
    } catch (err) {
        res.status(500).json({ error: 'Failed to aggregate leads', detail: err.message });
    }
});

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

// Bug 5: purge old closed sessions from memory every hour
setInterval(function () {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    let purged = 0;
    for (const [sid, sess] of chatSessions) {
        if (sess.status === 'closed' && new Date(sess.createdAt).getTime() < cutoff) {
            chatSessions.delete(sid);
            purged++;
        }
    }
    if (purged) console.log(`[chat] Purged ${purged} stale closed session(s) from memory`);
}, 60 * 60 * 1000);

(async function boot() {
    await initChatDb();          // create chat_sessions table if it doesn't exist
    await loadSessionsFromDB();  // restore persisted sessions before accepting connections
    server.listen(PORT, function () {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log('[socket.io] Live chat ready');
        // Refresh page-registry cache, then write the static sitemap. The
        // sitemap is gated on the cache being populated so hidden pages are
        // excluded from the very first version on disk.
        refreshPageCache()
            .then(function () { return writeSitemapFile(null); })
            .catch(function (e) { console.warn('[sitemap] boot write failed:', e.message); });
    });
}());
