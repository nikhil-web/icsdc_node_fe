'use strict';
/**
 * image-import.js
 * ───────────────
 * Server-side download of a remote image for the builder's paste flow: an
 * article pasted from Google Docs or a web page references its images by URL,
 * and those have to be copied into the Media Library rather than hotlinked
 * (Google Docs' image links are temporary, so a hotlinked copy breaks on the
 * published article later). The browser can't do the download itself — the
 * image hosts don't send CORS headers — so the admin route does it here.
 *
 * Fetching an arbitrary URL from the server is an SSRF surface even behind
 * admin auth, so this is deliberately strict:
 *   - http/https only, default ports only (80/443)
 *   - every address the hostname resolves to must be public; the check runs
 *     inside the socket's own DNS lookup, so it applies to the address actually
 *     connected to (no check-then-connect gap for DNS rebinding) and to every
 *     redirect hop, not just the first URL
 *   - IP-literal hosts are checked up front (Node skips the lookup for those)
 *   - at most 3 redirects, 15s overall, 25MB (the upload route's own cap)
 *   - the body must BE an image by its magic bytes — PNG, JPEG, GIF or WebP.
 *     The response's Content-Type is ignored (CDNs often send
 *     application/octet-stream), and SVG is refused: it can carry script and
 *     would be served back from the site's own upload host.
 */

const http = require('http');
const https = require('https');
const dns = require('dns');
const net = require('net');

const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 3;
const USER_AGENT = 'Mozilla/5.0 (compatible; ICSDC-Builder-ImageImport/1.0)';

class ImageImportError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status; // 400 = the URL/content is unacceptable, 502 = upstream failed
    }
}

const blocked = new net.BlockList();
[
    ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
    ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
    ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
    ['224.0.0.0', 4], ['240.0.0.0', 4],
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv4'));
/* No ::ffff:0:0/96 rule here on purpose: net.BlockList applies IPv4-mapped
   IPv6 rules to plain IPv4 checks as well, so that one line blocks every IPv4
   address on the internet. Mapped addresses are unwrapped in isBlockedAddress()
   and judged against the IPv4 list instead. */
[
    ['::', 128], ['::1', 128], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
    ['64:ff9b::', 96],
].forEach(([addr, prefix]) => blocked.addSubnet(addr, prefix, 'ipv6'));

function isBlockedAddress(address) {
    // An IPv4-mapped IPv6 address is judged as the IPv4 address it maps to,
    // whether written dotted (::ffff:127.0.0.1) or in hex (::ffff:7f00:1).
    const dotted = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
    if (dotted) return blocked.check(dotted[1], 'ipv4');
    const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(address);
    if (hex) {
        const hi = parseInt(hex[1], 16), lo = parseInt(hex[2], 16);
        return blocked.check([hi >> 8, hi & 255, lo >> 8, lo & 255].join('.'), 'ipv4');
    }
    if (net.isIPv4(address)) return blocked.check(address, 'ipv4');
    if (net.isIPv6(address)) return blocked.check(address, 'ipv6');
    return true; // not an IP at all — refuse rather than guess
}

/* Drop-in for the socket's DNS lookup. Node 20 may ask for every address at
   once (`all: true`, for happy-eyeballs); refuse the host if ANY of them is
   internal, so a mixed record can't be used to reach an internal address. */
function safeLookup(hostname, options, callback) {
    dns.lookup(hostname, { all: true }, (err, addresses) => {
        if (err) return callback(err);
        if (!addresses.length || addresses.some((a) => isBlockedAddress(a.address))) {
            return callback(new ImageImportError('That address is not allowed', 400));
        }
        if (options && options.all) return callback(null, addresses);
        callback(null, addresses[0].address, addresses[0].family);
    });
}

function sniffImageType(buf) {
    if (!buf || buf.length < 12) return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return { mime: 'image/png', ext: 'png' };
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
    if (buf.slice(0, 6).toString('latin1') === 'GIF87a' || buf.slice(0, 6).toString('latin1') === 'GIF89a') return { mime: 'image/gif', ext: 'gif' };
    if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
    return null;
}

function checkUrl(raw) {
    let url;
    try { url = new URL(raw); } catch { throw new ImageImportError('Not a valid URL', 400); }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new ImageImportError('Only http and https URLs can be imported', 400);
    if (url.port && url.port !== '80' && url.port !== '443') throw new ImageImportError('Only standard ports can be imported', 400);
    if (url.username || url.password) throw new ImageImportError('URLs with credentials cannot be imported', 400);
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && isBlockedAddress(host)) throw new ImageImportError('That address is not allowed', 400);
    return url;
}

function download(url, redirectsLeft, deadline) {
    return new Promise((resolve, reject) => {
        const mod = url.protocol === 'https:' ? https : http;
        const remaining = deadline - Date.now();
        if (remaining <= 0) return reject(new ImageImportError('Timed out fetching the image', 502));

        const req = mod.get(url, {
            lookup: safeLookup,
            timeout: remaining,
            headers: { 'User-Agent': USER_AGENT, Accept: 'image/webp,image/png,image/jpeg,image/gif,*/*;q=0.5' },
        }, (res) => {
            const status = res.statusCode || 0;
            if (status >= 300 && status < 400 && res.headers.location) {
                res.resume();
                if (redirectsLeft <= 0) return reject(new ImageImportError('Too many redirects', 502));
                let next;
                try { next = checkUrl(new URL(res.headers.location, url).href); } catch (e) { return reject(e); }
                return resolve(download(next, redirectsLeft - 1, deadline));
            }
            if (status !== 200) {
                res.resume();
                return reject(new ImageImportError('The image host answered ' + status, 502));
            }
            const declared = Number(res.headers['content-length'] || 0);
            if (declared > MAX_BYTES) {
                res.resume();
                return reject(new ImageImportError('Image is larger than 25MB', 400));
            }
            const chunks = [];
            let total = 0;
            res.on('data', (chunk) => {
                total += chunk.length;
                if (total > MAX_BYTES) {
                    req.destroy(new ImageImportError('Image is larger than 25MB', 400));
                    return;
                }
                chunks.push(chunk);
            });
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('timeout', () => req.destroy(new ImageImportError('Timed out fetching the image', 502)));
        req.on('error', (err) => reject(err instanceof ImageImportError ? err : new ImageImportError('Could not fetch the image: ' + err.message, 502)));
    });
}

async function fetchRemoteImage(rawUrl) {
    const url = checkUrl(rawUrl);
    const buffer = await download(url, MAX_REDIRECTS, Date.now() + TIMEOUT_MS);
    const type = sniffImageType(buffer);
    if (!type) throw new ImageImportError('That URL is not a PNG, JPEG, GIF or WebP image', 400);
    return { buffer, mime: type.mime, ext: type.ext };
}

module.exports = { fetchRemoteImage, sniffImageType, isBlockedAddress, checkUrl, ImageImportError };
