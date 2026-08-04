#!/usr/bin/env node
/**
 * build.js — minify the public site's CSS and JS.
 *
 *   node scripts/build.js            # build
 *   node scripts/build.js --clean    # remove build/ and exit
 *
 * Why this shape, and not a bundler:
 *
 *   The site has no module graph to bundle. ~50 hand-written HTML pages
 *   reference `assets/js/<page>.js` and `assets/css/<page>.css` directly, and
 *   the ES modules import each other by relative path at runtime. Bundling
 *   would rewrite those paths and require touching every HTML file. So this
 *   uses esbuild's *transform* API, which minifies one file at a time and does
 *   not resolve, inline or rename anything. Imports survive verbatim.
 *
 *   Output mirrors the source tree into build/ICSDC_Frontend, so relative
 *   imports ('./utils/cms-helpers.js') and CSS url('../images/x.webp')
 *   resolve exactly as they do from source. server.js mounts that directory
 *   ahead of the source one and lets anything not present fall through, so
 *   only CSS and JS come from the build — images and HTML keep serving from
 *   public/ and never need copying.
 *
 * Deliberately NOT included: public/admin. server.js documents that the admin
 * is internal-only and intentionally left uncached because stale editor
 * scripts silently blank the builder canvas; there is no bandwidth win there
 * worth trading for harder debugging.
 *
 * Sources are never modified. build/ is disposable — delete it and the server
 * transparently falls back to serving the originals.
 */

const fs = require('fs');
const path = require('path');

// Loaded defensively because this script runs as `prestart`: npm aborts `start`
// if a pre-hook exits non-zero, so a throw here would take the whole site down
// rather than merely leaving it unminified. esbuild is a real `dependency` (not
// a devDependency) precisely so `npm install` under NODE_ENV=production still
// installs it — but a partial install or a pruned image should degrade to
// "serves unminified", never "will not boot".
let esbuild;
try {
    esbuild = require('esbuild');
} catch (err) {
    console.warn('[build] esbuild not installed — skipping minification, serving unminified sources.');
    console.warn('[build] run `npm install` (esbuild is a dependency) to enable it.');
    process.exit(0);
}

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'public/ICSDC_Frontend');
const OUT = path.join(ROOT, 'build/ICSDC_Frontend');

// Directories that must never be minified into the build.
//  prerendered — full-DOM crawler snapshots. They are HTML, and they inline
//                copies of the site's markup; minifying JS/CSS inside them is
//                meaningless and they are served straight from source.
//  _originals  — pre-optimisation source art, never requested by the browser.
const SKIP_DIRS = new Set(['prerendered', '_originals', 'node_modules']);

const MINIFY_RE = /\.(css|js|mjs)$/i;
const ALREADY_MIN_RE = /\.min\.(css|js)$/i;

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (MINIFY_RE.test(entry.name) && !ALREADY_MIN_RE.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

function rmrf(target) {
    if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function kb(bytes) {
    return (bytes / 1024).toFixed(1) + ' KB';
}

/**
 * Is the existing build already newer than every source file it came from?
 *
 * This runs from `prestart`, so PM2 re-executes it on every restart and every
 * crash-loop iteration. Without this check a flapping process would rebuild
 * 123 files on each restart while trying to come back up.
 */
function buildIsFresh(files) {
    if (!fs.existsSync(OUT)) return false;
    let newestSource = 0;
    for (const f of files) {
        const m = fs.statSync(f).mtimeMs;
        if (m > newestSource) newestSource = m;
    }
    let oldestOutput = Infinity;
    let count = 0;
    for (const f of walk(OUT)) {
        count++;
        const m = fs.statSync(f).mtimeMs;
        if (m < oldestOutput) oldestOutput = m;
    }
    // A source file added or removed since the last build invalidates it even if
    // every surviving output is newer.
    if (count !== files.length) return false;
    return oldestOutput > newestSource;
}

/**
 * Publish `staging` at `OUT` without ever leaving a partial tree in place.
 *
 * A plain "delete then write" would expose a window where the server is serving
 * a half-written build — and under PM2 the old process keeps serving traffic
 * while the new one builds. Renames are atomic within a filesystem, so the
 * swap is instantaneous and the old tree stays intact until the moment it is
 * replaced.
 */
function publishAtomically(staging) {
    const retired = OUT + '.retired-' + process.pid;
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    const hadPrevious = fs.existsSync(OUT);
    if (hadPrevious) fs.renameSync(OUT, retired);
    try {
        fs.renameSync(staging, OUT);
    } catch (err) {
        // Roll back so a failed publish never leaves the site without assets.
        if (hadPrevious) fs.renameSync(retired, OUT);
        throw err;
    }
    if (hadPrevious) rmrf(retired);
}

async function main() {
    if (process.argv.includes('--clean')) {
        rmrf(path.join(ROOT, 'build'));
        console.log('[build] removed build/');
        return;
    }

    if (!fs.existsSync(SRC)) {
        console.error(`[build] source directory missing: ${SRC}`);
        process.exit(1);
    }

    const files = walk(SRC);

    if (!process.argv.includes('--force') && buildIsFresh(files)) {
        console.log(`[build] up to date (${files.length} files) — skipping. Use --force to rebuild.`);
        return;
    }

    // Build into a staging directory and swap it in atomically at the end, so a
    // running server never observes a partially-written tree. Left-over staging
    // dirs from a killed build are cleared here rather than accumulating.
    const staging = OUT + '.staging-' + process.pid;
    rmrf(staging);

    let srcBytes = 0;
    let outBytes = 0;
    let failed = 0;
    const worst = [];

    for (const file of files) {
        const rel = path.relative(SRC, file);
        const dest = path.join(staging, rel);
        const code = fs.readFileSync(file, 'utf8');
        const loader = /\.css$/i.test(file) ? 'css' : 'js';

        let result;
        try {
            // transform(), not build(): no resolution, no bundling, no format
            // conversion. Classic scripts (config.js, polish.js, nav-search.js)
            // and ES modules alike come out structurally unchanged, just smaller.
            result = await esbuild.transform(code, {
                loader,
                minify: true,
                // The site targets current evergreen browsers; this keeps esbuild
                // from lowering modern syntax and accidentally growing output.
                target: ['es2020'],
                legalComments: 'none',
            });
        } catch (err) {
            // One malformed file must not abandon the whole build — copy the
            // original through so the site still works, and report it loudly.
            failed++;
            console.error(`  ! ${rel} — ${err.message.split('\n')[0]}`);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.writeFileSync(dest, code);
            srcBytes += Buffer.byteLength(code);
            outBytes += Buffer.byteLength(code);
            continue;
        }

        for (const warning of result.warnings || []) {
            console.warn(`  ~ ${rel} — ${warning.text}`);
        }

        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, result.code);

        const before = Buffer.byteLength(code);
        const after = Buffer.byteLength(result.code);
        srcBytes += before;
        outBytes += after;
        worst.push({ rel, before, after, saved: before - after });
    }

    publishAtomically(staging);

    worst.sort((a, b) => b.saved - a.saved);
    console.log(`[build] minified ${files.length - failed}/${files.length} files → build/ICSDC_Frontend`);
    console.log('[build] biggest savings:');
    for (const f of worst.slice(0, 8)) {
        const pct = ((f.saved / f.before) * 100).toFixed(0);
        console.log(`         ${kb(f.before).padStart(9)} → ${kb(f.after).padStart(9)}  (-${pct}%)  ${f.rel}`);
    }
    const pct = srcBytes ? ((srcBytes - outBytes) / srcBytes * 100).toFixed(1) : '0';
    console.log(`[build] total ${kb(srcBytes)} → ${kb(outBytes)}  (-${kb(srcBytes - outBytes)}, -${pct}%)`);
    if (failed) {
        // Exit 0 on purpose. This runs as `prestart`, and npm aborts `start`
        // when a pre-hook exits non-zero — so failing here would take the whole
        // site down over one malformed file. Those files were copied through
        // unminified above, so the site is correct, just slightly larger.
        console.log(`[build] ${failed} file(s) copied unminified — see errors above (not fatal)`);
    }
}

main().catch((err) => {
    // Runs from `prestart`, so a non-zero exit would stop the server from
    // booting at all. Serving unminified assets is strictly better than serving
    // nothing: report loudly, leave any previous build/ untouched, and let
    // server.js fall back to public/ if there is none.
    console.error('[build] failed — continuing with unminified sources:', err.message);
    process.exitCode = 0;
});
