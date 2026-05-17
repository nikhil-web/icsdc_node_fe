/**
 * seed-homepage-contact.js
 * ─────────────────────────
 * Seeds ONLY the "Get In Touch" contact fields on the home-page single type.
 * Safe to run without touching any other homepage content.
 *
 * Run (local):  node seed-homepage-contact.js
 * Run (prod):   node seed-homepage-contact.js https://admin.icsdc.com <TOKEN>
 */

const STRAPI_URL = process.argv[2] || 'http://localhost:1337';
const TOKEN      = process.argv[3] || '5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e';

const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
};

const CONTACT_DATA = {
    contactSectionTitle:    "Get In Touch",
    contactSectionSubtitle: "Get the best price & premium cloud services. Share your details and requirements, and our team will get in touch with you shortly.",
    contactEmail:           "info@icsdc.com",
    contactEmailHours:      "Monday – Friday: 9:00 AM – 6:00 PM IST",
    contactPhone:           "+91 98109 58857",
    contactPhoneHours:      "Monday – Friday: 9:00 AM – 6:00 PM IST",
    contactSubmitText:      "Submit",
};

async function seed() {
    console.log(`\n📡  Connecting to ${STRAPI_URL} …\n`);

    const res = await fetch(`${STRAPI_URL}/api/home-page`, {
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
    const verify = await fetch(`${STRAPI_URL}/api/home-page`, { headers }).then(r => r.json());
    const d = verify.data;

    console.log('✅  Homepage contact section seeded!\n');
    console.log(`    Title       : ${d.contactSectionTitle}`);
    console.log(`    Email       : ${d.contactEmail}`);
    console.log(`    Email hours : ${d.contactEmailHours}`);
    console.log(`    Phone       : ${d.contactPhone}`);
    console.log(`    Phone hours : ${d.contactPhoneHours}`);
    console.log(`    Submit text : ${d.contactSubmitText}`);
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
