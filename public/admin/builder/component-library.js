/**
 * component-library.js
 * ────────────────────
 * Renders the LEFT PANEL of the builder editor.
 * Each component card calls `onAdd(type)` from the editor controller.
 */

import { COMPONENT_REGISTRY, COMPONENT_ORDER } from '/assets/js/builder/componentRegistry.js';

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

export function renderComponentLibrary(containerEl, onAdd) {
    if (!containerEl) return;
    const items = COMPONENT_ORDER.filter((t) => COMPONENT_REGISTRY[t]);
    containerEl.innerHTML = items.map((type) => {
        const entry = COMPONENT_REGISTRY[type];
        const iconCls = ICON_MAP[entry.icon] || 'fa-cube';
        return '<button class="bld-lib-item" data-type="' + type + '" type="button" title="' + (entry.description || '') + '">' +
            '<span class="bld-lib-icon"><i class="fa-solid ' + iconCls + '" aria-hidden="true"></i></span>' +
            '<span class="bld-lib-label">' + entry.label + '</span>' +
            '<span class="bld-lib-plus"><i class="fa-solid fa-plus" aria-hidden="true"></i></span>' +
            '</button>';
    }).join('');

    containerEl.querySelectorAll('.bld-lib-item').forEach((btn) => {
        btn.addEventListener('click', () => onAdd(btn.dataset.type));
    });
}
