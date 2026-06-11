/**
 * builder-editor.js
 * ─────────────────
 * Main controller for the page builder. Vanilla JS — no Alpine, no SortableJS
 * required at this stage. Reordering is done via up/down buttons; drag-drop
 * can be layered on later without changing this state model.
 *
 * State:
 *   editor = {
 *     mode: 'list' | 'edit',
 *     pages: [...],          // for list view
 *     page: {                // when editing
 *       documentId, title, slug, sections[], metaTitle, metaDescription
 *     },
 *     selectedSectionId,
 *     dirty: bool,
 *   }
 */

import { COMPONENT_REGISTRY } from '/assets/js/builder/componentRegistry.js';
import { generateSectionId } from '/assets/js/builder/builder-utils.js';
import { BuilderAPI } from './builder-api.js';
import { renderComponentLibrary } from './component-library.js';
import { renderPropertyEditor } from './property-editor.js';
import { openVersionHistory } from './version-history.js';

const state = {
    mode: 'list',
    pages: [],
    page: null,
    selectedSectionId: null,
    dirty: false,
};

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ── Mount detection ─────────────────────────────────────── */
function getRoot() { return document.getElementById('view-builder'); }
function isBuilderRoute() { return window.location.pathname.startsWith('/admin/builder'); }

/* ── Top-level entrypoint ────────────────────────────────── */
export async function mountBuilder() {
    const root = getRoot();
    if (!root) return;

    // Determine sub-route
    const parts = window.location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    // parts: ['admin','builder'] or ['admin','builder',':documentId']
    const documentId = parts[2] || null;

    if (documentId) {
        await openEditor(documentId);
    } else {
        await openList();
    }
}

/* ══════ LIST VIEW ═══════════════════════════════════════ */
async function openList() {
    state.mode = 'list';
    state.page = null;
    state.dirty = false;
    const root = getRoot();
    root.innerHTML =
        '<div class="bld-list-wrap">' +
            '<div class="bld-list-head">' +
                '<div>' +
                    '<h2 class="admin-page-title">Page Builder</h2>' +
                    '<p class="admin-page-sub">Create and manage pages built with the visual editor.</p>' +
                '</div>' +
                '<div class="bld-list-actions">' +
                    '<button id="bld-new-page-btn" class="admin-login-btn"><i class="fa-solid fa-plus"></i> New Page</button>' +
                '</div>' +
            '</div>' +
            '<div class="admin-table-wrap">' +
                '<table class="admin-table">' +
                    '<thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Updated</th><th></th></tr></thead>' +
                    '<tbody id="bld-list-body"><tr><td colspan="5" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr></tbody>' +
                '</table>' +
            '</div>' +
        '</div>';

    document.getElementById('bld-new-page-btn').addEventListener('click', onNewPageClick);

    try {
        const res = await BuilderAPI.listPages();
        state.pages = res?.data || [];
        renderListBody();
    } catch (err) {
        document.getElementById('bld-list-body').innerHTML =
            '<tr><td colspan="5" class="admin-loading-cell">Failed: ' + esc(err.message) + '</td></tr>';
    }
}

function renderListBody() {
    const tbody = document.getElementById('bld-list-body');
    if (!tbody) return;
    if (!state.pages.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-loading-cell">No pages yet. Click <strong>New Page</strong> to start.</td></tr>';
        return;
    }
    tbody.innerHTML = state.pages.map((p) => {
        const id = p.documentId || p.id;
        const published = !!p.publishedAt;
        const status = published
            ? '<span class="admin-status-badge live"><span class="admin-status-dot"></span>Published</span>'
            : '<span class="admin-status-badge hidden"><span class="admin-status-dot"></span>Draft</span>';
        const date = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '—';
        return '<tr>' +
            '<td>' + esc(p.title) + '</td>' +
            '<td><code>/builder/' + esc(p.slug) + '</code></td>' +
            '<td>' + status + '</td>' +
            '<td>' + esc(date) + '</td>' +
            '<td>' +
                '<button class="admin-toggle-btn btn-show bld-list-edit" data-id="' + esc(id) + '"><i class="fa-solid fa-pen-to-square"></i> Edit</button> ' +
                '<button class="admin-toggle-btn btn-hide bld-list-delete" data-id="' + esc(id) + '" data-title="' + esc(p.title) + '"><i class="fa-solid fa-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join('');

    tbody.querySelectorAll('.bld-list-edit').forEach((btn) =>
        btn.addEventListener('click', () => navigateTo('/admin/builder/' + btn.dataset.id)));
    tbody.querySelectorAll('.bld-list-delete').forEach((btn) =>
        btn.addEventListener('click', () => onDeleteClick(btn.dataset.id, btn.dataset.title)));
}

async function onNewPageClick() {
    const title = window.prompt('Page title?');
    if (!title || !title.trim()) return;
    const slugHint = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = window.prompt('URL slug (will appear at /builder/<slug>):', slugHint);
    if (!slug || !slug.trim()) return;

    try {
        const res = await BuilderAPI.createPage({
            title: title.trim(),
            slug: slug.trim().toLowerCase(),
            sections: [],
        });
        const newId = res?.data?.documentId || res?.data?.id;
        if (newId) navigateTo('/admin/builder/' + newId);
        else openList();
    } catch (err) {
        alert('Failed to create page: ' + err.message);
    }
}

async function onDeleteClick(documentId, title) {
    if (!confirm('Delete "' + title + '"? This cannot be undone.')) return;
    try {
        await BuilderAPI.deletePage(documentId);
        await openList();
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

/* ══════ EDITOR VIEW ═════════════════════════════════════ */
async function openEditor(documentId) {
    state.mode = 'edit';
    state.dirty = false;
    state.selectedSectionId = null;

    const root = getRoot();
    root.innerHTML =
        '<div class="bld-editor">' +
            '<div class="bld-editor-topbar">' +
                '<button class="bld-back-btn" id="bld-back-btn"><i class="fa-solid fa-arrow-left"></i> All Pages</button>' +
                '<div class="bld-editor-title">' +
                    '<input type="text" id="bld-page-title" class="bld-title-input" placeholder="Page title">' +
                    '<span class="bld-slug-display" id="bld-slug-display"></span>' +
                '</div>' +
                '<div class="bld-editor-actions">' +
                    '<button id="bld-history-btn" class="admin-toggle-btn"><i class="fa-solid fa-clock-rotate-left"></i> History</button>' +
                    '<button id="bld-save-btn"    class="admin-toggle-btn btn-show"><i class="fa-solid fa-floppy-disk"></i> Save Draft</button>' +
                    '<button id="bld-preview-btn" class="admin-toggle-btn btn-show"><i class="fa-solid fa-eye"></i> Preview</button>' +
                    '<button id="bld-publish-btn" class="admin-login-btn"><i class="fa-solid fa-upload"></i> Publish</button>' +
                '</div>' +
            '</div>' +
            '<div class="bld-editor-body">' +
                '<aside class="bld-panel bld-panel-left">' +
                    '<h3 class="bld-panel-title">Components</h3>' +
                    '<div id="bld-library"></div>' +
                '</aside>' +
                '<main class="bld-canvas-wrap">' +
                    '<div id="bld-canvas" class="bld-canvas"></div>' +
                '</main>' +
                '<aside class="bld-panel bld-panel-right">' +
                    '<h3 class="bld-panel-title">Properties</h3>' +
                    '<div id="bld-properties"></div>' +
                '</aside>' +
            '</div>' +
            '<div class="bld-editor-footer">' +
                '<span id="bld-status" class="bld-status">Loading…</span>' +
            '</div>' +
        '</div>';

    // Load page data
    try {
        const res = await BuilderAPI.getPage(documentId);
        const page = res?.data;
        if (!page) {
            alert('Page not found.');
            navigateTo('/admin/builder');
            return;
        }
        state.page = {
            documentId: page.documentId || documentId,
            title: page.title || '',
            slug: page.slug || '',
            sections: Array.isArray(page.sections) ? page.sections : [],
            metaTitle: page.metaTitle || '',
            metaDescription: page.metaDescription || '',
            publishedAt: page.publishedAt || null,
            currentVersion: page.currentVersion || 1,
        };
    } catch (err) {
        alert('Failed to load page: ' + err.message);
        navigateTo('/admin/builder');
        return;
    }

    document.getElementById('bld-page-title').value = state.page.title;
    document.getElementById('bld-slug-display').textContent = '/builder/' + state.page.slug;

    document.getElementById('bld-back-btn').addEventListener('click', () => {
        if (state.dirty && !confirm('You have unsaved changes. Leave anyway?')) return;
        navigateTo('/admin/builder');
    });

    document.getElementById('bld-page-title').addEventListener('input', (e) => {
        state.page.title = e.target.value;
        markDirty();
    });

    document.getElementById('bld-save-btn').addEventListener('click', onSaveDraft);
    document.getElementById('bld-preview-btn').addEventListener('click', onPreview);
    document.getElementById('bld-publish-btn').addEventListener('click', onPublish);
    document.getElementById('bld-history-btn').addEventListener('click', () => {
        openVersionHistory(state.page.documentId, () => openEditor(state.page.documentId));
    });

    renderComponentLibrary(document.getElementById('bld-library'), onAddSection);
    renderCanvas();
    renderProperties();
    setStatus(state.page.publishedAt ? 'Published · v' + state.page.currentVersion : 'Draft · v' + state.page.currentVersion);
}

function markDirty() {
    state.dirty = true;
    setStatus('Unsaved changes');
}

function setStatus(text) {
    const el = document.getElementById('bld-status');
    if (el) el.textContent = text;
}

/* ── Canvas (centre) ─────────────────────────────────────── */
function renderCanvas() {
    const canvas = document.getElementById('bld-canvas');
    if (!canvas) return;
    if (!state.page.sections.length) {
        canvas.innerHTML =
            '<div class="bld-empty-canvas">' +
                '<i class="fa-solid fa-cubes" aria-hidden="true"></i>' +
                '<h3>No sections yet</h3>' +
                '<p>Click a component on the left to add your first section.</p>' +
            '</div>';
        return;
    }

    canvas.innerHTML = state.page.sections.map((sec, i) => {
        const entry = COMPONENT_REGISTRY[sec.type];
        const label = entry ? entry.label : sec.type;
        const selected = state.selectedSectionId === sec.id ? ' bld-card-selected' : '';
        const isFirst = i === 0;
        const isLast  = i === state.page.sections.length - 1;
        return '<div class="bld-card' + selected + '" data-id="' + esc(sec.id) + '">' +
            '<div class="bld-card-head">' +
                '<span class="bld-card-num">' + String(i + 1).padStart(2, '0') + '</span>' +
                '<span class="bld-card-label">' + esc(label) + '</span>' +
                '<div class="bld-card-actions">' +
                    '<button class="bld-icon-btn bld-up" data-id="' + esc(sec.id) + '" title="Move up"' + (isFirst ? ' disabled' : '') + '><i class="fa-solid fa-arrow-up"></i></button>' +
                    '<button class="bld-icon-btn bld-down" data-id="' + esc(sec.id) + '" title="Move down"' + (isLast ? ' disabled' : '') + '><i class="fa-solid fa-arrow-down"></i></button>' +
                    '<button class="bld-icon-btn bld-dup" data-id="' + esc(sec.id) + '" title="Duplicate"><i class="fa-solid fa-copy"></i></button>' +
                    '<button class="bld-icon-btn bld-del" data-id="' + esc(sec.id) + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
            '</div>' +
            '<div class="bld-card-summary">' + esc(summariseSection(sec)) + '</div>' +
        '</div>';
    }).join('');

    canvas.querySelectorAll('.bld-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.bld-card-actions')) return;
            state.selectedSectionId = card.dataset.id;
            renderCanvas();
            renderProperties();
        });
    });
    canvas.querySelectorAll('.bld-up').forEach((b) => b.addEventListener('click', () => moveSection(b.dataset.id, -1)));
    canvas.querySelectorAll('.bld-down').forEach((b) => b.addEventListener('click', () => moveSection(b.dataset.id, +1)));
    canvas.querySelectorAll('.bld-dup').forEach((b) => b.addEventListener('click', () => duplicateSection(b.dataset.id)));
    canvas.querySelectorAll('.bld-del').forEach((b) => b.addEventListener('click', () => deleteSection(b.dataset.id)));

    initSortable(canvas);
}

/* ── Drag-and-drop (SortableJS) ──────────────────────────── */
let _sortableInstance = null;
function initSortable(canvas) {
    if (typeof window.Sortable === 'undefined') return; // graceful fallback to up/down buttons
    if (_sortableInstance) {
        try { _sortableInstance.destroy(); } catch (_) {}
        _sortableInstance = null;
    }
    _sortableInstance = window.Sortable.create(canvas, {
        animation: 160,
        ghostClass: 'bld-card-ghost',
        chosenClass: 'bld-card-chosen',
        dragClass: 'bld-card-dragging',
        handle: '.bld-card-head',
        filter: '.bld-icon-btn',  // don't start drag from action buttons
        preventOnFilter: false,
        onEnd(evt) {
            if (evt.oldIndex === evt.newIndex) return;
            const arr = state.page.sections;
            const [moved] = arr.splice(evt.oldIndex, 1);
            arr.splice(evt.newIndex, 0, moved);
            arr.forEach((s, i) => (s.order = i));
            markDirty();
            renderCanvas();
        },
    });
}

function summariseSection(sec) {
    const p = sec.props || {};
    return p.title || p.heading || p.headline || '(no title)';
}

function renderProperties() {
    const root = document.getElementById('bld-properties');
    if (!root) return;
    const sec = state.page.sections.find((s) => s.id === state.selectedSectionId);
    renderPropertyEditor(root, sec || null, (updated) => {
        const idx = state.page.sections.findIndex((s) => s.id === updated.id);
        if (idx >= 0) {
            state.page.sections[idx] = updated;
            markDirty();
            renderCanvas();
        }
    });
}

/* ── Section ops ─────────────────────────────────────────── */
function onAddSection(type) {
    const entry = COMPONENT_REGISTRY[type];
    if (!entry) return;
    const section = {
        id: generateSectionId(),
        type,
        order: state.page.sections.length,
        visible: true,
        props: clone(entry.defaultProps || {}),
    };
    state.page.sections.push(section);
    state.selectedSectionId = section.id;
    markDirty();
    renderCanvas();
    renderProperties();
}

function moveSection(id, dir) {
    const idx = state.page.sections.findIndex((s) => s.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= state.page.sections.length) return;
    const arr = state.page.sections;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    arr.forEach((s, i) => (s.order = i));
    markDirty();
    renderCanvas();
}

function duplicateSection(id) {
    const sec = state.page.sections.find((s) => s.id === id);
    if (!sec) return;
    const copy = clone(sec);
    copy.id = generateSectionId();
    const idx = state.page.sections.findIndex((s) => s.id === id);
    state.page.sections.splice(idx + 1, 0, copy);
    state.page.sections.forEach((s, i) => (s.order = i));
    state.selectedSectionId = copy.id;
    markDirty();
    renderCanvas();
    renderProperties();
}

function deleteSection(id) {
    if (!confirm('Delete this section?')) return;
    state.page.sections = state.page.sections.filter((s) => s.id !== id);
    state.page.sections.forEach((s, i) => (s.order = i));
    if (state.selectedSectionId === id) state.selectedSectionId = null;
    markDirty();
    renderCanvas();
    renderProperties();
}

/* ── Save / Preview / Publish ────────────────────────────── */
async function onSaveDraft() {
    const btn = document.getElementById('bld-save-btn');
    btn.disabled = true;
    setStatus('Saving…');
    try {
        const res = await BuilderAPI.updatePage(state.page.documentId, {
            title: state.page.title,
            sections: state.page.sections,
            metaTitle: state.page.metaTitle,
            metaDescription: state.page.metaDescription,
            changeSummary: 'Draft saved',
        });
        state.page.currentVersion = res?.data?.currentVersion || state.page.currentVersion + 1;
        state.dirty = false;
        setStatus('Saved · v' + state.page.currentVersion);
    } catch (err) {
        setStatus('Save failed');
        alert('Save failed: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

async function onPreview() {
    const btn = document.getElementById('bld-preview-btn');
    btn.disabled = true;
    try {
        const { token } = await BuilderAPI.createPreviewToken({
            slug: state.page.slug,
            sections: state.page.sections,
            title: state.page.title,
            metaTitle: state.page.metaTitle,
            metaDescription: state.page.metaDescription,
        });
        const url = '/builder/preview/' + encodeURIComponent(state.page.slug) + '?token=' + encodeURIComponent(token);
        const opened = window.open(url, '_blank', 'noopener');
        if (!opened) alert('Preview was blocked by your browser. Allow pop-ups for this site.');
    } catch (err) {
        alert('Preview failed: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

async function onPublish() {
    if (!confirm('Publish this page? It will be live at /builder/' + state.page.slug)) return;
    const btn = document.getElementById('bld-publish-btn');
    btn.disabled = true;
    setStatus('Publishing…');
    try {
        // Save first to make sure the draft has the current sections
        await BuilderAPI.updatePage(state.page.documentId, {
            title: state.page.title,
            sections: state.page.sections,
            metaTitle: state.page.metaTitle,
            metaDescription: state.page.metaDescription,
            changeSummary: 'Saved before publish',
        });
        await BuilderAPI.publishPage(state.page.documentId);
        state.dirty = false;
        state.page.publishedAt = new Date().toISOString();
        setStatus('Published · v' + state.page.currentVersion);
    } catch (err) {
        setStatus('Publish failed');
        alert('Publish failed: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

/* ── Routing helper (uses History API) ───────────────────── */
function navigateTo(url) {
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

window.addEventListener('popstate', () => {
    if (isBuilderRoute()) mountBuilder();
});

// Initial mount when this module loads (after login completes)
if (isBuilderRoute() && document.getElementById('view-builder')) {
    mountBuilder();
}

// Re-mount when shown by admin.js (uses a custom event hook)
window.addEventListener('icsdc:show-builder', () => mountBuilder());
