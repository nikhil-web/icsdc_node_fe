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
                    <div class="footer-social" aria-label="Social media links">
                        <a data-strapi-social="linkedin" href="#" class="footer-social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-linkedin-in" aria-hidden="true"></i>
                        </a>
                        <a data-strapi-social="facebook" href="#" class="footer-social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-facebook-f" aria-hidden="true"></i>
                        </a>
                        <a data-strapi-social="instagram" href="#" class="footer-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-instagram" aria-hidden="true"></i>
                        </a>
                        <a data-strapi-social="twitter" href="#" class="footer-social-link" aria-label="X / Twitter" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-x-twitter" aria-hidden="true"></i>
                        </a>
                        <a data-strapi-social="youtube" href="#" class="footer-social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                            <i class="fa-brands fa-youtube" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

            </div>
        </div>

        <!-- ── Copyright bar ────────────────────────────────── -->
        <div class="footer-bottom">
            <p>&#169; Copyright <span data-strapi-year id="footer-year"></span> <span data-strapi-company-name>ICSDC</span>. All Rights Reserved</p>
        </div>
    `;
}
