// ══════════════════════════════════════════════════════════
//  Seed: cPanel Hosting Page — supportCards
//  Populates the Stress-Free Support section cards in Strapi.
//
//  Usage:
//    node seeds/cpanel-support-cards.js
//
//  Requires STRAPI_URL and STRAPI_TOKEN in .env
// ══════════════════════════════════════════════════════════

require('dotenv').config();

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
    console.error('❌  STRAPI_TOKEN is missing from .env');
    process.exit(1);
}

const supportCards = [
    {
        icon: 'fa-solid fa-headset',
        title: '24/7 Support in English & Hindi',
        desc: 'Our specialists are available round the clock to assist you anytime.'
    },
    {
        icon: 'fa-solid fa-comments',
        title: 'Easy-to-Reach Support Channels',
        desc: 'Simple, smooth, and reliable — every time. Reach us via Live Chat, Email, or Support Tickets.'
    },
    {
        icon: 'fa-solid fa-bolt',
        title: 'Fast Response Times',
        desc: 'Our average live-chat reply time is under 05 minutes, ensuring quick resolutions.'
    }
];

async function seed() {
    const url = `${STRAPI_URL}/api/cpanel-hosting-page`;

    console.log(`\n🌱  Seeding supportCards → ${url}\n`);

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${STRAPI_TOKEN}`
        },
        body: JSON.stringify({
            data: { supportCards }
        })
    });

    const json = await res.json();

    if (!res.ok) {
        console.error('❌  Strapi returned an error:');
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    console.log(`✅  supportCards seeded successfully (${supportCards.length} cards)`);
    supportCards.forEach((c, i) => console.log(`   ${i + 1}. ${c.title}`));
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
