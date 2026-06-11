#!/usr/bin/env node
/**
 * scripts/import-pages.js
 *
 * One-shot importer that converts hand-built HTML pages into builder-page
 * Strapi entries. Each imported page lands at the slug `<original>-builder`
 * so it never collides with the live page.
 *
 * Run with the same env vars the Node server uses:
 *   STRAPI_URL=http://localhost:1337
 *   STRAPI_TOKEN=<api-token-with-create-perms>
 *
 *   node scripts/import-pages.js
 *
 * Adding a new page = adding one entry to PAGES below with its sections[].
 * No HTML parsing — we hand-craft the sections JSON once so the result is
 * deterministic and easy to audit.
 */

require('dotenv').config();

const STRAPI_URL   = process.env.STRAPI_URL   || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

if (!STRAPI_TOKEN) {
    console.error('[importer] STRAPI_TOKEN is not set in .env — aborting.');
    process.exit(1);
}

// ─── Section helpers ────────────────────────────────────────────────
let sectionSeq = 0;
const nextId = () => 'sec-' + Date.now().toString(36) + '-' + (sectionSeq++);
const section = (type, props) => ({ id: nextId(), type, order: sectionSeq, visible: true, props });

// ─── Page definitions ───────────────────────────────────────────────
const PAGES = [
    /* ════════════════════════════════════════════════════════════════════════
       ABOUT US
       Source: public/ICSDC_Frontend/about-us.html
       ════════════════════════════════════════════════════════════════════════ */
    {
        title: 'About Us',
        slug: 'about-us-builder',
        metaTitle: 'About ICSDC | Our Story, Mission & Infrastructure',
        metaDescription:
            'Learn about ICSDC — our story, mission, core values, and the enterprise infrastructure that powers businesses across India and beyond.',
        sections: [
            section('hero', {
                eyebrow: '🏢 Our Story',
                title: 'Read Our Story',
                subtitle: "Because We've Never Settled for Just 'Good Enough'",
                description:
                    'At ICSDC, we believe technology should be reliable, secure, and built to last. From the beginning, we chose quality over shortcuts — building infrastructure that delivers consistent performance and real peace of mind.',
                imageUrl: '',
                imageAlt: '',
                imageSide: 'right',
                ctaPrimary:   { text: 'Get In Touch',     link: '/contact-us.html' },
                ctaSecondary: { text: 'Explore Services', link: '/' },
            }),

            // Section 2 — Core Specializations (.au-spec-card looks like .cloud-power-card)
            section('iconCards', {
                label: '',
                title: 'Our Core Specializations',
                subtitle: '',
                cardStyle: 'cloud-power',
                numbered: false,
                columns: 4,
                cards: [
                    { icon: 'database',     title: 'High-Performance VPS Hosting',         desc: 'Enterprise-grade VPS and fully managed solutions powered by Gold and Platinum processors with NVMe storage, built for speed, stability, and consistent performance.' },
                    { icon: 'cloud',        title: 'Highly Available Cloud Infrastructure', desc: 'Cloud platforms designed for reliability, with high-availability architecture, multiple ISP connectivity, and isolated virtual networks to keep systems running without interruption.' },
                    { icon: 'circle-check', title: 'Backup & Data Protection',              desc: 'Immutable S3-based backups with built-in snapshots and ransomware protection, ensuring fast recovery and secure data continuity when it matters most.' },
                    { icon: 'shield',       title: 'Security-First Network Design',         desc: 'Private L3 networking, dedicated switching, and firewall-protected environments that prioritize security, performance, and complete network isolation.' },
                ],
            }),

            // Section 3 — Who We Are (text only, no image)
            section('imageText', {
                eyebrow: '',
                title: 'Who We Are',
                body:
                    'At ICSDC (Indian Cloud Services & Data Center), we are a leading IT infrastructure partner helping businesses of all sizes succeed online with high-performance, secure, and scalable cloud solutions. From startups to enterprises, we provide robust hosting technologies and managed services that keep your digital operations running smoothly — always with performance, reliability, and support at the core of everything we do.',
                imageUrl: '',
                imageAlt: '',
                imageSide: 'left',
                cta: { text: '', link: '' },
            }),

            // Section 4 — What We Do (numbered cards)
            section('iconCards', {
                label: '',
                title: 'What We Do',
                subtitle: '',
                cardStyle: 'cloud-power',
                numbered: true,
                columns: 3,
                cards: [
                    { icon: '', title: 'Cloud Hosting Solutions',        desc: 'Flexible Linux and Windows cloud servers designed for speed, uptime, and seamless scalability across all workloads.' },
                    { icon: '', title: 'Dedicated & Private Cloud',      desc: 'High-performance dedicated servers and private cloud environments for businesses that require full control, security, and customization.' },
                    { icon: '', title: 'Managed IT Services',            desc: 'Comprehensive support including server management, backups, monitoring, and cloud infrastructure optimization so you can focus on growth.' },
                    { icon: '', title: 'Tally on Cloud',                 desc: 'Cloud-ready access for Tally ERP software, enabling financial operations from anywhere with enhanced security and zero local setup.' },
                    { icon: '', title: 'VDI & Remote Work Solutions',    desc: 'Virtual Desktop Infrastructure and enterprise-grade remote desktop support to keep teams connected and productive anywhere in the world.' },
                    { icon: '', title: 'Advanced Security Services',     desc: 'Firewall as a Service, Web Application Firewall, MFA, SSL certificates, and other security layers to safeguard your critical data.' },
                ],
            }),

            // Section 5 — Vision + Mission (2-col panels)
            section('iconCards', {
                label: '',
                title: 'Vision & Mission',
                subtitle: '',
                cardStyle: 'cloud-power',
                numbered: false,
                columns: 2,
                cards: [
                    { icon: 'eye',     title: 'Our Vision',  desc: 'To make cloud infrastructure something businesses never have to worry about.' },
                    { icon: 'bullseye', title: 'Our Mission', desc: 'To deliver secure, high-performance cloud solutions that simply work — every day.' },
                ],
            }),

            // Section 6 — Why Choose Us (text intro only — render as imageText body-only)
            section('imageText', {
                eyebrow: '',
                title: 'Why Choose ICSDC',
                body:
                    'We combine cutting-edge technology with dependable support and industry-trusted architecture to ensure your systems stay available, secure, and optimized. With a focus on cost-effectiveness, reliability, scalability, and customer-first service, ICSDC has earned the trust of clients across industries looking for a true infrastructure partner.',
                imageUrl: '',
                imageAlt: '',
                imageSide: 'left',
                cta: { text: '', link: '' },
            }),

            // Section 7 — Our Journey & Infrastructure (3 cards)
            section('iconCards', {
                label: '',
                title: 'Our Journey & Infrastructure',
                subtitle: '',
                cardStyle: 'cloud-power',
                numbered: false,
                columns: 3,
                cards: [
                    { icon: 'rocket', title: 'How We Started',
                      desc: 'ICSDC was founded in 2024 with a clear goal: to build cloud and hosting solutions that businesses can truly rely on. We started from Noida, India, focusing on strong infrastructure, clean network design, and real operational reliability — not shortcuts.' },
                    { icon: 'globe',  title: 'Where We Operate',
                      desc: 'ICSDC serves clients across 5+ countries, delivering reliable cloud infrastructure from India to global markets. Our low-latency network and multi-ISP backbone ensure consistent performance wherever your business operates. (India · Germany · USA · UK · Russia)' },
                    { icon: 'server', title: 'Our Data Centers',
                      desc: 'We operate from three strategically located, carrier-neutral facilities — each built for maximum uptime, security, and redundancy. Noida 1 (CtrlS, Tier IV, 99.995% SLA), Noida 2 (Yotta, hyperscale), Mumbai (NTT, low-latency for western India & international routes).' },
                ],
            }),

            // Section 8 — Life @ ICSDC (gallery)
            section('gallery', {
                title: 'Life @ ICSDC',
                subtitle: 'Where ideas, collaboration, and everyday moments come together.',
                items: [
                    { imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', imageAlt: 'Team event at ICSDC', label: 'Team Events' },
                    { imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80', imageAlt: 'Celebrations at ICSDC', label: 'Celebrations' },
                    { imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80', imageAlt: 'Collaboration at ICSDC', label: 'Collaboration' },
                    { imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', imageAlt: 'ICSDC office culture', label: 'Culture' },
                    { imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80', imageAlt: 'Growth and learning at ICSDC', label: 'Growth' },
                ],
            }),

            // Section 9 — Partners (logoCloud)
            section('logoCloud', {
                label: '',
                title: 'Our Partners',
                subtitle: '',
                logos: [
                    { name: 'Partner 1', imageUrl: '', link: '' },
                    { name: 'Partner 2', imageUrl: '', link: '' },
                    { name: 'Partner 3', imageUrl: '', link: '' },
                    { name: 'Partner 4', imageUrl: '', link: '' },
                    { name: 'Partner 5', imageUrl: '', link: '' },
                    { name: 'Partner 6', imageUrl: '', link: '' },
                ],
            }),

            // Final CTA Band
            section('ctaBand', {
                variant: 'dark',
                title: "Whether You're Growing or Scaling, We're Here",
                description: 'Start a conversation with ICSDC today. Our experts are ready to help you find the right infrastructure solution.',
                ctaPrimary:   { text: 'Contact Us Now',  link: '/contact-us.html' },
                ctaSecondary: { text: 'Explore Services', link: '/' },
            }),
        ],
    },

    /* ════════════════════════════════════════════════════════════════════════
       CONTACT US
       Source: public/ICSDC_Frontend/contact-us.html
       ════════════════════════════════════════════════════════════════════════ */
    {
        title: 'Contact Us',
        slug: 'contact-us-builder',
        metaTitle: 'Contact ICSDC | Get in Touch With Our Cloud Experts',
        metaDescription:
            'Reach the ICSDC team — talk to our cloud and hosting specialists about your infrastructure, migration, or pricing requirements.',
        sections: [
            // Hero (no image on contact, content centered)
            section('hero', {
                eyebrow: '💬 Get in Touch',
                title: "Let's Talk About Your Infrastructure",
                subtitle: 'Our team is ready to help you build something reliable.',
                description:
                    "Whether you're scaling up, migrating, or planning a brand-new deployment — we're happy to walk through the options with you. Drop us a message below or use any of the channels on the right.",
                imageUrl: '',
                imageAlt: '',
                imageSide: 'right',
                ctaPrimary:   { text: 'Send Us a Message', link: '#contact-form' },
                ctaSecondary: { text: 'View Our Services', link: '/' },
            }),

            // Section 2 — How Can We Help (4 cards)
            section('iconCards', {
                label: '',
                title: 'How Can We Help You?',
                subtitle: '',
                cardStyle: 'cloud-power',
                numbered: false,
                columns: 4,
                cards: [
                    { icon: 'server',         title: 'Cloud & Hosting Questions',  desc: 'Get clarity on VPS, Cloud Servers, Managed Hosting, Dedicated Servers, and which solution fits your workload.' },
                    { icon: 'sitemap',        title: 'Infrastructure Planning',    desc: "We'll help you design the right setup — from single-server deployments to multi-region, high-availability architectures." },
                    { icon: 'arrows-rotate', title: 'Migration & Performance',    desc: 'Support with server migrations, performance tuning, security hardening, and resolving infrastructure challenges.' },
                    { icon: 'handshake',      title: 'Pricing & Partnerships',     desc: 'Discuss pricing plans, enterprise agreements, reseller partnerships, or any general business inquiries.' },
                ],
            }),

            // Section 3 — What Happens Next (processSteps)
            section('processSteps', {
                label: '',
                title: 'What Happens Next',
                subtitle: '',
                steps: [
                    { title: 'Share Your Requirement',        desc: '' },
                    { title: 'We Review Your Use Case',       desc: '' },
                    { title: 'We Suggest the Right Solution', desc: '' },
                    { title: 'Setup & Beyond',                desc: '' },
                ],
            }),

            // Section 4 — Map embed
            section('mapEmbed', {
                title: 'Find Us',
                embedUrl:
                    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.7!2d77.4100!3d28.5850!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce8b12345678%3A0xabcdef1234567890!2sSector%20142%2C%20Noida%2C%20Uttar%20Pradesh%20201304!5e0!3m2!1sen!2sin!4v1700000000001!5m2!1sen!2sin',
                height: 420,
            }),

            // Section 5 — Contact Info cards
            section('contactInfo', {
                title: 'Get in Touch',
                subtitle: "We're always ready to help. Reach out through any of the channels below.",
                items: [
                    { icon: 'envelope', label: 'Email Address', value: 'info@icsdc.com',                                                            link: 'mailto:info@icsdc.com' },
                    { icon: 'phone',    label: 'Phone Number',  value: '+91 98109 58857',                                                           link: 'tel:+919810958857' },
                    { icon: 'map-pin',  label: 'Our Address',   value: 'Plot No. 21 & 21A, 6th Floor, Sector 142, Noida, Uttar Pradesh 201304',     link: '' },
                    { icon: 'clock',    label: 'Office Hours',  value: 'Monday – Friday: 9:00 AM – 6:00 PM IST | 24/7 Support for active clients', link: '' },
                ],
            }),

            // Section 6 — The Contact Form
            section('contactForm', {
                title: 'Send Us a Message',
                subtitle: '',
                subjectOptions:
                    'VPS / Cloud Hosting Questions\nInfrastructure Planning\nMigration & Performance\nSecurity & Compliance\nPricing & Plans\nPartnerships & Reseller\nTechnical Support\nOther / General Inquiry',
                successMessage:
                    'Thank you for reaching out. Our team will get back to you shortly.',
            }),
        ],
    },
];

// ─── Run ────────────────────────────────────────────────────────────
async function upsert(page) {
    // Check if a builder-page with this slug already exists
    const listUrl = `${STRAPI_URL}/api/builder-pages?filters[slug][$eq]=${encodeURIComponent(page.slug)}&pagination[pageSize]=1`;
    const head = await fetch(listUrl, { headers: { Authorization: `Bearer ${STRAPI_TOKEN}` } });
    if (!head.ok) {
        const text = await head.text();
        throw new Error(`list failed for ${page.slug}: ${head.status} ${text}`);
    }
    const existing = await head.json();
    const exists = existing && Array.isArray(existing.data) && existing.data[0];

    const body = {
        data: {
            title: page.title,
            slug: page.slug,
            sections: page.sections,
            metaTitle: page.metaTitle,
            metaDescription: page.metaDescription,
        },
    };

    let res, label;
    if (exists) {
        const docId = exists.documentId || exists.id;
        const url = `${STRAPI_URL}/api/builder-pages/${docId}`;
        res = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
            body: JSON.stringify(body),
        });
        label = `updated ${page.slug} (documentId=${docId})`;
    } else {
        res = await fetch(`${STRAPI_URL}/api/builder-pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
            body: JSON.stringify(body),
        });
        label = `created ${page.slug}`;
    }

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${label} FAILED: ${res.status} ${text}`);
    }
    const out = await res.json();
    const newId = out?.data?.documentId || out?.data?.id;
    console.log(`[importer] ${label} → documentId=${newId}`);

    // Publish so /builder/<slug> resolves via find/findOne (Strapi defaults to draft mode otherwise)
    if (newId) {
        try {
            const pubRes = await fetch(`${STRAPI_URL}/api/builder-pages/${newId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${STRAPI_TOKEN}`,
                },
                body: JSON.stringify({ data: { publishedAt: new Date().toISOString() } }),
            });
            if (pubRes.ok) {
                console.log(`[importer]   ↳ published`);
            } else {
                const text = await pubRes.text();
                console.log(`[importer]   ↳ publish failed (${pubRes.status}): ${text.slice(0, 120)}`);
            }
        } catch (err) {
            console.log(`[importer]   ↳ publish error: ${err.message}`);
        }
    }
}

(async () => {
    for (const page of PAGES) {
        try {
            await upsert(page);
        } catch (err) {
            console.error('[importer] ', err.message);
        }
    }
    console.log('[importer] done — visit /builder/<slug> on the Node server to preview.');
})();
