/**
 * homepage-cms.js
 * ──────────────────────────────────────────────────────────────
 * Fetches the home-page single type from Strapi v5 and populates
 * ALL sections. Sections already driven by main.js (hero, nav,
 * whyUs, cloudServices via separate endpoints) are skipped here.
 *
 * Sections handled by THIS file (all from /api/home-page):
 *   ✅ SEO meta tags
 *   ✅ Hero CTAs (primary + secondary buttons)
 *   ✅ Who We Are  (heading, paragraph, featureCards buttons)
 *   ✅ Less Cloud Complexity  (heading, paragraph)
 *   ✅ Cloud Solutions Engineered  (floating cards)
 *   ✅ Industry-Leading Excellence Validated  (heading, paragraph)
 *   ✅ Beyond Best Practice / ISO Standards   (heading, paragraph)
 *   ✅ Why Partner With Us   (eyebrow, title, sub, stats, tag cards, CTAs)
 *   ✅ Solutions by Industry (eyebrow, title, sub, industry tabs + panels)
 *   ✅ Security & Compliance (eyebrow, title, sub, badges, cards, highlights, CTAs)
 *   ✅ Testimonials  (carousel)
 *   ✅ FAQ  (accordion)
 *   ✅ Get In Touch  (title, subtitle, email, phone, hours, submit label)
 *   ✅ Footer  (address, phone, email, socialLinks, linkGroups)
 * ──────────────────────────────────────────────────────────────
 */

import { getHomepagePage } from "./services/contentService.js";
import { populateIconCards, resolveIcon, initTestimonials, populateSEO, inlineRichText } from "./utils/cms-helpers.js";

(function () {

    // ── Strapi config ─────────────────────────────────────────
    const BASE_URL = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'https://icsdcadmin.duckdns.org');



    // ── Media URL helper ──────────────────────────────────────
    function mediaURL(obj, format = 'medium') {
        if (!obj) return '';
        const url = obj?.formats?.[format]?.url ?? obj?.formats?.small?.url ?? obj?.url ?? '';
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
    }

    // ── DOM helpers ───────────────────────────────────────────
    const RICH_HTML_RE = /<\/?(p|a|strong|em|b|i|u|br|ul|ol|li|h[1-6]|blockquote|span)\b/i;

    function setText(sel, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (!el) return;
        if (typeof val === 'string' && RICH_HTML_RE.test(val)) {
            el.innerHTML = inlineRichText(val);
        } else {
            el.textContent = val;
        }
    }

    function setHTML(sel, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (el) el.innerHTML = inlineRichText(val);
    }

    function setAttr(sel, attr, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (el) el.setAttribute(attr, val);
    }

    // SEO (title + meta description + optional canonical override) is handled by
    // the shared populateSEO imported from cms-helpers.js.

    function populateHeroSection(params) {
        setText('[data-strapi="mainHeading"]', params.mainHeading);
        setText('[data-strapi="subHeading"]', params.subHeading);
        setText('[data-strapi="description"]', params.description);
        setText('[data-strapi="price"]', params.price);
        setText('[data-strapi="priceNote"]', params.priceNote);

        if (params.heroImage && params.heroImage.image) {
            const img = document.querySelector('.hero-right .hero-right-image');
            if (img) {
                img.src = mediaURL(params.heroImage.image, 'large');
                img.style.display = '';
            }
        }

    }

    // ═══════════════════════════════════════════════════════════
    //  HERO CTAs  (the hero text/price are handled by main.js)
    // ═══════════════════════════════════════════════════════════
    function populateHeroCTAs(primary, secondary) {
        // Primary CTA
        if (primary) {
            const btn = document.querySelector('.hero-cta-primary, [data-cta="primary"], .hero-btns .btn-primary');
            if (btn) {
                btn.textContent = primary.text || '';
                if (primary.link) btn.setAttribute('href', primary.link);
            }
        }
        // Secondary CTA
        if (secondary) {
            const btn = document.querySelector('.hero-cta-secondary, [data-cta="secondary"], .hero-btns .btn-outline');
            if (btn) {
                btn.textContent = secondary.text || '';
                if (secondary.link) btn.setAttribute('href', secondary.link);
            }
        }
    }


    // why chooose us
    /** 3. Pillars (4 icon cards in .why-us .why-grid) */
    function populateWhyChooseUs(pillars) {
        if (!pillars || !pillars.length) return;
        populateIconCards('.why-us .why-grid', pillars, 'why-card');
    }

    // ═══════════════════════════════════════════════════════════
    //  WHY BUSINESS NEEDS CLOUD
    // ═══════════════════════════════════════════════════════════
    function populateWhyCloud(data) {
        if (!data) return;

        // Title
        if (data.title) setText('[data-strapi="whyCloudTitle"]', data.title);

        // Image
        if (data.image) {
            const img = document.querySelector('[data-strapi="whyCloudImage"]');
            if (img) {
                img.src = mediaURL(data.image, 'large') || mediaURL(data.image, 'medium') || mediaURL(data.image);
                img.alt = data.image.alternativeText || 'Cloud services illustration';
            }
        }

        // Items
        if (!data.items || !data.items.length) return;
        const list = document.querySelector('[data-strapi-grid="whyCloudItems"]');
        if (!list) return;

        list.innerHTML = data.items.map(item => `
            <article class="business-needs-item">
                <div class="business-needs-icon" aria-hidden="true">
                    ${resolveIcon(item.icon)}
                </div>
                <div class="business-needs-copy">
                    <h3>${item.title || ''}</h3>
                    <p>${inlineRichText(item.desc || '')}</p>
                </div>
            </article>
        `).join('');
    }


    // ═══════════════════════════════════════════════════════════
    //  WHO WE ARE
    // ═══════════════════════════════════════════════════════════
    function populateWhoWeAre(data) {
        if (!data) return;
        setText('[data-strapi="whoWeAreHeading"]', data.heading);
        setHTML('[data-strapi="whoWeAreParagraph"]', inlineRichText(data.paragraph));

        const cards = data.featureCards;
        if (!Array.isArray(cards) || !cards.length) return;

        const container = document.querySelector('[data-strapi-grid="whoWeAreCards"]');
        if (!container) return;

        container.innerHTML = cards.map(card => {
            const cls = card.variant === 'primary' ? 'btn-primary feature-cards' : 'btn-outline feature-cards';
            return `<button class="${cls}">${card.label}</button>`;
        }).join('');
    }

    // ═══════════════════════════════════════════════════════════
    //  LESS CLOUD COMPLEXITY
    // ═══════════════════════════════════════════════════════════
    function populateLessComplexity(data) {
        if (!data) return;
        setText('[data-strapi="lessComplexityHeading"]', data.heading);
        setHTML('[data-strapi="lessComplexityParagraph"]', inlineRichText(data.paragraph));

        if (data.image) {
            const img = document.querySelector('.less-cloud-complex img, .less-complexity-image img');
            if (img) img.src = mediaURL(data.image, 'large');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  CLOUD SOLUTIONS ENGINEERED  (floating cards)
    // ═══════════════════════════════════════════════════════════
    const POSITION_CLASS_MAP = {
        'left-top': 'fc-left fc-top',
        'left-mid': 'fc-left fc-mid',
        'left-bot': 'fc-left fc-bot',
        'right-top': 'fc-right fc-top',
        'right-mid': 'fc-right fc-mid',
        'right-bot': 'fc-right fc-bot',
        'bottom-left': 'fc-btm fc-btm-l',
        'bottom-right': 'fc-btm fc-btm-r',
    };

    function populateCloudSolutions(services) {
        if (!Array.isArray(services) || !services.length) return;
        const wrapper = document.querySelector('.phone-mockup-wrapper');
        if (!wrapper) return;

        // Remove existing hardcoded floating cards
        wrapper.querySelectorAll('.floating-card').forEach(el => el.remove());

        const rippleWrap = wrapper.querySelector('.ripple-wrap') ?? wrapper.querySelector('.image-wrapper');

        services.forEach(service => {
            const posClasses = POSITION_CLASS_MAP[service.position] ?? 'fc-left fc-top';
            const card = document.createElement('div');
            card.className = `floating-card ${posClasses}`;
            card.style.setProperty('--fc-delay', service.animationDelay ?? '0s');

            const iconHTML = service.svgIcon
                ? `<div class="fc-icon">
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                           ${service.svgIcon}
                       </svg>
                   </div>`
                : '';

            card.innerHTML = `
                ${iconHTML}
                <h4>${service.title}</h4>
                <p>${inlineRichText(service.description || service.desc || '')}</p>
            `;

            const isBottom = service.position?.startsWith('bottom');
            if (isBottom || !rippleWrap) {
                wrapper.appendChild(card);
            } else {
                wrapper.insertBefore(card, rippleWrap);
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  INDUSTRY-LEADING EXCELLENCE VALIDATED
    // ═══════════════════════════════════════════════════════════
    function populateIndustryValidated(data) {
        if (!data) return;
        setText('[data-strapi="industryValidatedHeading"]', data.heading);
        setHTML('[data-strapi="industryValidatedParagraph"]', inlineRichText(data.paragraph));

        if (data.image) {
            const img = document.querySelector('.industry-validated img, #industry-validated img');
            if (img) img.src = mediaURL(data.image, 'large');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  BEYOND BEST PRACTICE / ISO STANDARDS
    // ═══════════════════════════════════════════════════════════
    function populateISOStandards(data) {
        if (!data) return;
        setText('.iso-standards-heading, [data-strapi="isoHeading"]', data.heading);
        setHTML('.iso-standards-paragraph, [data-strapi="isoParagraph"]', inlineRichText(data.paragraph));

        if (data.image) {
            const img = document.querySelector('.iso-standards img, .beyond-best-practice img');
            if (img) img.src = mediaURL(data.image, 'large');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  WHY PARTNER WITH US  (partnerStats, partnerCards, CTAs)
    // ═══════════════════════════════════════════════════════════
    function ctaAnchor(cta, cls) {
        if (!cta || !cta.text) return '';
        const link = cta.link || '#';
        return `<a href="${link}" class="${cls}">${cta.text} ` +
            `<i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>`;
    }

    function populatePartnerSection(page) {
        setText('[data-strapi="partnerEyebrow"]', page.partnerEyebrow);
        setText('[data-strapi="partnerTitle"]', page.partnerTitle);
        setText('[data-strapi="partnerSubtitle"]', page.partnerSubtitle);

        const stats = document.querySelector('[data-strapi-grid="partnerStats"]');
        if (stats && Array.isArray(page.partnerStats)) {
            stats.innerHTML = page.partnerStats.map(s => `
                <div class="hp-stat">
                    <span class="hp-stat-icon">${resolveIcon(s.icon)}</span>
                    <div><span class="hp-stat-num">${s.number || ''}</span><span class="hp-stat-label">${s.label || ''}</span></div>
                </div>`).join('');
        }

        const grid = document.querySelector('[data-strapi-grid="partnerCards"]');
        if (grid && Array.isArray(page.partnerCards)) {
            grid.innerHTML = page.partnerCards.map(c => `
                <article class="hp-partner-card">
                    ${c.tag ? `<span class="hp-partner-tag">${c.tag}</span>` : ''}
                    <h3>${c.title || ''}</h3>
                    <p>${inlineRichText(c.desc || '')}</p>
                </article>`).join('');
        }

        const ctas = document.querySelector('[data-strapi-grid="partnerCtas"]');
        if (ctas) {
            ctas.innerHTML =
                ctaAnchor(page.partnerCtaPrimary, 'hp-btn-primary') +
                ctaAnchor(page.partnerCtaSecondary, 'hp-btn-ghost');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  SOLUTIONS BY INDUSTRY  (tabs + dynamic panel)
    // ═══════════════════════════════════════════════════════════
    function populateIndustrySection(page) {
        setText('[data-strapi="industryEyebrow"]', page.industryEyebrow);
        setText('[data-strapi="industryTitle"]', page.industryTitle);
        setText('[data-strapi="industrySubtitle"]', page.industrySubtitle);

        const industries = Array.isArray(page.industries) ? page.industries : [];
        const tabsWrap = document.querySelector('[data-strapi-grid="industryTabs"]');
        const panel = document.getElementById('hp-industry-panel');
        if (!tabsWrap || !panel || !industries.length) return;

        tabsWrap.innerHTML = industries.map((ind, i) => `
            <button class="hp-industry-tab${i === 0 ? ' is-active' : ''}" role="tab"
                aria-selected="${i === 0 ? 'true' : 'false'}" data-industry-idx="${i}">
                ${resolveIcon(ind.icon)} ${ind.tabLabel || ''}
            </button>`).join('');

        function renderPanel(idx) {
            const d = industries[idx];
            if (!d) return;
            const features = (Array.isArray(d.features) ? d.features : []).map(f => `
                <div class="hp-industry-feature">
                    <span class="hp-industry-feature-icon">${resolveIcon(f.icon)}</span>
                    <div><span class="hp-industry-feature-title">${f.title || ''}</span>
                    <span class="hp-industry-feature-sub">${f.sub || ''}</span></div>
                </div>`).join('');

            const ctaText = d.cta && d.cta.text ? d.cta.text : '';
            const ctaLink = d.cta && d.cta.link ? d.cta.link : '#';

            panel.innerHTML = `
                <div class="hp-industry-card-head">
                    <div class="hp-industry-card-icon">${resolveIcon(d.icon)}</div>
                    <div><h3 class="hp-industry-card-title">${d.title || ''}</h3>
                    <p class="hp-industry-card-desc">${inlineRichText(d.desc || '')}</p></div>
                </div>
                <div class="hp-industry-features">${features}</div>
                <div class="hp-industry-card-foot">
                    <span class="hp-industry-usedby"><strong>Used by:</strong> ${d.usedBy || ''}</span>
                    ${ctaText ? `<a href="${ctaLink}" class="hp-industry-cta">${ctaText} <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : ''}
                </div>`;
        }

        const tabs = tabsWrap.querySelectorAll('.hp-industry-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', function () {
                tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');
                renderPanel(parseInt(tab.getAttribute('data-industry-idx'), 10));
            });
        });

        renderPanel(0);
    }

    // ═══════════════════════════════════════════════════════════
    //  SECURITY & COMPLIANCE  (badges, cards, highlights, CTAs)
    // ═══════════════════════════════════════════════════════════
    function populateSecuritySection(page) {
        setText('[data-strapi="securityEyebrow"]', page.securityEyebrow);
        setText('[data-strapi="securityTitle"]', page.securityTitle);
        setText('[data-strapi="securitySubtitle"]', page.securitySubtitle);

        const badges = document.querySelector('[data-strapi-grid="complianceBadges"]');
        if (badges && Array.isArray(page.complianceBadges)) {
            badges.innerHTML = page.complianceBadges.map(b => `
                <span class="hp-compliance-badge">${resolveIcon(b.icon)} ${b.title || ''}</span>`).join('');
        }

        const cards = document.querySelector('[data-strapi-grid="securityCards"]');
        if (cards && Array.isArray(page.securityCards)) {
            cards.innerHTML = page.securityCards.map(c => `
                <article class="hp-security-card">
                    <div class="hp-security-icon">${resolveIcon(c.icon)}</div>
                    <h3>${c.title || ''}</h3>
                    <p>${inlineRichText(c.desc || '')}</p>
                    ${c.chip ? `<span class="hp-security-chip">${c.chip}</span>` : ''}
                </article>`).join('');
        }

        const highlights = document.querySelector('[data-strapi-grid="securityHighlights"]');
        if (highlights && Array.isArray(page.securityHighlights)) {
            highlights.innerHTML = page.securityHighlights.map(h => `
                <article class="hp-security-highlight">
                    <div class="hp-security-icon">${resolveIcon(h.icon)}</div>
                    <div><h3>${h.title || ''}</h3><p>${inlineRichText(h.desc || '')}</p></div>
                </article>`).join('');
        }

        const ctas = document.querySelector('[data-strapi-grid="securityCtas"]');
        if (ctas) {
            ctas.innerHTML =
                ctaAnchor(page.securityCtaPrimary, 'hp-btn-primary') +
                ctaAnchor(page.securityCtaSecondary, 'hp-btn-ghost');
        }
    }

    // Testimonials handled by shared initTestimonials from cms-helpers.js

    // ═══════════════════════════════════════════════════════════
    //  FAQ ACCORDION
    // ═══════════════════════════════════════════════════════════
    // ── Global Presence: CMS-driven pin placement + legend ────────────────────
    //
    //  MAP_COORDS keys must match the `countryKey` field stored in Strapi.
    //  Values are percentages of the SVG viewBox (2000 × 857) — they stay
    //  accurate at every screen size because .hp-map-wrap uses aspect-ratio.
    //  Matching invisible <circle data-country="..."> anchors are embedded in
    //  world-map.svg as the geographic source of truth for these coordinates.
    //
    // Coordinates calibrated against actual SVG path data:
    //   UK  southern coast: SVG (992, 182)   → 0°,   51°N
    //   Germany north:      SVG (1053.9,159) → 13°E, 54°N
    //   India NE coast:     SVG (1427.6,308) → 88°E, 22°N  ← key anchor
    //   Angola NW coast:    SVG (1121.2,572) → 12°E,  5°S
    // x-scale (eastern): +4.95 px/° from London baseline (x=992 at 0°)
    // y-scale (tropical/subtropical): 9.78 px/° · temperate: 4.34–7.7 px/°
    var MAP_COORDS = {
        'usa': { x: 22.0, y: 24.0 },  // Washington DC  (77°W, 39°N)
        'uk': { x: 49, y: 2 },  // London         ( 0°,  51.5°N)
        'germany': { x: 52, y: 5 },  // Berlin         (13.4°E, 52.5°N)
        'russia': { x: 58.9, y: 16.9 },  // Moscow         (37.6°E, 55.8°N)
        'india': { x: 71, y: 36 },  // Noida/Delhi    (77.2°E, 28.6°N)
        'russia': { x: 58.9, y: 16.9 },  // Moscow         (37.6°E, 55.8°N)
        'future-expansion': { x: 74.5, y: 45.3 },  // Bangkok/SE Asia(100.5°E, 13.8°N)
    };

    function renderMapSection(title, subtitle, locations) {
        if (title) setText('#hp-global-title', title);
        if (subtitle) setText('#hp-global-sub', subtitle);
        if (!locations || !locations.length) return;

        var mapWrap = document.querySelector('.hp-map-wrap');
        var legend = document.getElementById('hp-legend');

        // Clear any existing dynamically-added pins
        if (mapWrap) {
            mapWrap.querySelectorAll('.hp-pin').forEach(function (el) { el.remove(); });
        }
        if (legend) legend.innerHTML = '';

        // Sort by order field
        var sorted = locations.slice().sort(function (a, b) {
            return (a.order || 0) - (b.order || 0);
        });

        sorted.forEach(function (loc, idx) {
            var key = (loc.countryKey || '').toLowerCase().trim();
            var coords = MAP_COORDS[key];
            var num = String(idx + 1).padStart(2, '0');
            var color = loc.pinColor || (coords ? '#1a56db' : '#1a56db');

            // ── Render pin on map ─────────────────────────────────────────
            if (coords && mapWrap) {
                var pin = document.createElement('div');
                pin.className = 'hp-pin';
                pin.style.cssText = 'left:' + coords.x + '%;top:' + coords.y + '%;--pin-c:' + color;
                pin.setAttribute('aria-label', loc.title || key);
                pin.setAttribute('data-country', key);
                pin.innerHTML =
                    '<div class="hp-pin-head"><span class="hp-pin-num">' + num + '</span></div>' +
                    '<div class="hp-pin-tail"></div>';
                mapWrap.appendChild(pin);
            }

            // ── Render legend item ────────────────────────────────────────
            if (legend) {
                var item = document.createElement('div');
                item.className = 'hp-legend-item';
                item.setAttribute('data-country', key);
                item.innerHTML =
                    '<div class="hp-legend-dot-row">' +
                    '<span class="hp-legend-dot" style="background:' + color + '"></span>' +
                    '<strong class="hp-legend-title" style="color:' + color + '">' + (loc.title || '') + '</strong>' +
                    '</div>' +
                    '<p class="hp-legend-desc">' + inlineRichText(loc.description || '') + '</p>';
                legend.appendChild(item);
            }
        });
    }

    // ── Technology Partners: populate logo grid (ds.partner-logo[]) ──
    function renderLogoBox(p) {
        var logoObj = p.logo;
        var logoUrl = logoObj
            ? (logoObj.url
                ? (logoObj.url.startsWith('http') ? logoObj.url : BASE_URL + logoObj.url)
                : mediaURL(logoObj))
            : null;
        var name = p.name || '';
        var inner = logoUrl
            ? '<img class="hp-logo-img" src="' + logoUrl + '" alt="' + name + '" loading="lazy">'
            : '<div class="hp-logo-badge">' + (name.substring(0, 2).toUpperCase() || '?') + '</div>';
        return '<div class="hp-logo-box">' + inner + '<span class="hp-logo-name">' + name + '</span></div>';
    }

    function populateLogoGrid(gridId, title, partners, titleId) {
        if (title && titleId) setText(titleId, title);
        if (!partners || !partners.length) return;
        var grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = partners.map(renderLogoBox).join('');
    }

    function populateFAQ(items) {
        if (!Array.isArray(items) || !items.length) return;
        const container = document.getElementById('faq-accordions');
        if (!container) return;

        const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const chev = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

        container.innerHTML = sorted.map((faq, i) => {
            const num = String(i + 1).padStart(2, '0');
            return `<details class="faq-item"${i === 0 ? ' open' : ''}>
                <summary class="faq-q">
                    <span class="faq-num">${num}</span>
                    <span class="faq-q-text">${faq.question || ''}</span>
                    <span class="faq-chev">${chev}</span>
                </summary>
                <div class="faq-a-wrap"><div class="faq-a">${inlineRichText(faq.answer || '')}</div></div>
            </details>`;
        }).join('');

        const detailsAll = container.querySelectorAll('.faq-item');
        detailsAll.forEach(item => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    detailsAll.forEach(o => { if (o !== item) o.open = false; });
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════
    //  GET IN TOUCH  (contact section before footer)
    // ═══════════════════════════════════════════════════════════
    function populateContactSection(page) {
        if (page.contactSectionTitle)    setText('#hp-contact-title',        page.contactSectionTitle);
        if (page.contactSectionSubtitle) setText('#hp-contact-subtitle',     page.contactSectionSubtitle);
        if (page.contactEmail)           setText('#hp-contact-email',        page.contactEmail);
        if (page.contactEmailHours)      setText('#hp-contact-email-hours',  page.contactEmailHours);
        if (page.contactPhone)           setText('#hp-contact-phone',        page.contactPhone);
        if (page.contactPhoneHours)      setText('#hp-contact-phone-hours',  page.contactPhoneHours);
        if (page.contactSubmitText) {
            const btn = document.getElementById('hp-contact-submit');
            if (btn) btn.textContent = page.contactSubmitText;
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════════════════════════


    // ═══════════════════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════════════════
    (async function init() {
        try {
            const res = await getHomepagePage();
            const page = res.data;

            if (!page) {
                console.warn('[homepage-cms] Strapi returned no data for home-page');
                return;
            }

            populateSEO(page.SEO);
            populateHeroSection(page);
            populateHeroCTAs(page.CallToActionPrimary, page.callToActionSecondary);
            populateWhyChooseUs(page.whyChooseUs);
            populateWhyCloud(page.whyBusinessNeedsCloud);
            populateWhoWeAre(page.whoWeAre);
            populateLessComplexity(page.LessCloudComplexity);
            populateCloudSolutions(page.CloudSolutionsEngineered);
            populateIndustryValidated(page.IndustryLeadingExcellenceValidated);
            populateISOStandards(page.BeyondBestPracticeOurISOStandards);
            populatePartnerSection(page);
            populateIndustrySection(page);
            populateSecuritySection(page);
            renderMapSection(page.globalPresenceTitle, page.globalPresenceSubtitle, page.globalLocations);
            initTestimonials(page.testimonials);
            populateLogoGrid('hp-tech-grid', page.techPartnersTitle, page.techPartners, '#hp-tech-title');
            populateLogoGrid('hp-trusted-grid', page.trustedTitle, page.trustedPartners, '#hp-trusted-title');
            populateContactSection(page);
            populateFAQ(page.faq);


        } catch (err) {
            console.error('[homepage-cms] Failed to load home-page data:', err);
        }
    })();

})();