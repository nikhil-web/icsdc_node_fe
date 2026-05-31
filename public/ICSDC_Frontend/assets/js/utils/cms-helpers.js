/**
 * cms-helpers.js
 * ──────────────
 * Shared CMS populator functions used by ALL page-specific JS files.
 * Icons use Font Awesome 6.5.2 — no inline SVGs.
 * Custom SVG icons can be registered in utils/custom-icons.js.
 */

import { CUSTOM_ICONS } from './custom-icons.js';
import { postAPI } from '../services/strapiClient.js';

/**
 * Wire a CTA button's click. If `link` is the magic value 'contact-popup'
 * (or '#contact-popup'), opens the site-wide contact modal via
 * window.openContactPopup() instead of navigating. Anything else navigates
 * to that link via window.location.href.
 */
export function wireCtaLink(btn, link) {
    if (!btn || !link) return;
    if (link === 'contact-popup' || link === '#contact-popup') {
        btn.setAttribute('onclick',
            "if(window.openContactPopup){window.openContactPopup();}return false;");
    } else {
        btn.setAttribute('onclick', "window.location.href='" + link + "'");
    }
}

/* ═══════════════════════════════════════════════════════════════
   FA ICONS MAP  (key → fa icon name, all fa-solid)
   ═══════════════════════════════════════════════════════════════ */

export var FA_ICONS = {
    // Speed / Power
    lightning:      'bolt',
    zap:            'bolt',
    speed:          'bolt',
    nvme:           'bolt',
    // Devices / Display
    monitor:        'desktop',
    mobile:         'mobile-screen',
    smartphone:     'mobile-screen',
    tablet:         'tablet',
    // Money
    dollar:         'dollar-sign',
    price:          'dollar-sign',
    billing:        'dollar-sign',
    currency:       'dollar-sign',
    // People
    users:          'users',
    team:           'users',
    headset:        'headset',
    support:        'headset',
    // Security
    lock:           'lock',
    ssl:            'lock',
    shield:         'shield',
    security:       'shield-halved',
    protect:        'shield-halved',
    firewall:       'fire-flame-curved',
    'lock-key':     'key',
    key:            'key',
    'shield-check': 'shield-check',
    vapt:           'shield-check',
    'eye-off':      'eye-slash',
    // Network / Global
    pulse:          'wave-square',
    activity:       'wave-square',
    globe:          'globe',
    'globe-lines':  'globe',
    domain:         'globe',
    network:        'network-wired',
    connect:        'network-wired',
    wifi:           'wifi',
    // Data
    database:       'database',
    storage:        'hard-drive',
    'hard-drive':   'hard-drive',
    upload:         'cloud-arrow-up',
    backup:         'cloud-arrow-up',
    cloud:          'cloud',
    // Compute
    cpu:            'microchip',
    gpu:            'microchip',
    compute:        'microchip',
    nvidia:         'microchip',
    // Code / Dev
    code:           'code',
    terminal:       'terminal',
    'git-branch':   'code-branch',
    container:      'box',
    filter:         'filter',
    // Files / Docs
    document:       'file',
    'file-text':    'file-lines',
    clipboard:      'clipboard',
    // Communication
    mail:           'envelope',
    email:          'envelope',
    chat:           'comments',
    // Infrastructure
    server:         'server',
    dedicated:      'server',
    hosting:        'server',
    layout:         'table-columns',
    panel:          'table-columns',
    // Analytics
    chart:          'chart-bar',
    'bar-chart':    'chart-bar',
    // Status
    check:          'check',
    'check-circle': 'circle-check',
    uptime:         'circle-check',
    clock:          'clock',
    refresh:        'rotate',
    recovery:       'rotate',
    calendar:       'calendar',
    // Content
    video:          'video',
    camera:         'camera',
    // UI
    grid:           'grip',
    layers:         'layer-group',
    // Actions
    arrow:          'arrow-right',
    share:          'share-nodes',
    search:         'magnifying-glass',
    rocket:         'rocket',
    launch:         'rocket',
    house:          'house',
    gaming:         'gamepad',
    // Business
    brain:          'brain',
    building:       'building',
    scale:          'scale-balanced',
    scalability:    'up-right-and-down-left-from-center',
    tag:            'tag',
    // OS / Platform brands (fa-brands)
    linux:          'linux',
    ubuntu:         'ubuntu',
    centos:         'centos',
    debian:         'debian',
    almalinux:      'linux',
    rocky:          'linux',
    fedora:         'fedora',
    redhat:         'redhat',
    freebsd:        'freebsd',
    windows:        'windows',
    microsoft:      'microsoft',
    google:         'google',
    aws:            'aws',
    azure:          'microsoft',
    // Control panels (no FA brand — map to solid icons)
    cpanel:         'sliders',
    solusvms:       'server',
    webmin:         'terminal',
    plesk:          'sliders',
    directadmin:    'gauge',
    'whm':          'sliders',
    // Misc
    settings:       'gear',
    manage:         'gear',
    tool:           'wrench',
    tools:          'wrench',
    link:           'link',
    compass:        'compass',
    cloud:          'cloud',
    smartphone:     'mobile-screen',
    tablet:         'tablet',
    calendar:       'calendar',
    inbox:          'inbox',
    award:          'award',
    briefcase:      'briefcase',
    'credit-card':  'credit-card',
    flag:           'flag',
    heart:          'heart',
    'map-pin':      'location-dot',
    location:       'location-dot',
    global:         'location-dot',
    'message-circle': 'message',
    phone:          'phone',
    printer:        'print',
    share:          'share-nodes',
    'shopping-cart': 'cart-shopping',
    tag:            'tag',
    'thumbs-up':    'thumbs-up',
    truck:          'truck',
    umbrella:       'umbrella',
    eye:            'eye',
    feather:        'feather',
    performance:    'gauge-high',
    support:        'headset',
    bandwidth:      'arrows-left-right',
    migration:      'right-left',
    transfer:       'right-left',
    scalability:    'up-right-and-down-left-from-center',
    scale:          'up-right-and-down-left-from-center',
    grow:           'arrow-trend-up',
    'trending-up':  'arrow-trend-up',
    package:        'box',
    docker:         'box',
    kubernetes:     'dharmachakra',
    openstack:      'layer-group',
    vmware:         'server',
    ceph:           'database',
    nginx:          'globe',
    terraform:      'terminal',
    ansible:        'terminal',
    prometheus:     'chart-line',
    grafana:        'chart-line',
    cloudflare:     'shield-halved',
    compliance:     'clipboard-check',
    api:            'code',
    developer:      'code',
    linux:          'linux',
    ubuntu:         'ubuntu',
    centos:         'centos',
    debian:         'debian',
    almalinux:      'linux',
    rocky:          'linux',
    fedora:         'fedora',
    redhat:         'redhat',
    freebsd:        'freebsd',
    windows:        'windows',
    microsoft:      'microsoft',
    google:         'google',
    aws:            'aws',
    azure:          'microsoft',
    cpanel:         'sliders',
    solusvms:       'server',
    webmin:         'terminal',
    plesk:          'sliders',
    directadmin:    'gauge',
};

/* Brand icons that use fa-brands instead of fa-solid */
var FA_BRANDS = { linux:1, ubuntu:1, centos:1, debian:1, fedora:1, redhat:1, freebsd:1, windows:1, microsoft:1, google:1, aws:1, apple:1, android:1, github:1, gitlab:1, docker:1, whatsapp:1, facebook:1, twitter:1, instagram:1, linkedin:1, youtube:1, tiktok:1, slack:1, discord:1, telegram:1, wordpress:1, shopify:1, stripe:1, paypal:1, dropbox:1, spotify:1 };

/* Legacy SVG map kept for backward compat — empty, all resolved via FA now */
export var ICONS = {};


/* ═══════════════════════════════════════════════════════════════
   DOM HELPERS
   ═══════════════════════════════════════════════════════════════ */

export function setText(parent, selector, text) {
    if (!parent) return;
    var el = parent.querySelector(selector);
    if (el && text != null) el.textContent = text;
}

export function setHTML(parent, selector, html) {
    if (!parent) return;
    var el = parent.querySelector(selector);
    if (el && html != null) el.innerHTML = html;
}

/**
 * Resolve an icon key to markup (SVG string or FA <i> tag).
 *
 * Resolution order:
 *  1. CUSTOM_ICONS registry  →  custom-icons.js (your own SVGs, highest priority)
 *  2. Per-call customIcons   →  inline override map passed by caller
 *  3. Explicit style prefix  →  "brands:linkedin", "regular:bell", "solid:house"
 *  4. FA_ICONS alias map     →  "lightning" → bolt, "linux" → fa-brands fa-linux
 *  5. Direct FA icon name    →  "shield-halved", "fa-rocket", "cart-shopping" …
 *     (strips leading "fa-" if present, then uses the name as-is with fa-solid)
 *
 * To add a custom SVG: edit assets/js/utils/custom-icons.js
 * To use any FA icon: just paste its name (e.g. "circle-nodes", "brands:linkedin")
 */
export function resolveIcon(key, customIcons) {
    if (!key) return defaultIconSVG();

    // ── 1. Global custom SVG registry ──
    if (CUSTOM_ICONS[key]) return CUSTOM_ICONS[key];

    // ── 2. Per-call override map ──
    if (customIcons && customIcons[key]) return customIcons[key];

    var k = key.toLowerCase().trim();
    var style = 'fa-solid';
    var iconName = k;

    // ── 3. Explicit prefix: "brands:linkedin"  "regular:bell"  "solid:house" ──
    if (k.indexOf(':') !== -1) {
        var sep = k.indexOf(':');
        var prefix = k.slice(0, sep);
        iconName = k.slice(sep + 1);
        if (prefix === 'brands' || prefix === 'brand') style = 'fa-brands';
        else if (prefix === 'regular' || prefix === 'reg') style = 'fa-regular';
        // "solid:" falls through as default
    } else {
        // ── 4. Strip "fa-" prefix if caller passed e.g. "fa-rocket" ──
        if (iconName.slice(0, 3) === 'fa-') iconName = iconName.slice(3);

        // ── 5. Try alias map ──
        var mapped = FA_ICONS[key] || FA_ICONS[k] || FA_ICONS[iconName];
        if (mapped) iconName = mapped;

        // ── 6. Determine style (brand check on resolved name) ──
        style = FA_BRANDS[iconName] ? 'fa-brands' : 'fa-solid';
    }

    return '<i class="' + style + ' fa-' + iconName + '" aria-hidden="true"></i>';
}

/** Default fallback icon */
export function defaultIconSVG() {
    return '<i class="fa-solid fa-circle-dot" aria-hidden="true"></i>';
}

/** Star for testimonial ratings */
export function starSVG() {
    return '<i class="fa-solid fa-star testi-star" aria-hidden="true"></i>';
}

/** Check mark for pricing feature lists */
export function checkSVG() {
    return '<i class="fa-solid fa-check" aria-hidden="true"></i>';
}

/** Comparison table status icon */
export function comparisonIcon(type) {
    if (type === 'check') {
        return '<span class="ds-check-icon"><i class="fa-solid fa-check" aria-hidden="true"></i></span>';
    }
    if (type === 'partial') {
        return '<span class="ds-partial-icon"><i class="fa-solid fa-minus" aria-hidden="true"></i></span>';
    }
    return '<span class="ds-cross-icon"><i class="fa-solid fa-xmark" aria-hidden="true"></i></span>';
}

export function getInitials(name) {
    if (!name) return '';
    return name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
}


/* ═══════════════════════════════════════════════════════════════
   SECTION POPULATORS
   ═══════════════════════════════════════════════════════════════ */

export function populateSEO(seo) {
    if (!seo) return;
    if (seo.metaTitle) document.title = seo.metaTitle;
    if (seo.metaDescription) {
        var meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', seo.metaDescription);
    }
}

export function populateHero(section, data) {
    if (!data) return;
    if (typeof section === 'string') section = document.querySelector(section);
    if (!section) return;

    if (data.eyebrow) {
        var eyebrow = section.querySelector('.eyebrow-badge');
        if (eyebrow) eyebrow.textContent = data.eyebrow;
    }

    if (data.title) setText(section, '.hero-title', data.title);
    if (data.subtitle) setText(section, '.hero-sub', data.subtitle);
    if (data.description) setHTML(section, '.hero-desc', data.description);

    if (data.price != null) {
        var priceEl = section.querySelector('.hero-price');
        if (priceEl) {
            var currency = data.priceCurrency || '₹';
            var priceSpan = priceEl.querySelector('span:first-child');
            if (priceSpan) priceSpan.innerHTML = currency + data.price;
        }
    }
    if (data.priceUnit) setText(section, '.price-unit', data.priceUnit);
    if (data.priceNote) setHTML(section, '.price-note', data.priceNote);

    var btns = section.querySelectorAll('.hero-btns button');
    if (btns.length >= 1 && data.ctaPrimary) {
        var primaryBtn = btns.length >= 2 ? btns[1] : btns[0];
        primaryBtn.innerHTML = (data.ctaPrimary.text || '') + ' &rarr;';
        wireCtaLink(primaryBtn, data.ctaPrimary.link);
    }
    if (btns.length >= 2 && data.ctaSecondary) {
        btns[0].textContent = data.ctaSecondary.text || '';
        wireCtaLink(btns[0], data.ctaSecondary.link);
    }

    if (data.heroImage && data.heroImage.image) {
        var heroRight = section.querySelector('.hero-right');
        var heroImg = heroRight && heroRight.querySelector('.hero-right-image');
        if (heroImg) {
            var _base = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://localhost:1337');
            var _m = data.heroImage.image;
            var _url = (_m.formats && (_m.formats.large || _m.formats.medium || _m.formats.small)
                ? (_m.formats.large || _m.formats.medium || _m.formats.small).url
                : _m.url) || '';
            if (_url && !_url.startsWith('http')) _url = _base + _url;
            if (_url) {
                heroImg.src = _url;
                heroImg.style.display = '';
                Array.from(heroRight.children).forEach(function (child) {
                    if (!child.classList.contains('hero-right-image')) child.style.display = 'none';
                });
            }
        }
    }

    // Hero form toggle — takes precedence over heroImage
    if (data.heroFormEnabled) {
        var heroRightEl = section.querySelector('.hero-right');
        if (heroRightEl) {
            var formWrap = heroRightEl.querySelector('.hero-form-wrap');
            if (formWrap) {
                Array.from(heroRightEl.children).forEach(function (child) {
                    child.style.display = child === formWrap ? '' : 'none';
                });
            }
        }
    }
}

export function populateIconCards(gridSelector, cards, cardClass, customIcons) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var cls = cardClass || 'why-card';
    var iconCls = cls.replace('-card', '-icon');
    var linkCls = cls.replace('-card', '-link');

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        var linkHtml = card.link
            ? '<a href="' + card.link + '" class="' + linkCls + '">Learn more &rarr;</a>'
            : '';
        return '<div class="' + cls + '">' +
            '<div class="' + iconCls + '" aria-hidden="true">' +
            resolveIcon(card.icon, customIcons) +
            '</div>' +
            '<h3>' + (card.title || '') + '</h3>' +
            '<p>' + (card.desc || card.description || '') + '</p>' +
            linkHtml +
            '</div>';
    }).join('');
}

export function populateSectionHeader(sectionSelector, label, title, subtitle) {
    var section = document.querySelector(sectionSelector);
    if (!section) return;
    if (label) {
        var labelEl = section.querySelector('.cloud-section-label') || section.querySelector('.ds-section-label');
        if (labelEl) labelEl.textContent = label;
    }
    if (title) setText(section, '.title', title);
    if (subtitle) setHTML(section, '.subtitle', subtitle);
}

export function populateCtaBand(selector, cta) {
    if (!cta) return;
    var section = document.querySelector(selector);
    if (!section) return;

    var inner = section.querySelector('.cloud-cta-inner') || section.querySelector('.ds-cta-inner');
    if (!inner) return;

    setHTML(inner, 'h2', cta.title);
    setHTML(inner, 'p', cta.description);

    var btns = inner.querySelector('.cloud-cta-btns') || inner.querySelector('.ds-cta-btns');
    if (btns) {
        var primaryBtn = btns.querySelector('.cloud-cta-btn-primary') || btns.querySelector('.ds-cta-btn-primary');
        var secondaryBtn = btns.querySelector('.cloud-cta-btn-outline') || btns.querySelector('.ds-cta-btn-outline');

        if (primaryBtn) {
            if (cta.ctaPrimary && cta.ctaPrimary.text) {
                primaryBtn.innerHTML = cta.ctaPrimary.text + ' &rarr;';
                wireCtaLink(primaryBtn, cta.ctaPrimary.link);
            } else {
                primaryBtn.remove();
            }
        }
        if (secondaryBtn) {
            if (cta.ctaSecondary && cta.ctaSecondary.text) {
                secondaryBtn.textContent = cta.ctaSecondary.text;
                wireCtaLink(secondaryBtn, cta.ctaSecondary.link);
            } else {
                secondaryBtn.remove();
            }
        }
    }
}

export function populatePricingPlans(gridSelector, plans) {
    if (!plans || !plans.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (plan) {
        var featuredClass = plan.isFeatured ? ' ds-featured' : '';
        var badge = plan.isFeatured && plan.badge
            ? '<span class="ds-plan-badge">' + plan.badge + '</span>'
            : '';
        var ctaClass = plan.ctaStyle === 'primary' ? 'ds-plan-cta-primary' : 'ds-plan-cta-outline';
        var ctaArrow = plan.ctaStyle === 'primary' ? ' &rarr;' : '';

        var featuresHTML = '';
        if (plan.features && plan.features.length) {
            featuresHTML = plan.features.map(function (f) {
                return '<li class="ds-plan-feature">' +
                    '<span class="ds-plan-check">' + checkSVG() + '</span>' +
                    (f.label || '') +
                    '</li>';
            }).join('');
        }

        return '<div class="ds-plan-card' + featuredClass + '">' +
            badge +
            '<div class="ds-plan-tier">' + (plan.tier || '') + '</div>' +
            '<div class="ds-plan-price-wrap">' +
            '<span class="ds-plan-currency">' + (plan.currency || '₹') + '</span>' +
            '<span class="ds-plan-price">' + (plan.price || '') + '</span>' +
            '<span class="ds-plan-period">' + (plan.period || '/mo') + '</span>' +
            '</div>' +
            (plan.tagline ? '<p class="ds-plan-tagline">' + plan.tagline + '</p>' : '') +
            '<hr class="ds-plan-divider">' +
            '<ul class="ds-plan-features">' + featuresHTML + '</ul>' +
            '<button class="ds-plan-cta ' + ctaClass + '">' +
            (plan.ctaText || '') + ctaArrow +
            '</button>' +
            '</div>';
    }).join('');
}

export function populatePricingPlansCloud(gridSelector, plans) {
    if (!plans || !plans.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = plans.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (plan) {
        var featuredClass = plan.isFeatured ? ' cloud-featured' : '';
        var badge = (plan.isFeatured && plan.badge)
            ? '<span class="cloud-plan-badge">' + plan.badge + '</span>'
            : '';
        var ctaClass = plan.ctaStyle === 'primary' ? 'cloud-plan-cta-primary' : 'cloud-plan-cta-outline';
        var ctaArrow = plan.ctaStyle === 'primary' ? ' →' : '';

        var featuresHTML = '';
        if (plan.features && plan.features.length) {
            featuresHTML = plan.features.map(function (f) {
                return '<li class="cloud-plan-feature">' +
                    '<span class="cloud-plan-check">' + checkSVG() + '</span>' +
                    (f.label || '') +
                    '</li>';
            }).join('');
        }

        return '<div class="cloud-plan-card' + featuredClass + '">' +
            badge +
            '<div class="cloud-plan-tier">' + (plan.tier || '') + '</div>' +
            '<div class="cloud-plan-price-wrap">' +
            '<span class="cloud-plan-currency">' + (plan.currency || '₹') + '</span>' +
            '<span class="cloud-plan-price">' + (plan.price || '') + '</span>' +
            '<span class="cloud-plan-period">' + (plan.period || '/mo') + '</span>' +
            '</div>' +
            (plan.tagline ? '<p class="cloud-plan-tagline">' + plan.tagline + '</p>' : '') +
            '<hr class="cloud-plan-divider">' +
            '<ul class="cloud-plan-features">' + featuresHTML + '</ul>' +
            '<button class="cloud-plan-cta ' + ctaClass + '">' +
            (plan.ctaText || '') + ctaArrow +
            '</button>' +
            '</div>';
    }).join('');
}

export function populateWhenCards(gridSelector, cards) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        return '<div class="ds-when-card">' +
            '<div class="ds-when-num">' + (card.number || '') + '</div>' +
            '<h3>' + (card.title || '') + '</h3>' +
            '<p>' + (card.description || '') + '</p>' +
            '</div>';
    }).join('');
}

export function populateComparisonTable(tableSelector, columns, rows) {
    var section = document.querySelector(tableSelector);
    if (!section) return;

    if (columns && columns.length) {
        var ths = section.querySelectorAll('thead th');
        columns.forEach(function (col, i) {
            if (ths[i]) ths[i].textContent = col;
        });
    }

    if (!rows || !rows.length) return;
    var tbody = section.querySelector('tbody');
    if (!tbody) return;

    var sorted = rows.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    tbody.innerHTML = sorted.map(function (r) {
        return '<tr>' +
            '<td>' + (r.feature || '') + '</td>' +
            '<td>' + (r.others || '') + '</td>' +
            '<td class="aws-check">' + (r.icsdc || '') + '</td>' +
            '</tr>';
    }).join('');
}

export function populateStats(containerSelector, stats) {
    if (!stats || !stats.length) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;

    container.innerHTML = stats.map(function (s) {
        return '<div class="ds-perf-stat">' +
            '<span class="ds-perf-stat-val">' + (s.value || '') + '</span>' +
            '<span class="ds-perf-stat-label">' + (s.label || '') + '</span>' +
            '</div>';
    }).join('');
}

export function populateChecklist(listSelector, items) {
    if (!items || !items.length) return;
    var ul = document.querySelector(listSelector);
    if (!ul) return;

    var sorted = items.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    ul.innerHTML = sorted.map(function (item) {
        return '<li class="ds-checklist-item">' +
            '<span class="ds-cl-icon"><i class="fa-solid fa-check" aria-hidden="true"></i></span>' +
            '<span><strong>' + (item.label || '') + '</strong> ' + (item.description || '') + '</span>' +
            '</li>';
    }).join('');
}

export function populateTechBadges(containerSelector, badges, customIcons) {
    if (!badges || !badges.length) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;

    var sorted = badges.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    container.innerHTML = sorted.map(function (badge) {
        var iconMarkup = badge.icon ? resolveIcon(badge.icon, customIcons) : resolveIcon('cloud');
        return '<div class="cloud-framework-badge">' +
            '<div class="cloud-fw-icon">' + iconMarkup + '</div>' +
            '<span class="cloud-fw-name">' + (badge.name || '') + '</span>' +
            '</div>';
    }).join('');
}

export function populateLocationCards(gridSelector, locations) {
    if (!locations || !locations.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = locations.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (loc) {
        return '<div class="location-card">' +
            '<span class="location-flag" aria-hidden="true">' + (loc.flag || '') + '</span>' +
            '<h3 class="location-name">' + (loc.name || '') + '</h3>' +
            '<p class="location-desc">' + (loc.description || '') + '</p>' +
            '</div>';
    }).join('');
}

export function populateSolutionCards(gridSelector, cards, customIcons) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        var ctaClass = card.ctaStyle === 'primary' ? 'solution-cta-primary' : 'solution-cta-outline';
        var ctaHTML = card.ctaText
            ? '<button class="solution-cta ' + ctaClass + '">' + card.ctaText + '</button>'
            : '';

        return '<div class="solution-card">' +
            '<div class="solution-icon" aria-hidden="true">' + resolveIcon(card.icon, customIcons) + '</div>' +
            '<h3 class="solution-name">' + (card.name || '') + '</h3>' +
            (card.tagline ? '<p class="solution-tagline">' + card.tagline + '</p>' : '') +
            '<p class="solution-desc">' + (card.description || '') + '</p>' +
            ctaHTML +
            '</div>';
    }).join('');
}

export function populateTldCards(gridSelector, cards) {
    if (!cards || !cards.length) return;
    var grid = document.querySelector(gridSelector);
    if (!grid) return;

    var sorted = cards.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    grid.innerHTML = sorted.map(function (card) {
        var badgeHTML = card.badge
            ? '<span class="tld-badge">' + card.badge + '</span>'
            : '';

        return '<div class="tld-card">' +
            badgeHTML +
            '<span class="tld-extension">' + (card.extension || '') + '</span>' +
            '<span class="tld-price">' + (card.price || '') + '</span>' +
            '</div>';
    }).join('');
}

export function hidePageLoader() {
    var loader = document.getElementById('page-loader');
    if (!loader) return;
    loader.classList.add('loader-done');
    setTimeout(function () {
        loader.classList.add('loader-hidden');
    }, 520);
}

export function markActiveNavLink() {
    var path = window.location.pathname;
    document.querySelectorAll('.nav-link, .mobile-nav-links .nav-link').forEach(function (link) {
        var href = link.getAttribute('href') || '';
        if (href && path.includes(href) && href !== '/') {
            link.classList.add('active');
        }
    });
}

export function initFAQ(faqItems) {
    var container = document.getElementById('faq-accordions');
    if (!container || !faqItems || !faqItems.length) return;

    var chevronSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    var sorted = faqItems.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    container.innerHTML = sorted.map(function (faq, i) {
        var num = String(i + 1).padStart(2, '0');
        return '<details class="faq-item"' + (i === 0 ? ' open' : '') + '>' +
            '<summary class="faq-q">' +
            '<span class="faq-num">' + num + '</span>' +
            '<span class="faq-q-text">' + (faq.question || '') + '</span>' +
            '<span class="faq-chev">' + chevronSVG + '</span>' +
            '</summary>' +
            '<div class="faq-a-wrap"><div class="faq-a">' + (faq.answer || '') + '</div></div>' +
            '</details>';
    }).join('');

    // Single-open accordion
    var items = container.querySelectorAll('.faq-item');
    items.forEach(function (item) {
        item.addEventListener('toggle', function () {
            if (item.open) {
                items.forEach(function (other) { if (other !== item) other.open = false; });
            }
        });
    });
}

export function initTestimonials(items) {
    var grid = document.getElementById('testi-grid');
    var dotsWrap = document.getElementById('testi-dots');
    var prevBtn = document.getElementById('testi-prev');
    var nextBtn = document.getElementById('testi-next');
    if (!grid || !dotsWrap || !items || !items.length) return;

    function buildTestiCard(t, index) {
        var initials = getInitials(t.name);
        var stars = '';
        for (var s = 0; s < (t.rating || 5); s++) { stars += starSVG(); }

        return '<article class="testi-card" role="listitem" data-testi-index="' + index + '" aria-label="Testimonial from ' + t.name + '">' +
            '<div class="testi-left">' +
            '<div class="testi-avatar" aria-hidden="true">' +
            '<span class="testi-avatar-initials">' + initials + '</span>' +
            '</div>' +
            '<div class="testi-client-info">' +
            '<p class="testi-name">' + t.name + '</p>' +
            '<p class="testi-job">' + (t.title || '') + '</p>' +
            '<p class="testi-company">' + (t.company || '') + '</p>' +
            '</div>' +
            '<div class="testi-rating" aria-label="Rating: ' + (t.rating || 5) + ' out of 5 stars">' + stars + '</div>' +
            '</div>' +
            '<div class="testi-right">' +
            '<blockquote class="testi-quote">' + t.quote + '</blockquote>' +
            '</div>' +
            '</article>';
    }

    grid.innerHTML = items.map(function (t, i) { return buildTestiCard(t, i); }).join('');

    dotsWrap.innerHTML = items.map(function (_, i) {
        return '<button class="testi-dot' + (i === 0 ? ' testi-dot-active' : '') + '" role="tab" aria-selected="' + (i === 0) + '" aria-label="Go to testimonial ' + (i + 1) + '" data-dot="' + i + '"></button>';
    }).join('');

    var cards = Array.from(grid.querySelectorAll('.testi-card'));
    var dots  = Array.from(dotsWrap.querySelectorAll('.testi-dot'));
    var currentIdx = 0;
    var programmaticScroll = false;
    var programmaticTimer;

    function updateDots(idx) {
        dots.forEach(function (d, i) {
            d.classList.toggle('testi-dot-active', i === idx);
            d.setAttribute('aria-selected', String(i === idx));
        });
    }

    function scrollToCard(index) {
        var card = cards[index];
        if (!card) return;
        currentIdx = index;

        /* Update dot immediately — before any scroll fires */
        updateDots(index);

        /* Block the scroll listener from overriding the dot while
           the smooth animation plays (browsers take up to ~500 ms) */
        programmaticScroll = true;
        clearTimeout(programmaticTimer);
        programmaticTimer = setTimeout(function () {
            programmaticScroll = false;
        }, 600);

        var gridRect = grid.getBoundingClientRect();
        var cardRect = card.getBoundingClientRect();
        var targetLeft = grid.scrollLeft + (cardRect.left - gridRect.left);
        grid.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }

    dots.forEach(function (btn, i) {
        btn.addEventListener('click', function () { scrollToCard(i); });
    });

    if (prevBtn) prevBtn.addEventListener('click', function () {
        scrollToCard((currentIdx - 1 + items.length) % items.length);
    });

    if (nextBtn) nextBtn.addEventListener('click', function () {
        scrollToCard((currentIdx + 1) % items.length);
    });

    /* Sync dots after manual swipe / drag only — ignored during
       programmatic scrolls so button clicks don't flicker */
    var scrollTimer;
    grid.addEventListener('scroll', function () {
        if (programmaticScroll) return;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
            var gridLeft = grid.getBoundingClientRect().left;
            var closest = 0, minDist = Infinity;
            cards.forEach(function (card, i) {
                var dist = Math.abs(card.getBoundingClientRect().left - gridLeft);
                if (dist < minDist) { minDist = dist; closest = i; }
            });
            currentIdx = closest;
            updateDots(closest);
        }, 80);
    });
}

/**
 * initHeroContactForm(formId, successId)
 * ──────────────────────────────────────
 * Attaches a validated submit handler to a hero-embedded contact form.
 * Used on pages where heroFormEnabled is toggled on in Strapi.
 * POSTs to /api/contact-submissions — same endpoint as the /contact-us page.
 *
 * @param {string} formId    - id of the <form> element (e.g. 'hf-form')
 * @param {string} successId - id of the success state div  (e.g. 'hf-success')
 */
export function initHeroContactForm(formId, successId) {
    var form = document.getElementById(formId);
    var successMsg = document.getElementById(successId);
    if (!form) return;

    function validatePayload(p) {
        if (!p.name)    return 'Please enter your name.';
        if (!p.email)   return 'Please enter your email address.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) return 'Please enter a valid email address.';
        if (!p.subject) return 'Please select a subject.';
        if (!p.message) return 'Please enter your message.';
        return null;
    }

    function showError(message) {
        form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });
        var errEl = document.createElement('p');
        errEl.className = 'cu-form-error';
        errEl.style.cssText = 'color:#e53e3e;margin-top:0.75rem;font-size:0.9rem;';
        errEl.textContent = message;
        var submitBtn = form.querySelector('[type=submit]');
        if (submitBtn) submitBtn.insertAdjacentElement('beforebegin', errEl);
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        form.querySelectorAll('.cu-form-error').forEach(function (el) { el.remove(); });

        var payload = {
            name:    (form.querySelector('[name=name]')    || {}).value.trim(),
            email:   (form.querySelector('[name=email]')   || {}).value.trim(),
            phone:   (form.querySelector('[name=phone]')   || {}).value.trim(),
            company: (form.querySelector('[name=company]') || {}).value.trim(),
            subject: (form.querySelector('[name=subject]') || {}).value,
            message: (form.querySelector('[name=message]') || {}).value.trim(),
        };

        var err = validatePayload(payload);
        if (err) { showError(err); return; }

        var submitBtn = form.querySelector('[type=submit]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            await postAPI('/api/contact-submissions', payload);
            form.style.display = 'none';
            if (successMsg) successMsg.style.display = 'flex';
        } catch (e) {
            if (submitBtn) submitBtn.disabled = false;
            showError('Something went wrong. Please try again or email us directly.');
            console.error('[hero-form] Submission failed:', e);
        }
    });
}
