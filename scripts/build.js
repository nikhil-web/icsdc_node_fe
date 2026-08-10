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
const crypto = require('crypto');

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
const HTML_RE = /\.html?$/i;

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue;
            walk(full, out);
        } else if (MINIFY_RE.test(entry.name) && !ALREADY_MIN_RE.test(entry.name)) {
            out.push(full);
        } else if (HTML_RE.test(entry.name)) {
            // HTML is not minified — it is copied through with its asset
            // references rewritten to content-hashed URLs (see below).
            out.push(full);
        }
    }
    return out;
}

/* ══════════════════════════════════════════════════════════════
   CONTENT-HASHED ASSET URLS
   ──────────────────────────────────────────────────────────────
   Every CSS/JS reference in the built HTML gets a ?v=<hash-of-
   content> suffix, so server.js can serve those URLs immutable
   for a year while an edit still reaches everyone instantly: new
   content produces a new hash produces a new URL.

   This is deliberately a BUILD step. The same thing was once done
   by hand in the source HTML, which meant a version bump showed
   up as a diff on every file that referenced the asset (~56 files
   for components.css) and had to be remembered on every edit.
   Sources stay clean; git only shows real changes.
   ══════════════════════════════════════════════════════════════ */

function sha(text) {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 8);
}

/* ── Finding import specifiers ──────────────────────────────
   By tokenising, not by pattern-matching raw text.

   A regex over the source cannot tell code from a comment or a string. The
   doc comment at the top of services/strapiClient.js —

       //  Usage: import { fetchAPI, uploadURL } from './strapiClient.js'

   — read as a real dependency, so that module appeared to import itself. A
   phantom edge only ever over-busts (a spurious hash change, never a stale
   one), but a graph that reports edges which do not exist is not a graph you
   can reason about, and this one decides what a browser caches for a year.

   So: scan once, tracking lexical state, and record only string literals
   that genuinely sit in an import position. Comments, string contents,
   template literals and regex literals are all skipped as data.
   ─────────────────────────────────────────────────────────── */

// A '/' opens a regex literal (rather than dividing) only where a value cannot
// already have ended — after an operator, an opening bracket, or a keyword.
const PUNCT_BEFORE_REGEX = /[([{,;:!&|?+\-*/%^~<>=]$/;
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|do|else|case|yield|await)$/;

/**
 * String literals in `src`, each with the trimmed code text immediately
 * preceding it — which is what tells an import specifier apart from any other
 * string. Ranges are [start, end) over the opening and closing quotes.
 */
function scanStringLiterals(src) {
    const found = [];
    // Trailing window of *code* characters only. Comments and string bodies
    // never enter it, so `tail` always reflects real preceding syntax.
    let tail = '';
    let i = 0;
    const n = src.length;

    while (i < n) {
        const c = src[i];
        const c2 = src[i + 1];

        if (c === '/' && c2 === '/') {                       // line comment
            i += 2;
            while (i < n && src[i] !== '\n') i++;
            continue;
        }
        if (c === '/' && c2 === '*') {                       // block comment
            i += 2;
            while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
            i += 2;
            continue;
        }
        if (c === '"' || c === "'") {                        // string literal
            const start = i;
            i++;
            while (i < n) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i] === c) { i++; break; }
                if (src[i] === '\n') break;                  // unterminated — bail out
                i++;
            }
            found.push({ start, end: i, before: tail.replace(/\s+$/, '') });
            tail = '_';                                      // a string is a value
            continue;
        }
        if (c === '`') {                                     // template literal
            // Treated as opaque: an import specifier is never a template, and a
            // dynamic import built from one cannot be resolved statically anyway.
            i++;
            let depth = 0;
            while (i < n) {
                if (src[i] === '\\') { i += 2; continue; }
                if (src[i] === '`' && depth === 0) { i++; break; }
                if (src[i] === '$' && src[i + 1] === '{') { depth++; i += 2; continue; }
                if (src[i] === '}' && depth > 0) { depth--; i++; continue; }
                i++;
            }
            tail = '_';
            continue;
        }
        if (c === '/') {                                     // regex literal?
            const t = tail.replace(/\s+$/, '');
            if (t === '' || PUNCT_BEFORE_REGEX.test(t) || KEYWORD_BEFORE_REGEX.test(t)) {
                i++;
                let inClass = false;
                while (i < n) {
                    const d = src[i];
                    if (d === '\\') { i += 2; continue; }
                    if (d === '[') inClass = true;
                    else if (d === ']') inClass = false;
                    else if (d === '/' && !inClass) { i++; break; }
                    else if (d === '\n') break;
                    i++;
                }
                while (i < n && /[gimsuyd]/.test(src[i])) i++;
                tail = '_';
                continue;
            }
        }

        tail = (tail + c).slice(-40);                        // ordinary code
        i++;
    }
    return found;
}

/**
 * Static import specifiers in `src`, with the exact source range of each
 * quoted string. Covers every form used in this codebase:
 *   import x from './a.js'   ·  export ... from '../b.js'
 *   import './side-effect.js'  ·  await import('./c.js')
 */
function findImportSpecifiers(src) {
    const out = [];
    for (const s of scanStringLiterals(src)) {
        const b = s.before;
        if (/\bfrom$/.test(b) || /\bimport$/.test(b) || /\bimport\s*\($/.test(b)) {
            out.push({ spec: src.slice(s.start + 1, s.end - 1), start: s.start, end: s.end });
        }
    }
    return out;
}

/**
 * Resolve an import specifier to a file on disk, or null if it is not ours.
 *
 * Both forms occur and both must be handled — main.js reaches for the contact
 * modal as '/assets/js/contact-modal.js' while everything else uses relative
 * paths. Missing the root-absolute form silently drops a real edge from the
 * graph, which is the dangerous direction: the parent's hash would not change
 * when the child does. scripts/check-import-graph.js exists to catch exactly
 * this, and did.
 */
function resolveSpecifier(fromFile, spec) {
    if (spec.startsWith('/')) return path.join(SRC, spec.slice(1));
    if (spec.startsWith('.')) return path.resolve(path.dirname(fromFile), spec);
    return null;                                    // bare specifier — not a local file
}

/** Resolved paths of a module's imports. */
function importsOf(file, code) {
    const deps = new Set();
    for (const { spec } of findImportSpecifiers(code)) {
        const target = resolveSpecifier(file, spec);
        if (target) deps.add(target);
    }
    return [...deps];
}

/**
 * Hash of a file's content *and*, transitively, of everything it imports.
 *
 * The transitive part is essential and easy to miss: `page-renderer.js`
 * imports `componentRegistry.js`. If the registry changes but the renderer's
 * own bytes do not, a content-only hash leaves the renderer's URL unchanged —
 * so a returning visitor keeps the cached renderer, which still points at the
 * OLD registry URL, and runs a stale registry for a year. Folding dependency
 * hashes in means touching the registry changes the renderer's URL too.
 *
 * Import cycles are legal in ES modules, so a node already being visited
 * contributes only its own content hash, which terminates the walk.
 */
function makeHasher(rawByFile) {
    const memo = new Map();
    const visiting = new Set();

    return function effectiveHash(file) {
        if (memo.has(file)) return memo.get(file);
        const raw = rawByFile.get(file);
        if (raw === undefined) return '';           // not a built asset (image, etc.)
        if (visiting.has(file)) return sha(raw);    // cycle — own content only
        visiting.add(file);

        let material = raw;
        if (/\.m?js$/i.test(file)) {
            for (const dep of importsOf(file, raw).sort()) {
                material += ' ' + effectiveHash(dep);
            }
        }
        visiting.delete(file);

        const h = sha(material);
        memo.set(file, h);
        return h;
    };
}

/**
 * Splice `text` into `src` at each of `edits` ({ at, text }).
 * Applied right-to-left so earlier offsets stay valid.
 */
function applyEdits(src, edits) {
    let out = src;
    for (const e of [...edits].sort((a, b) => b.at - a.at)) {
        out = out.slice(0, e.at) + e.text + out.slice(e.at);
    }
    return out;
}

/** Rewrite a module's own import specifiers to hashed URLs. */
function versionImports(file, code, effectiveHash, rawByFile) {
    const edits = [];
    for (const { spec, end } of findImportSpecifiers(code)) {
        const target = resolveSpecifier(file, spec);
        if (!target || !rawByFile.has(target)) continue;
        // end is just past the closing quote; insert before it.
        edits.push({ at: end - 1, text: `?v=${effectiveHash(target)}` });
    }
    return applyEdits(code, edits);
}

/**
 * Blank out regions of HTML that are not markup, preserving length so offsets
 * computed on the masked copy apply directly to the original.
 *
 * Same reasoning as the JS tokeniser: an href inside a comment is not a real
 * reference, and a URL assembled inside an inline <script> is built at runtime
 * — rewriting either would be wrong. Opening tags are left intact so
 * `<script src=…>` itself is still seen.
 */
function maskHtml(html) {
    const out = html.split('');
    const blank = (from, to) => {
        for (let k = from; k < to && k < out.length; k++) {
            if (out[k] !== '\n') out[k] = ' ';
        }
    };
    for (const m of html.matchAll(/<!--[\s\S]*?-->/g)) {
        blank(m.index, m.index + m[0].length);
    }
    for (const m of html.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)) {
        const bodyStart = m.index + m[0].indexOf('>') + 1;
        const bodyEnd = m.index + m[0].lastIndexOf('</');
        blank(bodyStart, bodyEnd);
    }
    return out.join('');
}

/**
 * Rewrite <link href> / <script src> in HTML to hashed URLs.
 * Only local .css/.js/.mjs are touched — absolute URLs (the Google Fonts and
 * Font Awesome CDN links) and anything already carrying a query are skipped.
 */
function versionHtmlRefs(htmlFile, html, effectiveHash, rawByFile) {
    const masked = maskHtml(html);
    const edits = [];
    for (const m of masked.matchAll(/\b(href|src)=(["'])([^"'?#]+?\.(?:css|m?js))\2/gi)) {
        const url = m[3];
        if (/^(https?:)?\/\//i.test(url)) continue;
        const target = url.startsWith('/')
            ? path.join(SRC, url.slice(1))
            : path.resolve(path.dirname(htmlFile), url);
        if (!rawByFile.has(target)) continue;
        // Closing quote is the final character of the match.
        edits.push({ at: m.index + m[0].length - 1, text: `?v=${effectiveHash(target)}` });
    }
    return applyEdits(html, edits);
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

    // Read every asset once up front: hashing is transitive, so a file's hash
    // can depend on a file that appears later in the list.
    const assets = files.filter((f) => MINIFY_RE.test(f));
    const htmls = files.filter((f) => HTML_RE.test(f));
    const rawByFile = new Map(assets.map((f) => [f, fs.readFileSync(f, 'utf8')]));
    const effectiveHash = makeHasher(rawByFile);

    // HTML: copied through, asset references rewritten to hashed URLs. Not
    // minified — these pages are the input to server.js's SEO head injection,
    // which matches on <title>/<meta>/</head>, and to prerender.js.
    let htmlRefs = 0;
    for (const file of htmls) {
        const rel = path.relative(SRC, file);
        const dest = path.join(staging, rel);
        const html = fs.readFileSync(file, 'utf8');
        const out = versionHtmlRefs(file, html, effectiveHash, rawByFile);
        htmlRefs += (out.match(/\?v=[0-9a-f]{8}/g) || []).length;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, out);
    }

    for (const file of assets) {
        const rel = path.relative(SRC, file);
        const dest = path.join(staging, rel);
        const code = rawByFile.get(file);
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

        // Rewrite import specifiers AFTER minifying: esbuild's transform keeps
        // them verbatim, and hashing off the raw source keeps the URL stable
        // across esbuild version bumps that only reshuffle output bytes.
        const outCode = /\.m?js$/i.test(file)
            ? versionImports(file, result.code, effectiveHash, rawByFile)
            : result.code;

        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, outCode);

        const before = Buffer.byteLength(code);
        const after = Buffer.byteLength(outCode);
        srcBytes += before;
        outBytes += after;
        worst.push({ rel, before, after, saved: before - after });
    }

    publishAtomically(staging);

    worst.sort((a, b) => b.saved - a.saved);
    console.log(`[build] minified ${assets.length - failed}/${assets.length} CSS/JS → build/ICSDC_Frontend`);
    console.log(`[build] rewrote ${htmlRefs} asset refs to content-hashed URLs across ${htmls.length} HTML files`);
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

// Exported so the import graph can be checked against an independent parser
// (scripts/check-import-graph.js) without triggering a build.
module.exports = { findImportSpecifiers, importsOf, versionImports, versionHtmlRefs, maskHtml, SRC };

// Only build when invoked directly — `require`ing this file must have no side
// effects, or the graph check would rebuild the site just to inspect it.
if (require.main === module) {
    main().catch((err) => {
        // Runs from `prestart`, so a non-zero exit would stop the server from
        // booting at all. Serving unminified assets is strictly better than
        // serving nothing: report loudly, leave any previous build/ untouched,
        // and let server.js fall back to public/ if there is none.
        console.error('[build] failed — continuing with unminified sources:', err.message);
        process.exitCode = 0;
    });
}
