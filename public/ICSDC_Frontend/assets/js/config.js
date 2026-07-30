// Strapi configuration — edit this one file to update the URL and token across all pages
const host = window.location.hostname;

if (host === "dev.icsdc.com") {

    window.STRAPI_URL = "https://admin.icsdc.com";

} else if (host === "icsdc.com" || host === "www.icsdc.com") {

    window.STRAPI_URL = "https://admin.icsdc.com";

} else if (host === "localhost" || host === "127.0.0.1") {

    window.STRAPI_URL = "http://localhost:1337";

} else {
    window.STRAPI_URL = "http://160.25.110.10:1337"; // fallback
}

// Canonical site origin — used to build <link rel="canonical"> on every page.
// Always points production/staging at the one canonical domain so duplicate
// hosts (www, http, staging) consolidate onto https://icsdc.com.
if (host === "localhost" || host === "127.0.0.1") {
    window.SITE_URL = window.location.origin; // dev: self-referential (not indexed)
} else {
    window.SITE_URL = "https://icsdc.com";
}
