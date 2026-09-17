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
import { BuilderAPI } from './builder-api.js';

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
// data-bld-paste marks an image still being copied into the media library
// (see "Pasted images" below); it is removed once the upload lands.
const PASTE_ALLOWED_ATTRS = { A: ['href', 'title'], IMG: ['src', 'alt', 'data-bld-paste'] };

/* ── Pasted images ─────────────────────────────────────────────
   An article pasted from Word or Google Docs carries its images, but never
   in a form that can simply be saved:
     - Word puts each image in the HTML as a data: URI — a DOWNSCALED, JPEG
       re-encoded copy (measured: a 320x200 PNG arrives as a 288x180 JPEG) —
       and the untouched original in the RTF flavour as a \pngblip/\jpegblip
       (measured: byte-identical to the source file). Older Word builds put a
       file:/// path in the HTML instead, which a page can't read at all, so
       the RTF is the only source there.
     - Google Docs and web pages reference images by URL. Google Docs' image
       links are temporary, so hotlinking them breaks the published article
       later, and the browser can't download them itself (no CORS headers).
   Embedding the bytes isn't an option either: page saves are capped at 2MB of
   JSON. So every pasted image is uploaded to the media library and the article
   references that copy — the same place the toolbar's image button uses.

   The text lands immediately; each image is a marker (data-bld-paste + a
   transparent placeholder) until its upload finishes. Markers are saved into
   the section's HTML so an upload can still land if the author moves to
   another section meanwhile, and Save/Publish refuse to run while any are
   pending, so a marker never reaches a published page. */
const PASTE_MARK = 'data-bld-paste';
const PASTE_PLACEHOLDER_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const PASTE_UPLOAD_CONCURRENCY = 3;
let pasteSeq = 0;
const pendingPasteImages = new Set();

/** How many pasted images are still uploading — Save/Publish wait for zero. */
export function pendingPasteImageCount() {
    return pendingPasteImages.size;
}

function nextPasteToken() {
    pasteSeq += 1;
    return 'p' + Date.now().toString(36) + '-' + pasteSeq;
}

// Identify real image bytes by signature; the declared type can't be trusted
// (Word labels its re-encoded JPEGs image/png).
function sniffImageBytes(b) {
    if (!b || b.length < 12) return null;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { mime: 'image/png', ext: 'png' };
    if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { mime: 'image/gif', ext: 'gif' };
    if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
        b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { mime: 'image/webp', ext: 'webp' };
    return null;
}

function dataUriToBytes(src) {
    const m = /^data:[^;,]*;base64,(.*)$/is.exec(src || '');
    if (!m) return null;
    try {
        const bin = atob(m[1].replace(/\s+/g, ''));
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    } catch { return null; }
}

function isHexOrSpace(c) {
    return (c >= 48 && c <= 57) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102) || c === 32 || c === 9 || c === 10 || c === 13;
}

function hexRunToBytes(s, from, to) {
    const out = new Uint8Array(Math.floor((to - from) / 2));
    let n = 0, hi = -1;
    for (let i = from; i < to; i++) {
        const c = s.charCodeAt(i);
        let v;
        if (c >= 48 && c <= 57) v = c - 48;
        else if (c >= 97 && c <= 102) v = c - 87;
        else if (c >= 65 && c <= 70) v = c - 55;
        else continue;                          // line breaks inside the hex
        if (hi < 0) hi = v; else { out[n++] = (hi << 4) | v; hi = -1; }
    }
    return out.subarray(0, n);
}

/* The pictures in Word's RTF, in document order, one per <img> in its HTML.
   Word writes every picture twice: \shppict holds the real PNG/JPEG, and
   \nonshppict a WMF copy for old readers — skipped, or the count would double
   and nothing would line up. A picture with no PNG/JPEG form (EMF charts,
   SmartArt) keeps its slot with bytes:null so the order still holds. Scanned
   with indexOf/charCode rather than regexes: this string runs to megabytes
   for an image-heavy document. */
function rtfPictures(rtf) {
    if (!rtf || rtf.indexOf('\\pict') === -1) return [];
    function groupEnd(s, i) {
        let depth = 0;
        for (let j = i; j < s.length; j++) {
            const c = s.charCodeAt(j);
            if (c === 92) { j++; continue; }    // \{ \} \\ are escapes, not braces
            if (c === 123) depth++;
            else if (c === 125 && --depth === 0) return j;
        }
        return -1;
    }
    const skip = [];
    for (let at = rtf.indexOf('\\nonshppict'); at !== -1; at = rtf.indexOf('\\nonshppict', at + 1)) {
        const open = rtf.lastIndexOf('{', at);
        const end = groupEnd(rtf, open);
        if (end < 0) break;
        skip.push([open, end]);
        at = end;
    }
    const pictures = [];
    for (let at = rtf.indexOf('{\\pict'); at !== -1; at = rtf.indexOf('{\\pict', at + 1)) {
        const end = groupEnd(rtf, at);
        if (end < 0) break;
        if (!skip.some((r) => at > r[0] && at < r[1])) {
            const group = rtf.slice(at, end);
            const png = group.indexOf('\\pngblip') !== -1;
            const jpeg = !png && group.indexOf('\\jpegblip') !== -1;
            let bytes = null;
            if (png || jpeg) {
                // The picture data is the hex run that closes the group.
                let k = end - 1;
                while (k > at && isHexOrSpace(rtf.charCodeAt(k))) k--;
                let start = k + 1;
                // Unless the data follows a closing brace, the backwards scan
                // has swallowed the tail of the control word before it — a
                // numeric parameter (\bliptag12345) or letters that happen to
                // be hex (\picscaled). RTF always ends a control word with a
                // delimiting space, so skip to that space.
                if (rtf[k] !== '}') while (start < end && rtf.charCodeAt(start) !== 32 && rtf.charCodeAt(start) !== 10 && rtf.charCodeAt(start) !== 13) start++;
                bytes = hexRunToBytes(rtf, start, end);
                if (!sniffImageBytes(bytes)) bytes = null;   // not what it claims → fall back to the HTML copy
            }
            pictures.push({ bytes });
        }
        at = end;
    }
    return pictures;
}

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

/* Returns { html, images }: the cleaned HTML, where every image has become a
   pending marker, and one { token, src, alt } per marker in document order —
   the order Word's RTF pictures pair up with. */
function sanitizePastedHtml(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const root = tpl.content;

    // Drop these outright — content inside them is never body copy.
    root.querySelectorAll('script,style,meta,link,title,head,noscript,iframe,object,embed').forEach((n) => n.remove());

    // Strip comments (Word emits huge conditional-comment blocks — including
    // the VML <v:imagedata> duplicate of each picture, so each image is counted
    // once, as its <img>).
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null);
    const comments = [];
    while (walker.nextNode()) comments.push(walker.currentNode);
    comments.forEach((c) => c.remove());

    // Turn every image into a pending marker before the attribute strip below,
    // which keeps only src/alt/data-bld-paste.
    const images = [];
    Array.from(root.querySelectorAll('img')).forEach((img) => {
        // A copy of an image that is itself still uploading (copied back out
        // of this editor) — the original will resolve; don't upload a 1px GIF.
        if (img.hasAttribute(PASTE_MARK) || img.getAttribute('src') === PASTE_PLACEHOLDER_SRC) {
            img.remove();
            return;
        }
        const token = nextPasteToken();
        images.push({ token, src: (img.getAttribute('src') || '').trim(), alt: img.getAttribute('alt') || '' });
        img.setAttribute('src', PASTE_PLACEHOLDER_SRC);
        img.setAttribute(PASTE_MARK, token);
    });

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
        // Images need no URL check here: every one is already a marker whose
        // src is the placeholder, and the real source is only ever uploaded,
        // never written into the article (see "Pasted images").
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

    // An image dropped by the cleanup above (e.g. inside a stripped <object>)
    // has no marker left to fill.
    const kept = images.filter((i) => root.querySelector('img[' + PASTE_MARK + '="' + i.token + '"]'));
    return { html: tpl.innerHTML.replace(/\s+/g, ' ').trim(), images: kept };
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

    /* Bound to the section this editor was built for, not the module-global
       activeSection. Identical while the panel is open; the difference is an
       image upload that finishes after the author has selected another
       section — writing through activeSection then would put this article's
       HTML into THAT section's props. */
    const section = activeSection;
    const notify = onChangeCallback;

    function commit() {
        if (!section) return;
        section.props = setByPath(section.props || {}, path, area.innerHTML.trim());
        if (notify) notify(section);
    }

    // Typing → live update (the canvas re-render is already debounced upstream)
    area.addEventListener('input', commit);
    area.addEventListener('blur', commit);

    // Upload progress for this editor's pasted images, shown in its toolbar.
    const mine = new Set();
    let failed = 0;        // no usable source at all → removed
    let stillLinked = 0;   // import failed → kept its original (possibly temporary) URL
    let statusTimer = null;
    function showPasteStatus() {
        let el = toolbar.querySelector('.bld-rich-status');
        if (!el) {
            el = document.createElement('span');
            el.className = 'bld-rich-status';
            el.setAttribute('role', 'status');
            toolbar.appendChild(el);
        }
        clearTimeout(statusTimer);
        if (mine.size) {
            el.textContent = 'Uploading ' + mine.size + ' image' + (mine.size === 1 ? '' : 's') + '…';
            el.classList.remove('is-warn');
        } else if (failed || stillLinked) {
            const parts = [];
            if (failed) parts.push(failed + ' image' + (failed === 1 ? '' : 's') + " couldn't be pasted");
            // Worth saying: a Google Docs image link expires, so this one will
            // eventually break on the published page unless it is re-added.
            if (stillLinked) parts.push(stillLinked + ' image' + (stillLinked === 1 ? '' : 's') + ' still linked to the original site');
            el.textContent = parts.join(' · ');
            el.classList.add('is-warn');
            statusTimer = setTimeout(() => { el.remove(); failed = 0; stillLinked = 0; }, 10000);
        } else {
            el.remove();
        }
    }

    /* Swap a marker for its uploaded image (src) — or, with no src, remove it.
       Looked up in the live document rather than through `area`: if the author
       left and came back, this section's panel was rebuilt and the marker now
       lives in a new editor, which commits through its own input handler. Only
       if no editor holds it any more is the section's saved HTML patched
       directly, so the image still lands. */
    function finalizePastedImage(token, src, alt) {
        const sel = 'img[' + PASTE_MARK + '="' + token + '"]';
        const live = Array.from(document.querySelectorAll('.bld-rich-area ' + sel));
        if (live.length) {
            // Resolve each image's editor BEFORE removing anything: a removed
            // node has no ancestors, so closest() would return null and the
            // removal would never be committed.
            const editors = new Set(live.map((img) => img.closest('.bld-rich-area')));
            live.forEach((img) => {
                if (src) {
                    img.setAttribute('src', src);
                    img.removeAttribute(PASTE_MARK);
                } else {
                    // Don't leave an empty paragraph where the image stood.
                    const parent = img.parentElement;
                    img.remove();
                    if (parent && parent.tagName === 'P' && !parent.textContent.trim() && !parent.children.length) parent.remove();
                }
            });
            editors.forEach((a) => a && a.dispatchEvent(new Event('input', { bubbles: true })));
            return;
        }
        if (!section) return;
        const current = getByPath(section.props || {}, path);
        if (typeof current !== 'string' || current.indexOf(token) === -1) return;
        const tag = src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '">' : '';
        section.props = setByPath(section.props || {}, path,
            current.replace(new RegExp('<img\\b[^>]*' + PASTE_MARK + '="' + token + '"[^>]*>', 'gi'), tag));
        if (notify) notify(section);
    }

    /* Each image, best source first: a file pasted on its own, then Word's
       original from the RTF, then the data: copy in the HTML, then — for an
       image referenced by URL — a server-side import. A URL that can't be
       imported keeps its original address (what pasting did before), so a
       failure is never worse than the old behaviour; an image with no usable
       source at all is removed and counted in the toolbar notice. */
    async function uploadPastedImages(images, rtf) {
        const fromWord = images.filter((i) => !i.file && !/^https?:\/\//i.test(i.src));
        const pictures = rtfPictures(rtf);
        // Pair by order only when the counts agree; otherwise the order can't
        // be trusted and each image falls back to its HTML copy.
        if (pictures.length && pictures.length === fromWord.length) {
            fromWord.forEach((img, i) => { img.original = pictures[i].bytes; });
        }

        images.forEach((i) => { mine.add(i.token); pendingPasteImages.add(i.token); });
        showPasteStatus();

        let next = 0;
        async function worker() {
            while (next < images.length) {
                const img = images[next++];
                let src = null;
                try {
                    let file = img.file || null;
                    if (!file) {
                        const bytes = img.original || dataUriToBytes(img.src);
                        const type = sniffImageBytes(bytes);
                        if (type) file = new File([bytes], 'pasted-image.' + type.ext, { type: type.mime });
                    }
                    let res = null;
                    if (file) {
                        res = await BuilderAPI.uploadMedia(file);
                    } else if (/^https?:\/\//i.test(img.src)) {
                        res = await BuilderAPI.importMediaUrl(img.src);
                        if (res && res.skipped) src = res.url;
                    }
                    if (res && !src) {
                        let f = Array.isArray(res) ? res[0] : res;
                        if (f && f.attributes) f = f.attributes;
                        // Strapi's 1000px "large" rendition when it made one — an
                        // article column never needs a 4000px original.
                        src = (f && f.formats && f.formats.large && f.formats.large.url) || (f && f.url) || null;
                    }
                } catch (err) {
                    console.warn('[builder] pasted image upload failed:', err && err.message);
                }
                if (!src && /^https?:\/\//i.test(img.src)) { src = img.src; stillLinked++; }
                if (!src) failed++;
                finalizePastedImage(img.token, src, img.alt);
                mine.delete(img.token);
                pendingPasteImages.delete(img.token);
                showPasteStatus();
            }
        }
        await Promise.all(Array.from({ length: Math.min(PASTE_UPLOAD_CONCURRENCY, images.length) }, worker));
    }

    // Paste from Google Docs / Word keeps its STRUCTURE (headings, bold, lists,
    // links, tables) but is stripped of all presentation. Pasting the raw HTML
    // would drag in inline font/colour styles, Word's mso-* junk and an XSS
    // surface — see sanitizePastedHtml. Images are copied into the media
    // library — see "Pasted images".
    area.addEventListener('paste', (e) => {
        const cb = e.clipboardData || window.clipboardData;
        if (!cb) return;
        const html = cb.getData('text/html');
        const files = Array.from(cb.files || []).filter((f) => /^image\//.test(f.type));
        e.preventDefault();
        if (html) {
            const { html: clean, images } = sanitizePastedHtml(html);
            // insertHTML keeps the caret/undo stack behaving like a normal paste
            document.execCommand('insertHTML', false, clean);
            commit();
            if (images.length) uploadPastedImages(images, cb.getData('text/rtf'));
        } else if (files.length) {
            // An image on its own (a screenshot, "Copy image"): no HTML to keep.
            const images = files.map((file) => ({ token: nextPasteToken(), src: '', alt: '', file }));
            document.execCommand('insertHTML', false, images.map((i) =>
                '<img src="' + PASTE_PLACEHOLDER_SRC + '" ' + PASTE_MARK + '="' + i.token + '" alt="">').join(''));
            commit();
            uploadPastedImages(images, '');
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
