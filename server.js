require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const publicPath = path.join(__dirname, 'public/ICSDC_Frontend');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

app.use(express.json());

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
                password:   req.body.password,
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

// ── Admin panel SPA ───────────────────────────────────────
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    refreshPageCache();
});
