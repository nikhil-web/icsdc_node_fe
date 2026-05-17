/**
 * seed-nav-icons.js
 * ─────────────────
 * Updates ONLY the icon fields in the Strapi navigation single-type.
 * Everything else (labels, urls, subtexts, cols, etc.) is left untouched.
 *
 * Run: node seed-nav-icons.js
 */

const STRAPI_URL = "http://localhost:1337";
const TOKEN = "5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e";

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
};

// ─── Navigation payload — full menus array with FA icon names ───────────────
// Icons follow the same resolution rules as cms-helpers.js resolveIcon():
//   plain name  → fa-solid   e.g. "server", "globe", "cloud-arrow-up"
//   brands:xxx  → fa-brands  e.g. "brands:windows", "brands:linux"
//   regular:xxx → fa-regular e.g. "regular:bell"

const MENUS = [
    // ── Services (has sections + sub-items) ──────────────────────────────────
    {
        lebel: "Services",
        icon: "server",                              // was 🖥️
        desc: "Explore all our infrastructure services",
        cols: 2,
        directLink: null,
        isHighlighted: false,
        sections: [
            {
                lebel: "Dedicated Server",
                icon: "server",
                items: [
                    { icon: "brands:windows",  title: "Windows dedicated Server",   subtext: "Sub Menu Details & subtext", url: "/windows-dedicated-server.html" },
                    { icon: "brands:linux",    title: "Linux Dedicated Hosting",    subtext: "Sub Menu Details & subtext", url: "/linux-dedicated-server.html" },
                    { icon: "gear",            title: "Managed dedicated Server",   subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "microchip",       title: "GPU Dedicated Server",       subtext: "Sub Menu Details & subtext", url: "/gpu-dedicated-server.html" },
                    { icon: "bolt",            title: "NVme dedicated Server",      subtext: "Sub Menu Details & subtext", url: "/nvme-dedicated-servers.html" },
                    { icon: "server",          title: "Bare Metal Server",          subtext: "Sub Menu Details & subtext", url: "/bare-metal-server.html" },
                    { icon: "box",             title: "Another Menu Item",          subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "box",             title: "Another Menu Item",          subtext: "Sub Menu Details & subtext", url: null },
                ],
            },
            {
                lebel: "VPS Hosting",
                icon: "layer-group",                 // was ⚙️
                items: [
                    { icon: "brands:windows",  title: "Windows VPS Hosting",        subtext: "Sub Menu Details & subtext", url: "/windows-vps-hosting.html" },
                    { icon: "desktop",         title: "Virtual Machine",            subtext: "Sub Menu Details & subtext", url: "/virtual-machine.html" },
                    { icon: "brands:linux",    title: "Linux VPS Hosting",          subtext: "Sub Menu Details & subtext", url: "/linux-vps-hosting.html" },
                    { icon: "server",          title: "VPS Cpanel Hosting",         subtext: "Sub Menu Details & subtext", url: "/vps-cpanel.html" },
                    { icon: "gear",            title: "Managed VPS Hosting",        subtext: "Sub Menu Details & subtext", url: "/managed-vps-hosting.html" },
                    { icon: "chart-bar",       title: "Forex VPS",                  subtext: "Sub Menu Details & subtext", url: "/forex-vps.html" },
                    { icon: "flask",           title: "VPS Trial & Demo",           subtext: "Sub Menu Details & subtext", url: null },
                ],
            },
            {
                lebel: "Cloud Hosting",
                icon: "cloud",                       // was ☁️
                items: [
                    { icon: "cloud",           title: "Public Cloud",               subtext: "Sub Menu Details & subtext", url: "/cloud-hosting.html" },
                    { icon: "lock",            title: "Private Cloud",              subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "network-wired",   title: "Hybrid Cloud",               subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "bolt",            title: "Multi Cloud",                subtext: "Sub Menu Details & subtext", url: null },
                ],
            },
            {
                lebel: "Email",
                icon: "envelope",                    // was ✉️
                items: [
                    { icon: "envelope",        title: "Business Email",             subtext: "Sub Menu Details & subtext", url: "/email-hosting.html" },
                    { icon: "lock",            title: "Secure Email",               subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "envelope",        title: "Email Hosting",              subtext: "Sub Menu Details & subtext", url: "/email-hosting.html" },
                    { icon: "right-left",      title: "Email Migration",            subtext: "Sub Menu Details & subtext", url: null },
                    { icon: "envelope",        title: "Advanced Zimbra Hosting",    subtext: "Designed for Businesses That Expect More from Their Email Hosting", url: "/zimbra-hosting.html" },
                ],
            },
        ],
        items: [],
    },

    // ── Web Hosting ──────────────────────────────────────────────────────────
    {
        lebel: "Web Hosting",
        icon: "globe",                               // was 🌐
        desc: "Fast, reliable web hosting solutions",
        cols: 3,
        directLink: null,
        isHighlighted: false,
        sections: [],
        items: [
            { icon: "globe",               title: "Web Hosting",                subtext: "Sub Menu Details & subtext", url: "/web-hosting.html" },
            { icon: "bolt",                title: "Shared Hosting",             subtext: "Sub Menu Details & subtext", url: "/shared-hosting.html" },
            { icon: "brands:wordpress",    title: "WordPress Hosting",          subtext: "Sub Menu Details & subtext", url: "/wordpress-hosting.html" },
            { icon: "cart-shopping",       title: "eCommerce Hosting",          subtext: "Sub Menu Details & subtext", url: null },
            { icon: "building",            title: "Business Hosting",           subtext: "Sub Menu Details & subtext", url: null },
            { icon: "rocket",              title: "Reseller Hosting",           subtext: "Sub Menu Details & subtext", url: "/reseller-hosting.html" },
            { icon: "gear",                title: "Managed Hosting",            subtext: "Sub Menu Details & subtext", url: null },
            { icon: null,                  title: null,                         subtext: null,                         url: null },
        ],
    },

    // ── Domain ───────────────────────────────────────────────────────────────
    {
        lebel: "Domain",
        icon: "globe",                               // was 🌍
        desc: "Register and manage your domains",
        cols: 2,
        directLink: null,
        isHighlighted: false,
        sections: [],
        items: [
            { icon: "magnifying-glass",    title: "Domain Search",              subtext: "Sub Menu Details & subtext", url: null },
            { icon: "right-left",          title: "Domain Transfer",            subtext: "Sub Menu Details & subtext", url: "/domain-transfer.html" },
            { icon: "rotate",              title: "Domain Renewal",             subtext: "Sub Menu Details & subtext", url: null },
            { icon: "tag",                 title: "Domain Pricing",             subtext: "Sub Menu Details & subtext", url: null },
        ],
    },

    // ── Backup & Security ────────────────────────────────────────────────────
    {
        lebel: "Backup & Security",
        icon: "shield-halved",                       // was 🔐
        desc: "Details about backup and security",
        cols: 2,
        directLink: null,
        isHighlighted: false,
        sections: [],
        items: [
            { icon: "cloud-arrow-up",      title: "Acronis Backup",             subtext: "Sub Menu Details & subtext", url: "/acronis-backup.html" },
            { icon: "hard-drive",          title: "Veeam Backup",               subtext: "Sub Menu Details & subtext", url: "/veeam-backup.html" },
            { icon: "cloud",               title: "Cloud Storage",              subtext: "Sub Menu Details & subtext", url: "/cloud-storage.html" },
            { icon: "key",                 title: "PAM / MFA",                  subtext: "Sub Menu Details & subtext", url: "/pam-mfa.html" },
            { icon: "shield-halved",       title: "SSL Certificate",            subtext: "Sub Menu Details & subtext", url: null },
            { icon: "fire-flame-curved",   title: "Firewall",                   subtext: "Sub Menu Details & subtext", url: "/firewall-security.html" },
            { icon: "shield-check",        title: "VAPT",                       subtext: "Sub Menu Details & subtext", url: "/vapt.html" },
        ],
    },

    // ── Public Cloud ─────────────────────────────────────────────────────────
    {
        lebel: "Public Cloud",
        icon: "cloud",                               // was ⛅
        desc: "Details about Public Cloud",
        cols: 3,
        directLink: null,
        isHighlighted: false,
        sections: [],
        items: [
            { icon: "brands:aws",          title: "AWS",                        subtext: "Sub Menu Details & subtext", url: "/aws-cloud-hosting.html" },
            { icon: "brands:microsoft",    title: "Azure",                      subtext: "Sub Menu Details & subtext", url: "/azure-cloud-hosting.html" },
            { icon: "brands:google",       title: "Google Cloud Platform",      subtext: "Sub Menu Details & subtext", url: "/google-cloud-hosting.html" },
        ],
    },

    // ── Resources ────────────────────────────────────────────────────────────
    {
        lebel: "Resources",
        icon: "book-open",                           // was 📚
        desc: "Guides, docs, and support",
        cols: 2,
        directLink: null,
        isHighlighted: false,
        sections: [],
        items: [
            { icon: "file-lines",          title: "Documentation",              subtext: "Sub Menu Details & subtext", url: null },
            { icon: "pen-nib",             title: "Blog",                       subtext: "Sub Menu Details & subtext", url: null },
            { icon: "graduation-cap",      title: "Tutorials",                  subtext: "Sub Menu Details & subtext", url: null },
            { icon: "headset",             title: "Support Center",             subtext: "Sub Menu Details & subtext", url: null },
        ],
    },
];

// ─── PUT to Strapi ───────────────────────────────────────────────────────────

async function seedNavIcons() {
    console.log("📡  Sending navigation icon update to Strapi...\n");

    const res = await fetch(`${STRAPI_URL}/api/navigation`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ data: { menus: MENUS } }),
    });

    const json = await res.json();

    if (!res.ok) {
        console.error("❌  Strapi returned an error:");
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    console.log("✅  Navigation icons updated successfully!");
    console.log(`    Menus updated: ${MENUS.length}`);
    console.log(`    Total items  : ${MENUS.reduce((n, m) => {
        const sectionItems = (m.sections || []).reduce((s, sec) => s + sec.items.length, 0);
        return n + m.items.length + sectionItems;
    }, 0)}`);
}

seedNavIcons().catch(err => {
    console.error("❌  Unexpected error:", err.message);
    process.exit(1);
});
