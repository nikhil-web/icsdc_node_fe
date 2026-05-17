require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const publicPath = path.join(__dirname, 'public/ICSDC_Frontend');
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

app.use(express.json());

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
        const data = await upstream.json();
        res.status(upstream.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'Strapi proxy error', detail: err.message });
    }
});

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

// Dynamic routes
app.get('/:page', (req, res) => {
    const filePath = path.join(publicPath, `${req.params.page}.html`);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res
                .status(404)
                .sendFile(path.join(publicPath, '404.html'));
        }

        res.sendFile(filePath);
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});