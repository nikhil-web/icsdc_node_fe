/**
 * canvas-mode.js
 * ──────────────
 * Runs INSIDE the editor's canvas iframe (/builder/__canvas?canvas=1).
 * The page is rendered by the real componentRegistry via renderSections —
 * this module adds the WYSIWYG editing layer on top:
 *
 *   parent → iframe:  bld:render {sections}   render/re-render the page
 *                     bld:highlight {id}      sync selection + scroll to section
 *   iframe → parent:  bld:ready               request initial render
 *                     bld:select {id}         user clicked a section
 *                     bld:reorder {ids}       user drag-reordered sections
 *                     bld:insert {type,index} library item dropped at position
 *                     bld:action {action,id}  toolbar: up|down|dup|del
 *
 * All messages are same-origin only.
 */

const ORIGIN = window.location.origin;
const SORTABLE_CDN = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js';

let renderFn = null;
let currentSections = [];
let selectedId = null;
let sortable = null;

function post(msg) { window.parent.postMessage(msg, ORIGIN); }

function root() { return document.getElementById('builder-page-root'); }

/* ── Canvas-only chrome (outlines, toolbar, insert line) ──── */
function injectCanvasCss() {
    const css =
        'body { cursor: default; }' +
        /* The canvas shows ONLY the page body. Site chrome (nav/footer) and
           floating widgets are injected asynchronously by main.js/chat-widget.js,
           so hide them with CSS — a one-time JS hide would miss late arrivals. */
        'header, nav, footer, .chat-bubble, .chat-window, .chat-unread-badge,' +
        '.btn-wa-nav, .wa-float, .wa-popover, #page-loader, .builder-preview-banner' +
        ' { display: none !important; }' +
        '#builder-page-root .bsec { position: relative; }' +
        '#builder-page-root .bsec:hover { outline: 2px dashed rgba(26,86,219,.45); outline-offset: -2px; }' +
        '#builder-page-root .bsec.bld-cv-selected { outline: 2px solid #1a56db; outline-offset: -2px; }' +
        '#builder-page-root .bsec.bld-cv-selected:hover { outline-style: solid; }' +
        '.bld-cv-toolbar { position: absolute; top: 8px; right: 8px; z-index: 60; display: none; gap: 4px;' +
        '  background: #0a1230; border-radius: 8px; padding: 4px; box-shadow: 0 4px 14px rgba(0,0,0,.25); }' +
        '.bsec.bld-cv-selected > .bld-cv-toolbar { display: flex; }' +
        '.bld-cv-toolbar button { width: 30px; height: 30px; border: none; border-radius: 6px; background: transparent;' +
        '  color: #cbd5e1; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }' +
        '.bld-cv-toolbar button:hover { background: #1a56db; color: #fff; }' +
        '.bld-cv-toolbar .bld-cv-grip { cursor: grab; }' +
        '.bld-cv-type-chip { position: absolute; top: 8px; left: 8px; z-index: 60; display: none;' +
        '  background: #1a56db; color: #fff; font: 700 10.5px/1 system-ui; letter-spacing: .04em; text-transform: uppercase;' +
        '  padding: 6px 10px; border-radius: 6px; pointer-events: none; }' +
        '.bsec:hover > .bld-cv-type-chip, .bsec.bld-cv-selected > .bld-cv-type-chip { display: block; }' +
        '.bld-cv-insert-line { height: 4px; background: #1a56db; border-radius: 2px; margin: 2px 24px; }' +
        '.bld-cv-ghost { opacity: .4; }' +
        /* Sized generously: the canvas is transform-scaled (often ~60%), so this
           editor-chrome message must stay legible once shrunk. */
        '.bld-cv-empty { text-align: center; padding: 160px 24px; color: #64748b; font-family: system-ui; }' +
        '.bld-cv-empty i { font-size: 84px; color: #cbd5e1; display: block; margin-bottom: 26px; }' +
        '.bld-cv-empty h3 { font-size: 38px; margin: 0 0 12px; color: #334155; }' +
        '.bld-cv-empty p { font-size: 22px; margin: 0; }' +
        /* neutralise entrance animations inside the canvas so everything is always visible */
        '#builder-page-root [data-animate], #builder-page-root [data-stagger] { opacity: 1 !important; transform: none !important; }';
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
}

function loadSortable() {
    return new Promise((resolve) => {
        if (window.Sortable) return resolve();
        const s = document.createElement('script');
        s.src = SORTABLE_CDN;
        s.onload = () => resolve();
        s.onerror = () => resolve();          // reorder degrades to toolbar arrows
        document.head.appendChild(s);
    });
}

/* ── Decorate rendered sections with editing chrome ───────── */
function decorate() {
    const r = root();
    if (!r) return;

    if (!currentSections.length) {
        r.innerHTML =
            '<div class="bld-cv-empty">' +
            '<i class="fa-solid fa-cubes" aria-hidden="true"></i>' +
            '<h3>Blank page</h3><p>Click or drag a component from the left panel to start building.</p>' +
            '</div>';
        return;
    }

    r.querySelectorAll('.bsec').forEach((wrap) => {
        const id = wrap.dataset.sectionId;
        const type = wrap.dataset.sectionType || '';
        if (id === selectedId) wrap.classList.add('bld-cv-selected');

        const chip = document.createElement('span');
        chip.className = 'bld-cv-type-chip';
        chip.textContent = type;
        wrap.appendChild(chip);

        const bar = document.createElement('div');
        bar.className = 'bld-cv-toolbar';
        bar.innerHTML =
            '<button class="bld-cv-grip" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></button>' +
            '<button data-act="up" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>' +
            '<button data-act="down" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>' +
            '<button data-act="dup" title="Duplicate"><i class="fa-solid fa-copy"></i></button>' +
            '<button data-act="del" title="Delete"><i class="fa-solid fa-trash"></i></button>';
        bar.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-act]');
            if (!btn) return;
            e.stopPropagation();
            post({ type: 'bld:action', action: btn.dataset.act, id });
        });
        wrap.appendChild(bar);
    });
}

function initSortable() {
    const r = root();
    if (!r || !window.Sortable) return;
    if (sortable) { try { sortable.destroy(); } catch (_) {} sortable = null; }
    if (!currentSections.length) return;
    sortable = window.Sortable.create(r, {
        animation: 180,
        handle: '.bld-cv-grip',
        draggable: '.bsec',
        ghostClass: 'bld-cv-ghost',
        onEnd() {
            const ids = Array.from(r.querySelectorAll('.bsec')).map((el) => el.dataset.sectionId);
            post({ type: 'bld:reorder', ids });
        },
    });
}

/* ── Click-to-select (and block navigation inside canvas) ─── */
function initClickSelect() {
    document.addEventListener('click', (e) => {
        // Never navigate away — the canvas is an editing surface.
        const a = e.target.closest('a');
        if (a) e.preventDefault();
        const btn = e.target.closest('button');
        if (btn && !btn.closest('.bld-cv-toolbar')) e.preventDefault();

        if (e.target.closest('.bld-cv-toolbar')) return;
        const wrap = e.target.closest('.bsec');
        if (!wrap) return;
        setSelected(wrap.dataset.sectionId);
        post({ type: 'bld:select', id: wrap.dataset.sectionId });
    }, true);

    // Block form submits too
    document.addEventListener('submit', (e) => e.preventDefault(), true);
}

function setSelected(id) {
    selectedId = id;
    const r = root();
    if (!r) return;
    r.querySelectorAll('.bsec').forEach((el) =>
        el.classList.toggle('bld-cv-selected', el.dataset.sectionId === id));
}

/* ── Library drop-insert ────────────────────────────────────
   The admin's library items set 'application/x-bld-component'
   on dragstart; same-origin drags deliver events to this doc. */
function initDropInsert() {
    let line = null;
    function removeLine() { if (line) { line.remove(); line = null; } }
    function insertIndexAt(y) {
        const wraps = Array.from(root().querySelectorAll('.bsec'));
        for (let i = 0; i < wraps.length; i++) {
            const rect = wraps[i].getBoundingClientRect();
            if (y < rect.top + rect.height / 2) return i;
        }
        return wraps.length;
    }
    document.addEventListener('dragover', (e) => {
        if (!e.dataTransfer || !Array.from(e.dataTransfer.types).includes('application/x-bld-component')) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        const idx = insertIndexAt(e.clientY);
        removeLine();
        line = document.createElement('div');
        line.className = 'bld-cv-insert-line';
        const wraps = root().querySelectorAll('.bsec');
        if (idx >= wraps.length) root().appendChild(line);
        else root().insertBefore(line, wraps[idx]);
    });
    document.addEventListener('dragleave', (e) => { if (e.target === document.documentElement) removeLine(); });
    document.addEventListener('drop', (e) => {
        const type = e.dataTransfer && e.dataTransfer.getData('application/x-bld-component');
        removeLine();
        if (!type) return;
        e.preventDefault();
        post({ type: 'bld:insert', componentType: type, index: insertIndexAt(e.clientY) });
    });
}

/* ── Message handling ──────────────────────────────────────── */
export function initCanvasMode(renderSections) {
    renderFn = renderSections;
    // Edit in light theme regardless of the admin's OS preference — pages are
    // designed light-first and this is what most visitors see. (The published
    // page still honours each visitor's own theme.)
    document.documentElement.setAttribute('data-theme', 'light');
    injectCanvasCss();
    initClickSelect();
    initDropInsert();

    window.addEventListener('message', async (e) => {
        if (e.origin !== ORIGIN || !e.data || typeof e.data !== 'object') return;
        if (e.data.type === 'bld:render') {
            currentSections = Array.isArray(e.data.sections) ? e.data.sections : [];
            renderFn(root(), currentSections);
            decorate();
            await loadSortable();
            initSortable();
        } else if (e.data.type === 'bld:highlight') {
            setSelected(e.data.id);
            const el = root().querySelector('.bsec[data-section-id="' + e.data.id + '"]');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    // Hide nav/footer/widgets — the canvas shows ONLY the page body.
    ['header', 'nav', 'footer', '.chat-bubble', '.chat-window', '.wa-widget', '#page-loader'].forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => { el.style.display = 'none'; });
    });

    post({ type: 'bld:ready' });
}
