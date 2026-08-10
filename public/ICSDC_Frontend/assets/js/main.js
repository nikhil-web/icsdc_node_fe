// ══════════════════════════════════════════════════════════
//  main.js — ICSDC Frontend + Strapi Integration
//  Renders:  Navigation + Dropdown + Hamburger Menu
// ══════════════════════════════════════════════════════════

import { getNavigation, getFooter } from "./services/contentService.js";
import { resolveIcon, inlineRichText } from "./utils/cms-helpers.js";
import { getFooterHTML } from "./footer-template.js";

// ══════════════════════════════════════════════════════════
//  DEFERRED WIDGET STYLES
//  chat-widget / whatsapp-widget / contact-modal CSS used to be @import-ed
//  from style.css, which made them a serial render-blocking waterfall (fetch
//  style.css -> parse -> only then discover these three, all blocking paint;
//  Lighthouse measured ~600ms each). Nothing they style is needed for first
//  paint — two floating bubbles and a modal that starts hidden — and the
//  widgets themselves are built by JS anyway, so load them here instead.
//  main.js is a module (deferred), so this runs after parse and never blocks.
/* Builder canvas mode (/builder/__canvas?canvas=1, inside the admin's editor
   iframe). It exists ONLY to render builder sections, so every piece of site
   chrome below is pure cost there: the nav + footer Strapi round-trips, the
   logo image, the chat/WhatsApp/contact widgets and their stylesheets. They
   also can't be interacted with in the editor. Skipping them cuts the canvas
   boot down to the renderer itself. */
const IS_CANVAS = new URLSearchParams(window.location.search).get('canvas') === '1';

(function loadDeferredWidgetStyles() {
    if (IS_CANVAS) return;
    ['chat-widget', 'whatsapp-widget', 'contact-modal'].forEach(function (name) {
        var href = '/assets/css/' + name + '.css';
        if (document.querySelector('link[href="' + href + '"]')) return;
        var l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    });
})();

// ══════════════════════════════════════════════════════════
//  SCROLL-ANIMATION SAFETY REVEAL  (SEO / crawler fix)
//  Scroll-triggered elements start at opacity:0 and are revealed by an
//  IntersectionObserver on scroll. Crawlers (Googlebot's renderer) paint at a
//  fixed viewport WITHOUT scrolling, so below-the-fold [data-animate]/[data-stagger]
//  content never gets `.is-visible` and the rendered screenshot comes out blank.
//  This force-reveals anything still hidden shortly after load — guaranteeing the
//  full page is painted for crawlers (real users keep on-scroll animation for the
//  first ~2s, which covers the above-the-fold reveal).
(function revealAnimatedForCrawlers() {
    function revealAll() {
        document.querySelectorAll('[data-animate]:not(.is-visible), [data-stagger]:not(.is-visible)')
            .forEach(function (el) { el.classList.add('is-visible'); });
    }
    function schedule() { setTimeout(revealAll, 2000); }
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule);
})();


// ══════════════════════════════════════════════════════════
//  LOADER
// ══════════════════════════════════════════════════════════
function showLoader() {
    document.getElementById("page-loader")?.classList.remove("loader-hidden");
}

function hideLoader() {
    const loader = document.getElementById("page-loader");
    if (!loader) return;
    loader.classList.add("loader-done");
    setTimeout(() => loader.classList.add("loader-hidden"), 400);
}


// ══════════════════════════════════════════════════════════
//  RENDER: NAV + DROPDOWN (unchanged from original)
// ══════════════════════════════════════════════════════════
function initNav(menuData) {
    const CMS_MENUS = (menuData?.data?.menus ?? []).map(menu => ({
        id: String(menu.id),
        label: menu.lebel,
        directLink: menu.directLink || '',
        isHighlighted: !!menu.isHighlighted,
        icon: menu.icon,
        desc: menu.desc || menu.description || '',
        cols: menu.cols,
        items: (menu.items || []).map(item => ({
            icon: item.icon,
            title: item.title,
            sub: item.subtext,
            url: item.url || "#",
        })),
        sections: (menu.sections || []).map(sec => ({
            id: String(sec.id),
            label: sec.lebel,
            icon: sec.icon,
            items: (sec.items || []).map(item => ({
                icon: item.icon,
                title: item.title,
                sub: item.subtext,
                url: item.url || "#",
            })),
        })),
    }));

    function buildNavLinkHTML(menu, mobile = false) {
        const hlClass = menu.isHighlighted ? ' nav-link--highlight' : '';
        // Direct link — renders as a plain anchor, no dropdown
        if (menu.directLink) {
            return `<a class="nav-link nav-link--direct${hlClass}" href="${menu.directLink}">${menu.label}</a>`;
        }
        // Dropdown button
        const onclick = mobile
            ? `openDropdown('${menu.id}', this); closeMobileMenu()`
            : `openDropdown('${menu.id}', this)`;
        return `
            <button class="nav-link${hlClass}" onclick="${onclick}">
                ${menu.label}
                <svg class="chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>`;
    }

    document.querySelectorAll("[data-strapi-nav]").forEach(navLinks => {
        CMS_MENUS.forEach(menu => {
            const li = document.createElement("li");
            li.className = "nav-item";
            li.innerHTML = buildNavLinkHTML(menu, false);
            navLinks.appendChild(li);
        });
    });

    document.querySelectorAll("[data-strapi-nav-mobile]").forEach(mobileNav => {
        CMS_MENUS.forEach(menu => {
            const li = document.createElement("li");
            li.className = "nav-item";
            li.innerHTML = buildNavLinkHTML(menu, true);
            mobileNav.appendChild(li);
        });
    });

    let currentMenuId = null;

    function renderItems(source, cols, title) {
        const panelTitle = document.querySelector("[data-strapi-dd='panelTitle']");
        if (title) {
            panelTitle.textContent = title;
            panelTitle.classList.remove("hidden");
        } else {
            panelTitle.classList.add("hidden");
        }
        const grid = document.querySelector("[data-strapi-dd='grid']");
        grid.className = `cols-${cols || 2}`;
        grid.innerHTML = source.items.map(item => `
            <a href="${item.url}" class="dd-item">
                <div class="dd-item-icon">${resolveIcon(item.icon)}</div>
                <div class="dd-item-text">
                    <h5>${item.title}</h5>
                    <p>${item.sub}</p>
                </div>
            </a>
        `).join("");
    }

    window.openDropdown = function (menuId, btnEl) {
        if (currentMenuId === menuId) { closeDropdown(); return; }
        closeDropdown(false);
        currentMenuId = menuId;
        const menu = CMS_MENUS.find(m => m.id === menuId);
        if (!menu) return;

        document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");

        const sidebar = document.querySelector("[data-strapi-dd='sidebar']");
        const flatLeft = document.querySelector("[data-strapi-dd='flatLeft']");

        if (menu.sections && menu.sections.length) {
            sidebar.classList.remove("hidden");
            flatLeft.classList.add("hidden");
            sidebar.innerHTML = menu.sections.map((sec, i) => `
                <button class="sidebar-item${i === 0 ? " active" : ""}"
                        onclick="selectSection('${menu.id}', '${sec.id}', this)">
                    <div class="sidebar-icon">${resolveIcon(sec.icon)}</div>
                    <span class="sidebar-label">${sec.label}</span>
                    <span class="sidebar-arrow">›</span>
                </button>
            `).join("");
            renderItems(menu.sections[0], menu.cols, menu.sections[0].label);
        } else {
            sidebar.classList.add("hidden");
            flatLeft.classList.remove("hidden");
            document.querySelector("[data-strapi-dd='flatIcon']").innerHTML = resolveIcon(menu.icon);
            document.querySelector("[data-strapi-dd='flatTitle']").textContent = menu.label;
            document.querySelector("[data-strapi-dd='flatDesc']").textContent = menu.desc;
            renderItems(menu, menu.cols, null);
        }

        document.getElementById("dropdown-wrap").classList.add("open");
        document.getElementById("overlay").classList.add("visible");
    };

    window.selectSection = function (menuId, sectionId, btnEl) {
        const menu = CMS_MENUS.find(m => m.id === menuId);
        const sec = menu.sections.find(s => s.id === sectionId);
        document.querySelectorAll(".sidebar-item").forEach(b => b.classList.remove("active"));
        btnEl.classList.add("active");
        renderItems(sec, menu.cols, sec.label);
    };

    window.closeDropdown = function (resetState = true) {
        document.getElementById("dropdown-wrap").classList.remove("open");
        document.getElementById("overlay").classList.remove("visible");
        document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
        if (resetState) currentMenuId = null;
    };

    document.getElementById("overlay")?.addEventListener("click", closeDropdown);
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDropdown(); });
}

// ══════════════════════════════════════════════════════════
//  HAMBURGER MENU (unchanged)
// ══════════════════════════════════════════════════════════
function initHamburger() {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobile-menu");
    if (!hamburger || !mobileMenu) return;

    window.closeMobileMenu = function () {
        hamburger.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("open");
        mobileMenu.setAttribute("aria-hidden", "true");
    };

    hamburger.addEventListener("click", () => {
        const isOpen = mobileMenu.classList.contains("open");
        if (isOpen) {
            closeMobileMenu();
        } else {
            hamburger.classList.add("open");
            hamburger.setAttribute("aria-expanded", "true");
            mobileMenu.classList.add("open");
            mobileMenu.setAttribute("aria-hidden", "false");
            if (typeof closeDropdown === "function") closeDropdown();
        }
    });

    document.addEventListener("click", e => {
        if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
            closeMobileMenu();
        }
    });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeMobileMenu(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 1024) closeMobileMenu(); });
}



function initMainLogo(menuData) {
    // data strapi is mainLogo we nedd to add main logo data to this image src 
    const mainLogoEl = document.querySelector('[data-strapi-mainLogo], [data-strapi="mainLogo"]');
    if (mainLogoEl && menuData?.data?.navLogo) {
        mainLogoEl.src = STRAPI_URL + menuData.data.navLogo.mainLogo.url;
        mainLogoEl.alt = menuData.data.navLogo.alternativeText || "Main Logo";
    }
}

function initLoginButton(menuData) {
    const loginButtons = document.querySelectorAll(".desktop-login-btn, .mobile-login-btn");
    if (!loginButtons.length || !menuData?.data?.LoginButton) return;

    const { btnText, Link } = menuData.data.LoginButton;
    loginButtons.forEach((loginBtn) => {
        // Prepend a user icon so the button matches the icon+label style of .btn-wa-nav
        loginBtn.innerHTML =
            '<i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>' +
            '<span>' + (btnText || 'Login') + '</span>';
        if (Link) {
            loginBtn.addEventListener("click", () => {
                window.location.href = Link;
            });
        }
    });
}

function initCtaButton(menuData) {
    const cta = menuData?.data?.ctaButton;
    if (!cta?.label || !cta?.link) return;

    const target = cta.openInNewTab !== false ? '_blank' : '_self';

    function makeBtn(extraClass) {
        const a = document.createElement('a');
        a.href = cta.link;
        a.className = 'btn-cta-nav' + (extraClass ? ' ' + extraClass : '');
        if (cta.bgColor)   a.style.background = cta.bgColor;
        if (cta.textColor) a.style.color = cta.textColor;
        if (target === '_blank') a.rel = 'noopener noreferrer';
        a.target = target;
        a.setAttribute('aria-label', cta.label);

        if (cta.icon) {
            a.insertAdjacentHTML('beforeend', resolveIcon(cta.icon));
            a.appendChild(document.createTextNode(' ' + cta.label));
        } else {
            a.textContent = cta.label;
        }

        return a;
    }

    const desktopLogin = document.querySelector('.desktop-login-btn');
    if (desktopLogin) {
        desktopLogin.insertAdjacentElement('afterend', makeBtn(''));
    }

    const mobileLogin = document.querySelector('.mobile-login-btn');
    if (mobileLogin) {
        mobileLogin.insertAdjacentElement('afterend', makeBtn('mobile-cta-btn'));
    }
}

// ══════════════════════════════════════════════════════════
//  WHATSAPP FLOATING WIDGET
//  Bubble bottom-right of every page. Click → popover with an
//  editable message → submit opens wa.me/<number>?text=<msg>.
//  No phone/name capture — we already know the company number,
//  and WhatsApp itself collects the visitor's identity on send.
//  Config comes from the Strapi navigation single type's
//  `whatsappWidget` component. If missing or enabled=false, no-op.
// ══════════════════════════════════════════════════════════
function initWhatsappWidget(menuData) {
    const cfg = menuData?.data?.whatsappWidget;
    if (!cfg || cfg.enabled === false || !cfg.phoneNumber) return;

    // Don't mount twice
    if (document.getElementById('wa-nav-btn')) return;

    const cleanPhone = String(cfg.phoneNumber).replace(/[^0-9]/g, '');
    if (!cleanPhone) return;

    const title          = cfg.popoverTitle    || 'Chat with us on WhatsApp';
    const subtitle       = cfg.popoverSubtitle || "Send us a quick message and we'll get back to you.";
    const defaultMessage = cfg.defaultMessage  || "Hi, I'd like to know more about ICSDC services.";

    // ── Navbar buttons (desktop + mobile menu) ──────────────
    let popover     = null;
    let activeAnchor = null;

    function makeWaBtn(id, extraClass) {
        const btn = document.createElement('button');
        btn.id   = id;
        btn.type = 'button';
        btn.className = 'btn-wa-nav' + (extraClass ? ' ' + extraClass : '');
        btn.setAttribute('aria-label', 'Chat on WhatsApp');
        btn.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span> WhatsApp</span>';
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            popover ? closePopover() : openPopover(btn);
        });
        return btn;
    }

    // Desktop nav — insert after .desktop-login-btn
    const desktopLogin = document.querySelector('.desktop-login-btn');
    if (desktopLogin) desktopLogin.insertAdjacentElement('afterend', makeWaBtn('wa-nav-btn', ''));

    // Mobile menu — wrap login + WA in a flex row so they sit side by side
    const mobileLogin = document.querySelector('.mobile-login-btn');
    if (mobileLogin) {
        const row = document.createElement('div');
        row.className = 'mobile-cta-row';
        mobileLogin.parentNode.insertBefore(row, mobileLogin);
        row.appendChild(mobileLogin);
        row.appendChild(makeWaBtn('wa-nav-btn-mobile', 'btn-wa-nav--mobile'));
    }

    // ── Position popover anchored to the button that opened it ──
    function positionPopover(anchorEl) {
        if (!popover || !anchorEl) return;
        const rect = anchorEl.getBoundingClientRect();
        const popW = Math.min(340, window.innerWidth - 24);
        // Fixed 80 px from the top of the viewport; right edge aligns with the button
        let right = window.innerWidth - rect.right;
        right = Math.max(right, 8);
        if (window.innerWidth - right < popW) right = window.innerWidth - popW - 8;

        popover.style.top    = '80px';
        popover.style.right  = right + 'px';
        popover.style.bottom = 'auto';
        popover.style.left   = 'auto';
    }

    function openPopover(anchorEl) {
        if (popover) return;
        activeAnchor = anchorEl;
        popover = document.createElement('div');
        popover.className = 'wa-popover';
        popover.setAttribute('role', 'dialog');
        popover.setAttribute('aria-labelledby', 'wa-pop-title');
        popover.innerHTML =
            '<div class="wa-pop-head">' +
                '<div class="wa-pop-avatar"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></div>' +
                '<div class="wa-pop-head-text">' +
                    '<div id="wa-pop-title" class="wa-pop-title">' + escapeHtml(title) + '</div>' +
                    '<div class="wa-pop-sub">' + escapeHtml(subtitle) + '</div>' +
                '</div>' +
                '<button class="wa-pop-close" type="button" aria-label="Close">&times;</button>' +
            '</div>' +
            '<form class="wa-pop-form" novalidate>' +
                '<label class="wa-field">' +
                    '<span class="wa-label">Your message</span>' +
                    '<textarea name="message" class="wa-input wa-textarea" rows="4" placeholder="Type your message…">' + escapeHtml(defaultMessage) + '</textarea>' +
                '</label>' +
                '<button type="submit" class="wa-submit"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Continue on WhatsApp</button>' +
                '<p class="wa-trust">Opens a chat with our team.</p>' +
            '</form>' +
            '<div class="wa-pop-success" hidden>' +
                '<div class="wa-pop-success-icon"><i class="fa-solid fa-circle-check" aria-hidden="true"></i></div>' +
                '<div class="wa-pop-success-text">Opening WhatsApp…</div>' +
            '</div>';
        document.body.appendChild(popover);
        positionPopover(anchorEl);
        // Trigger CSS open transition
        requestAnimationFrame(() => popover.classList.add('is-open'));
        if (activeAnchor) activeAnchor.classList.add('is-open');

        popover.querySelector('.wa-pop-close').addEventListener('click', closePopover);
        popover.querySelector('.wa-pop-form').addEventListener('submit', onSubmit);
        document.addEventListener('keydown', onEsc);
        document.addEventListener('click', onOutsideClick);
        window.addEventListener('resize', onResize);
        // Focus message textarea so visitor can start typing immediately
        setTimeout(() => {
            const ta = popover.querySelector('.wa-textarea');
            if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        }, 60);
    }

    function closePopover() {
        if (!popover) return;
        document.removeEventListener('keydown', onEsc);
        document.removeEventListener('click', onOutsideClick);
        window.removeEventListener('resize', onResize);
        popover.classList.remove('is-open');
        if (activeAnchor) activeAnchor.classList.remove('is-open');
        const ref = popover;
        popover = null;
        activeAnchor = null;
        setTimeout(() => ref.remove(), 200);
    }

    function onEsc(e) { if (e.key === 'Escape') closePopover(); }
    function onResize() { positionPopover(activeAnchor); }
    function onOutsideClick(e) {
        if (!popover) return;
        if (popover.contains(e.target) || (activeAnchor && activeAnchor.contains(e.target))) return;
        closePopover();
    }

    function onSubmit(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const message = String(data.get('message') || '').trim() || defaultMessage;

        // Build the universal wa.me link — opens the WhatsApp app if installed,
        // otherwise falls back to web.whatsapp.com. Either way the visitor lands
        // in a chat with our number, with the message pre-filled.
        const waUrl = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message);

        // Brief success state, then hand off to WhatsApp.
        form.style.display = 'none';
        popover.querySelector('.wa-pop-success').hidden = false;
        window.open(waUrl, '_blank', 'noopener,noreferrer');

        setTimeout(closePopover, 1100);
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Click handlers are attached inside makeWaBtn — nothing extra needed here.
}

// ══════════════════════════════════════════════════════════
//  INIT — orchestrates the full render pipeline
// ══════════════════════════════════════════════════════════

function initFooter(footer) {
    if (!footer) return;

    // --- Logo ---
    var logoFooter = document.querySelector("[data-strapi-logo]");
    if (logoFooter && footer.logo) {
        logoFooter.src = STRAPI_URL + footer.logo.url;
        logoFooter.alt = footer.logoAlt || 'Logo';
    }

    // --- Address ---
    var address = document.querySelector('[data-strapi-footer-address]');
    if (address && footer.address) {
        address.innerHTML = inlineRichText(footer.address); // keep <br> / links from CMS, strip CKEditor <p> wrapper
    }

    // --- Phone ---
    var phone = document.querySelector('[data-strapi-footer-phone]');
    if (phone && footer.phone) {
        phone.innerHTML = footer.phone;
    }

    // --- Email ---
    var email = document.querySelector('[data-strapi-footer-email]');
    if (email && footer.email) {
        email.href = 'mailto:' + footer.email;
        email.innerHTML = footer.email;
    }

    // --- Social links (dynamic — icon + name + url from Strapi) ---
    var socialList = document.querySelector('[data-strapi-social-list]');
    if (socialList && footer.socialLinks) {
        footer.socialLinks.forEach(function (item) {
            if (!item.url) return;
            var a = document.createElement('a');
            a.href = item.url;
            a.className = 'footer-social-link';
            a.setAttribute('aria-label', item.name || '');
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = resolveIcon(item.icon);
            socialList.appendChild(a);
        });
    }

    var groupsWrap = document.querySelector('[data-strapi-link-groups]');

    if (groupsWrap && footer.linkGroups) {
        footer.linkGroups.forEach(function (group) {
            var links = (group.links || []).map(function (link) {
                return `<li><a class="footer-link" href="${link.url || '#'}">${link.label || ''}</a></li>`;
            }).join('');

            groupsWrap.insertAdjacentHTML('beforeend', `
            <div class="footer-link-group">
                <h3 class="footer-link-title">${group.title || ''}</h3>
                <ul>${links}</ul>
            </div>
        `);
        });
    }


    /*
    
            <!-- Services -->
            <div class="footer-link-group" aria-labelledby="footer-services">
                <h3 id="footer-services" class="footer-link-title">Services</h3>
                <ul data-strapi-link-group="services"></ul>
            </div> */

    // --- Year & Company ---
    var yearEl = document.querySelector('[data-strapi-year]');
    if (yearEl) yearEl.textContent = footer.copyrightYear || new Date().getFullYear();

    var nameEl = document.querySelector('[data-strapi-company-name]');
    if (nameEl && footer.companyName) nameEl.textContent = footer.companyName;

}

/**
 * Inject a self-referencing <link rel="canonical"> on every page.
 * Builds the canonical from window.SITE_URL (config.js) + the clean pathname:
 *   - strips a trailing ".html" / "index.html" (site uses clean URLs)
 *   - drops query strings, hashes, and trailing slashes (except root)
 * This consolidates duplicate URLs (.html, ?utm=…, www, http) onto the one
 * canonical https://icsdc.com/<path> — matching what's in sitemap.xml.
 */
function setCanonical() {
    try {
        var base = (window.SITE_URL || 'https://icsdc.com').replace(/\/+$/, '');
        var path = (window.location.pathname || '/')
            .replace(/\/index\.html$/i, '/')
            .replace(/\.html$/i, '');
        if (path.length > 1) path = path.replace(/\/+$/, ''); // strip trailing slash (keep root)
        if (!path) path = '/';

        var link = document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = document.createElement('link');
            link.setAttribute('rel', 'canonical');
            document.head.appendChild(link);
        }
        link.setAttribute('href', base + path);
    } catch (e) { /* non-fatal */ }
}

async function init() {
    setCanonical();

    /* Canvas mode: skip the nav/footer Strapi fetches and the widgets entirely.
       Measured on the editor canvas, those two API calls plus the logo image
       were the three slowest requests on the page (~935ms combined) and none of
       it is editable or clickable inside the iframe. The nav/footer markup is
       already in builder-template.html, so the chrome still occupies its normal
       space — section spacing previews identically, it just isn't populated. */
    if (IS_CANVAS) {
        hideLoader();
        initThemeToggle();
        return;
    }






    showLoader();
    try {
        const menuData = await getNavigation();
        initNav(menuData);
        initMainLogo(menuData);
        initLoginButton(menuData);
        initCtaButton(menuData);
        initWhatsappWidget(menuData);

        // Contact popup modal — lazy-loaded; available site-wide via
        // window.openContactPopup() and on any <a href="contact-popup">.
        import('/assets/js/contact-modal.js')
            .then(function (m) { m.initContactModal(); })
            .catch(function (err) { console.warn('[main] contact-modal load failed', err); });

        // Inject footer template into the placeholder element
        const footerEl = document.getElementById('site-footer');
        if (footerEl) footerEl.innerHTML = getFooterHTML();

        const footerData = await getFooter();
        initFooter(footerData.data.commonFooter);

    } catch (err) {
        console.error(" Menu data fetch has failed frm strapi", err);

    } finally {
        hideLoader();
    }

    initHamburger();
    initThemeToggle();
}

init();

// Load chat widget after main init (dynamic import keeps main.js lean).
// Never in the editor canvas — a live-chat bubble inside the page builder is
// noise, and it opens a socket.io connection per canvas mount.
if (!IS_CANVAS) {
    import('./chat-widget.js').then(function (m) { m.initChatWidget(); }).catch(function () {});
}

// ══════════════════════════════════════════════════════
//  THEME TOGGLE
// ══════════════════════════════════════════════════════
function initThemeToggle() {
    var MOON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    var SUN_SVG  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

    function getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // ── Desktop nav button ──────────────────────────────
    var btn = document.createElement('button');
    btn.id = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.title = 'Toggle dark / light mode';

    // ── Mobile menu row ─────────────────────────────────
    var mobileRow = document.createElement('div');
    mobileRow.className = 'mobile-theme-row';

    var mobileLabel = document.createElement('span');
    mobileLabel.className = 'mobile-theme-label';
    mobileLabel.textContent = 'Dark Mode';

    var mobileBtn = document.createElement('button');
    mobileBtn.className = 'mobile-theme-toggle';
    mobileBtn.setAttribute('aria-label', 'Toggle dark mode');
    mobileBtn.type = 'button';

    mobileRow.appendChild(mobileLabel);
    mobileRow.appendChild(mobileBtn);

    // ── Shared apply function — syncs both buttons ──────
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('icsdc-theme', theme);
        var isDark = theme === 'dark';
        var icon   = isDark ? SUN_SVG : MOON_SVG;
        var label  = isDark ? 'Switch to light mode' : 'Switch to dark mode';
        btn.innerHTML     = icon;
        mobileBtn.innerHTML = icon;
        btn.setAttribute('aria-label', label);
        mobileBtn.setAttribute('aria-label', label);
        mobileLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }

    applyTheme(getTheme());

    btn.addEventListener('click', function () {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });
    mobileBtn.addEventListener('click', function () {
        applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    // Insert desktop button before login in nav-inner
    var navInner = document.querySelector('.nav-inner');
    var loginBtn = navInner && navInner.querySelector('.btn-login');
    if (loginBtn) navInner.insertBefore(btn, loginBtn);
    else if (navInner) navInner.appendChild(btn);

    // Insert mobile row inside mobile-menu, before the mobile login button
    var mobileMenu = document.getElementById('mobile-menu');
    var mobileLoginBtn = mobileMenu && mobileMenu.querySelector('.mobile-login-btn');
    if (mobileLoginBtn && mobileLoginBtn.parentNode === mobileMenu) mobileMenu.insertBefore(mobileRow, mobileLoginBtn);
    else if (mobileMenu) mobileMenu.appendChild(mobileRow);
}
