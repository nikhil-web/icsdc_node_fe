/**
 * component-library.js
 * ────────────────────
 * Renders the LEFT PANEL of the builder editor.
 * Components are grouped into collapsible categories (COMPONENT_CATEGORIES).
 * Each component card calls `onAdd(type)` from the editor controller, and is
 * draggable so it can be dropped straight onto the WYSIWYG canvas.
 */

import { COMPONENT_REGISTRY, COMPONENT_ORDER, COMPONENT_CATEGORIES } from '/assets/js/builder/componentRegistry.js';

const ICON_MAP = {
    rocket:   'fa-rocket',
    grid:     'fa-table-cells',
    arrow:    'fa-arrow-up-right-from-square',
    question: 'fa-circle-question',
    tag:      'fa-tag',
    star:     'fa-star',
    image:    'fa-image',
    chart:    'fa-chart-simple',
    compare:  'fa-scale-balanced',
    steps:    'fa-list-ol',
    partners: 'fa-handshake',
    gallery:  'fa-images',
    info:     'fa-address-card',
    envelope: 'fa-envelope',
    map:      'fa-map-location-dot',
};

function itemHtml(type) {
    const entry = COMPONENT_REGISTRY[type];
    if (!entry) return '';
    const iconCls = ICON_MAP[entry.icon] || 'fa-cube';
    return '<button class="bld-lib-item" data-type="' + type + '" type="button" draggable="true" title="' + (entry.description || '') + '">' +
        '<span class="bld-lib-icon"><i class="fa-solid ' + iconCls + '" aria-hidden="true"></i></span>' +
        '<span class="bld-lib-label">' + entry.label + '</span>' +
        '<span class="bld-lib-plus"><i class="fa-solid fa-plus" aria-hidden="true"></i></span>' +
        '</button>';
}

export function renderComponentLibrary(containerEl, onAdd) {
    if (!containerEl) return;

    // Categorised view when COMPONENT_CATEGORIES is available; flat fallback otherwise.
    const cats = Array.isArray(COMPONENT_CATEGORIES) && COMPONENT_CATEGORIES.length
        ? COMPONENT_CATEGORIES
        : [{ label: 'Components', types: COMPONENT_ORDER }];

    // Anything not claimed by a category still shows up at the end.
    const claimed = new Set(cats.flatMap((c) => c.types));
    const orphans = COMPONENT_ORDER.filter((t) => COMPONENT_REGISTRY[t] && !claimed.has(t));
    const groups = orphans.length ? cats.concat([{ label: 'Other', types: orphans }]) : cats;

    containerEl.innerHTML = groups.map((cat, gi) => {
        const items = cat.types.filter((t) => COMPONENT_REGISTRY[t]).map(itemHtml).join('');
        if (!items) return '';
        return '<div class="bld-lib-group' + (gi === 0 ? ' is-open' : ' is-open') + '">' +
            '<button class="bld-lib-group-head" type="button" data-group="' + gi + '">' +
            '<span>' + cat.label + '</span>' +
            '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="bld-lib-group-body">' + items + '</div>' +
            '</div>';
    }).join('');

    // Collapse/expand categories
    containerEl.querySelectorAll('.bld-lib-group-head').forEach((head) => {
        head.addEventListener('click', () => head.parentElement.classList.toggle('is-open'));
    });

    // Click to append
    containerEl.querySelectorAll('.bld-lib-item').forEach((btn) => {
        btn.addEventListener('click', () => onAdd(btn.dataset.type));
        // Drag source for canvas drop-insert (Phase C reads this dataTransfer key)
        btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/x-bld-component', btn.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
        });
    });
}
