/* ══════════════════════════════════════════════════════════
   NAV SEARCH — instant page navigation
   Type-ahead search over all site pages.
══════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    var PAGES = [
        { title: 'Home', url: '/', keywords: 'home index landing' },
        { title: 'About Us', url: '/about-us.html', keywords: 'about company team story' },
        { title: 'Contact Us', url: '/contact-us.html', keywords: 'contact reach support' },
        { title: 'Pricing', url: '/pricing.html', keywords: 'pricing plans cost' },

        // Hosting
        { title: 'Web Hosting', url: '/web-hosting.html', keywords: 'web hosting website' },
        { title: 'Shared Hosting', url: '/shared-hosting.html', keywords: 'shared hosting cheap' },
        { title: 'cPanel Hosting', url: '/cpanel-hosting.html', keywords: 'cpanel control panel hosting' },
        { title: 'WordPress Hosting', url: '/wordpress-hosting.html', keywords: 'wordpress wp cms' },
        { title: 'Reseller Hosting', url: '/reseller-hosting.html', keywords: 'reseller white label whm' },

        // Cloud
        { title: 'Cloud Hosting', url: '/cloud-hosting.html', keywords: 'cloud hosting' },
        { title: 'Linux Cloud Hosting', url: '/linux-cloud-hosting.html', keywords: 'linux cloud' },
        { title: 'Windows Cloud Hosting', url: '/windows-cloud-hosting.html', keywords: 'windows cloud' },
        { title: 'Managed Cloud Hosting', url: '/managed-cloud-hosting.html', keywords: 'managed cloud' },
        { title: 'AWS Cloud Hosting', url: '/aws-cloud-hosting.html', keywords: 'aws amazon cloud' },
        { title: 'Azure Cloud Hosting', url: '/azure-cloud-hosting.html', keywords: 'azure microsoft cloud' },
        { title: 'Google Cloud Hosting', url: '/google-cloud-hosting.html', keywords: 'google gcp cloud' },
        { title: 'GPU Cloud Hosting', url: '/gpu-cloud-hosting.html', keywords: 'gpu cloud nvidia' },
        { title: 'Cloud Storage', url: '/cloud-storage.html', keywords: 'storage backup files' },
        { title: 'Virtual Machine', url: '/virtual-machine.html', keywords: 'vm virtual machine' },

        // VPS
        { title: 'VPS Hosting', url: '/vps-hosting.html', keywords: 'vps virtual private server' },
        { title: 'Linux VPS Hosting', url: '/linux-vps-hosting.html', keywords: 'linux vps' },
        { title: 'Windows VPS Hosting', url: '/windows-vps-hosting.html', keywords: 'windows vps' },
        { title: 'Managed VPS Hosting', url: '/managed-vps-hosting.html', keywords: 'managed vps' },
        { title: 'VPS cPanel', url: '/vps-cpanel.html', keywords: 'vps cpanel' },
        { title: 'Forex VPS', url: '/forex-vps.html', keywords: 'forex trading vps' },
        { title: 'VPS Hosting Trial', url: '/vps-hosting-trial.html', keywords: 'vps trial free' },

        // Dedicated Servers
        { title: 'Dedicated Server', url: '/dedicated-server.html', keywords: 'dedicated server' },
        { title: 'Linux Dedicated Server', url: '/linux-dedicated-server.html', keywords: 'linux dedicated' },
        { title: 'Windows Dedicated Server', url: '/windows-dedicated-server.html', keywords: 'windows dedicated' },
        { title: 'Managed Dedicated Server', url: '/managed-dedicated-server.html', keywords: 'managed dedicated' },
        { title: 'GPU Dedicated Server', url: '/gpu-dedicated-server.html', keywords: 'gpu dedicated nvidia' },
        { title: 'NVMe Dedicated Servers', url: '/nvme-dedicated-servers.html', keywords: 'nvme ssd dedicated' },
        { title: 'Bare Metal Server', url: '/bare-metal-server.html', keywords: 'bare metal server' },

        // Email
        { title: 'Email Hosting', url: '/email-hosting.html', keywords: 'email mail business' },
        { title: 'Google Workspace', url: '/google-workspace.html', keywords: 'google workspace gsuite gws' },
        { title: 'Microsoft 365', url: '/microsoft-365.html', keywords: 'microsoft 365 office o365' },
        { title: 'Zimbra Hosting', url: '/zimbra-hosting.html', keywords: 'zimbra email' },

        // Domains
        { title: 'Domain Registration', url: '/domain-registration.html', keywords: 'domain register' },
        { title: 'Domain Transfer', url: '/domain-transfer.html', keywords: 'domain transfer migrate' },

        // Security
        { title: 'SSL Certificate', url: '/ssl-certificate.html', keywords: 'ssl certificate https tls' },
        { title: 'Firewall & Security', url: '/firewall-security.html', keywords: 'firewall security waf' },
        { title: 'VAPT', url: '/vapt.html', keywords: 'vapt vulnerability assessment penetration testing' },
        { title: 'PAM & MFA', url: '/pam-mfa.html', keywords: 'pam mfa identity access' },

        // Backup
        { title: 'Acronis Backup', url: '/acronis-backup.html', keywords: 'acronis backup' },
        { title: 'Veeam Backup', url: '/veeam-backup.html', keywords: 'veeam backup' },

        // Software
        { title: 'Tally on Cloud', url: '/tally-on-cloud.html', keywords: 'tally cloud accounting' }
    ];

    function escapeHtml(s) {
        return (s || '').replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function highlight(text, query) {
        if (!query) return escapeHtml(text);
        var safe = escapeHtml(text);
        var rx = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
        return safe.replace(rx, '<mark>$1</mark>');
    }

    function filterPages(query) {
        if (!query) return [];
        var q = query.toLowerCase().trim();
        return PAGES
            .map(function (p) {
                var t = p.title.toLowerCase();
                var k = (p.keywords || '').toLowerCase();
                var score = 0;
                if (t.indexOf(q) === 0) score = 100;
                else if (t.indexOf(q) > -1) score = 80;
                else if (k.indexOf(q) > -1) score = 50;
                return { page: p, score: score };
            })
            .filter(function (r) { return r.score > 0; })
            .sort(function (a, b) { return b.score - a.score; })
            .slice(0, 8);
    }

    var SEARCH_ICON_SVG =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';

    var PAGE_ICON_SVG =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<path d="M14 2v6h6"/></svg>';

    function renderItems(q, results) {
        var matches = q ? filterPages(q) : PAGES.slice(0, 8).map(function (p) { return { page: p }; });
        if (!matches.length) {
            results.innerHTML = '<div class="nav-search-empty">No pages match "' + escapeHtml(q) + '"</div>';
            return matches;
        }
        results.innerHTML = matches.map(function (m, i) {
            return '<a href="' + m.page.url + '" class="nav-search-item" role="option" data-idx="' + i + '">' +
                PAGE_ICON_SVG +
                '<span class="nav-search-item-title">' + highlight(m.page.title, q) + '</span>' +
                '<span class="nav-search-item-url">' + escapeHtml(m.page.url) + '</span>' +
            '</a>';
        }).join('');
        return matches;
    }

    function wireKeyboard(input, results, getActive, setActive, closePanel) {
        input.addEventListener('keydown', function (e) {
            var items = results.querySelectorAll('.nav-search-item');
            var idx = getActive();
            if (e.key === 'ArrowDown') {
                e.preventDefault(); setActive(Math.min(idx + 1, items.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault(); setActive(Math.max(idx - 1, 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                var target = idx >= 0 ? items[idx] : items[0];
                if (target) window.location.href = target.getAttribute('href');
            } else if (e.key === 'Escape') {
                e.preventDefault(); closePanel();
            }
        });
    }

    function buildSearchUI() {
        // Don't double-mount
        if (document.getElementById('nav-search')) return;

        // ── Desktop search (icon → dropdown panel) ──────────
        var navInner = document.querySelector('nav .nav-inner');
        if (navInner) {
            var wrap = document.createElement('div');
            wrap.className = 'nav-search';
            wrap.id = 'nav-search';
            wrap.innerHTML =
                '<button class="nav-search-trigger" aria-label="Search pages" type="button">' +
                    SEARCH_ICON_SVG +
                '</button>' +
                '<div class="nav-search-panel" role="dialog" aria-label="Page search" hidden>' +
                    '<div class="nav-search-input-wrap">' +
                        '<svg class="nav-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                            '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>' +
                        '</svg>' +
                        '<input type="search" class="nav-search-input" placeholder="Search pages…" autocomplete="off" spellcheck="false" />' +
                        '<kbd class="nav-search-kbd">ESC</kbd>' +
                    '</div>' +
                    '<div class="nav-search-results" role="listbox"></div>' +
                '</div>';

            var loginBtn = navInner.querySelector('.desktop-login-btn');
            if (loginBtn) navInner.insertBefore(wrap, loginBtn);
            else navInner.appendChild(wrap);

            var trigger = wrap.querySelector('.nav-search-trigger');
            var panel   = wrap.querySelector('.nav-search-panel');
            var input   = wrap.querySelector('.nav-search-input');
            var results = wrap.querySelector('.nav-search-results');
            var activeIdx = -1;

            function openPanel() {
                panel.hidden = false;
                wrap.classList.add('open');
                setTimeout(function () { input.focus(); }, 10);
                renderItems('', results);
            }
            function closePanel() {
                panel.hidden = true;
                wrap.classList.remove('open');
                input.value = '';
                activeIdx = -1;
            }

            trigger.addEventListener('click', function () { panel.hidden ? openPanel() : closePanel(); });
            input.addEventListener('input', function () { renderItems(input.value, results); });
            wireKeyboard(input, results,
                function () { return activeIdx; },
                function (i) {
                    activeIdx = i;
                    results.querySelectorAll('.nav-search-item').forEach(function (el, j) {
                        el.classList.toggle('is-active', j === i);
                        if (j === i) el.scrollIntoView({ block: 'nearest' });
                    });
                },
                closePanel
            );
            document.addEventListener('click', function (e) {
                if (!wrap.contains(e.target) && !panel.hidden) closePanel();
            });

            // Global shortcut: / or Ctrl/Cmd+K
            document.addEventListener('keydown', function (e) {
                var tag = document.activeElement.tagName;
                if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
                    e.preventDefault(); openPanel();
                } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault(); openPanel();
                }
            });
        }

        // ── Mobile search — full-width bar at top of hamburger menu ──
        var mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            var mWrap = document.createElement('div');
            mWrap.className = 'mobile-search-bar';
            mWrap.id = 'mobile-search-bar';
            mWrap.innerHTML =
                '<div class="mobile-search-input-wrap">' +
                    SEARCH_ICON_SVG +
                    '<input type="search" class="mobile-search-input" ' +
                        'placeholder="Search pages…" autocomplete="off" spellcheck="false" />' +
                '</div>' +
                '<div class="mobile-search-results"></div>';

            // Prepend — search bar appears first inside the menu
            mobileMenu.insertBefore(mWrap, mobileMenu.firstChild);

            var mInput   = mWrap.querySelector('.mobile-search-input');
            var mResults = mWrap.querySelector('.mobile-search-results');
            var mActiveIdx = -1;

            mInput.addEventListener('input', function () {
                mActiveIdx = -1;
                renderItems(mInput.value, mResults);
            });
            wireKeyboard(mInput, mResults,
                function () { return mActiveIdx; },
                function (i) {
                    mActiveIdx = i;
                    mResults.querySelectorAll('.nav-search-item').forEach(function (el, j) {
                        el.classList.toggle('is-active', j === i);
                        if (j === i) el.scrollIntoView({ block: 'nearest' });
                    });
                },
                function () { mInput.value = ''; mResults.innerHTML = ''; mActiveIdx = -1; }
            );
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildSearchUI);
    } else {
        buildSearchUI();
    }
})();
