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

function renderField(field, value, path) {
    switch (field.type) {
        case 'text':     return fieldText(field, value, path);
        case 'image':    return fieldImage(field, value, path);
        case 'textarea': return fieldTextarea(field, value, path);
        case 'number':   return fieldNumber(field, value, path);
        case 'toggle':   return fieldToggle(field, value, path);
        case 'select':   return fieldSelect(field, value, path);
        case 'cta':      return fieldCta(field, value, path);
        case 'repeater': return fieldRepeater(field, value, path);
        default:         return '<div class="bld-field-unknown">Unsupported field: ' + esc(field.type) + '</div>';
    }
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
        '<form class="bld-prop-form" onsubmit="return false">' + fieldsHtml + '</form>';

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
