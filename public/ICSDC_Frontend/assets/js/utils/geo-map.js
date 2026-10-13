// ══════════════════════════════════════════════════════════
//  geo-map.js
//  Places map pins on assets/images/world-map.svg from latitude/longitude.
//
//  world-map.svg is GENERATED (Natural Earth 1 projection, Natural Earth
//  country outlines, Antarctica left out). GEO_MAP holds the exact constants
//  it was generated with — they are also stamped on the <svg> element as
//  data-scale / data-tx / data-ty. Regenerate both together or pins drift.
//
//  Locations come from Strapi's "Place" field: editors search for a city or
//  country and pick it; the stored place carries its lat/lng
//  (my-admin/src/utils/geo-places.ts). Editors never see coordinates.
// ══════════════════════════════════════════════════════════

export const GEO_MAP = {
    width: 2000,
    height: 887,
    scale: 370.0260104462849,
    tx: 1000,
    ty: 518.1690446723669,
};

/**
 * Natural Earth 1 forward projection (Šavrič, Jenny, Patterson & Jenny 2015),
 * the same formula d3-geo's geoNaturalEarth1 uses — verified to 0 px against it.
 * @returns {{x:number, y:number}} position as % of the map's width/height
 */
export function projectLatLng(lat, lng) {
    const lambda = (lng * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const phi2 = phi * phi;
    const phi4 = phi2 * phi2;
    const x = lambda * (0.8707 - 0.131979 * phi2 + phi4 * (-0.013791 + phi4 * (0.003971 * phi2 - 0.001529 * phi4)));
    const y = phi * (1.007226 + phi2 * (0.015085 + phi4 * (-0.044475 + 0.028874 * phi2 - 0.005916 * phi4)));
    return {
        x: ((GEO_MAP.tx + GEO_MAP.scale * x) / GEO_MAP.width) * 100,
        y: ((GEO_MAP.ty - GEO_MAP.scale * y) / GEO_MAP.height) * 100,
    };
}

function num(v) {
    const n = typeof v === 'string' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

/** Where a CMS location goes on the map (its picked Place), as % of width/height, or null. */
export function pinPosition(loc) {
    const place = loc && loc.place && typeof loc.place === 'object' ? loc.place : null;
    const lat = place ? num(place.lat) : null;
    const lng = place ? num(place.lng) : null;
    return lat !== null && lng !== null ? projectLatLng(lat, lng) : null;
}

/** "Mumbai, Maharashtra, India" — the picked Place's label, or '' if none. */
export function placeName(loc) {
    const place = loc && loc.place;
    return place && typeof place.label === 'string' ? place.label.trim() : '';
}

export function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/**
 * One map pin: a dot exactly on the place, the location's NAME on a label
 * beside it, and a card with the full details (the same as its legend card:
 * title, full place name, description) that opens on hover / keyboard focus.
 * A <button>, so keyboard users can reach it. `id` links it to its legend
 * item ([data-pin=id]). `descHtml` is already-rendered CMS rich text.
 */
export function buildMapPin(pos, id, color, name, title, place, descHtml) {
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'hp-pin' +
        (pos.x > 70 ? ' hp-pin--card-left' : pos.x < 30 ? ' hp-pin--card-right' : '') +
        (pos.y < 40 ? ' hp-pin--card-below' : '');
    pin.dataset.pin = id;
    pin.style.cssText = 'left:' + pos.x.toFixed(3) + '%;top:' + pos.y.toFixed(3) + '%;--pin-c:' + color;
    pin.setAttribute('aria-label', [name, title && title !== name ? title : '', place && place !== name ? place : '']
        .filter(Boolean).join(' — '));
    const card = (title || place || descHtml)
        ? '<span class="hp-pin-card" aria-hidden="true">' +
            (title ? '<strong class="hp-pin-card-title">' + escapeHtml(title) + '</strong>' : '') +
            (place ? '<span class="hp-pin-card-place">' + escapeHtml(place) + '</span>' : '') +
            (descHtml ? '<span class="hp-pin-card-desc">' + descHtml + '</span>' : '') +
          '</span>'
        : '';
    pin.innerHTML =
        '<span class="hp-pin-pulse" aria-hidden="true"></span>' +
        '<span class="hp-pin-dot" aria-hidden="true"></span>' +
        (name ? '<span class="hp-pin-label" aria-hidden="true">' + escapeHtml(name) + '</span>' : '') +
        card;
    return pin;
}

const LABEL_SIDES = ['right', 'left', 'top', 'bottom'];

/**
 * Put each pin's label on the side (right, left, above, below) where it
 * overlaps the fewest other labels and dots and stays inside the map.
 * Nearby places — London/Frankfurt, Noida/Mumbai — otherwise collide.
 * Re-runs when the map is resized.
 */
export function layoutPinLabels(mapWrap) {
    const pins = [...mapWrap.querySelectorAll('.hp-pin')];
    const box = mapWrap.getBoundingClientRect();
    if (!pins.length || !box.width) return;
    const placed = [];
    const dots = pins.map((p) => p.querySelector('.hp-pin-dot').getBoundingClientRect());
    const overlap = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

    // Left to right, so each label is fitted against the ones already placed.
    pins.map((p, i) => ({ p, i })).sort((a, b) => dots[a.i].left - dots[b.i].left).forEach(({ p, i }) => {
        const label = p.querySelector('.hp-pin-label');
        if (!label) return;
        let best = null;
        for (const side of LABEL_SIDES) {
            LABEL_SIDES.forEach((s) => p.classList.remove('hp-pin--label-' + s));
            if (side !== 'right') p.classList.add('hp-pin--label-' + side);
            const r = label.getBoundingClientRect();
            const outside = Math.max(0, box.left - r.left) + Math.max(0, r.right - box.right) +
                Math.max(0, box.top - r.top) + Math.max(0, r.bottom - box.bottom);
            const cost = placed.reduce((sum, q) => sum + overlap(r, q), 0) +
                dots.reduce((sum, d, j) => sum + (j === i ? 0 : overlap(r, d)), 0) + outside * 50;
            if (!best || cost < best.cost) best = { side, cost, rect: r };
            if (cost === 0) break;
        }
        LABEL_SIDES.forEach((s) => p.classList.remove('hp-pin--label-' + s));
        if (best.side !== 'right') p.classList.add('hp-pin--label-' + best.side);
        placed.push(best.rect);
        p.dataset.labelSide = best.side;
    });

    // Details cards: open above or below, whichever covers fewer of the other
    // pins' dots and labels (Mumbai's card must not hide Delhi), never on the
    // same side as a label placed above/below, and preferring to stay inside
    // the map. Measured while hidden — visibility:hidden still lays out.
    const labelRects = pins.map((p) => {
        const l = p.querySelector('.hp-pin-label');
        return l ? l.getBoundingClientRect() : null;
    });
    pins.forEach((p, i) => {
        const card = p.querySelector('.hp-pin-card');
        if (!card) return;
        let best = null;
        for (const below of [false, true]) {
            if ((below && p.dataset.labelSide === 'bottom') || (!below && p.dataset.labelSide === 'top')) continue;
            p.classList.toggle('hp-pin--card-below', below);
            const r = card.getBoundingClientRect();
            let cost = (Math.max(0, box.top - r.top) + Math.max(0, r.bottom - box.bottom)) * 2;
            pins.forEach((q, j) => {
                if (j === i) return;
                cost += overlap(r, dots[j]) * 20;            // never hide another pin
                if (labelRects[j]) cost += overlap(r, labelRects[j]);
            });
            if (!best || cost < best.cost) best = { below, cost };
        }
        if (best) p.classList.toggle('hp-pin--card-below', best.below);
    });
}

/**
 * Pins and legend items are linked: hovering or focusing either highlights
 * both, and the pin's details card opens (CSS: .hp-pin:hover / .is-active).
 * On phones the card is hidden (the map is too small) — a tap highlights the
 * pin and scrolls its legend card into view instead.
 * Safe to call again after re-rendering pins (listeners attach once per map).
 */
export function wireMapInteractions(mapWrap, legend) {
    if (!mapWrap) return;
    if (legend) mapWrap.classList.add('has-legend');
    layoutPinLabels(mapWrap);
    if (mapWrap.dataset.wired) return;
    mapWrap.dataset.wired = '1';

    if ('ResizeObserver' in window) {
        let raf = 0;
        new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => layoutPinLabels(mapWrap));
        }).observe(mapWrap);
    }

    const clear = () => {
        mapWrap.querySelectorAll('.hp-pin.is-active').forEach((x) => x.classList.remove('is-active'));
        if (legend) legend.querySelectorAll('[data-pin].is-active').forEach((x) => x.classList.remove('is-active'));
    };
    const highlight = (id) => {
        clear();
        const pin = mapWrap.querySelector('.hp-pin[data-pin="' + id + '"]');
        if (pin) pin.classList.add('is-active');
        const item = legend && legend.querySelector('[data-pin="' + id + '"]');
        if (item) item.classList.add('is-active');
        return item;
    };
    const onEnter = (sel) => (e) => {
        const el = e.target.closest(sel);
        if (el) highlight(el.dataset.pin);
    };
    const onLeave = (sel) => (e) => {
        const el = e.target.closest(sel);
        if (el && !el.contains(e.relatedTarget)) clear();
    };

    ['mouseover', 'focusin'].forEach((t) => mapWrap.addEventListener(t, onEnter('.hp-pin')));
    ['mouseout', 'focusout'].forEach((t) => mapWrap.addEventListener(t, onLeave('.hp-pin')));
    mapWrap.addEventListener('click', (e) => {
        const pin = e.target.closest('.hp-pin');
        if (!pin) return clear();
        const item = highlight(pin.dataset.pin);
        if (item && window.matchMedia('(hover: none)').matches) {
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

    if (!legend) return;
    ['mouseover', 'focusin'].forEach((t) => legend.addEventListener(t, onEnter('[data-pin]')));
    ['mouseout', 'focusout'].forEach((t) => legend.addEventListener(t, onLeave('[data-pin]')));
    legend.addEventListener('click', onEnter('[data-pin]'));
}
