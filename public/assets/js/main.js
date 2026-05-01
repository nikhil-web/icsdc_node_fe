// ══════════════════════════════════════════════════════════
//  main.js — ICSDC Frontend + Strapi Integration
//  Renders:  Navigation + Dropdown + Hamburger Menu
// ══════════════════════════════════════════════════════════

import { getNavigation, getFooter } from "./services/contentService.js";
import { resolveIcon } from "./utils/cms-helpers.js";


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
        loginBtn.textContent = btnText || "Login";
        if (Link) {
            loginBtn.addEventListener("click", () => {
                window.location.href = Link;
            });
        }
    });
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
        address.innerHTML = footer.address; // keep <br> tags from CMS
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

    // --- Social links ---
    if (footer.socialLinks) {
        footer.socialLinks.forEach(function (item) {
            var el = document.querySelector('[data-strapi-social="' + item.platform + '"]');
            if (el && item.url) {
                el.href = item.url;
            }
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

async function init() {






    showLoader();
    try {
        const menuData = await getNavigation();
        initNav(menuData);
        initMainLogo(menuData);
        initLoginButton(menuData);

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
    if (mobileLoginBtn) mobileMenu.insertBefore(mobileRow, mobileLoginBtn);
    else if (mobileMenu) mobileMenu.appendChild(mobileRow);
}
