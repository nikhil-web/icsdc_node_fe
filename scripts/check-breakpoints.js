#!/usr/bin/env node
/**
 * check-breakpoints.js — keep every responsive breakpoint on the standard four.
 *
 *   node scripts/check-breakpoints.js      (npm run check:breakpoints)
 *
 * The site uses exactly four tiers, defined in
 * public/ICSDC_Frontend/assets/js/utils/breakpoints.js:
 *
 *   mobile 0–639 · tablet 640–1023 · desktop 1024–1439 · large 1440+
 *
 * CSS can't put a variable inside @media, so those numbers are written
 * literally in every stylesheet. That is exactly how the site drifted to 20
 * different breakpoints before — one-off values are easy to add and hard to
 * notice. This scans everything that decides layout by width and fails on any
 * value that isn't one of the six tier edges:
 *
 *   - @media width conditions in the site's CSS
 *   - media="" attributes and <style> blocks in the HTML pages
 *   - matchMedia('…') queries in the site's JS
 *   - innerWidth / outerWidth / clientWidth compared against a number — use
 *     matchMedia(MEDIA.x) (or the same literal query in a classic script)
 *     instead, so JS and CSS switch at the same width
 *   - media="" strings server.js writes into pages (e.g. the hero preload)
 *
 * The admin panel (public/admin) is a separate app with its own layout and is
 * deliberately out of scope.
 *
 * Exits non-zero on any violation, so it can gate a release — same contract as
 * scripts/check-import-graph.js.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'public', 'ICSDC_Frontend');
const ALLOWED = { max: new Set([639, 1023, 1439]), min: new Set([640, 1024, 1440]) };

function walk(dir, ext, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'prerendered' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, ext, out);
        else if (entry.name.endsWith(ext)) out.push(full);
    }
    return out;
}

const violations = [];
const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/* Every (min|max)-width in a media condition must be a tier edge, in px. */
function checkCondition(file, text, index, condition, where) {
    const re = /\((min|max)-width\s*:\s*([\d.]+)\s*([a-z%]*)\s*\)/gi;
    let m;
    while ((m = re.exec(condition))) {
        const kind = m[1].toLowerCase();
        const value = Number(m[2]);
        const unit = (m[3] || '').toLowerCase();
        if (unit !== 'px' || !ALLOWED[kind].has(value)) {
            const expected = kind === 'max' ? '639 / 1023 / 1439' : '640 / 1024 / 1440';
            violations.push(`${rel(file)}:${lineOf(text, index)}  ${where} (${kind}-width: ${m[2]}${unit}) — ${kind}-width must be ${expected}px`);
        }
    }
}

// 1. CSS @media conditions
for (const file of walk(path.join(SITE, 'assets', 'css'), '.css')) {
    const text = fs.readFileSync(file, 'utf8');
    const re = /@media([^{]+)\{/g;
    let m;
    while ((m = re.exec(text))) checkCondition(file, text, m.index, m[1], '@media');
}

// 2. HTML: media="" attributes and inline <style> blocks
for (const file of walk(SITE, '.html')) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    const attr = /\bmedia\s*=\s*"([^"]*)"/gi;
    while ((m = attr.exec(text))) checkCondition(file, text, m.index, m[1], 'media=""');
    const style = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    while ((m = style.exec(text))) {
        const inner = /@media([^{]+)\{/g;
        let q;
        while ((q = inner.exec(m[1]))) checkCondition(file, text, m.index + q.index, q[1], '<style> @media');
    }
}

// 3. JS: matchMedia literals and raw width comparisons
for (const file of walk(path.join(SITE, 'assets', 'js'), '.js')) {
    const text = fs.readFileSync(file, 'utf8');
    let m;
    const mm = /matchMedia\(\s*(['"`])([^'"`]*)\1/g;
    while ((m = mm.exec(text))) checkCondition(file, text, m.index, m[2], 'matchMedia');
    const cmp = /\b(?:innerWidth|outerWidth|clientWidth)\s*[<>]=?\s*\d+|\b\d+\s*[<>]=?\s*(?:window\.)?(?:innerWidth|outerWidth)\b/g;
    while ((m = cmp.exec(text))) {
        violations.push(`${rel(file)}:${lineOf(text, m.index)}  width compared to a number (${m[0].trim()}) — use matchMedia(MEDIA.…) from utils/breakpoints.js so JS switches where the CSS does`);
    }
}

// 4. server.js: media="" it writes into pages
{
    const file = path.join(ROOT, 'server.js');
    const text = fs.readFileSync(file, 'utf8');
    let m;
    const attr = /media="([^"]*width[^"]*)"/g;
    while ((m = attr.exec(text))) checkCondition(file, text, m.index, m[1], 'media=""');
}

if (violations.length) {
    console.error(`✗ ${violations.length} non-standard breakpoint${violations.length === 1 ? '' : 's'}:\n`);
    violations.forEach((v) => console.error('  ' + v));
    console.error('\nAllowed: max-width 639/1023/1439px, min-width 640/1024/1440px — see assets/js/utils/breakpoints.js');
    process.exit(1);
}
console.log('✓ all breakpoints use the standard tiers (mobile ≤639 · tablet 640–1023 · desktop 1024–1439 · large 1440+)');
