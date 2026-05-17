/**
 * seed-about-us-partners.js
 * ──────────────────────────
 * 1. Uploads every image in IMAGES_DIR to Strapi's media library.
 * 2. Links all uploaded images to the About Us page partnersCards field.
 *
 * Run (local):  node seed-about-us-partners.js
 * Run (prod):   node seed-about-us-partners.js https://admin.icsdc.com <TOKEN>
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.argv[2] || 'https://admin.icsdc.com';
const TOKEN = process.argv[3] || '5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e';
const IMAGES_DIR = 'C:\\Users\\saket\\OneDrive\\Desktop\\images\\images';

// ── Correct company name for each file (keyed by basename without extension) ──
const NAME_MAP = {
    'RHL': 'RHL',
    'SAARIGA': 'Saariga Constructions',
    'abhinav-it': 'Abhinav IT Solutions',
    'technocrats': 'Technocrats Techsoft LLP',
    'oscar': 'Oscar',
    'zicorp': 'ZiCorp',
    '5': 'Oscar',
    '8': 'Technocrats Techsoft LLP',
};

const jsonHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
};

// ── Upload one image, return the Strapi media object ─────────────────────────
async function uploadImage(filePath, filename) {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === '.svg' ? 'image/svg+xml'
        : ext === '.webp' ? 'image/webp'
            : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
                : 'image/png';

    const blob = new Blob([buffer], { type: mime });
    const form = new FormData();
    form.append('files', blob, filename);

    const res = await fetch(`${STRAPI_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
        body: form,
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Upload failed for ${filename} (${res.status}): ${err}`);
    }

    const data = await res.json();
    return data[0];
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
    console.log(`\n📡  Connecting to ${STRAPI_URL} …\n`);

    // 1. Collect image files
    const files = fs.readdirSync(IMAGES_DIR)
        .filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f))
        .sort();

    console.log(`📂  Found ${files.length} images in ${IMAGES_DIR}\n`);

    // 2. Upload each image
    const partners = [];
    for (const filename of files) {
        const filePath = path.join(IMAGES_DIR, filename);
        const key = path.basename(filename, path.extname(filename));
        const name = NAME_MAP[key] || key;
        const media = await uploadImage(filePath, filename);
        console.log(`  ✅  ${filename.padEnd(20)} → media ID ${media.id}  (${name})`);
        partners.push({ name, logo: media.id });
    }

    // 3. PUT to about-us-page
    console.log(`\n🚀  Linking ${partners.length} logos to about-us-page partnersCards …`);

    const putRes = await fetch(`${STRAPI_URL}/api/about-us-page`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ data: { partnersCards: partners } }),
    });

    const json = await putRes.json();

    if (!putRes.ok) {
        console.error('❌  Strapi error:');
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    // 4. Verify
    const verify = await fetch(
        `${STRAPI_URL}/api/about-us-page?populate[partnersCards][populate][logo]=true`,
        { headers: jsonHeaders }
    ).then(r => r.json());

    const saved = verify.data?.partnersCards ?? [];
    console.log(`\n✅  Done!`);
    console.log(`    partnersCards saved: ${saved.length} entries`);
    if (saved.length) {
        console.log('\n    Names seeded:');
        saved.forEach((p, i) => console.log(`      ${String(i + 1).padStart(2)}. ${p.name}`));
    }
    console.log();
}

seed().catch(err => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
