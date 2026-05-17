// Strapi configuration — edit this one file to update the URL and token across all pages
const host = window.location.hostname;

if (host === "dev.icsdc.com") {
    window.STRAPI_URL = "https://admin.icsdc.com";
} else if (host === "localhost" || host === "127.0.0.1") {
    window.STRAPI_URL = "http://localhost:1337";
} else {
    window.STRAPI_URL = "http://160.25.110.10:1337"; // fallback
}
