/**
 * footer-template.js
 * ──────────────────
 * Single source of truth for the footer HTML structure.
 * main.js injects this into <footer id="site-footer"> on every page.
 * Dynamic content (logo, address, links, social) is populated from Strapi by initFooter().
 *
 * To change the footer layout — edit ONLY this file.
 */

export function getFooterHTML() {
    return `
        <!-- ── Link columns ─────────────────────────────────── -->
        <div class="footer-links-section">
            <div class="footer-links-grid" data-strapi-link-groups></div>
        </div>

        <!-- ── Brand bar ────────────────────────────────────── -->
        <div class="footer-brand-bar">
            <div class="footer-brand-inner">

                <div class="footer-brand-left">
                    <a href="/" aria-label="ICSDC Home" class="footer-logo-link">
                        <img data-strapi-logo src="" alt="ICSDC" class="footer-logo">
                    </a>
                    <address class="footer-address">
                        <span data-strapi-footer-address></span>
                        <span data-strapi-footer-phone class="footer-phone"></span>
                        <span class="footer-email-wrap">
                            Email: <a data-strapi-footer-email href="mailto:info@icsdc.com" class="footer-email-link">info@icsdc.com</a>
                        </span>
                    </address>
                </div>

                <div class="footer-brand-right">
                    <div class="footer-social" data-strapi-social-list aria-label="Social media links"></div>
                </div>

            </div>
        </div>

        <!-- ── Copyright bar ────────────────────────────────── -->
        <div class="footer-bottom">
            <p>&#169; Copyright <span data-strapi-year id="footer-year"></span> <span data-strapi-company-name>ICSDC</span>. All Rights Reserved</p>
        </div>
    `;
}
