/**
 * version-history.js
 * ──────────────────
 * A simple drawer that lists snapshots for the active page and offers rollback.
 */

import { BuilderAPI } from './builder-api.js';

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function openVersionHistory(documentId, onRollback) {
    let backdrop = document.querySelector('.bld-history-backdrop');
    if (backdrop) backdrop.remove();
    backdrop = document.createElement('div');
    backdrop.className = 'bld-history-backdrop';
    backdrop.innerHTML =
        '<aside class="bld-history-drawer" role="dialog" aria-label="Version history">' +
            '<header>' +
                '<h2>Version History</h2>' +
                '<button class="bld-history-close" aria-label="Close">&times;</button>' +
            '</header>' +
            '<div class="bld-history-body"><p class="bld-empty">Loading…</p></div>' +
        '</aside>';
    document.body.appendChild(backdrop);

    backdrop.querySelector('.bld-history-close').addEventListener('click', () => backdrop.remove());
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.remove(); });

    const body = backdrop.querySelector('.bld-history-body');
    try {
        const { data } = await BuilderAPI.listVersions(documentId);
        if (!data || !data.length) {
            body.innerHTML = '<p class="bld-empty">No version snapshots yet. Save the page to create the first snapshot.</p>';
            return;
        }
        body.innerHTML = data.map((v) => {
            const date = v.created_at ? new Date(v.created_at).toLocaleString() : '';
            return '<div class="bld-history-row">' +
                '<div class="bld-history-meta">' +
                    '<span class="bld-history-version">v' + v.version_number + '</span>' +
                    '<span class="bld-history-summary">' + esc(v.change_summary || '') + '</span>' +
                    '<span class="bld-history-date">' + esc(date) + '</span>' +
                '</div>' +
                '<button class="bld-history-restore" data-version="' + v.version_number + '" type="button">Restore</button>' +
                '</div>';
        }).join('');

        body.querySelectorAll('.bld-history-restore').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const versionNumber = Number(btn.dataset.version);
                if (!confirm('Restore version ' + versionNumber + ' as a new draft? Your current unsaved work will be lost.')) return;
                btn.disabled = true;
                btn.textContent = 'Restoring…';
                try {
                    await BuilderAPI.rollback(documentId, versionNumber);
                    backdrop.remove();
                    if (onRollback) onRollback();
                } catch (err) {
                    alert('Restore failed: ' + err.message);
                    btn.disabled = false;
                    btn.textContent = 'Restore';
                }
            });
        });
    } catch (err) {
        body.innerHTML = '<p class="bld-empty">Failed to load history: ' + esc(err.message) + '</p>';
    }
}
