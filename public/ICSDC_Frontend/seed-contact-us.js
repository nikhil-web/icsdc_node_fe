/**
 * seed-contact-us.js
 * ───────────────────
 * Seeds contact information to the Strapi contact-us-page single type.
 *
 * Run (local):  node seed-contact-us.js
 * Run (prod):   node seed-contact-us.js https://admin.icsdc.com <TOKEN>
 */

const STRAPI_URL = process.argv[2] || 'http://localhost:1337';
const TOKEN      = process.argv[3] || '5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e';

const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
};

// ── Full contact-us page data ─────────────────────────────────────────────────
const CONTACT_DATA = {

    // ── Hero ──────────────────────────────────────────────────────────────────
    heroTitle:       "Let's Talk Infrastructure",
    heroSubtitle:    'Expert Guidance, Zero Pressure',
    heroDescription: "Whether you're planning, migrating, scaling, or just exploring options, our team is here to help you make the right infrastructure decisions — without pressure or confusion.",

    // ── How We Help ───────────────────────────────────────────────────────────
    helpTitle:       'How Can We Help You?',
    helpDescription: "Reach out to us for anything related to our cloud and hosting services. We'll listen first, understand your needs, and guide you toward the right solution.",
    helpCards: [
        {
            order: 1,
            icon:  'server',
            title: 'Questions about VPS, Cloud, or Managed Hosting',
            desc:  'Get clarity on VPS, Cloud Servers, Managed Hosting, Dedicated Servers, and which solution fits your workload.',
        },
        {
            order: 2,
            icon:  'sitemap',
            title: 'Help choosing the right infrastructure setup',
            desc:  "We'll help you design the right setup — from single-server deployments to multi-region, high-availability architectures.",
        },
        {
            order: 3,
            icon:  'arrows-rotate',
            title: 'Support with migration, performance, or security',
            desc:  'Expert help with server migrations, performance tuning, security hardening, and resolving infrastructure challenges.',
        },
        {
            order: 4,
            icon:  'handshake',
            title: 'Pricing, partnerships, or general inquiries',
            desc:  'Discuss pricing plans, enterprise agreements, reseller partnerships, or any general business inquiries.',
        },
    ],

    // ── What Happens Next ─────────────────────────────────────────────────────
    stepsTitle:       'What Happens Next',
    stepsDescription: 'A simple, transparent process from first contact to full support.',
    steps: [
        { order: 1, number: '01', title: 'You share your requirement or question',          description: 'Tell us about your current setup, goals, or the challenge you are facing — in as much or as little detail as you like.' },
        { order: 2, number: '02', title: 'Our team reviews and understands your use case',  description: 'Our team carefully reviews your requirements and understands your technical and business context.' },
        { order: 3, number: '03', title: 'We suggest the most suitable solution',           description: 'You receive a clear, tailored recommendation — no jargon, no upselling, just the most suitable path forward.' },
        { order: 4, number: '04', title: 'We support you through setup and beyond',         description: 'We are with you through the entire onboarding, setup, and beyond — with 24/7 expert assistance every step of the way.' },
    ],

    // ── Contact Info ──────────────────────────────────────────────────────────
    contactEmail:   'info@icsdc.com',
    contactPhone:   '+91 98109 58857',
    contactAddress: 'Plot No. 21 & 21A, 6th Floor, Sector 142, Noida, Uttar Pradesh 201304',
    officeHours:    'Monday – Friday: 9:00 AM – 6:00 PM IST | 24/7 Support for active clients',

    // ── Map — paste your exact Google Maps embed src here ────────────────────
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3504.7!2d77.4100!3d28.5850!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce5d5b3c4f123%3A0xabcdef1234567890!2sSector%20142%2C%20Noida%2C%20Uttar%20Pradesh%20201304!5e0!3m2!1sen!2sin!4v1700000000001!5m2!1sen!2sin',
};

async function seed() {
    console.log(`\n📡  Connecting to ${STRAPI_URL} …\n`);

    const res = await fetch(`${STRAPI_URL}/api/contact-us-page`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: CONTACT_DATA }),
    });

    const json = await res.json();

    if (!res.ok) {
        console.error('❌  Strapi error:');
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    // Verify
    const verify = await fetch(
        `${STRAPI_URL}/api/contact-us-page?populate[helpCards]=*&populate[steps]=*`,
        { headers }
    ).then(r => r.json());
    const d = verify.data;

    console.log('✅  Contact Us page seeded!\n');
    console.log(`    Email      : ${d.contactEmail}`);
    console.log(`    Phone      : ${d.contactPhone}`);
    console.log(`    Address    : ${d.contactAddress}`);
    console.log(`    Hours      : ${d.officeHours}`);
    console.log(`    Map URL    : ${d.mapEmbedUrl ? '✅ set' : '❌ missing'}`);
    console.log(`    Help cards : ${(d.helpCards || []).length} (icons: ${(d.helpCards || []).map(c => c.icon || '—').join(', ')})`);
    console.log(`    Steps      : ${(d.steps || []).length}`);
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
