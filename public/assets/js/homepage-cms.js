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
 *   ✅ Footer  (address, phone, email, socialLinks, linkGroups)
 * ──────────────────────────────────────────────────────────────
 */

import { getHomepagePage } from "./services/contentService.js";
import { populateIconCards } from "./utils/cms-helpers.js";

(function () {

    // ── Strapi config ─────────────────────────────────────────
    const BASE_URL = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://13.126.9.248:1337');



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
    }

    // ═══════════════════════════════════════════════════════════
    //  HERO CTAs  (the hero text/price are handled by main.js)
    // ═══════════════════════════════════════════════════════════
    function populateHeroCTAs(primary, secondary) {
        // Primary CTA
        if (primary) {
            const btn = document.querySelector('.hero-cta-primary, [data-cta="primary"], .hero-btns .btn-primary');
            if (btn) {
                btn.textContent = primary.text;
                if (primary.link) btn.setAttribute('href', primary.link);
            }
        }
        // Secondary CTA
        if (secondary) {
            const btn = document.querySelector('.hero-cta-secondary, [data-cta="secondary"], .hero-btns .btn-outline');
            if (btn) {
                btn.textContent = secondary.text;
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
                <p>${service.description}</p>
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

    // ═══════════════════════════════════════════════════════════
    //  TESTIMONIALS
    // ═══════════════════════════════════════════════════════════
    function starSVG() {
        return `<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>`;
    }

    function getInitials(name) {
        return (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function populateTestimonials(items) {
        if (!Array.isArray(items) || !items.length) return;
        const grid = document.getElementById('testi-grid');
        const dotsWrap = document.getElementById('testi-dots');
        const prevBtn = document.getElementById('testi-prev');
        const nextBtn = document.getElementById('testi-next');
        if (!grid) return;

        grid.innerHTML = items.map((t, idx) => {
            const initials = getInitials(t.name);
            const stars = Array.from({ length: t.rating || 5 }, () => starSVG()).join('');
            const avatarSrc = t.Avatar ? mediaURL(t.Avatar, 'thumbnail') : null;
            const avatarHTML = avatarSrc
                ? `<img src="${avatarSrc}" alt="${t.name}" class="testi-avatar-img" loading="lazy">`
                : `<span class="testi-avatar-initials">${initials}</span>`;

            return `
            <article class="testi-card" role="listitem" data-testi-index="${idx}"
                     aria-label="Testimonial from ${t.name}">
                <div class="testi-left">
                    <div class="testi-avatar" aria-hidden="true">${avatarHTML}</div>
                    <div class="testi-client-info">
                        <p class="testi-name">${t.name}</p>
                        <p class="testi-job">${t.title || ''}</p>
                        <p class="testi-company">${t.company || ''}</p>
                    </div>
                    <div class="testi-rating" aria-label="Rating: ${t.rating || 5} out of 5 stars">
                        ${stars}
                    </div>
                </div>
                <div class="testi-right">
                    <blockquote class="testi-quote">${t.quote}</blockquote>
                </div>
            </article>`;
        }).join('');

        if (dotsWrap) {
            dotsWrap.innerHTML = items.map((_, i) => `
                <button class="testi-dot${i === 0 ? ' testi-dot-active' : ''}"
                        role="tab" aria-selected="${i === 0}"
                        aria-label="Go to testimonial ${i + 1}"
                        data-dot="${i}"></button>`).join('');

            const cards = Array.from(grid.querySelectorAll('.testi-card'));
            const dots = Array.from(dotsWrap.querySelectorAll('.testi-dot'));

            function scrollToCard(index) {
                const card = cards[index];
                if (card) grid.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
            }

            dots.forEach((btn, i) => btn.addEventListener('click', () => scrollToCard(i)));

            function currentIndex() {
                let closest = 0, minDist = Infinity;
                cards.forEach((card, i) => {
                    const dist = Math.abs(card.offsetLeft - grid.scrollLeft);
                    if (dist < minDist) { minDist = dist; closest = i; }
                });
                return closest;
            }

            prevBtn?.addEventListener('click', () => {
                const idx = currentIndex();
                scrollToCard(idx === 0 ? items.length - 1 : idx - 1);
            });
            nextBtn?.addEventListener('click', () => {
                const idx = currentIndex();
                scrollToCard(idx === items.length - 1 ? 0 : idx + 1);
            });
        }
    }

    // ═══════════════════════════════════════════════════════════
    //  FAQ ACCORDION
    // ═══════════════════════════════════════════════════════════
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
            populateWhoWeAre(page.whoWeAre);
            populateLessComplexity(page.LessCloudComplexity);
            populateCloudSolutions(page.CloudSolutionsEngineered);
            populateIndustryValidated(page.IndustryLeadingExcellenceValidated);
            populateISOStandards(page.BeyondBestPracticeOurISOStandards);
            populateBestCloudServices(page.BestCloudServices);
            populateTestimonials(page.testimonials);
            populateFAQ(page.faq);


        } catch (err) {
            console.error('[homepage-cms] Failed to load home-page data:', err);
        }
    })();

})();