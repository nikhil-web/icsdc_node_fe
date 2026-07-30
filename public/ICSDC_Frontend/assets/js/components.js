/* ══════════════════════════════════════════════════════════
   COMPONENTS.JS
   Handles: Testimonials (Strapi), FAQ (Strapi), Contact form
   Pattern: Mirrors main.js — Strapi-first, local fallback
══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── CONFIG (set by index.html before this script loads) ──
    const BASE_URL = (typeof STRAPI_URL !== "undefined" ? STRAPI_URL : "https://icsdcadmin.duckdns.org");
    const API_TOKEN = (typeof TOKEN !== "undefined" ? TOKEN : "");

    const headers = {
        "Content-Type": "application/json",
        ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    };

    /** Normalise CKEditor HTML for inline rendering (strip outer <p>, keep links). */
    function inlineRichText(html) {
        if (html == null) return html;
        return String(html)
            .replace(/<\/p>\s*<p[^>]*>/gi, '<br><br>')
            .replace(/^\s*<p[^>]*>/i, '')
            .replace(/<\/p>\s*$/i, '')
            .trim();
    }

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

        const jobLine = [t.jobTitle ?? t.title ?? '', t.company ?? ''].filter(Boolean).join(' · ');

        return `
        <article
            class="testi-card"
            role="listitem"
            data-testi-index="${index}"
            aria-label="Testimonial from ${t.name}"
        >
            <div class="testi-body">
                <span class="testi-quote-mark" aria-hidden="true">&#10077;</span>
                <blockquote class="testi-quote">${inlineRichText(t.quote || '')}</blockquote>
                <div class="testi-rating" aria-label="Rating: ${t.rating} out of 5 stars">
                    ${stars}
                </div>
            </div>
            <div class="testi-footer">
                <div class="testi-avatar" aria-hidden="true">${avatarHTML}</div>
                <div class="testi-client-info">
                    <p class="testi-name">${t.name}</p>
                    <p class="testi-job">${jobLine}</p>
                </div>
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
                    name: (entry.name ?? entry.attributes?.name ?? '').replace(/[,\s]+$/, '').trim(),
                    jobTitle: (entry.jobTitle ?? entry.attributes?.jobTitle ?? '').replace(/\s+at\s*$/i, '').trim(),
                    company: (entry.company ?? entry.attributes?.company ?? '').trim(),
                    quote: (entry.quote ?? entry.attributes?.quote ?? '').trim(),
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
        const container = document.getElementById('faq-accordions');
        if (!container || !items || !items.length) return;
        const chev = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

        container.innerHTML = items.map((faq, i) => {
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
        const form      = document.getElementById('contact-form');
        const successEl = document.getElementById('contact-success');
        const submitBtn = document.getElementById('hp-contact-submit');
        if (!form || !successEl || !submitBtn) return;

        // Remove any previous inline error
        function clearError() {
            form.querySelectorAll('.contact-form-error').forEach(el => el.remove());
        }

        function showError(msg) {
            clearError();
            const p = document.createElement('p');
            p.className = 'contact-form-error';
            p.style.cssText = 'color:#ef4444;font-size:13px;margin:0 0 8px;font-weight:500;';
            p.textContent = msg;
            submitBtn.before(p);
        }

        function validateEmail(v) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        }

        form.onsubmit = async function (e) {
            e.preventDefault();
            clearError();

            const name    = form.elements['name']?.value.trim() ?? '';
            const email   = form.elements['email']?.value.trim() ?? '';
            const website = form.elements['website']?.value.trim() ?? '';
            const message = form.elements['message']?.value.trim() ?? '';

            if (!name)                  { showError('Please enter your name.'); return; }
            if (!validateEmail(email))  { showError('Please enter a valid email address.'); return; }
            if (!message)               { showError('Please enter a message.'); return; }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';

            try {
                const res = await fetch('/api/strapi/api/contact-submissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: {
                            name,
                            email,
                            company: website,
                            subject: 'Homepage Enquiry',
                            message,
                        },
                    }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err?.error?.message || `Server error ${res.status}`);
                }

                form.style.display = 'none';
                successEl.classList.add('contact-success-visible');

            } catch (err) {
                showError('Something went wrong. Please try again or email us directly.');
                console.error('[contact-form]', err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit';
            }
        };
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
