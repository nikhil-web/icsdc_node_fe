/* ══════════════════════════════════════════════════════════
   COMPONENTS.JS
   Handles: Testimonials (Strapi), FAQ (Strapi), Contact form
   Pattern: Mirrors main.js — Strapi-first, local fallback
══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── CONFIG (set by index.html before this script loads) ──
    const BASE_URL = (typeof STRAPI_URL !== "undefined" ? STRAPI_URL : "http://13.126.9.248:1337");
    const API_TOKEN = (typeof TOKEN !== "undefined" ? TOKEN : "");

    const headers = {
        "Content-Type": "application/json",
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    };

    /** Lightweight fetch wrapper — consistent with strapiClient.js */
    async function strapiFetch(path) {
        const res = await fetch(`${BASE_URL}${path}`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status} on ${path}`);
        return res.json();
    }

    /** Convert Strapi media object → absolute URL */
    function mediaURL(mediaObj, format = "medium") {
        if (!mediaObj) return "";
        const url = mediaObj?.formats?.[format]?.url ?? mediaObj?.formats?.small?.url ?? mediaObj?.url ?? "";
        return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    }

    /* ─────────────────────────────────────────────────────────
       FALLBACK DATA — used when Strapi is offline
    ───────────────────────────────────────────────────────── */
    const LOCAL_TESTIMONIALS = [
        {
            name: "Aarav Sharma",
            jobTitle: "CTO",
            company: "TechVision India",
            quote: "Switching to ICSDC was a defining strategic move. Our previous cloud provider's outages were costing us dearly. Since migrating, our verified uptime has been flawless.",
            rating: 5,
            avatar: null,
        },
        {
            name: "Priya Mehta",
            jobTitle: "Head of Engineering",
            company: "FinServ Solutions",
            quote: "The support team is genuinely exceptional. We've had zero critical incidents since migration, and response times average under 10 minutes. That level of reliability is priceless.",
            rating: 5,
            avatar: null,
        },
        {
            name: "Rahul Gupta",
            jobTitle: "Founder & CEO",
            company: "CloudFirst Startup",
            quote: "ICSDC gave us enterprise-grade infrastructure without the enterprise price tag. Our deployment times dropped by 70% and our costs went down. Best infrastructure decision we've made.",
            rating: 5,
            avatar: null,
        },
        {
            name: "Divya Nair",
            jobTitle: "VP Engineering",
            company: "RetailEdge",
            quote: "ISO certifications, 99.95% uptime, and a support team that actually picks up the phone. ICSDC delivers on every promise. Highly recommended for any serious business.",
            rating: 5,
            avatar: null,
        },
        {
            name: "Suresh Kumar",
            jobTitle: "CIO",
            company: "HealthBridge",
            quote: "Security and compliance were our biggest concerns. ICSDC's infrastructure meets every regulatory requirement we have, and their team knows the domain inside out.",
            rating: 5,
            avatar: null,
        },
    ];

    const LOCAL_FAQ = [
        {
            question: "What makes ICSDC different from other cloud providers?",
            answer: "ICSDC operates its own data centers in India (Noida & Mumbai), giving us full control over hardware, network, and support. Unlike resellers, we build and manage our own infrastructure, which means faster response times, better uptime, and more competitive pricing.",
        },
        {
            question: "What is your uptime guarantee?",
            answer: "We offer a verified 99.95% uptime SLA across all our cloud services. This is backed by our redundant infrastructure, multiple network providers, and real-time monitoring systems.",
        },
        {
            question: "Can I migrate my existing website or server to ICSDC?",
            answer: "Yes! Our expert migration team handles the entire process — zero downtime migrations included with most plans. We support migrations from all major providers including AWS, Azure, GCP, and Hetzner.",
        },
        {
            question: "Do you offer 24/7 technical support?",
            answer: "Absolutely. Our support team is available 24/7/365 via phone, email, and live chat. You'll always speak to a real engineer — not a bot. We pride ourselves on resolving critical issues within 15 minutes.",
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit/debit cards, UPI, net banking, and bank transfers. For enterprise clients, we also offer invoice-based billing on NET 30/60 terms. All pricing is transparent — no hidden fees.",
        },
    ];

    /* ─────────────────────────────────────────────────────────
       TESTIMONIALS
    ───────────────────────────────────────────────────────── */

    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }

    function starSVG() {
        return `<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>`;
    }

    function buildTestimonialCard(t, index) {
        const initials = getInitials(t.name);
        const stars = Array.from({ length: t.rating }, () => starSVG()).join('');
        const avatarSrc = t.avatar ? mediaURL(t.avatar, "thumbnail") : null;

        const avatarHTML = avatarSrc
            ? `<img src="${avatarSrc}" alt="${t.name}" class="testi-avatar-img" loading="lazy">`
            : `<span class="testi-avatar-initials">${initials}</span>`;

        return `
        <article
            class="testi-card"
            role="listitem"
            data-testi-index="${index}"
            aria-label="Testimonial from ${t.name}"
        >
            <div class="testi-left">
                <div class="testi-avatar" aria-hidden="true">
                    ${avatarHTML}
                </div>
                <div class="testi-client-info">
                    <p class="testi-name">${t.name}</p>
                    <p class="testi-job">${t.jobTitle ?? t.title ?? ''}</p>
                    <p class="testi-company">${t.company}</p>
                </div>
                <div class="testi-rating" aria-label="Rating: ${t.rating} out of 5 stars">
                    ${stars}
                </div>
            </div>
            <div class="testi-right">
                <blockquote class="testi-quote">${t.quote}</blockquote>
            </div>
        </article>`;
    }

    function renderTestimonials(items) {
        const grid = document.getElementById('testi-grid');
        const dotsWrap = document.getElementById('testi-dots');
        const prevBtn = document.getElementById('testi-prev');
        const nextBtn = document.getElementById('testi-next');
        if (!grid || !dotsWrap) return;

        // Render all cards
        grid.innerHTML = items.map((t, i) => buildTestimonialCard(t, i)).join('');

        // Build dots
        dotsWrap.innerHTML = items.map((_, i) => `
            <button
                class="testi-dot${i === 0 ? ' testi-dot-active' : ''}"
                role="tab"
                aria-selected="${i === 0}"
                aria-label="Go to testimonial ${i + 1}"
                data-dot="${i}"
            ></button>`).join('');

        const cards = Array.from(grid.querySelectorAll('.testi-card'));
        const dots = Array.from(dotsWrap.querySelectorAll('.testi-dot'));

        function scrollToCard(index) {
            const card = cards[index];
            if (!card) return;
            grid.scrollTo({ left: card.offsetLeft - 4, behavior: 'smooth' });
        }

        dots.forEach((btn, i) => btn.addEventListener('click', () => scrollToCard(i)));

        function currentIndex() {
            const scrollLeft = grid.scrollLeft;
            let closest = 0, minDist = Infinity;
            cards.forEach((card, i) => {
                const dist = Math.abs(card.offsetLeft - scrollLeft);
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

        let scrollTimer;
        grid.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const idx = currentIndex();
                dots.forEach((d, i) => {
                    d.classList.toggle('testi-dot-active', i === idx);
                    d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
                });
            }, 80);
        });
    }

    async function initTestimonials() {
        let items = LOCAL_TESTIMONIALS;
        try {
            const res = await strapiFetch("/api/testimonials?populate=avatar&sort=createdAt:desc");
            if (res?.data?.length) {
                // Strapi v5 returns flat data (no nested attributes object)
                items = res.data.map(entry => ({
                    name: entry.name ?? entry.attributes?.name,
                    jobTitle: entry.jobTitle ?? entry.attributes?.jobTitle,
                    company: entry.company ?? entry.attributes?.company,
                    quote: entry.quote ?? entry.attributes?.quote,
                    rating: entry.rating ?? entry.attributes?.rating ?? 5,
                    avatar: entry.avatar ?? entry.attributes?.avatar?.data ?? null,
                }));
            }
        } catch (err) {
            console.warn("[components.js] Testimonials fetch failed — using local data:", err.message);
        }
        renderTestimonials(items);
    }

    /* ─────────────────────────────────────────────────────────
       FAQ ACCORDION
    ───────────────────────────────────────────────────────── */

    function renderFAQ(items) {
        const dl = document.getElementById('faq-accordions');
        if (!dl) return;

        let openIndex = 0;

        function render() {
            dl.innerHTML = items.map((faq, i) => {
                const isOpen = i === openIndex;
                return `
                <div class="faq-item${isOpen ? ' faq-open' : ''}" data-faq-index="${i}">
                    <dt>
                        <button
                            class="faq-question"
                            aria-expanded="${isOpen}"
                            aria-controls="faq-answer-${i}"
                            id="faq-question-${i}"
                        >
                            <span>${faq.question}</span>
                            <svg class="faq-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                                <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </dt>
                    <dd class="faq-answer" id="faq-answer-${i}" role="region" aria-labelledby="faq-question-${i}">
                        <p>${faq.answer}</p>
                    </dd>
                </div>`;
            }).join('');

            dl.querySelectorAll('.faq-question').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.closest('.faq-item').dataset.faqIndex, 10);
                    openIndex = (openIndex === index) ? null : index;
                    render();
                });
            });
        }

        render();
    }

    async function initFAQ() {
        let items = LOCAL_FAQ;
        try {
            const res = await strapiFetch("/api/faq-items?sort=order:asc");
            if (res?.data?.length) {
                items = res.data.map(entry => ({
                    question: entry.question ?? entry.attributes?.question,
                    answer: entry.answer ?? entry.attributes?.answer,
                }));
            }
        } catch (err) {
            console.warn("[components.js] FAQ fetch failed — using local data:", err.message);
        }
        renderFAQ(items);
    }

    /* ─────────────────────────────────────────────────────────
       CONTACT FORM
    ───────────────────────────────────────────────────────── */
    function initContactForm() {
        const form = document.getElementById('contact-form');
        const successEl = document.getElementById('contact-success');
        if (!form || !successEl) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            const payload = {
                name: form.elements['name']?.value ?? '',
                email: form.elements['email']?.value ?? '',
                website: form.elements['website']?.value ?? '',
                message: form.elements['message']?.value ?? '',
            };

            // Attempt to POST to Strapi contact-submissions endpoint if it exists
            try {
                await fetch(`${BASE_URL}/api/contact-submissions`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify({ data: payload }),
                });
            } catch (err) {
                // Silent fail — form feedback is UX-level, not dependent on this
                console.warn("[components.js] Contact form POST failed:", err.message);
            }

            form.style.display = 'none';
            successEl.classList.add('contact-success-visible');
        });
    }

    /* ─────────────────────────────────────────────────────────
       BOOT
    ───────────────────────────────────────────────────────── */
    function init() {
        // initTestimonials();  // async — fetches from Strapi
        // initFAQ();           // async — fetches from Strapi
        initContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
