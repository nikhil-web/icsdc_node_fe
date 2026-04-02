/**
 * zimbra-page.js
 * ══════════════════════════════════════════════════════
 * Strapi Single Type integration for zimbra-hosting.html
 * Single Type API slug: "zimbra-page"
 * Endpoint: GET /api/zimbra-page?populate=deep
 *
 * Falls back to LOCAL_DATA when Strapi is unreachable.
 *
 * Sections managed:
 *  - Hero
 *  - Pillars (4 why-cards)
 *  - Features (zimbra-feat-badges)
 *  - Why ICSDC (cloud-power-cards)
 *  - CTA Band
 *  - Migration Steps
 *  - Comparison Table
 *  - Testimonials
 *  - FAQ
 *  - Dark CTA
 * ══════════════════════════════════════════════════════
 */

(function () {
    'use strict';

    // ── Config (injected by HTML before this script) ──────────────────────
    const BASE_URL = (typeof STRAPI_URL !== 'undefined' ? STRAPI_URL : 'http://13.126.9.248:1337');
    const API_TOKEN = (typeof TOKEN !== 'undefined' ? TOKEN : '');

    // ── Strapi fetch ───────────────────────────────────────────────────────
    async function fetchZimbraPage() {
        const url = BASE_URL + '/api/zimbra-page?populate=deep';
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...(API_TOKEN ? { Authorization: 'Bearer ' + API_TOKEN } : {}),
            },
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json.data; // Strapi v5 wraps in { data: { ... } }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  FALLBACK DATA — exact mirror of Strapi Single Type fields
    //  Change these to match whatever Strapi returns.
    // ══════════════════════════════════════════════════════════════════════
    const LOCAL_DATA = {

        // ── Hero ────────────────────────────────────────────────────────
        hero: {
            eyebrow: 'Zimbra Email Hosting',
            heading: 'Advanced Zimbra Hosting for Smarter Communication Workflows',
            subheading: 'Designed for Businesses That Expect More from Their Email Hosting',
            description: "Experience fast, secure, and reliable communication with ICSDC's Zimbra Hosting — built for teams that depend on uninterrupted email, calendar, chat, and collaboration every day.",
            ctaPrimary: 'Get Started with Zimbra',
            ctaSecondary: 'Call +91\u00a098109\u00a058857',
        },

        // ── 4 Pillars (why-us strip) ────────────────────────────────────
        pillars: [
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                title: 'Secure Email Environment',
                desc: 'Advanced anti-spam, anti-virus, and encrypted communication for enterprise-grade reliability and peace of mind.',
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
                title: 'High-Performance Mail Delivery',
                desc: 'Fast syncing, smooth access, and optimized server response for seamless daily communication workflows.',
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
                title: 'Easy Management & Control',
                desc: 'Simple admin tools for user accounts, policies, storage, and mailbox settings — managed from a central dashboard.',
            },
            {
                icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
                title: 'Collaboration-Ready Features',
                desc: 'Built-in calendars, contacts, tasks, chat, and file sharing for unified team productivity in one platform.',
            },
        ],

        // ── Features section ────────────────────────────────────────────
        features: {
            sectionLabel: 'Features',
            heading: 'Everything Your Team Needs for Reliable Email Hosting',
            subheading: 'A complete communication and collaboration suite — from email to document co-editing — all in one platform.',
            badges: [
                'Modern AJAX-Powered Email Experience',
                'Personalizable Interface with Your Branding',
                'Zimbra Desktop App for Offline Access',
                'Create & Manage Distribution Lists',
                'Full POP & IMAP Email Compatibility',
                'Seamless Synchronization with Outlook',
                'Advanced File, Mail & Calendar Sharing',
                'Built-In Instant Messaging for Teams',
                'Powerful Search Across Emails & Files',
                'Flexible Hybrid Deployment Support',
                'Mobile-Ready Contacts & Calendar Sync',
                'Optimized AJAX Mobile Webmail Interface',
                'Easy-to-Use Web Admin Console',
                'Role-Based Admin Access Levels',
                'Integrated Anti-Spam & Anti-Virus',
                'Works with LDAP & Active Directory',
                'Email Archiving with e-Discovery Tools',
                'Support for Multiple Domains',
                'Round-the-Clock Technical Support (24/7)',
                'High-Availability Ready Infrastructure',
                'Central Dashboard for System Monitoring',
            ],
        },

        // ── Why ICSDC cards ─────────────────────────────────────────────
        whyIcsdc: {
            sectionLabel: 'Why ICSDC',
            heading: 'Why Choose ICSDC Zimbra Hosting?',
            subheading: 'A Zimbra hosting experience built on stability, security, and real-world performance — with expert support that actually knows the platform.',
            cards: [
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
                    title: 'Modern & Responsive Interface',
                    desc: 'Clean interface that adapts beautifully to desktops, mobiles, and browsers. Personalize the look and feel to match your brand identity.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
                    title: 'Powerful 3rd-Party Integrations',
                    desc: 'Connect your Zimbra environment with Slack, Dropbox, Zoom, and more. ICSDC ensures integrations are configured for seamless productivity.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                    title: 'Secure Cloud Hosting Infrastructure',
                    desc: "Your Zimbra environment runs on ICSDC's hardened cloud infrastructure with strong privacy controls and top-tier data protection.",
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
                    title: 'Zimbra Connect \u2014 Built-In Communication',
                    desc: 'Chat, call, and collaborate without external apps. Team chat, 1:1 and group video calls, and screen sharing built right in.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>',
                    title: 'Z Drive \u2014 Next-Gen File Management',
                    desc: 'Store, sync, and share files through integrated Z Drive. Everything is cloud-backed and works securely across all devices.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>',
                    title: 'Z Docs \u2014 Collaborate Instantly',
                    desc: 'Create documents, spreadsheets, and presentations inside your mailbox. Real-time collaboration without leaving Zimbra.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
                    title: 'Mobile Sync That Just Works',
                    desc: 'Exchange ActiveSync compatibility keeps mails, calendars, contacts, and tasks in perfect sync across every smartphone and tablet.',
                },
                {
                    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>',
                    title: 'Switchable Interface Modes',
                    desc: 'Users can instantly switch between Modern UI and Classic UI based on preference or device — zero productivity loss during transitions.',
                },
            ],
        },

        // ── CTA Band ────────────────────────────────────────────────────
        ctaBand: {
            heading: 'Get the Right Zimbra Hosting Plan for Your Team',
            subheading: 'From small teams to enterprise organizations \u2014 ICSDC\u2019s Zimbra plans scale with your communication needs.',
            ctaPrimary: 'View Zimbra Plans',
            ctaSecondary: 'Call +91\u00a098109\u00a058857',
        },

        // ── Migration Steps ─────────────────────────────────────────────
        migration: {
            sectionLabel: 'Migration',
            heading: 'How ICSDC Helps You Move from Exchange or Google Workspace to Zimbra',
            subheading: "Migrating to Zimbra is simple with ICSDC. Our team combines Zimbra's proven tools with deep cloud expertise for a smooth, zero-disruption transition.",
            steps: [
                {
                    title: 'Review Your Current Setup',
                    desc: 'We evaluate your existing platform \u2014 Exchange, Office 365, or Google Workspace \u2014 to identify the right migration strategy for your team.',
                },
                {
                    title: 'Pick the Best Zimbra Edition',
                    desc: 'ICSDC helps you choose between Zimbra Open Source or Network Edition based on your collaboration needs and scale.',
                },
                {
                    title: 'Prepare Your Environment',
                    desc: 'Your Zimbra server is deployed and configured on ICSDC cloud with DNS and security settings ready before migration begins.',
                },
                {
                    title: 'Use the Right Migration Tools',
                    desc: 'Exchange/O365: Zimbra Migration Wizard. Google Workspace: Google migration utilities + IMAPSync for complete data transfer.',
                },
                {
                    title: 'Run a Pilot Migration',
                    desc: 'We test a few user accounts to confirm accuracy and stability before the full rollout \u2014 zero guesswork.',
                },
                {
                    title: 'Complete the Full Migration',
                    desc: 'All accounts migrated with minimal downtime, followed by post-migration checks to ensure everything runs smoothly from day one.',
                },
            ],
        },

        // ── Comparison Table ────────────────────────────────────────────
        comparison: {
            sectionLabel: 'Comparison',
            heading: 'Compare Zimbra vs Microsoft 365',
            subheading: 'See why Zimbra on ICSDC gives businesses more control, better privacy, and lower total cost of ownership.',
            col1Label: 'Feature / Capability',
            col2Label: 'Zimbra (ICSDC Hosted)',
            col3Label: 'Microsoft 365',
            rows: [
                { feature: 'Email Hosting', zimbra: '\u2713 Robust, secure mailboxes', ms365: '\u2713 Enterprise-grade mail' },
                { feature: 'Cost Efficiency', zimbra: '\u2713 More affordable for teams', ms365: '\u2717 Higher recurring costs' },
                { feature: 'Data Privacy & Local Hosting', zimbra: "\u2713 Hosted on ICSDC\u2019s secure infrastructure", ms365: '\u2717 Data on Microsoft global servers' },
                { feature: 'Customisation & Control', zimbra: '\u2713 Fully customizable UI, branding & admin', ms365: '\u2717 Limited customization options' },
                { feature: 'Collaboration Tools', zimbra: '\u2713 Zimbra Chat, Drive, Docs, Calendar', ms365: '\u2713 Teams, OneDrive, Office apps' },
                { feature: 'Vendor Lock-in', zimbra: '\u2713 No lock-in; flexible ecosystem', ms365: '\u2717 Strong ecosystem lock-in' },
                { feature: 'Admin Flexibility', zimbra: '\u2713 Greater control over mailflow & policies', ms365: '\u2717 More restricted admin freedoms' },
                { feature: 'Licensing Model', zimbra: '\u2713 Simple per-user plans', ms365: '\u2717 Complex tier-based licensing' },
                { feature: 'Best For', zimbra: 'Businesses wanting privacy, control & lower cost', ms365: 'Businesses tied heavily to MS Office ecosystem' },
            ],
        },

        // ── Testimonials ────────────────────────────────────────────────
        testimonials: [
            {
                name: 'Ravi Menon',
                title: 'IT Director',
                company: 'Financial Services Group',
                quote: "Switching to ICSDC Zimbra Hosting transformed our email operations. The migration was flawless and our team's productivity has improved significantly with the built-in collaboration tools.",
                rating: 5,
            },
            {
                name: 'Priya Sharma',
                title: 'Operations Head',
                company: 'Healthcare Network',
                quote: "The security and privacy controls with ICSDC Zimbra Hosting are exactly what our industry requires. We have complete data sovereignty and admin control — something Microsoft 365 couldn't offer us.",
                rating: 5,
            },
            {
                name: 'Arjun Nair',
                title: 'CTO',
                company: 'Manufacturing Enterprise',
                quote: "ICSDC's support team knew Zimbra inside out. From migration to daily management, every challenge was resolved quickly. We get enterprise email at a fraction of the cost.",
                rating: 5,
            },
            {
                name: 'Sunita Verma',
                title: 'CEO',
                company: 'EdTech Company',
                quote: 'Zimbra on ICSDC gave our 200-person team a single platform for email, chat, calendars, and file sharing. The mobile sync works perfectly across all our devices.',
                rating: 5,
            },
        ],

        // ── FAQ ─────────────────────────────────────────────────────────
        faq: {
            sectionLabel: 'FAQ',
            heading: 'Frequently Asked Questions',
            subheading: 'Still Have Questions? Our Zimbra Server experts are available 24/7 to walk you through the right plan.',
            ctaPhone: '+91 98109 58857',
            items: [
                {
                    question: 'What is Zimbra Hosting and how does it work?',
                    answer: "Zimbra Hosting provides a cloud-based email and collaboration suite where your mailboxes, calendars, contacts, and files are hosted on ICSDC's secure infrastructure with full admin control and enterprise-grade performance.",
                },
                {
                    question: 'Is Zimbra better than traditional email hosting solutions?',
                    answer: "Yes. Zimbra offers built-in collaboration tools like shared calendars, tasks, chat, and file management \u2014 features not commonly found in standard email hosting. It's a complete communication platform, not just email.",
                },
                {
                    question: 'Does Zimbra support Outlook, Apple Mail, and mobile apps?',
                    answer: 'Zimbra works seamlessly with Outlook, Apple Mail, Thunderbird, Android, and iOS devices, ensuring smooth access and synchronization across all platforms and clients.',
                },
                {
                    question: 'How secure is Zimbra Email Hosting at ICSDC?',
                    answer: "Your mail environment is protected through anti-spam filtering, anti-virus scanning, encrypted connections, firewalls, and ICSDC's hardened cloud infrastructure with continuous monitoring.",
                },
                {
                    question: 'Can I migrate my existing email data to Zimbra?',
                    answer: 'Yes. ICSDC provides assisted migration for emails, contacts, calendars, and files from platforms like cPanel, Google Workspace, Exchange, and Microsoft 365 with minimal downtime.',
                },
                {
                    question: 'How much storage can I get for my Zimbra mailboxes?',
                    answer: 'Storage is fully scalable. Start with a base plan and increase mailbox space or overall storage instantly as your team grows \u2014 no downtime required.',
                },
                {
                    question: 'Does ICSDC provide admin-level controls for Zimbra?',
                    answer: 'Yes. Administrators get full access to manage users, set policies, control storage, create groups, and enforce security rules from a centralized web admin console.',
                },
                {
                    question: 'How reliable is the uptime on ICSDC Zimbra Hosting?',
                    answer: 'ICSDC operates on high-availability infrastructure with redundant systems, ensuring stable uptime and uninterrupted email delivery for mission-critical business communication.',
                },
            ],
        },

        // ── Dark CTA ────────────────────────────────────────────────────
        darkCta: {
            heading: 'Power Your Communication with ICSDC Zimbra Hosting',
            subheading: 'Secure. Scalable. Feature-rich. Your entire team\u2019s communication platform in one place.',
            ctaPrimary: 'Get Started with Zimbra',
            ctaSecondary: 'Call +91\u00a098109\u00a058857',
        },
    };

    // ══════════════════════════════════════════════════════════════════════
    //  MAP Strapi response → LOCAL_DATA shape
    //  Strapi Single Type fields use camelCase matching LOCAL_DATA keys.
    //  Adjust field names here if your Strapi schema uses different names.
    // ══════════════════════════════════════════════════════════════════════
    function mapStrapiData(raw) {
        if (!raw) return LOCAL_DATA;
        return {
            hero: raw.hero ?? LOCAL_DATA.hero,
            pillars: raw.pillars ?? LOCAL_DATA.pillars,
            features: raw.features ?? LOCAL_DATA.features,
            whyIcsdc: raw.whyIcsdc ?? LOCAL_DATA.whyIcsdc,
            ctaBand: raw.ctaBand ?? LOCAL_DATA.ctaBand,
            migration: raw.migration ?? LOCAL_DATA.migration,
            comparison: raw.comparison ?? LOCAL_DATA.comparison,
            testimonials: raw.testimonials ?? LOCAL_DATA.testimonials,
            faq: raw.faq ?? LOCAL_DATA.faq,
            darkCta: raw.darkCta ?? LOCAL_DATA.darkCta,
        };
    }

    // ══════════════════════════════════════════════════════════════════════
    //  RENDER FUNCTIONS
    // ══════════════════════════════════════════════════════════════════════

    function renderHero(d) {
        var s = d.hero;
        _t('[data-z="hero-eyebrow"]', s.eyebrow);
        _t('[data-z="hero-heading"]', s.heading);
        _t('[data-z="hero-subheading"]', s.subheading);
        _t('[data-z="hero-description"]', s.description);
        _t('[data-z="hero-cta-primary"]', s.ctaPrimary);
        _t('[data-z="hero-cta-secondary"]', s.ctaSecondary);
    }

    function renderPillars(d) {
        var grid = document.querySelector('[data-z="pillars-grid"]');
        if (!grid) return;
        grid.innerHTML = d.pillars.map(function (p) {
            return '<div class="why-card">' +
                '<div class="why-icon">' + p.icon + '</div>' +
                '<h3>' + p.title + '</h3>' +
                '<p>' + p.desc + '</p>' +
                '</div>';
        }).join('');
    }

    function renderFeatures(d) {
        var f = d.features;
        _t('[data-z="features-label"]', f.sectionLabel);
        _t('[data-z="features-heading"]', f.heading);
        _t('[data-z="features-sub"]', f.subheading);
        var grid = document.querySelector('[data-z="features-grid"]');
        if (!grid) return;
        grid.innerHTML = f.badges.map(function (b) {
            return '<div class="zimbra-feat-badge">' + b + '</div>';
        }).join('');
    }

    function renderWhyIcsdc(d) {
        var w = d.whyIcsdc;
        _t('[data-z="why-label"]', w.sectionLabel);
        _t('[data-z="why-heading"]', w.heading);
        _t('[data-z="why-sub"]', w.subheading);
        var grid = document.querySelector('[data-z="why-grid"]');
        if (!grid) return;
        grid.innerHTML = w.cards.map(function (c) {
            return '<div class="cloud-power-card">' +
                '<div class="cloud-power-icon">' + c.icon + '</div>' +
                '<h3>' + c.title + '</h3>' +
                '<p>' + c.desc + '</p>' +
                '</div>';
        }).join('');
    }

    function renderCtaBand(d) {
        var c = d.ctaBand;
        _t('[data-z="cta-heading"]', c.heading);
        _t('[data-z="cta-sub"]', c.subheading);
        _t('[data-z="cta-primary"]', c.ctaPrimary);
        _t('[data-z="cta-secondary"]', c.ctaSecondary);
    }

    function renderMigration(d) {
        var m = d.migration;
        _t('[data-z="migration-label"]', m.sectionLabel);
        _t('[data-z="migration-heading"]', m.heading);
        _t('[data-z="migration-sub"]', m.subheading);
        var list = document.querySelector('[data-z="migration-steps"]');
        if (!list) return;
        list.innerHTML = m.steps.map(function (s, i) {
            return '<div class="zimbra-step">' +
                '<div class="zimbra-step-num">' + (i + 1) + '</div>' +
                '<div class="zimbra-step-body">' +
                '<h3>' + s.title + '</h3>' +
                '<p>' + s.desc + '</p>' +
                '</div>' +
                (i < m.steps.length - 1 ? '<span class="zimbra-step-arrow">›</span>' : '') +
                '</div>';
        }).join('');
    }

    function renderComparison(d) {
        var c = d.comparison;
        _t('[data-z="comp-label"]', c.sectionLabel);
        _t('[data-z="comp-heading"]', c.heading);
        _t('[data-z="comp-sub"]', c.subheading);
        var head = document.querySelector('[data-z="comp-head"]');
        if (head) {
            head.innerHTML = '<th scope="col">' + c.col1Label + '</th>' +
                '<th scope="col">' + c.col2Label + '</th>' +
                '<th scope="col">' + c.col3Label + '</th>';
        }
        var body = document.querySelector('[data-z="comp-body"]');
        if (!body) return;
        body.innerHTML = c.rows.map(function (r) {
            var z = r.zimbra.startsWith('\u2713') ? '<span class="zimbra-tick">' + r.zimbra + '</span>' : r.zimbra;
            var m = r.ms365.startsWith('\u2717') ? '<span class="zimbra-cross">' + r.ms365 + '</span>' :
                r.ms365.startsWith('\u2713') ? '<span class="zimbra-tick">' + r.ms365 + '</span>' : r.ms365;
            return '<tr><td>' + r.feature + '</td><td>' + z + '</td><td>' + m + '</td></tr>';
        }).join('');
    }

    function renderTestimonials(d) {
        var grid = document.getElementById('testi-grid');
        var dotsEl = document.getElementById('testi-dots');
        var prevBtn = document.getElementById('testi-prev');
        var nextBtn = document.getElementById('testi-next');
        if (!grid) return;

        function initials(n) { return n.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2); }
        function stars(n) {
            var s = '';
            for (var i = 0; i < n; i++) s += '<svg class="testi-star" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            return s;
        }

        grid.innerHTML = d.testimonials.map(function (t, i) {
            return '<article class="testi-card" role="listitem" data-testi-index="' + i + '">' +
                '<div class="testi-left">' +
                '<div class="testi-avatar"><span class="testi-avatar-initials">' + initials(t.name) + '</span></div>' +
                '<div class="testi-client-info"><p class="testi-name">' + t.name + '</p><p class="testi-job">' + t.title + '</p><p class="testi-company">' + t.company + '</p></div>' +
                '<div class="testi-rating">' + stars(t.rating) + '</div>' +
                '</div>' +
                '<div class="testi-right"><blockquote class="testi-quote">' + t.quote + '</blockquote></div>' +
                '</article>';
        }).join('');

        if (dotsEl) {
            dotsEl.innerHTML = d.testimonials.map(function (_, i) {
                return '<button class="testi-dot' + (i === 0 ? ' testi-dot-active' : '') + '" role="tab" aria-selected="' + (i === 0) + '" aria-label="Testimonial ' + (i + 1) + '" data-dot="' + i + '"></button>';
            }).join('');
        }

        var cards = Array.from(grid.querySelectorAll('.testi-card'));
        var dots = dotsEl ? Array.from(dotsEl.querySelectorAll('.testi-dot')) : [];
        function scrollTo(i) { var c = cards[i]; if (c) grid.scrollTo({ left: c.offsetLeft - 4, behavior: 'smooth' }); }
        dots.forEach(function (b, i) { b.addEventListener('click', function () { scrollTo(i); }); });
        function current() {
            var sl = grid.scrollLeft, best = 0, md = Infinity;
            cards.forEach(function (c, i) { var d2 = Math.abs(c.offsetLeft - sl); if (d2 < md) { md = d2; best = i; } });
            return best;
        }
        if (prevBtn) prevBtn.addEventListener('click', function () { var i = current(); scrollTo(i === 0 ? cards.length - 1 : i - 1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { var i = current(); scrollTo(i === cards.length - 1 ? 0 : i + 1); });
        var scrollTimer;
        grid.addEventListener('scroll', function () {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () {
                var i = current();
                dots.forEach(function (d2, n) { d2.classList.toggle('testi-dot-active', n === i); d2.setAttribute('aria-selected', n === i ? 'true' : 'false'); });
            }, 80);
        });
    }

    function renderFaq(d) {
        var f = d.faq;
        _t('[data-z="faq-label"]', f.sectionLabel);
        _t('[data-z="faq-heading"]', f.heading);
        _t('[data-z="faq-sub"]', f.subheading);
        _t('[data-z="faq-phone"]', f.ctaPhone);
        var dl = document.getElementById('zimbra-faq-accordions');
        if (!dl) return;
        var openIdx = 0;
        function render() {
            dl.innerHTML = f.items.map(function (item, i) {
                var isOpen = i === openIdx;
                return '<div class="faq-item' + (isOpen ? ' faq-open' : '') + '" data-faq-index="' + i + '">' +
                    '<dt><button class="faq-question" aria-expanded="' + isOpen + '" aria-controls="zfaq-ans-' + i + '" id="zfaq-q-' + i + '">' +
                    '<span>' + item.question + '</span>' +
                    '<svg class="faq-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
                    '</button></dt>' +
                    '<dd class="faq-answer" id="zfaq-ans-' + i + '" role="region" aria-labelledby="zfaq-q-' + i + '"><p>' + item.answer + '</p></dd>' +
                    '</div>';
            }).join('');
            dl.querySelectorAll('.faq-question').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var idx = parseInt(btn.closest('.faq-item').dataset.faqIndex, 10);
                    openIdx = (openIdx === idx) ? null : idx;
                    render();
                });
            });
        }
        render();
    }

    function renderDarkCta(d) {
        var c = d.darkCta;
        _t('[data-z="dcta-heading"]', c.heading);
        _t('[data-z="dcta-sub"]', c.subheading);
        _t('[data-z="dcta-primary"]', c.ctaPrimary);
        _t('[data-z="dcta-secondary"]', c.ctaSecondary);
    }

    // ── Tiny helper: set textContent on first matching element ────────────
    function _t(selector, value) {
        var el = document.querySelector(selector);
        if (el && value !== undefined) el.textContent = value;
    }

    // ── Page loader helper ────────────────────────────────────────────────
    function hideLoader() {
        var ldr = document.getElementById('page-loader');
        if (ldr) { ldr.classList.add('loader-done'); setTimeout(function () { ldr.classList.add('loader-hidden'); }, 520); }
    }

    // ══════════════════════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════════════════════
    async function init() {
        var data = LOCAL_DATA;
        try {
            var raw = await fetchZimbraPage();
            data = mapStrapiData(raw);
        } catch (err) {
            console.info('[zimbra-page.js] Strapi unavailable — using local fallback data.', err.message);
        }

        renderHero(data);
        renderPillars(data);
        renderFeatures(data);
        renderWhyIcsdc(data);
        renderCtaBand(data);
        renderMigration(data);
        renderComparison(data);
        renderTestimonials(data);
        renderFaq(data);
        renderDarkCta(data);
        hideLoader();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

})();