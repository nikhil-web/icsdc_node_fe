/**
 * media-picker.js
 * ───────────────
 * Modal media library. Lists uploaded files from Strapi (via the Node admin proxy)
 * and lets the user upload new ones. Resolves with the chosen absolute URL.
 *
 *   const url = await pickMedia({ initialUrl: existingUrl });
 *   if (url) { /* user chose a file *\/ }
 *   else     { /* user cancelled *\/ }
 *
 * No external deps — vanilla JS + the existing builder-editor.css design language.
 */

import { BuilderAPI } from './builder-api.js';

function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// The Node admin proxy already absolutifies Strapi URLs server-side,
// so file.url should always be an absolute URL.
function absoluteUrl(file) { return file.url || ''; }

function isImage(file) {
    return (file.mime || '').startsWith('image/');
}

export function pickMedia(opts = {}) {
    return new Promise((resolve) => {
        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'bld-media-backdrop';

        // Modal
        const modal = document.createElement('div');
        modal.className = 'bld-media-modal';
        modal.innerHTML =
            '<div class="bld-media-head">' +
            '<h3>Media Library</h3>' +
            '<button class="bld-media-close" aria-label="Close">&times;</button>' +
            '</div>' +
            '<div class="bld-media-toolbar">' +
            '<input type="search" class="bld-media-search" placeholder="Search files…" />' +
            '<label class="bld-media-upload-btn">' +
            '<i class="fa-solid fa-cloud-arrow-up"></i> Upload' +
            '<input type="file" hidden accept="image/*" />' +
            '</label>' +
            '</div>' +
            '<div class="bld-media-grid" tabindex="0"></div>' +
            '<div class="bld-media-foot">' +
            '<span class="bld-media-status">Loading…</span>' +
            '<div>' +
            '<button class="bld-media-cancel admin-toggle-btn">Cancel</button>' +
            '<button class="bld-media-confirm admin-login-btn" disabled>Use Selected</button>' +
            '</div>' +
            '</div>';
        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);

        const grid = modal.querySelector('.bld-media-grid');
        const search = modal.querySelector('.bld-media-search');
        const upload = modal.querySelector('input[type="file"]');
        const status = modal.querySelector('.bld-media-status');
        const confirm = modal.querySelector('.bld-media-confirm');
        const cancel = modal.querySelector('.bld-media-cancel');
        const closeBtn = modal.querySelector('.bld-media-close');

        let selected = null;
        let files = [];

        function close(result) {
            backdrop.remove();
            resolve(result);
        }

        function normaliseFile(raw) {
            // Strapi 5 may wrap each file in { id, attributes: {...} } (v4 returned flat).
            if (raw && raw.attributes && typeof raw.attributes === 'object') {
                return Object.assign({ id: raw.id }, raw.attributes);
            }
            return raw || {};
        }

        async function refresh(q) {
            grid.innerHTML = '';
            status.textContent = 'Loading…';
            try {
                const data = await BuilderAPI.listMedia(q);
                // /upload/files returns an array (v4) or { results: [...] } / { data: [...] } (v5).
                const list = Array.isArray(data) ? data : (data?.results || data?.data || []);
                files = list.map(normaliseFile);
                renderGrid();
                status.textContent = files.length + ' file' + (files.length === 1 ? '' : 's');
            } catch (err) {
                status.textContent = 'Failed: ' + err.message;
            }
        }

        function renderGrid() {
            if (!files.length) {
                grid.innerHTML = '<div class="bld-media-empty">No files yet. Click <strong>Upload</strong> to add one.</div>';
                return;
            }
            grid.innerHTML = files.map((f) => {
                const url = absoluteUrl(f);
                const isImg = isImage(f);
                const thumb = isImg
                    ? '<img src="' + esc(url) + '" alt="" loading="lazy">'
                    : '<div class="bld-media-thumb-file"><i class="fa-solid fa-file"></i></div>';
                const sizeKb = f.size ? (f.size / 1024).toFixed(0) + ' KB' : '';
                return '<button type="button" class="bld-media-card" data-id="' + esc(f.id) + '" data-url="' + esc(url) + '" data-name="' + esc(f.name || '') + '" title="' + esc(f.name || '') + '">' +
                    '<div class="bld-media-thumb">' + thumb + '</div>' +
                    '<div class="bld-media-meta">' +
                    '<div class="bld-media-name">' + esc(f.name || f.hash || '(unnamed)') + '</div>' +
                    '<div class="bld-media-sub">' + esc(sizeKb) + ' · ' + esc(f.ext || '') + '</div>' +
                    '</div>' +
                    '</button>';
            }).join('');

            grid.querySelectorAll('.bld-media-card').forEach((card) => {
                card.addEventListener('click', () => {
                    grid.querySelectorAll('.bld-media-card.is-selected').forEach((c) => c.classList.remove('is-selected'));
                    card.classList.add('is-selected');
                    selected = { id: card.dataset.id, url: card.dataset.url, name: card.dataset.name };
                    confirm.disabled = false;
                });
                card.addEventListener('dblclick', () => close(card.dataset.url));
            });
        }

        async function handleUpload(file) {
            if (!file) return;
            status.textContent = 'Uploading "' + file.name + '"…';
            try {
                const arr = await BuilderAPI.uploadMedia(file);
                const raw = Array.isArray(arr) ? arr[0] : arr;
                const newFile = normaliseFile(raw);
                if (newFile && newFile.id) {
                    files.unshift(newFile);
                    renderGrid();
                    // auto-select
                    const card = grid.querySelector('.bld-media-card[data-id="' + newFile.id + '"]');
                    if (card) card.click();
                    status.textContent = 'Uploaded ' + file.name;
                }
            } catch (err) {
                status.textContent = 'Upload failed: ' + err.message;
            }
        }

        // Wire up
        upload.addEventListener('change', (e) => {
            const f = e.target.files && e.target.files[0];
            if (f) handleUpload(f);
            e.target.value = '';
        });

        // Drag-and-drop on the grid
        ['dragenter', 'dragover'].forEach((ev) =>
            grid.addEventListener(ev, (e) => { e.preventDefault(); grid.classList.add('is-dropping'); }));
        ['dragleave', 'drop'].forEach((ev) =>
            grid.addEventListener(ev, (e) => { e.preventDefault(); grid.classList.remove('is-dropping'); }));
        grid.addEventListener('drop', (e) => {
            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (f) handleUpload(f);
        });

        let searchTimer;
        search.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(() => refresh(search.value.trim()), 250);
        });

        confirm.addEventListener('click', () => selected && close(selected.url));
        cancel.addEventListener('click', () => close(null));
        closeBtn.addEventListener('click', () => close(null));
        backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(null); });

        // ESC to close
        function onKey(e) { if (e.key === 'Escape') close(null); }
        document.addEventListener('keydown', onKey);
        backdrop.addEventListener('remove', () => document.removeEventListener('keydown', onKey));

        // Initial load
        refresh('');
    });
}
