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
 *   ✅ Best Cloud Services / Our Partnerships  (heading, paragraph, featureCards)
 *   ✅ Testimonials  (carousel)
 *   ✅ FAQ  (accordion)
 *   ✅ Get In Touch  (title, subtitle, email, phone, hours, submit label)
 *   ✅ Footer  (address, phone, email, socialLinks, linkGroups)
 * ──────────────────────────────────────────────────────────────
 */

import { getHomepagePage } from "./services/contentService.js";
import { populateIconCards, resolveIcon, initTestimonials } from "./utils/cms-helpers.js";

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
    function setText(sel, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (el) el.textContent = val;
    }

    function setHTML(sel, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (el) el.innerHTML = val;
    }

    function setAttr(sel, attr, val, root = document) {
        if (!val) return;
        const el = root.querySelector(sel);
        if (el) el.setAttribute(attr, val);
    }

    // ═══════════════════════════════════════════════════════════
    //  SEO
    // ═══════════════════════════════════════════════════════════
    function populateSEO(seo) {
        if (!seo) return;
        if (seo.metaTitle) document.title = seo.metaTitle;
        const desc = document.querySelector('meta[name="description"]');
        if (desc && seo.metaDescription) desc.setAttribute('content', seo.metaDescription);
    }

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
                    <p>${item.desc || ''}</p>
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
        setText('[data-strapi="whoWeAreParagraph"]', data.paragraph);

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
        setText('[data-strapi="lessComplexityParagraph"]', data.paragraph);

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
                <p>${service.description || service.desc || ''}</p>
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
        setText('[data-strapi="industryValidatedParagraph"]', data.paragraph);

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
        setText('.iso-standards-paragraph, [data-strapi="isoParagraph"]', data.paragraph);

        if (data.image) {
            const img = document.querySelector('.iso-standards img, .beyond-best-practice img');
            if (img) img.src = mediaURL(data.image, 'large');
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  BEST CLOUD SERVICES / OUR PARTNERSHIPS
    // ═══════════════════════════════════════════════════════════
    function populateBestCloudServices(data) {
        if (!data) return;
        setText('.best-cloud-services-title', data.heading);
        setText('.best-cloud-services-subtitle', data.paragraph);

        const cards = data.featureCards;
        if (!Array.isArray(cards) || !cards.length) return;

        const container = document.querySelector('[data-strapi-grid="ourPartnershipsCards"]');
        if (!container) return;

        container.innerHTML = cards.map(card => {
            const cls = card.variant === 'primary' ? 'btn-primary feature-cards' : 'btn-outline feature-cards';
            return `<button class="${cls}">${card.label}</button>`;
        }).join('');
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
                    '<p class="hp-legend-desc">' + (loc.description || '') + '</p>';
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
        const dl = document.getElementById('faq-accordions');
        if (!dl) return;

        // Sort by the `order` field if present
        const sorted = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        dl.innerHTML = sorted.map((faq, idx) => `
            <div class="faq-item" id="faq-item-${idx}">
                <dt>
                    <button class="faq-question" aria-expanded="false"
                            aria-controls="faq-answer-${idx}"
                            id="faq-btn-${idx}">
                        ${faq.question}
                        <svg class="faq-chevron" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </dt>
                <dd class="faq-answer" id="faq-answer-${idx}"
                    role="region" aria-labelledby="faq-btn-${idx}" hidden>
                    <p>${faq.answer}</p>
                </dd>
            </div>`).join('');

        // Accordion toggle
        dl.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                // Close all
                dl.querySelectorAll('.faq-question').forEach(b => {
                    b.setAttribute('aria-expanded', 'false');
                    const ans = document.getElementById(b.getAttribute('aria-controls'));
                    if (ans) ans.hidden = true;
                });
                // Open clicked (unless it was already open)
                if (!expanded) {
                    btn.setAttribute('aria-expanded', 'true');
                    const ans = document.getElementById(btn.getAttribute('aria-controls'));
                    if (ans) ans.hidden = false;
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
            populateBestCloudServices(page.BestCloudServices);
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