/**
 * seed-partner-logos.js
 * ──────────────────────
 * 1. Uploads every image in IMAGES_DIR to Strapi's media library.
 * 2. Links all uploaded images to home-page techPartners AND trustedPartners,
 *    using the correct company name for each file (see NAME_MAP below).
 *
 * Run (local):  node seed-partner-logos.js
 * Run (prod):   node seed-partner-logos.js https://admin.icsdc.com <TOKEN>
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.argv[2] || 'https://admin.icsdc.com';
const TOKEN = process.argv[3] || '5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e';
const IMAGES_DIR = 'C:\\Users\\saket\\OneDrive\\Desktop\\images\\associate-images';

// ── Correct company name for each numbered file ───────────────────────────────
const NAME_MAP = {
    '1': 'RDM',
    '2': 'VMware',
    '3': 'Pure Storage',
    '4': 'TSplus',
    '5': 'Hexa Data Solutions',
    '6': 'Sophos',
    '7': 'Microsoft Azure',
    '8': 'Google Cloud',
    '9': 'Symantec',
    '10': 'Veeam',
    '11': 'Microsoft',
    '12': 'Forcepoint',
    '13': 'Fortinet',
    '14': 'AWS',
    '15': 'SAP',
    '16': 'Red Hat',
    '17': 'Trend Micro',
    '18': 'Webpros',
    '19': 'Acronis',
    '20': 'Dell',
    '21': 'McAfee',
    '22': 'HP',
};

const jsonHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
};

// ── Upload one image, return the Strapi media object ─────────────────────────
async function uploadImage(filePath, filename) {
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer], { type: 'image/png' });
    const form = new FormData();
    form.append('files', blob, filename);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },   // no Content-Type — browser sets boundary
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload failed for ${filename} (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data[0];   // Strapi returns an array
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
    // 1. Collect PNG files, sorted numerically (1.png, 2.png … 22.png)
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f))
        .sort((a, b) => parseInt(a) - parseInt(b));

    console.log(`\n📂  Found ${files.length} images in ${IMAGES_DIR}\n`);

    // 2. Upload each image
    const mediaIds = [];
    for (const filename of files) {
        const filePath = path.join(IMAGES_DIR, filename);
        const media = await uploadImage(filePath, filename);
        const key = path.basename(filename, path.extname(filename));
        const name = NAME_MAP[key] || key;
        console.log(`  ✅  ${filename.padEnd(10)} → media ID ${media.id}  (${name})`);
        mediaIds.push(media.id);
    }

    // 3. Build partner entries: { name, logo: <media id> }
    const partners = files.map((filename, i) => {
        const key = path.basename(filename, path.extname(filename));
        return {
            name: NAME_MAP[key] || key,
            logo: mediaIds[i],
        };
    });

    // 4. PUT to home-page — update the two partner fields.
    //    Also patch the home-page's embedded Footer.socialLinks which have stale
    //    null icon values from before the schema change (causes validation errors).
    console.log(`\n🚀  Linking ${partners.length} logos to techPartners + trustedPartners …`);

    const putRes = await fetch(`${STRAPI_URL}/api/home-page`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
            data: {
                techPartners: partners,
                trustedPartners: partners,
                // Clear stale embedded Footer socialLinks so validation passes
                Footer: { socialLinks: [] },
            },
        }),
    });

    const json = await putRes.json();

    if (!putRes.ok) {
        console.error('❌  Strapi error:');
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    // 5. Verify
    const verify = await fetch(
        `${STRAPI_URL}/api/home-page?populate[techPartners][populate][logo]=true&populate[trustedPartners][populate][logo]=true`,
        { headers: jsonHeaders }
    ).then(r => r.json());

    const tp = verify.data?.techPartners ?? [];
    const trp = verify.data?.trustedPartners ?? [];

    console.log(`\n✅  Done!`);
    console.log(`    techPartners    : ${tp.length} entries`);
    console.log(`    trustedPartners : ${trp.length} entries`);
    if (tp.length) {
        console.log('\n    Names seeded:');
        tp.forEach((p, i) => console.log(`      ${String(i + 1).padStart(2)}. ${p.name}`));
    }
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
