/**
 * property-editor.js
 * ──────────────────
 * Renders the RIGHT PANEL: a form for the currently-selected section.
 * Iterates the section's component schema and emits input controls.
 *
 * Field types supported: text, textarea, number, toggle, select, cta, repeater
 *
 * Edits flow through `onChange(updatedProps)` so the editor can re-render
 * the section preview.
 */

import { COMPONENT_REGISTRY } from '/assets/js/builder/componentRegistry.js';
import { pickMedia } from './media-picker.js';

let activeSection = null;
let onChangeCallback = null;
let activeRoot = null;

function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function emitChange(newProps) {
    if (!activeSection) return;
    activeSection.props = newProps;
    if (onChangeCallback) onChangeCallback(activeSection);
}

/* Deep clone via JSON (props are JSON-serialisable by contract). */
function clone(o) { return JSON.parse(JSON.stringify(o == null ? null : o)); }

function getByPath(obj, path) {
    let v = obj;
    for (const p of path) { v = (v == null) ? undefined : v[p]; }
    return v;
}

function setByPath(obj, path, value) {
    const cloned = clone(obj) || {};
    let cur = cloned;
    for (let i = 0; i < path.length - 1; i++) {
        const k = path[i];
        if (cur[k] == null) cur[k] = (typeof path[i + 1] === 'number') ? [] : {};
        cur = cur[k];
    }
    cur[path[path.length - 1]] = value;
    return cloned;
}

function deleteByPath(obj, path) {
    const cloned = clone(obj) || {};
    let cur = cloned;
    for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]];
    const last = path[path.length - 1];
    if (Array.isArray(cur)) cur.splice(last, 1);
    else delete cur[last];
    return cloned;
}

/* ── Field renderers ──────────────────────────────────────── */
function fieldText(field, value, path) {
    return '<label class="bld-field">' +
        '<span class="bld-field-label">' + esc(field.label) + (field.required ? ' *' : '') + '</span>' +
        '<input type="text" class="bld-input" data-path="' + path.join('.') + '" value="' + esc(value) + '">' +
        '</label>';
}

function fieldImage(field, value, path) {
    const url = value || '';
    const preview = url
        ? '<img src="' + esc(url) + '" alt="" class="bld-img-preview" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
          '<div class="bld-img-preview bld-img-preview-empty" style="display:none"><i class="fa-solid fa-triangle-exclamation"></i></div>'
        : '<div class="bld-img-preview bld-img-preview-empty"><i class="fa-solid fa-image"></i></div>';
    return '<div class="bld-field bld-field-image">' +
        '<span class="bld-field-label">' + esc(field.label) + (field.required ? ' *' : '') + '</span>' +
        preview +
        '<button type="button" class="bld-img-browse-btn bld-img-browse" data-path="' + path.join('.') + '">' +
            '<i class="fa-solid fa-folder-open"></i>&nbsp; Browse media library' +
        '</button>' +
        '<input type="text" class="bld-input bld-img-url" data-path="' + path.join('.') + '" value="' + esc(url) + '" placeholder="Or paste a URL…">' +
        '</div>';
}

function fieldTextarea(field, value, path) {
    return '<label class="bld-field">' +
        '<span class="bld-field-label">' + esc(field.label) + '</span>' +
        '<textarea class="bld-input bld-textarea" rows="3" data-path="' + path.join('.') + '">' + esc(value) + '</textarea>' +
        '</label>';
}

function fieldNumber(field, value, path) {
    const min = field.min != null ? ' min="' + field.min + '"' : '';
    const max = field.max != null ? ' max="' + field.max + '"' : '';
    return '<label class="bld-field">' +
        '<span class="bld-field-label">' + esc(field.label) + '</span>' +
        '<input type="number" class="bld-input" data-path="' + path.join('.') + '" value="' + esc(value) + '"' + min + max + '>' +
        '</label>';
}

function fieldToggle(field, value, path) {
    const checked = value === true ? ' checked' : '';
    return '<label class="bld-field bld-field-toggle">' +
        '<input type="checkbox" class="bld-toggle" data-path="' + path.join('.') + '"' + checked + '>' +
        '<span class="bld-field-label">' + esc(field.label) + '</span>' +
        '</label>';
}

function fieldSelect(field, value, path) {
    const opts = (field.options || []).map((opt) => {
        const selected = opt === value ? ' selected' : '';
        return '<option value="' + esc(opt) + '"' + selected + '>' + esc(opt) + '</option>';
    }).join('');
    return '<label class="bld-field">' +
        '<span class="bld-field-label">' + esc(field.label) + '</span>' +
        '<select class="bld-input" data-path="' + path.join('.') + '">' + opts + '</select>' +
        '</label>';
}

function fieldCta(field, value, path) {
    const v = value || {};
    const inner = (field.fields || []).map((sub) => {
        const subPath = path.concat([sub.key]);
        return fieldText(sub, v[sub.key] || '', subPath);
    }).join('');
    return '<fieldset class="bld-fieldset">' +
        '<legend>' + esc(field.label) + '</legend>' +
        inner +
        '</fieldset>';
}

function fieldRepeater(field, value, path) {
    const items = Array.isArray(value) ? value : [];
    const itemsHtml = items.map((item, i) => {
        const itemPath = path.concat([i]);
        const inner = (field.itemSchema || []).map((sub) => {
            const subPath = itemPath.concat([sub.key]);
            const subVal = item ? item[sub.key] : '';
            return renderField(sub, subVal, subPath);
        }).join('');
        return '<div class="bld-repeater-item">' +
            '<div class="bld-repeater-head">' +
                '<span class="bld-repeater-title">' + esc(field.label) + ' #' + (i + 1) + '</span>' +
                '<div class="bld-repeater-actions">' +
                    '<button class="bld-icon-btn bld-repeater-up" type="button" data-path="' + itemPath.join('.') + '" title="Move up"><i class="fa-solid fa-arrow-up"></i></button>' +
                    '<button class="bld-icon-btn bld-repeater-down" type="button" data-path="' + itemPath.join('.') + '" title="Move down"><i class="fa-solid fa-arrow-down"></i></button>' +
                    '<button class="bld-icon-btn bld-repeater-del" type="button" data-path="' + itemPath.join('.') + '" title="Remove"><i class="fa-solid fa-trash"></i></button>' +
                '</div>' +
            '</div>' +
            inner +
            '</div>';
    }).join('');
    return '<div class="bld-repeater" data-repeater-path="' + path.join('.') + '">' +
        '<div class="bld-field-label bld-field-label-block">' + esc(field.label) + '</div>' +
        itemsHtml +
        '<button class="bld-add-item-btn" type="button" data-path="' + path.join('.') + '" data-default=\'' +
            esc(JSON.stringify(field.itemSchema ? field.itemSchema.reduce((acc, f) => {
                acc[f.key] = f.default != null ? f.default : '';
                return acc;
            }, {}) : {})) +
        '\'><i class="fa-solid fa-plus"></i> Add ' + esc(field.label) + '</button>' +
        '</div>';
}

/* Rich text: a real WYSIWYG surface. The markup here is just the mount point —
   bindRichText() below turns it into an editor once the DOM exists. */
function fieldRichText(field, value, path) {
    return '<div class="bld-field bld-field-rich">' +
        '<span class="bld-field-label">' + esc(field.label) + (field.required ? ' *' : '') + '</span>' +
        '<div class="bld-rich" data-rich-path="' + path.join('.') + '">' +
            '<div class="bld-rich-toolbar" role="toolbar" aria-label="Formatting">' +
                '<button type="button" data-cmd="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>' +
                '<button type="button" data-cmd="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>' +
                '<span class="bld-rich-sep"></span>' +
                '<button type="button" data-block="h2" title="Heading">H2</button>' +
                '<button type="button" data-block="h3" title="Sub-heading">H3</button>' +
                '<button type="button" data-block="p" title="Paragraph">¶</button>' +
                '<span class="bld-rich-sep"></span>' +
                '<button type="button" data-cmd="insertUnorderedList" title="Bulleted list"><i class="fa-solid fa-list-ul"></i></button>' +
                '<button type="button" data-cmd="insertOrderedList" title="Numbered list"><i class="fa-solid fa-list-ol"></i></button>' +
                '<button type="button" data-block="blockquote" title="Quote"><i class="fa-solid fa-quote-left"></i></button>' +
                '<span class="bld-rich-sep"></span>' +
                '<button type="button" data-act="link" title="Add link"><i class="fa-solid fa-link"></i></button>' +
                '<button type="button" data-act="image" title="Insert image"><i class="fa-solid fa-image"></i></button>' +
                '<button type="button" data-cmd="removeFormat" title="Clear formatting"><i class="fa-solid fa-eraser"></i></button>' +
            '</div>' +
            '<div class="bld-rich-area" contenteditable="true">' + (value == null ? '' : value) + '</div>' +
        '</div>' +
        '</div>';
}

function renderField(field, value, path) {
    switch (field.type) {
        case 'text':     return fieldText(field, value, path);
        case 'image':    return fieldImage(field, value, path);
        case 'richtext': return fieldRichText(field, value, path);
        case 'textarea': return fieldTextarea(field, value, path);
        case 'number':   return fieldNumber(field, value, path);
        case 'toggle':   return fieldToggle(field, value, path);
        case 'select':   return fieldSelect(field, value, path);
        case 'cta':      return fieldCta(field, value, path);
        case 'repeater': return fieldRepeater(field, value, path);
        default:         return '<div class="bld-field-unknown">Unsupported field: ' + esc(field.type) + '</div>';
    }
}

/* ── Shared Layout panel ─────────────────────────────────────
   Edits section.layout (width / align / background / padding /
   columns) — rendered above every component's own fields.
   See builder-layout.css for what each value does. */
const LAYOUT_CONTROLS = [
    { key: 'width',      label: 'Width',      options: [['contained', 'Contained'], ['narrow', 'Narrow'], ['full', 'Full width']] },
    { key: 'align',      label: 'Text Align', options: [['center', 'Center'], ['left', 'Left']] },
    { key: 'background', label: 'Background', options: [['none', 'None'], ['light', 'Light'], ['blue', 'Brand Blue'], ['ink', 'Dark Ink']] },
    { key: 'padding',    label: 'Spacing',    options: [['normal', 'Normal'], ['compact', 'Compact'], ['spacious', 'Spacious']] },
];

/* Components whose main grid can be re-columned via layout.columns.
   (iconCards is excluded — it has its own Columns field.) */
const GRID_TYPES = ['pillars', 'tagCards', 'securityCards', 'audienceGroups', 'relatedServices', 'numberedTips', 'statChips'];

function layoutPanelHtml(section) {
    const l = section.layout || {};
    const selects = LAYOUT_CONTROLS.map((c) => {
        const cur = l[c.key] || c.options[0][0];
        const opts = c.options.map(([val, lab]) =>
            '<option value="' + val + '"' + (val === cur ? ' selected' : '') + '>' + lab + '</option>').join('');
        return '<label class="bld-field bld-layout-field">' +
            '<span class="bld-field-label">' + c.label + '</span>' +
            '<select class="bld-input bld-layout-input" data-layout-key="' + c.key + '">' + opts + '</select>' +
            '</label>';
    }).join('');
    const colsCur = l.columns || '';
    const cols = GRID_TYPES.includes(section.type)
        ? '<label class="bld-field bld-layout-field">' +
          '<span class="bld-field-label">Grid Columns</span>' +
          '<select class="bld-input bld-layout-input" data-layout-key="columns">' +
          '<option value=""' + (colsCur === '' ? ' selected' : '') + '>Auto</option>' +
          [1, 2, 3, 4].map((n) => '<option value="' + n + '"' + (String(colsCur) === String(n) ? ' selected' : '') + '>' + n + '</option>').join('') +
          '</select></label>'
        : '';
    return '<fieldset class="bld-fieldset bld-layout-panel">' +
        '<legend><i class="fa-solid fa-table-columns" aria-hidden="true"></i> Layout</legend>' +
        '<div class="bld-layout-grid">' + selects + cols + '</div>' +
        '</fieldset>';
}

function bindLayoutHandlers(rootEl) {
    rootEl.querySelectorAll('.bld-layout-input').forEach((sel) => {
        sel.addEventListener('change', () => {
            if (!activeSection) return;
            const key = sel.dataset.layoutKey;
            const layout = Object.assign({}, activeSection.layout || {});
            if (key === 'columns') {
                if (sel.value === '') delete layout.columns;
                else layout.columns = Number(sel.value);
            } else {
                layout[key] = sel.value;
            }
            activeSection.layout = layout;
            if (onChangeCallback) onChangeCallback(activeSection);
        });
    });
}

/* ── Paste sanitiser (Google Docs / Word) ─────────────────────
   Goal: keep the STRUCTURE an author wrote (headings, bold, italic, lists,
   links, quotes, tables) and throw away everything presentational, so pasted
   articles inherit the site's own typography instead of Docs' or Word's.

   Everything not on this list is UNWRAPPED rather than deleted — a stray
   <span>/<div>/<font> disappears but the text inside it survives. Deleting
   outright would silently eat pasted content. */
const PASTE_ALLOWED_TAGS = {
    P: 1, BR: 1, H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1,
    STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, STRIKE: 1, DEL: 1,
    UL: 1, OL: 1, LI: 1, A: 1, BLOCKQUOTE: 1, CODE: 1, PRE: 1,
    IMG: 1, HR: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, SUP: 1, SUB: 1,
};

// Only these attributes survive; everything else (style/class/id/dir/lang, and
// crucially every on* handler) is dropped.
const PASTE_ALLOWED_ATTRS = { A: ['href', 'title'], IMG: ['src', 'alt'] };

/* Docs and Word express bold/italic as inline STYLE on a <span>, not as
   <strong>/<em>. Unwrapping the span would therefore lose the emphasis, so
   read it off the style first and re-express it semantically. */
function semanticTagsFromStyle(el) {
    const s = el.style;
    if (!s) return [];
    const tags = [];
    const fw = String(s.fontWeight || '').toLowerCase();
    if (fw === 'bold' || fw === 'bolder' || (parseInt(fw, 10) >= 600)) tags.push('strong');
    if (String(s.fontStyle || '').toLowerCase() === 'italic') tags.push('em');
    const td = String(s.textDecoration || s.textDecorationLine || '').toLowerCase();
    if (td.indexOf('underline') !== -1) tags.push('u');
    if (td.indexOf('line-through') !== -1) tags.push('s');
    return tags;
}

function unwrapInto(el, wrapTags) {
    const parent = el.parentNode;
    if (!parent) return;
    let host = el;
    // Rebuild the emphasis the style was carrying, innermost last
    wrapTags.forEach((t) => {
        const w = document.createElement(t);
        parent.insertBefore(w, host);
        w.appendChild(host);
        host = w;
    });
    // Move children out relative to el's CURRENT parent — after the wrapping
    // above, el is nested inside the new wrapper and is no longer a child of
    // `parent`, so anchoring on `parent` here throws NotFoundError.
    while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
    el.remove();
}

function sanitizePastedHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const root = tpl.content;

    // Drop these outright — content inside them is never body copy.
    root.querySelectorAll('script,style,meta,link,title,head,noscript,iframe,object,embed').forEach((n) => n.remove());

    // Strip comments (Word emits huge conditional-comment blocks).
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());

    // Deepest-first so unwrapping a parent can't skip children still to visit.
    const els = Array.from(root.querySelectorAll('*')).reverse();
    els.forEach((el) => {
        const tag = el.tagName;

        if (!PASTE_ALLOWED_TAGS[tag]) {
            unwrapInto(el, semanticTagsFromStyle(el));
            return;
        }

        /* Google Docs wraps the WHOLE selection in
           <b style="font-weight:normal" id="docs-internal-guid-…">.
           Left alone that makes an entire pasted article bold. */
        if ((tag === 'B' || tag === 'STRONG')) {
            const fw = String(el.style && el.style.fontWeight || '').toLowerCase();
            if (fw === 'normal' || (parseInt(fw, 10) && parseInt(fw, 10) < 600)) {
                unwrapInto(el, []);
                return;
            }
        }

        // Keep the tag, bin every attribute except the few that carry meaning.
        const keep = PASTE_ALLOWED_ATTRS[tag] || [];
        Array.from(el.attributes).forEach((attr) => {
            if (keep.indexOf(attr.name.toLowerCase()) === -1) el.removeAttribute(attr.name);
        });

        // Neutralise javascript:/data: URLs — this HTML ends up on public pages.
        if (tag === 'A' && el.getAttribute('href')) {
            const href = el.getAttribute('href').trim();
            if (/^(javascript|data|vbscript):/i.test(href)) el.removeAttribute('href');
        }
        if (tag === 'IMG' && el.getAttribute('src')) {
            const src = el.getAttribute('src').trim();
            // Docs pastes images as base64 data: URLs — they'd bloat the saved
            // JSON enormously, so drop them and let the author use the image button.
            if (!/^https?:\/\//i.test(src)) el.remove();
        }
    });

    // Collapse empties left behind by stripped wrappers (but keep void tags).
    Array.from(root.querySelectorAll('p,span,div,strong,b,em,i,u,s')).forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector('img,br,hr')) el.remove();
    });

    /* Docs marks heading text as font-weight:700, which the style conversion
       above turns into <h2><strong>…</strong></h2>. Headings are already bold,
       so drop the redundant emphasis rather than saving it into the article. */
    root.querySelectorAll('h1 strong, h1 b, h2 strong, h2 b, h3 strong, h3 b, h4 strong, h4 b, h5 strong, h5 b, h6 strong, h6 b')
        .forEach((el) => unwrapInto(el, []));

    return tpl.innerHTML.replace(/\s+/g, ' ').trim();
}

/* ── Rich-text (WYSIWYG) binding ──────────────────────────────
   contenteditable + execCommand: no external dependency, works offline, and
   emits plain semantic HTML (<p>/<h2>/<ul>/<a>/<blockquote>) that the site's
   own stylesheets already render — no editor-specific classes leak into the
   published page. execCommand is deprecated but universally implemented; the
   block/link/image actions below are done with DOM APIs rather than relying on
   its patchier commands. */
function bindRichText(wrap) {
    const area = wrap.querySelector('.bld-rich-area');
    const toolbar = wrap.querySelector('.bld-rich-toolbar');
    if (!area || !toolbar) return;
    const path = wrap.dataset.richPath.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);

    function commit() {
        const html = area.innerHTML.trim();
        emitChange(setByPath(activeSection.props || {}, path, html));
    }

    // Typing → live update (the canvas re-render is already debounced upstream)
    area.addEventListener('input', commit);
    area.addEventListener('blur', commit);

    // Paste from Google Docs / Word keeps its STRUCTURE (headings, bold, lists,
    // links, tables) but is stripped of all presentation. Pasting the raw HTML
    // would drag in inline font/colour styles, Word's mso-* junk and an XSS
    // surface — see sanitizePastedHtml.
    area.addEventListener('paste', (e) => {
        const cb = e.clipboardData || window.clipboardData;
        if (!cb) return;
        const html = cb.getData('text/html');
        e.preventDefault();
        if (html) {
            const clean = sanitizePastedHtml(html);
            // insertHTML keeps the caret/undo stack behaving like a normal paste
            document.execCommand('insertHTML', false, clean);
        } else {
            document.execCommand('insertText', false, cb.getData('text/plain'));
        }
    });

    function wrapBlock(tag) {
        // formatBlock needs the angle-bracket form in some engines
        document.execCommand('formatBlock', false, '<' + tag + '>');
    }

    toolbar.addEventListener('click', async (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        e.preventDefault();
        area.focus();

        if (btn.dataset.cmd) {
            document.execCommand(btn.dataset.cmd, false, null);
        } else if (btn.dataset.block) {
            wrapBlock(btn.dataset.block);
        } else if (btn.dataset.act === 'link') {
            const url = window.prompt('Link URL (a path like /pricing, or a full URL):', 'https://');
            if (url) document.execCommand('createLink', false, url);
        } else if (btn.dataset.act === 'image') {
            const url = await pickMedia({});
            if (url) document.execCommand('insertImage', false, url);
        }
        commit();
    });
}

/* ── Public API ──────────────────────────────────────────── */

export function renderPropertyEditor(rootEl, section, onChange) {
    activeRoot = rootEl;
    activeSection = section;
    onChangeCallback = onChange;

    if (!section) {
        rootEl.innerHTML = '<div class="bld-empty">Select a section to edit its properties.</div>';
        return;
    }

    const entry = COMPONENT_REGISTRY[section.type];
    if (!entry) {
        rootEl.innerHTML = '<div class="bld-empty">Unknown component type: ' + esc(section.type) + '</div>';
        return;
    }

    const props = section.props || {};
    const fieldsHtml = (entry.schema || []).map((f) => renderField(f, props[f.key], [f.key])).join('');

    rootEl.innerHTML =
        '<div class="bld-prop-header">' +
            '<h3>' + esc(entry.label) + '</h3>' +
            '<p>' + esc(entry.description || '') + '</p>' +
        '</div>' +
        layoutPanelHtml(section) +
        '<form class="bld-prop-form" onsubmit="return false">' + fieldsHtml + '</form>';

    bindLayoutHandlers(rootEl);
    bindHandlers(rootEl, entry);
}

function bindHandlers(rootEl, entry) {
    // Text / textarea / number / select inputs
    rootEl.querySelectorAll('.bld-input').forEach((inp) => {
        inp.addEventListener('input', () => {
            const path = inp.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
            let val = inp.value;
            if (inp.type === 'number') val = val === '' ? '' : Number(val);
            const newProps = setByPath(activeSection.props || {}, path, val);
            emitChange(newProps);
        });
    });

    // Toggles
    rootEl.querySelectorAll('.bld-toggle').forEach((inp) => {
        inp.addEventListener('change', () => {
            const path = inp.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
            const newProps = setByPath(activeSection.props || {}, path, inp.checked);
            emitChange(newProps);
        });
    });

    // Repeater "Add item"
    rootEl.querySelectorAll('.bld-add-item-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const path = btn.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
            let defaults;
            try { defaults = JSON.parse(btn.dataset.default || '{}'); } catch { defaults = {}; }
            const cur = getByPath(activeSection.props || {}, path) || [];
            const newArr = cur.slice();
            newArr.push(defaults);
            const newProps = setByPath(activeSection.props || {}, path, newArr);
            emitChange(newProps);
            // Re-render with the new item visible
            renderPropertyEditor(activeRoot, activeSection, onChangeCallback);
        });
    });

    // Repeater item delete
    rootEl.querySelectorAll('.bld-repeater-del').forEach((btn) => {
        btn.addEventListener('click', () => {
            const path = btn.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
            const newProps = deleteByPath(activeSection.props || {}, path);
            emitChange(newProps);
            renderPropertyEditor(activeRoot, activeSection, onChangeCallback);
        });
    });

    // Repeater move up / down
    function move(btn, dir) {
        const path = btn.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
        const idx = path[path.length - 1];
        const parentPath = path.slice(0, -1);
        const arr = (getByPath(activeSection.props || {}, parentPath) || []).slice();
        const target = idx + dir;
        if (target < 0 || target >= arr.length) return;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        const newProps = setByPath(activeSection.props || {}, parentPath, arr);
        emitChange(newProps);
        renderPropertyEditor(activeRoot, activeSection, onChangeCallback);
    }
    rootEl.querySelectorAll('.bld-repeater-up').forEach((btn) => btn.addEventListener('click', () => move(btn, -1)));
    rootEl.querySelectorAll('.bld-repeater-down').forEach((btn) => btn.addEventListener('click', () => move(btn, +1)));

    // Rich text (WYSIWYG) editors
    rootEl.querySelectorAll('.bld-rich').forEach((wrap) => bindRichText(wrap));

    // Image Browse → open media picker
    rootEl.querySelectorAll('.bld-img-browse').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const path = btn.dataset.path.split('.').map((p) => /^\d+$/.test(p) ? Number(p) : p);
            const current = getByPath(activeSection.props || {}, path) || '';
            const chosen = await pickMedia({ initialUrl: current });
            if (!chosen) return;
            const newProps = setByPath(activeSection.props || {}, path, chosen);
            emitChange(newProps);
            // Re-render so preview thumb + text input both reflect the new URL
            renderPropertyEditor(activeRoot, activeSection, onChangeCallback);
        });
    });
}
