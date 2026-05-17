/**
 * seed-about-us.js
 * ─────────────────
 * Seeds the About Us page content (text fields + components) to Strapi.
 * Does NOT touch partnersCards — run seed-about-us-partners.js separately for logos.
 *
 * Run (local):  node seed-about-us.js
 * Run (prod):   node seed-about-us.js https://admin.icsdc.com <TOKEN>
 *
 * Journey fields (howStartedItems / whereWeOperateItems / dataCentersItems)
 * are plain text, one item per line — the frontend splits on "\n".
 */

const STRAPI_URL = process.argv[2] || 'http://localhost:1337';
const TOKEN      = process.argv[3] || '5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e';

const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
};

// ── Page data ─────────────────────────────────────────────────────────────────
const ABOUT_DATA = {

    // ── Hero ──────────────────────────────────────────────────────────────────
    heroTitle:       'Read Our Story',
    heroSubtitle:    "Because We've Never Settled for Just 'Good Enough'",
    heroDescription: "At ICSDC, we believe technology should be reliable, secure, and built to last. From the beginning, we chose quality over shortcuts — building infrastructure that delivers consistent performance and real peace of mind.",

    // ── Stats ──────────────────────────────────────────────────────────────────
    foundedYear:      '2024',
    countriesCount:   '5+',
    dataCentersCount: '3',
    servicesCount:    '40+',

    // ── Specializations ───────────────────────────────────────────────────────
    specializationsTitle: 'Our Core Specializations',
    specializationsCards: [
        { order: 1, icon: 'server',       title: 'Cloud & VPS Hosting',         desc: 'High-performance virtual and cloud servers with full root access and scalable resources.' },
        { order: 2, icon: 'dedicated',    title: 'Dedicated Servers',            desc: 'Bare-metal performance with enterprise-grade hardware for mission-critical workloads.' },
        { order: 3, icon: 'shield',       title: 'Security & Compliance',        desc: 'VAPT, firewall management, PAM/MFA solutions, and SSL — built-in from day one.' },
        { order: 4, icon: 'cloud',        title: 'Managed Cloud Solutions',      desc: 'Full-stack managed cloud on AWS, Azure, and Google Cloud tailored to your business.' },
        { order: 5, icon: 'backup',       title: 'Backup & Disaster Recovery',   desc: 'Acronis and Veeam-powered backup solutions with rapid restore and offsite replication.' },
        { order: 6, icon: 'headset',      title: '24/7 Expert Support',          desc: 'Round-the-clock support from certified infrastructure engineers, not tier-1 helpdesks.' },
    ],

    // ── Who We Are ────────────────────────────────────────────────────────────
    whoWeAreTitle:       'Who We Are',
    whoWeAreDescription: "ICSDC (International Cloud & Server Data Center) is a next-generation cloud infrastructure provider headquartered in Noida, India. We design, build, and manage hosting solutions that power businesses across industries — from fast-growing startups to established enterprises.",

    // ── What We Do ────────────────────────────────────────────────────────────
    whatWeDoTitle: 'What We Do',
    whatWeDoCards: [
        { order: 1, icon: 'server',    title: 'VPS & Cloud Servers',         desc: 'Scalable virtual and cloud servers with NVMe storage, dedicated resources, and full root access.' },
        { order: 2, icon: 'dedicated', title: 'Dedicated Servers',           desc: 'Bare-metal servers with enterprise CPUs, ECC RAM, and hardware RAID for maximum performance.' },
        { order: 3, icon: 'manage',    title: 'Managed Hosting',             desc: 'Fully managed cloud and VPS hosting — we handle patching, monitoring, and optimization for you.' },
        { order: 4, icon: 'shield',    title: 'Security Services',           desc: 'VAPT assessments, firewall hardening, SSL, PAM, and MFA solutions to protect your infrastructure.' },
        { order: 5, icon: 'backup',    title: 'Backup & Recovery',           desc: 'Automated backup and disaster recovery powered by Acronis and Veeam with offsite replication.' },
        { order: 6, icon: 'globe',     title: 'Multi-Cloud Management',      desc: 'AWS, Azure, and Google Cloud deployment and management with cost optimization built in.' },
    ],

    // ── Vision & Mission ──────────────────────────────────────────────────────
    visionTitle:  'Our Vision',
    visionText:   'To be the most trusted cloud infrastructure partner in Asia — known for reliability, transparency, and technical excellence.',
    missionTitle: 'Our Mission',
    missionText:  'To make enterprise-grade infrastructure accessible to every business, backed by expert support and a commitment to uptime.',

    // ── Why Choose Us ─────────────────────────────────────────────────────────
    whyChooseTitle:       'Why Businesses Choose ICSDC',
    whyChooseDescription: "We're not a reseller. We own our infrastructure, manage our network, and take full accountability for your uptime — so you can focus on growing your business.",

    // ── Journey ───────────────────────────────────────────────────────────────
    journeyTitle:    'Our Journey & Infrastructure',

    howStartedTitle: 'How We Started',
    // One bullet per line — frontend splits on \n into <li> elements
    howStartedItems: `ICSDC was founded in 2024 with a clear goal: to build cloud and hosting solutions that businesses can truly rely on.
We started from Noida, India, focusing on strong infrastructure, clean network design, and real technical expertise.
From day one, we invested in carrier-neutral data center partnerships, enterprise hardware, and a team of certified engineers.
Today, ICSDC powers clients across 5+ countries with a portfolio of 40+ infrastructure and security services.`,

    whereWeOperateTitle: 'Where We Operate',
    // One country per line — frontend renders each as a flag chip
    whereWeOperateItems: `🇮🇳 India
🇩🇪 Germany
🇺🇸 USA
🇸🇬 Singapore
🇬🇧 UK`,

    dataCentersTitle: 'Our Data Centers',
    // Format: "Name — Description" per line — frontend bolds the name
    dataCentersItems: `Noida 1 — CtrlS Data Center — Tier IV certified, 99.995% uptime SLA, enterprise power and cooling
Noida 2 — Yotta Data Center — Hyperscale infrastructure with multi-layer physical and network security
Mumbai — NTT Data Center — Strategically located for low-latency connectivity across western India and international routes`,

    // ── Life @ ICSDC ──────────────────────────────────────────────────────────
    lifeTitle:       'Life at ICSDC',
    lifeDescription: 'We work hard, learn continuously, and celebrate every win together.',

    // ── Partners ──────────────────────────────────────────────────────────────
    partnersTitle: 'Our Partners',
};

async function seed() {
    console.log(`\n📡  Connecting to ${STRAPI_URL} …\n`);

    const res = await fetch(`${STRAPI_URL}/api/about-us-page`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: ABOUT_DATA }),
    });

    const json = await res.json();

    if (!res.ok) {
        console.error('❌  Strapi error:');
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    // Verify
    const verify = await fetch(
        `${STRAPI_URL}/api/about-us-page?populate[specializationsCards]=*&populate[whatWeDoCards]=*`,
        { headers }
    ).then(r => r.json());
    const d = verify.data;

    console.log('✅  About Us page seeded!\n');
    console.log(`    Hero title          : ${d.heroTitle}`);
    console.log(`    Stats               : Founded ${d.foundedYear}, ${d.countriesCount} countries, ${d.dataCentersCount} DCs, ${d.servicesCount} services`);
    console.log(`    Specialization cards: ${(d.specializationsCards || []).length}`);
    console.log(`    What We Do cards    : ${(d.whatWeDoCards || []).length}`);
    console.log(`    howStartedItems     : ${d.howStartedItems ? '✅ set (' + d.howStartedItems.split('\n').filter(Boolean).length + ' lines)' : '❌ missing'}`);
    console.log(`    whereWeOperateItems : ${d.whereWeOperateItems ? '✅ set (' + d.whereWeOperateItems.split('\n').filter(Boolean).length + ' lines)' : '❌ missing'}`);
    console.log(`    dataCentersItems    : ${d.dataCentersItems ? '✅ set (' + d.dataCentersItems.split('\n').filter(Boolean).length + ' lines)' : '❌ missing'}`);
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
