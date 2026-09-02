// ══════════════════════════════════════════════════════════
//  prerender.js — Dynamic-rendering build step
//  Renders each live page through headless Chromium and saves a fully-rendered,
//  content-baked static HTML snapshot to public/ICSDC_Frontend/prerendered/.
//  server.js serves these snapshots to known crawlers (see BOT_UA_RE there),
//  while humans keep getting the live client-rendered app.
//
//  Usage:
//    node prerender.js                 # build all live pages (from sitemap.xml)
//    node prerender.js /cloud-hosting  # build a single path
//    node prerender.js cloud-hosting   # (leading slash optional)
//
//  Requires: the Node server running on PORT, and Strapi reachable (for content).
// ══════════════════════════════════════════════════════════
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3000;
const ORIGIN = `http://localhost:${PORT}`;
const SITE_URL = (process.env.SITE_URL || 'https://icsdc.com').replace(/\/+$/, '');
const STRAPI_PUBLIC = 'https://admin.icsdc.com';   // public Strapi media host (snapshot image URLs)
const publicPath = path.join(__dirname, 'public/ICSDC_Frontend');
const outDir = path.join(publicPath, 'prerendered');

// Map a URL path → snapshot file. MUST match snapshotFileForPath() in server.js.
function snapshotFile(p) {
    if (p === '/' || p === '') return path.join(outDir, 'home.html');
    p = p.replace(/\/$/, '');
    if (p.startsWith('/legal/')) return path.join(outDir, 'legal', p.slice('/legal/'.length) + '.html');
    return path.join(outDir, p.replace(/^\//, '') + '.html');
}

// Paths to render: a single CLI arg, else every <loc> in the live sitemap.xml
// (already filtered by Page Registry). Builder pages publish at top-level
// /<slug> since 2026-07-03 and are prerendered like any other page.
function getPaths() {
    const arg = process.argv[2];
    if (arg) {
        let p = arg.trim();
        if (!p.startsWith('/')) p = '/' + p;
        return [p];
    }
    const xml = fs.readFileSync(path.join(publicPath, 'sitemap.xml'), 'utf8');
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map(m => { try { return new URL(m[1]).pathname; } catch { return null; } })
        .filter(Boolean);
    return [...new Set(paths)];
}

// Runs IN the page: reveal scroll-animation content, strip dynamic scripts, drop chat widget.
function cleanInPage() {
    document.querySelectorAll('[data-animate],[data-stagger]').forEach(e => e.classList.add('is-visible'));
    document.querySelectorAll('script').forEach(s => {
        const src = s.getAttribute('src') || '';
        if (/config\.js|\/main\.js|homepage-cms\.js|components\.js|nav-search\.js|socket\.io|polish\.js|theme-init\.js|googletagmanager|gtm\.js/i.test(src)) s.remove();
        else if (!src && /(gtm\.start|dataLayer|footer-year|googletagmanager)/i.test(s.textContent || '')) s.remove();
    });
    document.querySelectorAll('.chat-bubble,.chat-window').forEach(e => e.remove());
    // Drop the server's no-JS blog fallback: this snapshot already holds the fully
    // rendered article, so keeping it would duplicate the whole body text. (With JS
    // on, a <noscript>'s contents are plain text, so match on the marker class.)
    document.querySelectorAll('noscript').forEach(n => {
        if (/blog-noscript/.test(n.textContent || '')) n.remove();
    });
}

(async function main() {
    const paths = getPaths();
    console.log(`[prerender] ${paths.length} page(s) to build (origin ${ORIGIN})`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    const originRe = new RegExp(ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let ok = 0, fail = 0;

    for (const p of paths) {
        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1280, height: 900 });
            await page.goto(ORIGIN + p, { waitUntil: 'networkidle0', timeout: 45000 });
            await new Promise(r => setTimeout(r, 2500));   // let client render + safety-reveal settle
            await page.evaluate(cleanInPage);

            let html = '<!DOCTYPE html>\n' + await page.evaluate(() => document.documentElement.outerHTML);
            html = html.replace(/http:\/\/localhost:1337/g, STRAPI_PUBLIC).replace(originRe, SITE_URL);
            const stub = '<script>window.openDropdown=function(){};window.closeDropdown=function(){};window.closeMobileMenu=function(){};document.querySelectorAll(\'[data-animate],[data-stagger]\').forEach(function(e){e.classList.add(\'is-visible\');});<\/script>';
            html = html.replace('</body>', stub + '\n</body>');

            const file = snapshotFile(p);
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, html, 'utf8');
            console.log(`  ✓ ${p}  →  ${path.relative(publicPath, file).replace(/\\/g, '/')}  (${Math.round(html.length / 1024)} KB)`);
            ok++;
        } catch (e) {
            console.error(`  ✗ ${p}  —  ${e.message}`);
            fail++;
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log(`[prerender] done — ${ok} ok, ${fail} failed`);
    process.exit(fail && !ok ? 1 : 0);
})();
