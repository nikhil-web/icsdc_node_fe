/**
 * seed-footer-links.js
 * ─────────────────────
 * Replaces footer.commonFooter.linkGroups with the full 9-column Hostinger-
 * style set.  Address, phone, email and social links are preserved as-is.
 *
 * Run:  node seed-footer-links.js
 * Run against prod:  node seed-footer-links.js https://admin.icsdc.com <TOKEN>
 */

const STRAPI_URL = process.argv[2] || "http://localhost:1337";
const TOKEN =
    process.argv[3] ||
    "5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e";

const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
};

// ─── 9 Footer link columns ────────────────────────────────────────────────────

const LINK_GROUPS = [
    {
        title: "Dedicated Server",
        links: [
            { label: "Windows Dedicated Server", url: "/windows-dedicated-server.html" },
            { label: "Linux Dedicated Server",   url: "/linux-dedicated-server.html"   },
            { label: "Managed Dedicated Server", url: "/managed-dedicated-server.html" },
            { label: "NVMe Dedicated Server",    url: "/nvme-dedicated-servers.html"   },
            { label: "GPU Dedicated Server",     url: "/gpu-dedicated-server.html"     },
            { label: "Bare Metal Server",        url: "/bare-metal-server.html"        },
        ],
    },
    {
        title: "VPS Hosting",
        links: [
            { label: "Windows VPS Hosting", url: "/windows-vps-hosting.html" },
            { label: "Linux VPS Hosting",   url: "/linux-vps-hosting.html"   },
            { label: "Managed VPS Hosting", url: "/managed-vps-hosting.html" },
            { label: "VPS cPanel Hosting",  url: "/vps-cpanel.html"          },
            { label: "Forex VPS",           url: "/forex-vps.html"           },
            { label: "Virtual Machine",     url: "/virtual-machine.html"     },
        ],
    },
    {
        title: "Cloud Hosting",
        links: [
            { label: "Cloud Hosting",         url: "/cloud-hosting.html"         },
            { label: "Managed Cloud Hosting", url: "/managed-cloud-hosting.html" },
            { label: "Linux Cloud Hosting",   url: "/linux-cloud-hosting.html"   },
            { label: "Windows Cloud Hosting", url: "/windows-cloud-hosting.html" },
            { label: "GPU Cloud Hosting",     url: "/gpu-cloud-hosting.html"     },
        ],
    },
    {
        title: "Web Hosting",
        links: [
            { label: "Web Hosting",       url: "/web-hosting.html"      },
            { label: "Shared Hosting",    url: "/shared-hosting.html"   },
            { label: "WordPress Hosting", url: "/wordpress-hosting.html"},
            { label: "Reseller Hosting",  url: "/reseller-hosting.html" },
            { label: "cPanel Hosting",    url: "/cpanel-hosting.html"   },
        ],
    },
    {
        title: "Public Cloud",
        links: [
            { label: "AWS",                   url: "/aws-cloud-hosting.html"    },
            { label: "Azure",                 url: "/azure-cloud-hosting.html"  },
            { label: "Google Cloud Platform", url: "/google-cloud-hosting.html" },
        ],
    },
    {
        title: "Backup & Security",
        links: [
            { label: "Acronis Backup",   url: "/acronis-backup.html"   },
            { label: "Veeam Backup",     url: "/veeam-backup.html"     },
            { label: "Cloud Storage",    url: "/cloud-storage.html"    },
            { label: "SSL Certificate",  url: "/ssl-certificate.html"  },
            { label: "Firewall Security",url: "/firewall-security.html"},
            { label: "PAM / MFA",        url: "/pam-mfa.html"          },
            { label: "VAPT",             url: "/vapt.html"             },
        ],
    },
    {
        title: "Business Apps",
        links: [
            { label: "Email Hosting",    url: "/email-hosting.html"    },
            { label: "Google Workspace", url: "/google-workspace.html" },
            { label: "Microsoft 365",    url: "/microsoft-365.html"    },
            { label: "Tally on Cloud",   url: "/tally-on-cloud.html"   },
            { label: "Zimbra Hosting",   url: "/zimbra-hosting.html"   },
        ],
    },
    {
        title: "Domain",
        links: [
            { label: "Domain Registration", url: "/domain-registration.html" },
            { label: "Domain Transfer",     url: "/domain-transfer.html"     },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About Us",   url: "/about-us.html"   },
            { label: "Contact Us", url: "/contact-us.html" },
            { label: "Pricing",    url: "/pricing.html"    },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentFooter() {
    const res = await fetch(
        `${STRAPI_URL}/api/footer?populate[commonFooter][populate][socialLinks]=true`,
        { headers }
    );
    if (!res.ok) throw new Error(`GET /api/footer failed: ${res.status}`);
    const json = await res.json();
    return json.data?.commonFooter ?? {};
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seedFooterLinks() {
    console.log(`\n📡  Connecting to ${STRAPI_URL} …\n`);

    // 1. Read existing fields so we don't overwrite address / phone / email / social
    const existing = await getCurrentFooter();
    console.log(`✅  Current footer fetched`);
    console.log(`    address   : ${existing.address ? "present" : "empty"}`);
    console.log(`    phone     : ${existing.phone || "—"}`);
    console.log(`    email     : ${existing.email || "—"}`);
    console.log(`    socials   : ${(existing.socialLinks || []).length} entries`);
    console.log(`    old groups: ${(existing.linkGroups  || []).length} entries\n`);

    // 2. Social links — new schema: icon (FA name) + name + url
    //    These replace the old enum-based "platform" field entirely.
    const socialLinks = [
        { icon: "brands:linkedin-in", name: "LinkedIn",  url: "https://www.linkedin.com"  },
        { icon: "brands:facebook-f",  name: "Facebook",  url: "https://www.facebook.com"  },
        { icon: "brands:instagram",   name: "Instagram", url: "https://www.instagram.com" },
        { icon: "brands:x-twitter",   name: "X",         url: "https://www.twitter.com"   },
        { icon: "brands:youtube",     name: "YouTube",   url: "https://www.youtube.com"   },
    ];

    // 3. Build PUT body — preserve everything except linkGroups
    const body = {
        data: {
            commonFooter: {
                address: existing.address || "",
                phone:   existing.phone   || "",
                email:   existing.email   || "",
                socialLinks,
                linkGroups: LINK_GROUPS,
            },
        },
    };

    // 4. PUT
    console.log(`🚀  Uploading ${LINK_GROUPS.length} link groups …`);
    const putRes = await fetch(`${STRAPI_URL}/api/footer`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
    });

    const json = await putRes.json();

    if (!putRes.ok) {
        console.error("❌  Strapi returned an error:");
        console.error(JSON.stringify(json, null, 2));
        process.exit(1);
    }

    // 5. Verify with a separate GET (PUT response doesn't populate nested components)
    const verifyRes = await fetch(
        `${STRAPI_URL}/api/footer?populate[commonFooter][populate][linkGroups][populate][links]=true`,
        { headers }
    );
    const verifyJson = await verifyRes.json();
    const saved = verifyJson.data?.commonFooter?.linkGroups ?? [];

    console.log(`\n✅  Footer link groups updated!`);
    console.log(`    Groups saved : ${saved.length}`);
    saved.forEach((g, i) =>
        console.log(`    ${String(i + 1).padStart(2)}. ${g.title} (${(g.links || []).length} links)`)
    );
    console.log();
}

seedFooterLinks().catch(err => {
    console.error("❌  Unexpected error:", err.message);
    process.exit(1);
});
