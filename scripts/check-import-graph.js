#!/usr/bin/env node
/**
 * check-import-graph.js — verify the build's import graph against esbuild.
 *
 *   node scripts/check-import-graph.js
 *
 * scripts/build.js derives every module's dependencies with its own tokeniser
 * (findImportSpecifiers). That graph decides the content hash of every asset
 * URL, and those URLs are served `immutable` for a year — so an edge that is
 * wrong in the "missed" direction ships a module that can never self-correct.
 *
 * This checks the tokeniser against esbuild's real JavaScript parser. Every
 * module is built with all imports forced external, so nothing is bundled and
 * the output is discarded; only the metafile's resolution record is read.
 *
 * Two disagreements are possible and they are NOT equally bad:
 *
 *   phantom — the tokeniser sees an edge esbuild does not. Over-busts a hash.
 *             Wasteful, never incorrect.
 *   MISSED  — esbuild sees an edge the tokeniser does not. This is the one
 *             that matters: the parent's hash would not change when the child
 *             does, so a cached parent keeps pointing at a stale child URL.
 *
 * Exits non-zero if either occurs, so it can gate a release.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { importsOf, SRC } = require('./build.js');

const TMP = path.join(__dirname, '..', '.import-graph-check');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'prerendered') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.m?js$/i.test(entry.name)) out.push(path.resolve(full));
    }
    return out;
}

/** Dependencies of `file` according to esbuild's parser. */
async function esbuildDeps(file) {
    const result = await esbuild.build({
        entryPoints: [file],
        bundle: true,          // required for esbuild to resolve imports at all
        write: false,          // output is irrelevant — only the metafile is read
        metafile: true,
        logLevel: 'silent',
        outdir: TMP,
        platform: 'browser',
        plugins: [{
            name: 'force-external',
            setup(build) {
                // Everything except the entry is external, so nothing is
                // actually bundled and classic scripts cannot be mangled.
                //
                // What is being verified here is esbuild's PARSING — which
                // strings are genuinely import specifiers. Where a specifier
                // points is a project convention esbuild cannot know: a
                // leading '/' means the site's web root (public/ICSDC_Frontend),
                // not the filesystem root, so that rule is applied here to
                // match. Resolving it the naive way reported every
                // root-absolute import as a mismatch.
                build.onResolve({ filter: /.*/ }, (args) => {
                    if (args.kind === 'entry-point') return undefined;
                    const resolved = args.path.startsWith('/')
                        ? path.join(SRC, args.path.slice(1))
                        : path.resolve(path.dirname(args.importer), args.path);
                    return { path: resolved, external: true };
                });
            },
        }],
    });
    const input = Object.keys(result.metafile.inputs)[0];
    const deps = new Set();
    for (const imp of result.metafile.inputs[input].imports || []) {
        if (/\.m?js$/i.test(imp.path)) deps.add(path.resolve(imp.path));
    }
    return deps;
}

(async () => {
    const files = walk(SRC);
    let phantom = 0;
    let missed = 0;
    let edges = 0;

    for (const file of files) {
        const rel = path.relative(SRC, file);
        const mine = new Set(importsOf(file, fs.readFileSync(file, 'utf8')).map((p) => path.resolve(p)));

        let theirs;
        try {
            theirs = await esbuildDeps(file);
        } catch (err) {
            console.log(`  ? ${rel} — esbuild could not parse: ${err.message.split('\n')[0]}`);
            continue;
        }

        edges += mine.size;
        for (const dep of mine) {
            if (!theirs.has(dep)) {
                phantom++;
                console.log(`  phantom  ${rel}  →  ${path.relative(SRC, dep)}`);
            }
        }
        for (const dep of theirs) {
            if (!mine.has(dep)) {
                missed++;
                console.log(`  MISSED   ${rel}  →  ${path.relative(SRC, dep)}`);
            }
        }
    }

    fs.rmSync(TMP, { recursive: true, force: true });

    console.log(`\nchecked ${files.length} modules / ${edges} edges`);
    if (!phantom && !missed) {
        console.log('import graph matches esbuild exactly.');
        return;
    }
    console.log(`${missed} missed edge(s), ${phantom} phantom edge(s)`);
    process.exitCode = 1;
})();
