// Strapi configuration — edit this one file to update the URL and token across all pages
const host = window.location.hostname;

if (host === "dev.icsdc.com") {
    window.STRAPI_URL = "https://admin.icsdc.com";
} else if (host === "localhost" || host === "127.0.0.1") {
    window.STRAPI_URL = "http://localhost:1337";
} else {
    window.STRAPI_URL = "http://160.25.110.10:1337"; // fallback
}
window.TOKEN = "5e685bd788588b5db88df3d3d47ad9a446f82768a2514d7dce437f6dc10c872d61b83b91763e6ea54acb9f7d7aac432e1714eef2dd12d718aae5c3bbae246aa90a85d22938474559dd9327dc2f7c9114b06bfdbb4ce9daf5d4e8f45b7a608c7d80eea92ac9896b47238380007a7d592b3825db93c9f9e5fbdab95be79a2c8e6e";
