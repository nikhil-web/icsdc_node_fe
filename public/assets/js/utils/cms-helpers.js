/**
 * cms-helpers.js
 * ──────────────
 * Shared CMS populator functions used by ALL page-specific JS files.
 * Each function takes a DOM container/selector and CMS data, then
 * populates the HTML. Null/undefined data is handled gracefully.
 *
 * Usage:
 *   import { setText, setHTML, resolveIcon, ICONS, populateHero, ... } from './utils/cms-helpers.js';
 */

/* ═══════════════════════════════════════════════════════════════
   ICONS MAP
   CMS stores icon key names; we resolve them to inline SVG here.
   Pages can extend this with page-specific icons via resolveIcon().
   ═══════════════════════════════════════════════════════════════ */

var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">';
var SVG_CLOSE = '</svg>';

export var ICONS = {
    lightning: SVG_OPEN + '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' + SVG_CLOSE,
    monitor: SVG_OPEN + '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>' + SVG_CLOSE,
    dollar: SVG_OPEN + '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' + SVG_CLOSE,
    users: SVG_OPEN + '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>' + SVG_CLOSE,
    lock: SVG_OPEN + '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>' + SVG_CLOSE,
    pulse: SVG_OPEN + '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' + SVG_CLOSE,
    globe: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>' + SVG_CLOSE,
    database: SVG_OPEN + '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>' + SVG_CLOSE,
    'globe-lines': SVG_OPEN + '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10"/><path d="M12 2a15.3 15.3 0 00-4 10 15.3 15.3 0 004 10"/>' + SVG_CLOSE,
    shield: SVG_OPEN + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' + SVG_CLOSE,
    document: SVG_OPEN + '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' + SVG_CLOSE,
    clock: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' + SVG_CLOSE,
    firewall: SVG_OPEN + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>' + SVG_CLOSE,
    'lock-key': SVG_OPEN + '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/>' + SVG_CLOSE,
    'shield-check': SVG_OPEN + '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>' + SVG_CLOSE,
    ssl: SVG_OPEN + '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><line x1="12" y1="15" x2="12" y2="17"/>' + SVG_CLOSE,
    layout: SVG_OPEN + '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>' + SVG_CLOSE,
    gaming: SVG_OPEN + '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><path d="M17.32 5H6.68a4 4 0 00-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 003 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 019.828 16h4.344a2 2 0 011.414.586L17 18c.5.5 1 1 2 1a3 3 0 003-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0017.32 5z"/>' + SVG_CLOSE,
    video: SVG_OPEN + '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>' + SVG_CLOSE,
    code: SVG_OPEN + '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>' + SVG_CLOSE,
    mail: SVG_OPEN + '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>' + SVG_CLOSE,
    server: SVG_OPEN + '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>' + SVG_CLOSE,
    chart: SVG_OPEN + '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>' + SVG_CLOSE,
    grid: SVG_OPEN + '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>' + SVG_CLOSE,
    upload: SVG_OPEN + '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/><polyline points="16 16 12 12 8 16"/>' + SVG_CLOSE,
    network: SVG_OPEN + '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><path d="M5 16v-4h14v4"/><line x1="12" y1="12" x2="12" y2="8"/>' + SVG_CLOSE,
    layers: SVG_OPEN + '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>' + SVG_CLOSE,
    activity: SVG_OPEN + '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' + SVG_CLOSE,
    'check-circle': SVG_OPEN + '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' + SVG_CLOSE,
    zap: SVG_OPEN + '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' + SVG_CLOSE,
    'file-text': SVG_OPEN + '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' + SVG_CLOSE,
    wifi: SVG_OPEN + '<path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>' + SVG_CLOSE,
    house: SVG_OPEN + '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' + SVG_CLOSE,
    rocket: SVG_OPEN + '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/>' + SVG_CLOSE,
    search: SVG_OPEN + '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' + SVG_CLOSE,
    key: SVG_OPEN + '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>' + SVG_CLOSE,
    cpu: SVG_OPEN + '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>' + SVG_CLOSE,
    'hard-drive': SVG_OPEN + '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>' + SVG_CLOSE,
    refresh: SVG_OPEN + '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>' + SVG_CLOSE,
    settings: SVG_OPEN + '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>' + SVG_CLOSE,
    terminal: SVG_OPEN + '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>' + SVG_CLOSE,
    'trending-up': SVG_OPEN + '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' + SVG_CLOSE,
    'bar-chart': SVG_OPEN + '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>' + SVG_CLOSE,
    package: SVG_OPEN + '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' + SVG_CLOSE,
    tool: SVG_OPEN + '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>' + SVG_CLOSE,
    link: SVG_OPEN + '<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>' + SVG_CLOSE,
    compass: SVG_OPEN + '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>' + SVG_CLOSE,
    cloud: SVG_OPEN + '<path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>' + SVG_CLOSE,
    smartphone: SVG_OPEN + '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' + SVG_CLOSE,
    tablet: SVG_OPEN + '<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' + SVG_CLOSE,
    calendar: SVG_OPEN + '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' + SVG_CLOSE,
    inbox: SVG_OPEN + '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>' + SVG_CLOSE,
    award: SVG_OPEN + '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>' + SVG_CLOSE,
    briefcase: SVG_OPEN + '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>' + SVG_CLOSE,
    'credit-card': SVG_OPEN + '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' + SVG_CLOSE,
    flag: SVG_OPEN + '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>' + SVG_CLOSE,
    heart: SVG_OPEN + '<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>' + SVG_CLOSE,
    'map-pin': SVG_OPEN + '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>' + SVG_CLOSE,
    'message-circle': SVG_OPEN + '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>' + SVG_CLOSE,
    phone: SVG_OPEN + '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>' + SVG_CLOSE,
    printer: SVG_OPEN + '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>' + SVG_CLOSE,
    share: SVG_OPEN + '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' + SVG_CLOSE,
    'shopping-cart': SVG_OPEN + '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>' + SVG_CLOSE,
    tag: SVG_OPEN + '<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' + SVG_CLOSE,
    'thumbs-up': SVG_OPEN + '<path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/>' + SVG_CLOSE,
    truck: SVG_OPEN + '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>' + SVG_CLOSE,
    umbrella: SVG_OPEN + '<path d="M23 12a11.05 11.05 0 00-22 0zm-5 7a3 3 0 01-6 0v-7"/>' + SVG_CLOSE,
    eye: SVG_OPEN + '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' + SVG_CLOSE,
    feather: SVG_OPEN + '<path d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>' + SVG_CLOSE
};


/* ═══════════════════════════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Set textContent of the first element matching `selector` inside `parent`.
 */
export function setText(parent, selector, text) {
    if (!parent) return;
    var el = parent.querySelector(selector);
    if (el && text != null) el.textContent = text;
}

/**
 * Set innerHTML of the first element matching `selector` inside `parent`.
 */
export function setHTML(parent, selector, html) {
    if (!parent) return;
    var el = parent.querySelector(selector);
    if (el && html != null) el.innerHTML = html;
}

/**
 * Resolve an icon key to SVG markup.
 * Falls back to customIcons map (if provided), then ICONS, then a default circle.
 */
export function resolveIcon(key, customIcons) {
    if (!key) return defaultIconSVG();
    if (customIcons && customIcons[key]) return customIcons[key];
    return ICONS[key] || defaultIconSVG();
}

/**
 * Default fallback icon (simple circle).
 */
export function defaultIconSVG() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">' +
        '<circle cx="12" cy="12" r="10" />' +
        '</svg>';
}

/**
 * Star SVG for testimonial ratings.
 */
export function starSVG() {
    return '<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
        '<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>' +
        '</svg>';
}

/**
 * Small check SVG used inside pricing feature lists.
 */
export function checkSVG() {
    return '<svg viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" /></svg>';
}

/**
 * Comparison table status icon (check / partial / cross).
 */
export function comparisonIcon(type) {
    if (type === 'check') {
        return '<span class="ds-check-icon"><svg viewBox="0 0 14 14" fill="none">' +
            '<polyline points="2,7 5.5,10.5 12,3" stroke-linecap="round" stroke-linejoin="round" />' +
            '</svg></span>';
    }
    if (type === 'partial') {
        return '<span class="ds-partial-icon"><svg viewBox="0 0 14 14" fill="none">' +
            '<line x1="3" y1="7" x2="11" y2="7" stroke-linecap="round" />' +
            '</svg></span>';
    }
    return '<span class="ds-cross-icon"><svg viewBox="0 0 14 14" fill="none">' +
        '<line x1="3" y1="3" x2="11" y2="11" stroke-linecap="round" />' +
        '<line x1="11" y1="3" x2="3" y2="11" stroke-linecap="round" />' +
        '</svg></span>';
}

/**
 * Get initials from a full name (e.g. "John Doe" -> "JD").
 */
export function getInitials(name) {
    if (!name) return '';
    return name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
}


/* ═══════════════════════════════════════════════════════════════
   SECTION POPULATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Populate SEO meta tags (title + description).
 * @param {Object} seo - { metaTitle, metaDescription }
 */
export function populateSEO(seo) {
    if (!seo) return;
    if (seo.metaTitle) document.title = seo.metaTitle;
    if (seo.metaDescription) {
        var meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', seo.metaDescription);
    }
}

/**
 * Populate a hero section.
 * @param {Element|string} section - DOM element or selector for the hero section
 * @param {Object} data - { eyebrow?, eyebrowSelector?, title, subtitle, description, price?, priceNote?, ctaPrimary?, ctaSecondary? }
 */
export function populateHero(section, data) {
    if (!data) return;
    if (typeof section === 'string') section = document.querySelector(section);
    if (!section) return;

    // Eyebrow
    if (data.eyebrow) {
        var eyebrowSel = '.eyebrow-badge';
        var eyebrow = section.querySelector(eyebrowSel);
        if (eyebrow) {
            eyebrow.textContent = data.eyebrow;
        }
    }

    if (data.title) setText(section, '.hero-title', data.title);
    if (data.subtitle) setText(section, '.hero-sub', data.subtitle);
    if (data.description) setHTML(section, '.hero-desc', data.description);

    // Price
    if (data.price != null) {
        var priceEl = section.querySelector('.hero-price');
        if (priceEl) {
            var currency = data.priceCurrency || '\u20B9';
            var priceSpan = priceEl.querySelector('span:first-child');
            if (priceSpan) priceSpan.innerHTML = currency + data.price;
        }
    }
    if (data.priceUnit) setText(section, '.price-unit', data.priceUnit);
    if (data.priceNote) setHTML(section, '.price-note', data.priceNote);

    // CTA Buttons
    var btns = section.querySelectorAll('.hero-btns button');
    if (btns.length >= 1 && data.ctaPrimary) {
        // Try second button first (dedicated-server pattern), fall back to first
        var primaryBtn = btns.length >= 2 ? btns[1] : btns[0];
        primaryBtn.innerHTML = data.ctaPrimary.text + ' &rarr;';
        if (data.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + data.ctaPrimary.link + "'");
    }
    if (btns.length >= 2 && data.ctaSecondary) {
        btns[0].textContent = data.ctaSecondary.text;
        if (data.ctaSecondary.link) btns[0].setAttribute('onclick', "window.location.href='" + data.ctaSecondary.link + "'");
    }
}

/**
 * Populate icon cards into a grid container.
 * @param {string} gridSelector - CSS selector for the grid container
 * @param {Array} cards - [{icon, title, description, order}]
 * @param {string} cardClass - CSS class for the card wrapper (e.g. "why-card", "cloud-power-card")
 * @param {Object} [customIcons] - optional extra icons map
 */
export function populateIconCards(gridSelector, cards, cardClass, customIcons) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var cls = cardClass || 'why-card';
    var iconCls = cls.replace('-card', '-icon');

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        return '<div class="' + cls + '">' +
            '<div class="' + iconCls + '" aria-hidden="true">' +
            resolveIcon(card.icon, customIcons) +
            '</div>' +
            '<h3>' + (card.title || '') + '</h3>' +
            '<p>' + (card.desc || card.description || '') + '</p>' +
            '</div>';
    }).join('');
}

/**
 * Populate a section header (label + title + subtitle).
 * @param {string} sectionSelector - CSS selector for the section
 * @param {string} label - Section label text
 * @param {string} title - Section title text
 * @param {string} subtitle - Section subtitle (may contain HTML)
 */
export function populateSectionHeader(sectionSelector, label, title, subtitle) {
    var section = document.querySelector(sectionSelector);
    if (!section) return;
    if (label) {
        // Try cloud-style label first, then ds-style
        var labelEl = section.querySelector('.cloud-section-label') || section.querySelector('.ds-section-label');
        if (labelEl) labelEl.textContent = label;
    }
    if (title) setText(section, '.title', title);
    if (subtitle) setHTML(section, '.subtitle', subtitle);
}

/**
 * Populate a CTA band section.
 * Supports both dedicated-server (.ds-cta-*) and cloud-hosting (.cloud-cta-*) class patterns.
 * Tries .cloud-cta-* first, then falls back to .ds-cta-*.
 * @param {string} selector - CSS selector for the CTA band section
 * @param {Object} cta - { title, description, ctaPrimary: {text, link}, ctaSecondary: {text, link} }
 */
export function populateCtaBand(selector, cta) {
    if (!cta) return;
    var section = document.querySelector(selector);
    if (!section) return;

    // Try cloud-style inner first, then ds-style
    var inner = section.querySelector('.cloud-cta-inner') || section.querySelector('.ds-cta-inner');
    if (!inner) return;

    setHTML(inner, 'h2', cta.title);
    setHTML(inner, 'p', cta.description);

    // Try cloud-style buttons first, then ds-style
    var btns = inner.querySelector('.cloud-cta-btns') || inner.querySelector('.ds-cta-btns');
    if (btns) {
        var primaryBtn = btns.querySelector('.cloud-cta-btn-primary') || btns.querySelector('.ds-cta-btn-primary');
        var secondaryBtn = btns.querySelector('.cloud-cta-btn-outline') || btns.querySelector('.ds-cta-btn-outline');

        if (primaryBtn && cta.ctaPrimary) {
            primaryBtn.innerHTML = cta.ctaPrimary.text + ' &rarr;';
            if (cta.ctaPrimary.link) primaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaPrimary.link + "'");
        }
        if (secondaryBtn && cta.ctaSecondary) {
            secondaryBtn.textContent = cta.ctaSecondary.text;
            if (cta.ctaSecondary.link) secondaryBtn.setAttribute('onclick', "window.location.href='" + cta.ctaSecondary.link + "'");
        }
    }
}

/**
 * Populate pricing plan cards.
 * @param {string} gridSelector - CSS selector for the pricing grid
 * @param {Array} plans - [{tier, price, currency, period, tagline, ctaText, ctaStyle, isFeatured, badge, features: [{label}], order}]
 */
export function populatePricingPlans(gridSelector, plans) {
    if (!plans || !plans.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (plan) {
        var featuredClass = plan.isFeatured ? ' ds-featured' : '';
        var badge = plan.isFeatured && plan.badge
            ? '<span class="ds-plan-badge">' + plan.badge + '</span>'
            : '';
        var ctaClass = plan.ctaStyle === 'primary' ? 'ds-plan-cta-primary' : 'ds-plan-cta-outline';
        var ctaArrow = plan.ctaStyle === 'primary' ? ' &rarr;' : '';

        var featuresHTML = '';
        if (plan.features && plan.features.length) {
            featuresHTML = plan.features.map(function (f) {
                return '<li class="ds-plan-feature">' +
                    '<span class="ds-plan-check">' + checkSVG() + '</span>' +
                    (f.label || '') +
                    '</li>';
            }).join('');
        }

        return '<div class="ds-plan-card' + featuredClass + '">' +
            badge +
            '<div class="ds-plan-tier">' + (plan.tier || '') + '</div>' +
            '<div class="ds-plan-price-wrap">' +
            '<span class="ds-plan-currency">' + (plan.currency || '\u20B9') + '</span>' +
            '<span class="ds-plan-price">' + (plan.price || '') + '</span>' +
            '<span class="ds-plan-period">' + (plan.period || '/mo') + '</span>' +
            '</div>' +
            (plan.tagline ? '<p class="ds-plan-tagline">' + plan.tagline + '</p>' : '') +
            '<hr class="ds-plan-divider">' +
            '<ul class="ds-plan-features">' + featuresHTML + '</ul>' +
            '<button class="ds-plan-cta ' + ctaClass + '">' +
            (plan.ctaText || '') + ctaArrow +
            '</button>' +
            '</div>';
    }).join('');
}


export function populatePricingPlansCloud(gridSelector, plans) {
    if (!plans || !plans.length) return;

    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = plans.slice().sort(function (a, b) {
        return (a.order || 0) - (b.order || 0);
    });

    function checkSVG() {
        return '<svg viewBox="0 0 12 12" fill="none">' +
            '<polyline points="2,6 5,9 10,3"></polyline>' +
            '</svg>';
    }


    grid.innerHTML = sorted.map(function (plan) {

        var featuredClass = plan.isFeatured ? ' cloud-featured' : '';

        var badge = (plan.isFeatured && plan.badge)
            ? '<span class="cloud-plan-badge">' + plan.badge + '</span>'
            : '';

        var ctaClass = plan.ctaStyle === 'primary'
            ? 'cloud-plan-cta-primary'
            : 'cloud-plan-cta-outline';

        var ctaArrow = plan.ctaStyle === 'primary' ? ' →' : '';

        var featuresHTML = '';
        if (plan.features && plan.features.length) {
            featuresHTML = plan.features.map(function (f) {
                return '<li class="cloud-plan-feature">' +
                    '<span class="cloud-plan-check">' + checkSVG() + '</span>' +
                    (f.label || '') +
                    '</li>';
            }).join('');
        }

        return '<div class="cloud-plan-card' + featuredClass + '">' +
            badge +

            '<div class="cloud-plan-tier">' + (plan.tier || '') + '</div>' +

            '<div class="cloud-plan-price-wrap">' +
            '<span class="cloud-plan-currency">' + (plan.currency || '₹') + '</span>' +
            '<span class="cloud-plan-price">' + (plan.price || '') + '</span>' +
            '<span class="cloud-plan-period">' + (plan.period || '/mo') + '</span>' +
            '</div>' +

            (plan.tagline
                ? '<p class="cloud-plan-tagline">' + plan.tagline + '</p>'
                : '') +

            '<hr class="cloud-plan-divider">' +

            '<ul class="cloud-plan-features">' + featuresHTML + '</ul>' +

            '<button class="cloud-plan-cta ' + ctaClass + '">' +
            (plan.ctaText || '') + ctaArrow +
            '</button>' +

            '</div>';
    }).join('');
}
/**
 * Populate numbered "when" cards (e.g. "When Do You Need" section).
 * @param {string} gridSelector - CSS selector for the cards grid
 * @param {Array} cards - [{number, title, description, order}]
 */
export function populateWhenCards(gridSelector, cards) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        return '<div class="ds-when-card">' +
            '<div class="ds-when-num">' + (card.number || '') + '</div>' +
            '<h3>' + (card.title || '') + '</h3>' +
            '<p>' + (card.description || '') + '</p>' +
            '</div>';
    }).join('');
}

/**
 * Populate a comparison table (2-column: ICSDC vs Others).
 * @param {string} tableSelector - CSS selector for the table container (section that wraps the table)
 * @param {Array} columns - Column header strings (e.g. ["Feature", "ICSDC", "Others"])
 * @param {Array} rows - [{feature, icsdc, icsdcStatus, others, othersStatus, order}]
 *   Status values: "check", "partial", "cross"
 */
export function populateComparisonTable(tableSelector, columns, rows) {
    var section = document.querySelector(tableSelector);
    if (!section) return;

    // Update column headers if provided
    if (columns && columns.length) {
        var ths = section.querySelectorAll('thead th');
        columns.forEach(function (col, i) {
            if (ths[i]) ths[i].textContent = col;
        });
    }

    if (!rows || !rows.length) return;
    var tbody = section.querySelector('tbody');
    if (!tbody) return;

    var sorted = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    tbody.innerHTML = sorted.map(function (r) {
        // return '<tr>' +
        //     '<td>' + (r.feature || '') + '</td>' +
        //     '<td style="text-align:center;">' + comparisonIcon(r.othersStatus) + ' ' + (r.others || '') + '</td>' +
        //     '<td class="aws-check">' + comparisonIcon(r.icsdcStatus) + ' ' + (r.icsdc || '') + '</td>' +

        //     '</tr>';

        return '<tr>' +
            '<td>' + (r.feature || '') + '</td>' +
            '<td>' + (r.others || '') + '</td>' +
            '<td class="aws-check">' + (r.icsdc || '') + '</td>' +

            '</tr>';

    }).join('');
}

/**
 * Populate performance / stats cards.
 * @param {string} containerSelector - CSS selector for the stats container
 * @param {Array} stats - [{value, label}]
 */
export function populateStats(containerSelector, stats) {
    if (!stats || !stats.length) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = stats.map(function (s) {
        return '<div class="ds-perf-stat">' +
            '<span class="ds-perf-stat-val">' + (s.value || '') + '</span>' +
            '<span class="ds-perf-stat-label">' + (s.label || '') + '</span>' +
            '</div>';
    }).join('');
}

/**
 * Populate a checklist (e.g. performance checklist).
 * @param {string} listSelector - CSS selector for the <ul> element
 * @param {Array} items - [{label, description, order}]
 */
export function populateChecklist(listSelector, items) {
    if (!items || !items.length) return;
    var ul = document.querySelector(listSelector);
    if (!ul) return;

    var sorted = items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    ul.innerHTML = sorted.map(function (item) {
        return '<li class="ds-checklist-item">' +
            '<span class="ds-cl-icon"><svg viewBox="0 0 12 12" fill="none">' +
            '<polyline points="2,6 5,9 10,3" stroke-linecap="round" stroke-linejoin="round" />' +
            '</svg></span>' +
            '<span><strong>' + (item.label || '') + '</strong> ' + (item.description || '') + '</span>' +
            '</li>';
    }).join('');
}

/**
 * Populate tech / framework badges.
 * @param {string} containerSelector - CSS selector for the badges container
 * @param {Array} badges - [{icon, name, order}]
 * @param {Object} [customIcons] - optional extra icons map
 */
export function populateTechBadges(containerSelector, badges, customIcons) {
    if (!badges || !badges.length) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;

    var sorted = badges.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    container.innerHTML = sorted.map(function (badge) {
        return '<div class="tech-badge">' +

            '<span class="tech-badge-name">' + (badge.name || '') + '</span>' +
            '</div>';
    }).join('');
}

/**
 * Populate location cards (e.g. data center locations).
 * @param {string} gridSelector - CSS selector for the grid container
 * @param {Array} locations - [{flag, name, description, order}]
 */
export function populateLocationCards(gridSelector, locations) {
    if (!locations || !locations.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = locations.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (loc) {
        return '<div class="location-card">' +
            '<span class="location-flag" aria-hidden="true">' + (loc.flag || '') + '</span>' +
            '<h3 class="location-name">' + (loc.name || '') + '</h3>' +
            '<p class="location-desc">' + (loc.description || '') + '</p>' +
            '</div>';
    }).join('');
}

/**
 * Populate solution cards (e.g. email solutions).
 * @param {string} gridSelector - CSS selector for the grid container
 * @param {Array} cards - [{icon, name, description, tagline, ctaText, ctaStyle, order}]
 * @param {Object} [customIcons] - optional extra icons map
 */
export function populateSolutionCards(gridSelector, cards, customIcons) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        var ctaClass = card.ctaStyle === 'primary' ? 'solution-cta-primary' : 'solution-cta-outline';
        var ctaHTML = card.ctaText
            ? '<button class="solution-cta ' + ctaClass + '">' + card.ctaText + '</button>'
            : '';

        return '<div class="solution-card">' +
            '<div class="solution-icon" aria-hidden="true">' + resolveIcon(card.icon, customIcons) + '</div>' +
            '<h3 class="solution-name">' + (card.name || '') + '</h3>' +
            (card.tagline ? '<p class="solution-tagline">' + card.tagline + '</p>' : '') +
            '<p class="solution-desc">' + (card.description || '') + '</p>' +
            ctaHTML +
            '</div>';
    }).join('');
}

/**
 * Populate TLD pricing cards (domain registration).
 * @param {string} gridSelector - CSS selector for the grid container
 * @param {Array} cards - [{extension, price, badge, order}]
 */
export function populateTldCards(gridSelector, cards) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        var badgeHTML = card.badge
            ? '<span class="tld-badge">' + card.badge + '</span>'
            : '';

        return '<div class="tld-card">' +
            badgeHTML +
            '<span class="tld-extension">' + (card.extension || '') + '</span>' +
            '<span class="tld-price">' + (card.price || '') + '</span>' +
            '</div>';
    }).join('');
}

/**
 * Hide the page loader overlay.
 */
export function hidePageLoader() {
    var loader = document.getElementById('page-loader');
    if (!loader) return;
    loader.classList.add('loader-done');
    setTimeout(function () {
        loader.classList.add('loader-hidden');
    }, 520);
}

/**
 * Mark the active nav link based on the current URL path.
 */
export function markActiveNavLink() {
    var path = window.location.pathname;
    document.querySelectorAll('.nav-link, .mobile-nav-links .nav-link').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href && path.includes(href) && href !== '/') {
            link.classList.add('active');
        }
    });
}

/** 9. FAQ Accordion */
export function initFAQ(faqItems) {
    var dl = document.getElementById('faq-accordions');
    if (!dl || !faqItems || !faqItems.length) return;

    var sorted = faqItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    var openIndex = 0;

    function render() {
        dl.innerHTML = sorted.map(function (faq, i) {
            var isOpen = i === openIndex;
            return '<div class="faq-item' + (isOpen ? ' faq-open' : '') + '" data-faq-index="' + i + '">' +
                '<dt>' +
                '<button class="faq-question" aria-expanded="' + isOpen + '" aria-controls="acr-faq-' + i + '">' +
                '<span>' + faq.question + '</span>' +
                '<svg class="faq-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
                '<path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '</button>' +
                '</dt>' +
                '<dd class="faq-answer" id="acr-faq-' + i + '" role="region">' +
                '<p>' + faq.answer + '</p>' +
                '</dd>' +
                '</div>';
        }).join('');

        dl.querySelectorAll('.faq-question').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var index = parseInt(btn.closest('.faq-item').dataset.faqIndex, 10);
                openIndex = (openIndex === index) ? null : index;
                render();
            });
        });
    }

    render();
}


/** 8. Testimonials */
function buildTestiCard(t, index) {
    var initials = getInitials(t.name);
    var stars = '';
    for (var s = 0; s < (t.rating || 5); s++) { stars += starSVG(); }

    return '<article class="testi-card" role="listitem" data-testi-index="' + index + '" aria-label="Testimonial from ' + t.name + '">' +
        '<div class="testi-left">' +
        '<div class="testi-avatar" aria-hidden="true">' +
        '<span class="testi-avatar-initials">' + initials + '</span>' +
        '</div>' +
        '<div class="testi-client-info">' +
        '<p class="testi-name">' + t.name + '</p>' +
        '<p class="testi-job">' + (t.title || '') + '</p>' +
        '<p class="testi-company">' + (t.company || '') + '</p>' +
        '</div>' +
        '<div class="testi-rating" aria-label="Rating: ' + (t.rating || 5) + ' out of 5 stars">' + stars + '</div>' +
        '</div>' +
        '<div class="testi-right">' +
        '<blockquote class="testi-quote">' + t.quote + '</blockquote>' +
        '</div>' +
        '</article>';
}

export function initTestimonials(items) {
    var grid = document.getElementById('testi-grid');
    var dotsWrap = document.getElementById('testi-dots');
    var prevBtn = document.getElementById('testi-prev');
    var nextBtn = document.getElementById('testi-next');
    if (!grid || !dotsWrap || !items || !items.length) return;

    grid.innerHTML = items.map(function (t, i) { return buildTestiCard(t, i); }).join('');

    dotsWrap.innerHTML = items.map(function (_, i) {
        return '<button class="testi-dot' + (i === 0 ? ' testi-dot-active' : '') + '" role="tab" aria-selected="' + (i === 0) + '" aria-label="Go to testimonial ' + (i + 1) + '" data-dot="' + i + '"></button>';
    }).join('');

    var cards = Array.from(grid.querySelectorAll('.testi-card'));
    var dots = Array.from(dotsWrap.querySelectorAll('.testi-dot'));

    function scrollToCard(index) {
        var card = cards[index];
        if (!card) return;
        grid.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
    }

    dots.forEach(function (btn, i) {
        btn.addEventListener('click', function () { scrollToCard(i); });
    });

    function currentIndex() {
        var scrollLeft = grid.scrollLeft;
        var closest = 0, minDist = Infinity;
        cards.forEach(function (card, i) {
            var dist = Math.abs(card.offsetLeft - scrollLeft);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
    }

    if (prevBtn) prevBtn.addEventListener('click', function () {
        var idx = currentIndex();
        scrollToCard(idx === 0 ? items.length - 1 : idx - 1);
    });

    if (nextBtn) nextBtn.addEventListener('click', function () {
        var idx = currentIndex();
        scrollToCard(idx === items.length - 1 ? 0 : idx + 1);
    });

    var scrollTimer;
    grid.addEventListener('scroll', function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
            var idx = currentIndex();
            dots.forEach(function (d, i) {
                d.classList.toggle('testi-dot-active', i === idx);
                d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
            });
        }, 80);
    });
}
