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
import { createCanvasBridge } from './canvas-bridge.js';

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
            '<td><code>/' + esc(p.slug) + '</code></td>' +
            '<td>' + status + '</td>' +
            '<td>' + esc(date) + '</td>' +
            '<td>' +
                '<button class="admin-toggle-btn btn-show bld-list-edit" data-id="' + esc(id) + '"><i class="fa-solid fa-pen-to-square"></i> Edit</button> ' +
                (published
                    ? '<a class="admin-toggle-btn bld-list-view" href="/' + esc(p.slug) + '" target="_blank" rel="noopener" title="Open the live page"><i class="fa-solid fa-arrow-up-right-from-square"></i></a> '
                    : '') +
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
    const slug = window.prompt('URL slug (page will be live at icsdc.com/<slug>):', slugHint);
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
                    '<div class="bld-viewport-toggle" role="group" aria-label="Preview width">' +
                        '<button data-vw="desktop" class="is-active" title="Desktop"><i class="fa-solid fa-display"></i></button>' +
                        '<button data-vw="tablet" title="Tablet (768px)"><i class="fa-solid fa-tablet-screen-button"></i></button>' +
                        '<button data-vw="mobile" title="Mobile (390px)"><i class="fa-solid fa-mobile-screen"></i></button>' +
                    '</div>' +
                    '<span class="bld-zoom-badge" id="bld-zoom-badge" title="Canvas render width · zoom"></span>' +
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
                '<main class="bld-canvas-wrap bld-canvas-wrap-live">' +
                    '<div class="bld-canvas-stage" id="bld-canvas-stage">' +
                        // cache-bust: the canvas shell + its modules are long-cached by the
                        // browser, and a stale copy renders a silently-blank canvas.
                        '<iframe id="bld-canvas-frame" class="bld-canvas-frame" src="/builder/__canvas?canvas=1&v=' + Date.now() + '" title="Page canvas"></iframe>' +
                    '</div>' +
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
    document.getElementById('bld-slug-display').textContent = '/' + state.page.slug;

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
    // Auto-select the first section so the properties panel is useful immediately
    // instead of showing an empty "select a section" placeholder.
    if (!state.selectedSectionId && state.page.sections.length) {
        state.selectedSectionId = state.page.sections[0].id;
    }
    initCanvas();
    initViewportToggle();
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

/* ── Live WYSIWYG canvas (iframe + bridge) ───────────────── */
let canvasBridge = null;
let _refreshTimer = null;

function initCanvas() {
    const frame = document.getElementById('bld-canvas-frame');
    if (!frame) return;
    if (canvasBridge) { canvasBridge.destroy(); canvasBridge = null; }
    canvasBridge = createCanvasBridge(frame, {
        onSelect(id) {
            state.selectedSectionId = id;
            if (canvasBridge) canvasBridge.highlight(id);   // keep bridge's lastHighlight in sync
            renderProperties();
        },
        onReorder(ids) {
            const byId = {};
            state.page.sections.forEach((s) => { byId[s.id] = s; });
            const next = ids.map((id) => byId[id]).filter(Boolean);
            // keep any sections the canvas didn't report (safety)
            state.page.sections.forEach((s) => { if (!ids.includes(s.id)) next.push(s); });
            state.page.sections = next;
            state.page.sections.forEach((s, i) => (s.order = i));
            markDirty();
        },
        onInsert(type, index) { onAddSection(type, index); },
        onTimeout() { showCanvasError(); },
        onAction(action, id) {
            if (action === 'up') moveSection(id, -1);
            else if (action === 'down') moveSection(id, +1);
            else if (action === 'dup') duplicateSection(id);
            else if (action === 'del') deleteSection(id);
        },
    });
    canvasBridge.render(state.page.sections);
    // Mirror the editor's selection into the canvas. The bridge queues this
    // until the iframe reports ready, so it is safe to call immediately.
    if (state.selectedSectionId) canvasBridge.highlight(state.selectedSectionId);
}

/* The canvas iframe never reported ready — almost always a stale cached copy of
   page-renderer.js / canvas-mode.js. Tell the user instead of showing a blank. */
function showCanvasError() {
    const wrap = document.querySelector('.bld-canvas-wrap-live');
    if (!wrap || document.getElementById('bld-canvas-error')) return;
    const box = document.createElement('div');
    box.id = 'bld-canvas-error';
    box.className = 'bld-canvas-error';
    box.innerHTML =
        '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>' +
        '<h3>Canvas didn’t load</h3>' +
        '<p>The preview frame never finished starting up. This is almost always a cached ' +
        'copy of the editor scripts.</p>' +
        '<p><strong>Press Ctrl+Shift+R</strong> (Cmd+Shift+R on Mac) to hard-refresh, then reopen this page.</p>' +
        '<button type="button" id="bld-canvas-retry" class="admin-toggle-btn btn-show">' +
        '<i class="fa-solid fa-rotate"></i> Reload canvas</button>';
    wrap.appendChild(box);
    const btn = document.getElementById('bld-canvas-retry');
    if (btn) btn.addEventListener('click', () => {
        box.remove();
        const f = document.getElementById('bld-canvas-frame');
        if (f) f.src = '/builder/__canvas?canvas=1&v=' + Date.now();
        initCanvas();
    });
}

/* Debounced re-render so typing in the property panel feels live
   without re-rendering the whole page on every keystroke. */
function refreshCanvas(immediate) {
    if (!canvasBridge) return;
    clearTimeout(_refreshTimer);
    if (immediate) { canvasBridge.render(state.page.sections); return; }
    _refreshTimer = setTimeout(() => canvasBridge.render(state.page.sections), 160);
}

/* ── Viewport + scale-to-fit ──────────────────────────────────
   The iframe always renders at a TRUE device width so the page picks the
   right CSS breakpoint, then we scale it down to fit the available panel.
   Rendering a desktop site into a ~600px panel would otherwise trigger the
   tablet layout — a WYSIWYG preview that lies about what visitors see. */
const VIEWPORT_WIDTHS = { desktop: 1280, tablet: 768, mobile: 390 };
let currentViewport = 'desktop';

function applyViewport() {
    const wrap = document.querySelector('.bld-canvas-wrap-live');
    const stage = document.getElementById('bld-canvas-stage');
    const frame = document.getElementById('bld-canvas-frame');
    if (!wrap || !stage || !frame) return;

    const deviceW = VIEWPORT_WIDTHS[currentViewport] || VIEWPORT_WIDTHS.desktop;
    const pad = 28;                                     // .bld-canvas-wrap-live padding × 2
    const availW = Math.max(240, wrap.clientWidth - pad);
    const availH = Math.max(320, wrap.clientHeight - pad);
    const scale = Math.min(1, availW / deviceW);        // never scale up past 1:1

    // Give the iframe enough CSS height that, once scaled, it fills the panel.
    const deviceH = Math.round(availH / scale);
    frame.style.width = deviceW + 'px';
    frame.style.height = deviceH + 'px';
    frame.style.transform = scale < 1 ? 'scale(' + scale + ')' : 'none';

    // The stage occupies the post-scale footprint so centring + scrolling work.
    stage.style.width = Math.round(deviceW * scale) + 'px';
    stage.style.height = Math.round(deviceH * scale) + 'px';

    const badge = document.getElementById('bld-zoom-badge');
    if (badge) badge.textContent = deviceW + 'px · ' + Math.round(scale * 100) + '%';
}

function initViewportToggle() {
    document.querySelectorAll('.bld-viewport-toggle button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bld-viewport-toggle button').forEach((b) => b.classList.remove('is-active'));
            btn.classList.add('is-active');
            currentViewport = btn.dataset.vw || 'desktop';
            applyViewport();
        });
    });

    applyViewport();
    // Keep the fit correct when the window (or panel) resizes.
    if (window.ResizeObserver) {
        const wrap = document.querySelector('.bld-canvas-wrap-live');
        if (wrap) {
            if (_canvasResizeObs) _canvasResizeObs.disconnect();
            _canvasResizeObs = new ResizeObserver(() => applyViewport());
            _canvasResizeObs.observe(wrap);
        }
    } else {
        window.addEventListener('resize', applyViewport);
    }
}
let _canvasResizeObs = null;

function renderProperties() {
    const root = document.getElementById('bld-properties');
    if (!root) return;
    const sec = state.page.sections.find((s) => s.id === state.selectedSectionId);
    renderPropertyEditor(root, sec || null, (updated) => {
        const idx = state.page.sections.findIndex((s) => s.id === updated.id);
        if (idx >= 0) {
            state.page.sections[idx] = updated;
            markDirty();
            refreshCanvas();
        }
    });
}

/* ── Section ops ─────────────────────────────────────────── */
function onAddSection(type, atIndex) {
    const entry = COMPONENT_REGISTRY[type];
    if (!entry) return;
    const section = {
        id: generateSectionId(),
        type,
        order: state.page.sections.length,
        visible: true,
        props: clone(entry.defaultProps || {}),
        layout: {},
    };
    const idx = (typeof atIndex === 'number' && atIndex >= 0 && atIndex <= state.page.sections.length)
        ? atIndex : state.page.sections.length;
    state.page.sections.splice(idx, 0, section);
    state.page.sections.forEach((s, i) => (s.order = i));
    state.selectedSectionId = section.id;
    markDirty();
    refreshCanvas(true);
    if (canvasBridge) canvasBridge.highlight(section.id);
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
    refreshCanvas(true);
    if (canvasBridge) canvasBridge.highlight(id);
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
    refreshCanvas(true);
    if (canvasBridge) canvasBridge.highlight(copy.id);
    renderProperties();
}

function deleteSection(id) {
    if (!confirm('Delete this section?')) return;
    state.page.sections = state.page.sections.filter((s) => s.id !== id);
    state.page.sections.forEach((s, i) => (s.order = i));
    if (state.selectedSectionId === id) state.selectedSectionId = null;
    markDirty();
    refreshCanvas(true);
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
    if (!confirm('Publish this page? It will be live at /' + state.page.slug)) return;
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
        showPublishSuccess();
    } catch (err) {
        setStatus('Publish failed');
        alert('Publish failed: ' + err.message);
    } finally {
        btn.disabled = false;
    }
}

/* Post-publish confirmation: live URL + one-click crawler-snapshot rebuild
   (crawlers get the prerendered snapshot; it must be regenerated after publish). */
function showPublishSuccess() {
    const path = '/' + state.page.slug;
    const existing = document.getElementById('bld-publish-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'bld-publish-toast';
    toast.className = 'bld-publish-toast';
    toast.innerHTML =
        '<div class="bld-toast-row">' +
            '<i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
            '<span>Published — live at <a href="' + path + '" target="_blank" rel="noopener"><code>icsdc.com' + path + '</code></a></span>' +
            '<button id="bld-toast-close" class="bld-toast-close" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>' +
        '</div>' +
        '<div class="bld-toast-row bld-toast-sub">' +
            '<span>Crawlers use a static snapshot — rebuild it so search/AI bots see the new content.</span>' +
            '<button id="bld-toast-rebuild" class="admin-toggle-btn btn-show"><i class="fa-solid fa-bolt"></i> Rebuild snapshot</button>' +
        '</div>';
    document.body.appendChild(toast);
    document.getElementById('bld-toast-close').addEventListener('click', () => toast.remove());
    document.getElementById('bld-toast-rebuild').addEventListener('click', async (e) => {
        const b = e.currentTarget;
        b.disabled = true;
        b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Building…';
        try {
            const res = await BuilderAPI.rebuildSnapshot(path);
            if (!res.ok) throw new Error('request failed');
            b.innerHTML = '<i class="fa-solid fa-check"></i> Build started';
        } catch (err) {
            b.disabled = false;
            b.innerHTML = '<i class="fa-solid fa-bolt"></i> Rebuild snapshot';
            alert('Could not start snapshot build: ' + err.message);
        }
    });
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
