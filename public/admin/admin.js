(function () {
    'use strict';

    const JWT_KEY = 'icsdc_admin_jwt';
    const USER_KEY = 'icsdc_admin_user';

    // ── Auth helpers ──────────────────────────────────────────
    function getJwt() { return sessionStorage.getItem(JWT_KEY); }
    function getUser() { return JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); }

    function saveSession(jwt, user) {
        sessionStorage.setItem(JWT_KEY, jwt);
        sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    function clearSession() {
        sessionStorage.removeItem(JWT_KEY);
        sessionStorage.removeItem(USER_KEY);
    }

    async function apiFetch(url, opts) {
        const res = await fetch(url, {
            ...opts,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getJwt()}`,
                ...(opts && opts.headers),
            },
        });
        if (res.status === 401) {
            clearSession();
            showLogin();
            throw new Error('Session expired');
        }
        return res;
    }

    // ── View switching ────────────────────────────────────────
    function showLogin() {
        document.getElementById('view-login').hidden = false;
        document.getElementById('view-dashboard').hidden = true;
    }

    function showDashboard() {
        document.getElementById('view-login').hidden = true;
        document.getElementById('view-dashboard').hidden = false;
        const user = getUser();
        if (user) {
            document.getElementById('header-user').textContent =
                user.username || user.email || 'Admin';
        }
        // Route to either the dashboard tables or the builder view
        applyRoute();
    }

    function isBuilderPath() { return window.location.pathname.startsWith('/admin/builder'); }
    function isSitemapPath() { return window.location.pathname.startsWith('/admin/sitemap'); }
    function isChatPath() { return window.location.pathname.startsWith('/admin/chat'); }
    function isLeadsPath() { return window.location.pathname.startsWith('/admin/leads'); }
    function isRobotsPath() { return window.location.pathname.startsWith('/admin/robots'); }
    function isPrerenderPath() { return window.location.pathname.startsWith('/admin/prerender'); }

    function applyRoute() {
        const mainDash = document.getElementById('view-dashboard-main');
        const mainBld = document.getElementById('view-builder');
        const mainSitemap = document.getElementById('view-sitemap');
        const mainChat = document.getElementById('view-chat');
        const mainLeads = document.getElementById('view-leads');
        const mainRobots = document.getElementById('view-robots');
        const mainPrerender = document.getElementById('view-prerender');
        if (!mainDash || !mainBld || !mainSitemap || !mainChat || !mainLeads || !mainRobots || !mainPrerender) return;

        // Sync nav tab "active" styling
        document.querySelectorAll('.admin-nav-tab').forEach(function (a) {
            const tab = a.dataset.tab;
            const isActive =
                (tab === 'builder' && isBuilderPath()) ||
                (tab === 'sitemap' && isSitemapPath()) ||
                (tab === 'robots' && isRobotsPath()) ||
                (tab === 'prerender' && isPrerenderPath()) ||
                (tab === 'chat' && isChatPath()) ||
                (tab === 'leads' && isLeadsPath()) ||
                (tab === 'dashboard' && !isBuilderPath() && !isSitemapPath() && !isRobotsPath() && !isPrerenderPath() && !isChatPath() && !isLeadsPath());
            a.classList.toggle('active', isActive);
        });

        // Hide all, show active
        mainDash.hidden = true;
        mainBld.hidden = true;
        mainSitemap.hidden = true;
        mainChat.hidden = true;
        mainLeads.hidden = true;
        mainRobots.hidden = true;
        mainPrerender.hidden = true;

        if (isBuilderPath()) {
            mainBld.hidden = false;
            window.dispatchEvent(new CustomEvent('icsdc:show-builder'));
        } else if (isSitemapPath()) {
            mainSitemap.hidden = false;
            if (!window.__icsdc_sitemapLoaded) {
                window.__icsdc_sitemapLoaded = true;
                loadSitemap();
            }
        } else if (isRobotsPath()) {
            mainRobots.hidden = false;
            if (!window.__icsdc_robotsLoaded) {
                window.__icsdc_robotsLoaded = true;
                loadRobots();
            }
        } else if (isPrerenderPath()) {
            mainPrerender.hidden = false;
            if (!prerenderState_running) loadPrerender();
        } else if (isChatPath()) {
            mainChat.hidden = false;
            if (!window.__icsdc_chatLoaded) {
                window.__icsdc_chatLoaded = true;
                if (typeof window.initChatPanel === 'function') {
                    window.initChatPanel(mainChat);
                }
            }
        } else if (isLeadsPath()) {
            mainLeads.hidden = false;
            if (!window.__icsdc_leadsLoaded) {
                window.__icsdc_leadsLoaded = true;
                initLeadsControls();
                loadLeads();
            }
        } else {
            mainDash.hidden = false;
            if (!window.__icsdc_dashLoaded) {
                window.__icsdc_dashLoaded = true;
                loadDashboard();
            }
        }
    }

    // Intercept nav tab clicks for SPA-style navigation
    function initNavTabs() {
        document.querySelectorAll('.admin-nav-tab').forEach(function (a) {
            a.addEventListener('click', function (e) {
                e.preventDefault();
                const href = a.getAttribute('href');
                if (href === window.location.pathname) return;
                window.history.pushState({}, '', href);
                applyRoute();
            });
        });
        window.addEventListener('popstate', applyRoute);
    }

    // ── Login ─────────────────────────────────────────────────
    function initLogin() {
        const form = document.getElementById('login-form');
        const errEl = document.getElementById('login-error');
        const errTxt = document.getElementById('login-error-text');
        const btn = document.getElementById('login-btn');

        function showError(msg) {
            errTxt.textContent = msg;
            errEl.hidden = false;
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errEl.hidden = true;

            const identifier = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            if (!identifier || !password) {
                showError('Please enter your email and password.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…';

            try {
                const res = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identifier, password }),
                });
                const data = await res.json();

                if (!res.ok) {
                    showError(data?.error?.message || 'Invalid credentials.');
                    return;
                }

                saveSession(data.jwt, data.user);
                showDashboard();
            } catch {
                showError('Could not reach the server. Please try again.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Sign In ';
            }
        });
    }

    // ── Password eye toggle ───────────────────────────────────
    function initEyeToggle() {
        const btn = document.getElementById('eye-toggle');
        const input = document.getElementById('login-password');
        if (!btn || !input) return;

        btn.addEventListener('click', function () {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            }
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
    }

    // ── Logout ────────────────────────────────────────────────
    function initLogout() {
        document.getElementById('logout-btn').addEventListener('click', function () {
            clearSession();
            showLogin();
        });
    }

    // ── Theme toggle ──────────────────────────────────────────
    function initTheme() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;

        function syncIcon() {
            const dark = document.documentElement.getAttribute('data-theme') === 'dark';
            const icon = btn.querySelector('i');
            if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        }

        syncIcon();

        btn.addEventListener('click', function () {
            const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('icsdc-theme', next);
            syncIcon();
        });
    }

    // ── Dashboard ─────────────────────────────────────────────
    async function loadDashboard() {
        loadHealth();
        await loadPages();
    }

    // ── Health ────────────────────────────────────────────────
    async function loadHealth() {
        const chip = document.getElementById('chip-strapi');
        const status = document.getElementById('strapi-status');
        try {
            const res = await apiFetch('/api/admin/health');
            const data = await res.json();
            const up = data.strapi === 'ok';
            status.textContent = up ? 'OK' : 'Down';
            chip.className = `admin-chip ${up ? 'admin-chip-ok' : 'admin-chip-down'}`;
        } catch (err) {
            if (err.message !== 'Session expired') {
                status.textContent = 'Error';
                chip.className = 'admin-chip admin-chip-down';
            }
        }
    }

    // ── Submissions ───────────────────────────────────────────
    let allSubmissions = [];

    async function loadSubmissions() {
        const tbody = document.getElementById('submissions-body');
        tbody.innerHTML = '<tr><td colspan="6" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
        try {
            const res = await apiFetch('/api/admin/submissions');
            const data = await res.json();
            allSubmissions = data?.data || [];
            renderSubmissions(allSubmissions);
        } catch (err) {
            if (err.message !== 'Session expired') {
                tbody.innerHTML = '<tr><td colspan="6" class="admin-loading-cell">Failed to load submissions.</td></tr>';
            }
        }
    }

    function renderSubmissions(items) {
        const tbody = document.getElementById('submissions-body');
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="admin-loading-cell">No submissions found.</td></tr>';
            return;
        }
        tbody.innerHTML = items.map(function (item, idx) {
            const d = item.attributes || item;
            const date = d.createdAt
                ? new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
            const detailId = `sub-detail-${idx}`;
            const phone = d.phone ? `<div class="sub-detail-row"><span class="sub-detail-label">Phone</span><span>${esc(d.phone)}</span></div>` : '';
            return `<tr class="sub-main-row" data-detail="${detailId}">
                <td>${esc(d.name)}</td>
                <td><a href="mailto:${esc(d.email)}">${esc(d.email)}</a></td>
                <td>${esc(d.subject || '—')}</td>
                <td>${esc(d.company || '—')}</td>
                <td>${date}</td>
                <td><button class="sub-expand-btn" aria-expanded="false" aria-controls="${detailId}"><i class="fa-solid fa-chevron-down"></i></button></td>
            </tr>
            <tr id="${detailId}" class="sub-detail-panel" hidden>
                <td colspan="6">
                    <div class="sub-detail-body">
                        ${phone}
                        <div class="sub-detail-row">
                            <span class="sub-detail-label">Message</span>
                            <p class="sub-detail-message">${esc(d.message || '—')}</p>
                        </div>
                    </div>
                </td>
            </tr>`;
        }).join('');

        tbody.querySelectorAll('.sub-expand-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const panel = document.getElementById(btn.closest('tr').dataset.detail);
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', !expanded);
                btn.classList.toggle('open', !expanded);
                panel.hidden = expanded;
            });
        });
    }

    function initSubmissionsSearch() {
        const input = document.getElementById('search-submissions');
        if (!input) return;
        input.addEventListener('input', function () {
            const q = input.value.toLowerCase();
            const filtered = allSubmissions.filter(function (item) {
                const d = item.attributes || item;
                return [d.name, d.email, d.subject, d.company].some(function (v) {
                    return String(v || '').toLowerCase().includes(q);
                });
            });
            renderSubmissions(filtered);
        });

        document.getElementById('refresh-submissions').addEventListener('click', async function () {
            input.value = '';
            const btn = this;
            btn.disabled = true;
            await loadSubmissions();
            btn.disabled = false;
        });
    }

    // ── Pages ─────────────────────────────────────────────────
    let allPages = [];
    let activeFilter = 'all';

    async function loadPages() {
        const tbody = document.getElementById('pages-body');
        tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
        try {
            const res = await apiFetch('/api/admin/pages');
            const data = await res.json();
            // Drop the homepage row — it must never be toggleable, so it
            // shouldn't appear in the registry table.
            allPages = (data?.data || []).filter(function (p) {
                const slug = (p.attributes || p).slug || '';
                return slug !== 'index' && slug !== 'home' && slug !== '' && slug !== '/';
            });
            updatePageCounts();
            renderPages();
        } catch (err) {
            if (err.message !== 'Session expired') {
                tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell">Failed to load pages.</td></tr>';
            }
        }
    }

    function updatePageCounts() {
        const live = allPages.filter(function (p) { return (p.attributes || p).isLive !== false; }).length;
        const hidden = allPages.length - live;
        document.getElementById('count-all').textContent = allPages.length;
        document.getElementById('count-live').textContent = live;
        document.getElementById('count-hidden').textContent = hidden;
    }

    function renderPages() {
        const query = (document.getElementById('search-pages').value || '').toLowerCase();
        const tbody = document.getElementById('pages-body');

        const filtered = allPages.filter(function (item) {
            const d = item.attributes || item;
            const live = d.isLive !== false;

            if (activeFilter === 'live' && !live) return false;
            if (activeFilter === 'hidden' && live) return false;

            if (query) {
                return [d.displayName, d.slug].some(function (v) {
                    return String(v || '').toLowerCase().includes(query);
                });
            }
            return true;
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell">No pages found.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (item) {
            const d = item.attributes || item;
            const id = item.documentId || item.id;
            const live = d.isLive !== false;
            const badge = live
                ? '<span class="admin-status-badge live"><span class="admin-status-dot"></span>Live</span>'
                : '<span class="admin-status-badge hidden"><span class="admin-status-dot"></span>Hidden</span>';
            const toggleBtn = live
                ? `<button class="admin-toggle-btn btn-hide" data-id="${id}" data-live="true"><i class="fa-solid fa-eye-slash"></i> Take Offline</button>`
                : `<button class="admin-toggle-btn btn-show" data-id="${id}" data-live="false"><i class="fa-solid fa-eye"></i> Publish</button>`;
            const rowClass = live ? '' : 'admin-row-hidden';
            return `<tr class="${rowClass}">
                <td>${esc(d.displayName)}</td>
                <td><code>/${esc(d.slug)}</code></td>
                <td>${badge}</td>
                <td>${toggleBtn}</td>
            </tr>`;
        }).join('');

        // Bind toggle buttons
        tbody.querySelectorAll('.admin-toggle-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { handleTogglePage(btn); });
        });
    }

    async function handleTogglePage(btn) {
        const id = btn.dataset.id;
        const wasLive = btn.dataset.live === 'true';
        const newLive = !wasLive;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await apiFetch(`/api/admin/pages/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isLive: newLive }),
            });
            if (!res.ok) throw new Error('Toggle failed');

            // Update in-memory data
            const entry = allPages.find(function (p) { return (p.documentId || String(p.id)) === String(id); });
            if (entry) {
                if (entry.attributes) entry.attributes.isLive = newLive;
                else entry.isLive = newLive;
            }

            updatePageCounts();
            renderPages();
        } catch (err) {
            if (err.message !== 'Session expired') {
                btn.disabled = false;
                btn.innerHTML = wasLive
                    ? '<i class="fa-solid fa-eye-slash"></i> Take Offline'
                    : '<i class="fa-solid fa-eye"></i> Publish';
                alert('Failed to update page status. Please try again.');
            }
        }
    }

    function initPagesControls() {
        document.getElementById('search-pages').addEventListener('input', renderPages);

        document.querySelectorAll('.admin-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                activeFilter = btn.dataset.filter;
                document.querySelectorAll('.admin-filter-btn').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                renderPages();
            });
        });

        document.getElementById('refresh-pages').addEventListener('click', async function () {
            document.getElementById('search-pages').value = '';
            activeFilter = 'all';
            document.querySelectorAll('.admin-filter-btn').forEach(function (b) {
                b.classList.toggle('active', b.dataset.filter === 'all');
            });
            const btn = this;
            btn.disabled = true;
            await loadPages();
            btn.disabled = false;
        });
    }

    // ── Leads ─────────────────────────────────────────────────
    let allLeads = [];
    let leadsActiveSource = 'all';
    let leadsSearchQ = '';

    async function loadLeads() {
        const tbody = document.getElementById('leads-body');
        tbody.innerHTML = '<tr><td colspan="7" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading leads…</td></tr>';
        try {
            const res = await apiFetch('/api/admin/leads');
            const data = await res.json();
            allLeads = data?.data || [];
            updateLeadStats(data.counts || {}, data.weekCounts || {});
            renderLeads();
        } catch (err) {
            if (err.message !== 'Session expired') {
                tbody.innerHTML = '<tr><td colspan="7" class="admin-loading-cell">Failed to load leads.</td></tr>';
            }
        }
    }

    function updateLeadStats(counts, weekCounts) {
        const set = function (id, val) {
            const el = document.getElementById(id);
            if (el) el.textContent = val || 0;
        };
        set('stat-contact-total', counts.contact);
        set('stat-whatsapp-total', counts.whatsapp);
        set('stat-chat-total', counts.chat);
        set('stat-contact-week', weekCounts.contact);
        set('stat-whatsapp-week', weekCounts.whatsapp);
        set('stat-chat-week', weekCounts.chat);
        set('lead-count-all', counts.total);
        set('lead-count-contact', counts.contact);
        set('lead-count-whatsapp', counts.whatsapp);
        set('lead-count-chat', counts.chat);
    }

    function filteredLeads() {
        const q = leadsSearchQ.toLowerCase();
        return allLeads.filter(function (l) {
            if (leadsActiveSource !== 'all' && l.source !== leadsActiveSource) return false;
            if (!q) return true;
            return [l.name, l.email, l.phone, l.subject, l.message]
                .some(function (v) { return String(v || '').toLowerCase().includes(q); });
        });
    }

    function leadBadge(source) {
        const map = {
            contact: { cls: 'contact', icon: 'fa-solid fa-envelope', label: 'Contact' },
            whatsapp: { cls: 'whatsapp', icon: 'fa-brands fa-whatsapp', label: 'WhatsApp' },
            chat: { cls: 'chat', icon: 'fa-solid fa-comments', label: 'Chat' },
        };
        const m = map[source] || { cls: 'chat', icon: 'fa-solid fa-circle', label: source };
        return '<span class="lead-badge lead-badge--' + m.cls + '">' +
            '<i class="' + m.icon + '" aria-hidden="true"></i> ' + m.label + '</span>';
    }

    function leadActions(l) {
        const out = [];
        if (l.source === 'contact') {
            if (l.email) out.push('<a class="lead-action" title="Email" href="mailto:' + esc(l.email) + '"><i class="fa-solid fa-envelope" aria-hidden="true"></i></a>');
            if (l.phone) out.push('<a class="lead-action" title="Call"  href="tel:' + esc(l.phone) + '"><i class="fa-solid fa-phone" aria-hidden="true"></i></a>');
        } else if (l.source === 'whatsapp') {
            if (l.phone) {
                const clean = String(l.phone).replace(/[^0-9]/g, '');
                out.push('<a class="lead-action lead-action--wa" title="Open WhatsApp" target="_blank" rel="noopener" href="https://wa.me/' + clean + '"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></a>');
                out.push('<a class="lead-action" title="Call" href="tel:' + esc(l.phone) + '"><i class="fa-solid fa-phone" aria-hidden="true"></i></a>');
            }
        } else if (l.source === 'chat') {
            out.push('<a class="lead-action lead-action--chat" title="Open in Live Chat" href="/admin/chat"><i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>');
            if (l.phone) out.push('<a class="lead-action" title="Call" href="tel:' + esc(l.phone) + '"><i class="fa-solid fa-phone" aria-hidden="true"></i></a>');
        }
        return out.join('');
    }

    function leadContactCell(l) {
        const parts = [];
        if (l.email) parts.push('<a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a>');
        if (l.phone) parts.push(esc(l.phone));
        if (!parts.length) parts.push('<span class="muted">—</span>');
        return parts.join('<br>');
    }

    function leadStatusBadge(l) {
        if (!l.status) return '—';
        const cls = String(l.status).toLowerCase();
        return '<span class="lead-status lead-status--' + cls + '">' + esc(l.status) + '</span>';
    }

    function leadDetailBody(l) {
        const rows = [];
        if (l.subject) rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Subject</span><span>' + esc(l.subject) + '</span></div>');
        if (l.company) rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Company</span><span>' + esc(l.company) + '</span></div>');
        if (l.email) rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Email</span><a href="mailto:' + esc(l.email) + '">' + esc(l.email) + '</a></div>');
        if (l.phone) rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Phone</span><span>' + esc(l.phone) + '</span></div>');
        if (l.source === 'whatsapp' && l.raw && l.raw.sourceUrl)
            rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Page</span><a href="' + esc(l.raw.sourceUrl) + '" target="_blank" rel="noopener">' + esc(l.raw.sourceUrl) + '</a></div>');
        if (l.source === 'chat' && l.raw && Array.isArray(l.raw.messages) && l.raw.messages.length) {
            const last = l.raw.messages.slice(-3)
                .map(function (m) { return '<div><strong>' + esc(m.role) + ':</strong> ' + esc(m.text) + '</div>'; })
                .join('');
            rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Last messages</span><div>' + last + '</div></div>');
        }
        if (l.message) {
            rows.push('<div class="sub-detail-row"><span class="sub-detail-label">Message</span><p class="sub-detail-message">' + esc(l.message) + '</p></div>');
        }
        return rows.join('');
    }

    function renderLeads() {
        const tbody = document.getElementById('leads-body');
        const items = filteredLeads();
        if (!items.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="admin-loading-cell">No leads match the current filter.</td></tr>';
            return;
        }
        tbody.innerHTML = items.map(function (l, idx) {
            const date = l.createdAt
                ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '—';
            const detailId = 'lead-detail-' + idx;
            return '<tr class="sub-main-row" data-detail="' + detailId + '">' +
                '<td>' + leadBadge(l.source) + '</td>' +
                '<td>' + esc(l.name || '—') + '</td>' +
                '<td>' + leadContactCell(l) + '</td>' +
                '<td>' + leadStatusBadge(l) + '</td>' +
                '<td>' + date + '</td>' +
                '<td class="lead-actions">' + leadActions(l) + '</td>' +
                '<td><button class="sub-expand-btn" aria-expanded="false" aria-controls="' + detailId + '"><i class="fa-solid fa-chevron-down"></i></button></td>' +
                '</tr>' +
                '<tr id="' + detailId + '" class="sub-detail-panel" hidden>' +
                '<td colspan="7"><div class="sub-detail-body">' + leadDetailBody(l) + '</div></td>' +
                '</tr>';
        }).join('');

        tbody.querySelectorAll('.sub-expand-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const panel = document.getElementById(btn.closest('tr').dataset.detail);
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                btn.setAttribute('aria-expanded', !expanded);
                btn.classList.toggle('open', !expanded);
                panel.hidden = expanded;
            });
        });
    }

    function initLeadsControls() {
        const search = document.getElementById('search-leads');
        if (search) {
            search.addEventListener('input', function () {
                leadsSearchQ = search.value;
                renderLeads();
            });
        }
        document.querySelectorAll('#lead-filter-chips .admin-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('#lead-filter-chips .admin-filter-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                leadsActiveSource = btn.dataset.source;
                renderLeads();
            });
        });
        const refresh = document.getElementById('refresh-leads');
        if (refresh) {
            refresh.addEventListener('click', async function () {
                this.disabled = true;
                if (search) search.value = '';
                leadsSearchQ = '';
                await loadLeads();
                this.disabled = false;
            });
        }
    }

    // ── Sitemap ───────────────────────────────────────────────
    let allSitemapEntries = [];
    let sitemapActiveFilter = 'all';
    let sitemapUrl = '/sitemap.xml';

    async function loadSitemap() {
        const tbody = document.getElementById('sitemap-body');
        tbody.innerHTML = '<tr><td colspan="5" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
        try {
            const res = await apiFetch('/api/admin/sitemap');
            const data = await res.json();
            allSitemapEntries = data.entries || [];
            sitemapUrl = data.sitemapUrl || '/sitemap.xml';

            // Stats
            document.getElementById('stat-total').textContent = data.counts.total;
            document.getElementById('stat-static').textContent = data.counts.static;
            document.getElementById('stat-builder').textContent = data.counts.builder;
            document.getElementById('stat-blog').textContent = data.counts.blog;
            document.getElementById('stat-generated').textContent =
                data.generatedAt
                    ? new Date(data.generatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—';

            renderSitemap();
        } catch (err) {
            if (err.message !== 'Session expired') {
                tbody.innerHTML = '<tr><td colspan="5" class="admin-loading-cell">Failed to load sitemap data.</td></tr>';
            }
        }
    }

    function renderSitemap() {
        const query = (document.getElementById('sitemap-search').value || '').toLowerCase();
        const tbody = document.getElementById('sitemap-body');

        // Filter on the entry's own type. The old pair of checks knew only
        // 'static' and 'builder', so blog posts (type 'blog') were excluded by
        // BOTH buttons and were visible only under "All".
        const filtered = allSitemapEntries.filter(function (e) {
            if (sitemapActiveFilter !== 'all' && e.type !== sitemapActiveFilter) return false;
            if (query) return e.loc.toLowerCase().includes(query);
            return true;
        });

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-loading-cell">No URLs match.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (e) {
            // Three types, not two. Blog posts previously fell into the else
            // branch and were mislabelled "Static".
            const badgeLabel = { builder: 'Builder', blog: 'Blog' }[e.type] || 'Static';
            const badgeClass = { builder: 'sitemap-type-builder', blog: 'sitemap-type-blog' }[e.type]
                || 'sitemap-type-static';
            const typeBadge = '<span class="sitemap-type-badge ' + badgeClass + '">' + badgeLabel + '</span>';
            const path = e.loc.replace(/^https?:\/\/[^/]+/, '');
            return `<tr>
                <td class="sitemap-url-cell">
                    <a href="${esc(e.loc)}" target="_blank" rel="noopener noreferrer" class="sitemap-url-link">${esc(path)}</a>
                </td>
                <td>${typeBadge}</td>
                <td>${e.priority.toFixed(1)}</td>
                <td>${esc(e.changefreq)}</td>
                <td>${esc(e.lastmod)}</td>
            </tr>`;
        }).join('');
    }

    function initSitemapControls() {
        const searchInput = document.getElementById('sitemap-search');
        if (searchInput) {
            searchInput.addEventListener('input', renderSitemap);
        }

        // Filter buttons
        document.querySelectorAll('[data-sitemap-filter]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                sitemapActiveFilter = btn.dataset.sitemapFilter;
                document.querySelectorAll('[data-sitemap-filter]').forEach(function (b) {
                    b.classList.toggle('active', b === btn);
                });
                renderSitemap();
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('sitemap-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async function () {
                refreshBtn.disabled = true;
                window.__icsdc_sitemapLoaded = false;
                await loadSitemap();
                window.__icsdc_sitemapLoaded = true;
                refreshBtn.disabled = false;
            });
        }

        // Regenerate button — forces the server to rewrite public/sitemap.xml
        const regenBtn = document.getElementById('sitemap-regenerate-btn');
        if (regenBtn) {
            regenBtn.addEventListener('click', async function () {
                regenBtn.disabled = true;
                const original = regenBtn.innerHTML;
                regenBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Regenerating…';
                try {
                    const res = await apiFetch('/api/admin/sitemap/regenerate', { method: 'POST' });
                    if (!res.ok) throw new Error('Regenerate failed');
                    await loadSitemap();
                } catch (err) {
                    if (err.message !== 'Session expired') {
                        alert('Could not regenerate sitemap. See server logs.');
                    }
                } finally {
                    regenBtn.innerHTML = original;
                    regenBtn.disabled = false;
                }
            });
        }

        // Copy sitemap URL
        const copyBtn = document.getElementById('sitemap-copy-btn');
        const toast = document.getElementById('sitemap-toast');
        if (copyBtn && toast) {
            copyBtn.addEventListener('click', async function () {
                const url = sitemapUrl || window.location.origin + '/sitemap.xml';
                try {
                    await navigator.clipboard.writeText(url);
                } catch (_) {
                    // Fallback for non-secure contexts
                    const ta = document.createElement('textarea');
                    ta.value = url;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                toast.hidden = false;
                setTimeout(function () { toast.hidden = true; }, 2400);
            });
        }
    }

    // ── Robots.txt editor ─────────────────────────────────────
    let robotsSaved = '';   // last-saved baseline, for dirty detection

    function setRobotsStatus(msg, kind) {
        const el = document.getElementById('robots-status');
        if (!el) return;
        el.textContent = msg;
        el.classList.remove('is-success', 'is-error', 'is-dirty');
        if (kind) el.classList.add('is-' + kind);
    }

    function setRobotsDirty(dirty) {
        const saveBtn = document.getElementById('robots-save-btn');
        if (saveBtn) saveBtn.disabled = !dirty;
        if (dirty) setRobotsStatus('Unsaved changes', 'dirty');
    }

    async function loadRobots() {
        const editor = document.getElementById('robots-editor');
        if (!editor) return;
        setRobotsStatus('Loading…');
        try {
            const res = await apiFetch('/api/admin/robots');
            if (!res.ok) throw new Error('Load failed');
            const data = await res.json();
            editor.value = data.content || '';
            robotsSaved = editor.value;
            setRobotsDirty(false);
            setRobotsStatus(data.exists === false
                ? 'No robots.txt yet — showing a default. Save to create it.'
                : 'Loaded.');
        } catch (err) {
            if (err.message !== 'Session expired') setRobotsStatus('Could not load robots.txt.', 'error');
        }
    }

    function initRobotsControls() {
        const editor = document.getElementById('robots-editor');
        const saveBtn = document.getElementById('robots-save-btn');
        const reloadBtn = document.getElementById('robots-reload-btn');
        if (!editor) return;

        editor.addEventListener('input', function () {
            setRobotsDirty(editor.value !== robotsSaved);
        });

        if (reloadBtn) {
            reloadBtn.addEventListener('click', async function () {
                reloadBtn.disabled = true;
                await loadRobots();
                reloadBtn.disabled = false;
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', async function () {
                saveBtn.disabled = true;
                const original = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';
                try {
                    const res = await apiFetch('/api/admin/robots', {
                        method: 'POST',
                        body: JSON.stringify({ content: editor.value }),
                    });
                    if (!res.ok) {
                        const e = await res.json().catch(function () { return {}; });
                        throw new Error(e.error || 'Save failed');
                    }
                    robotsSaved = editor.value;
                    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    setRobotsStatus('Saved ✓ at ' + t, 'success');
                } catch (err) {
                    if (err.message !== 'Session expired') {
                        setRobotsStatus(err.message || 'Could not save robots.txt.', 'error');
                        saveBtn.disabled = false;   // allow retry
                    }
                } finally {
                    saveBtn.innerHTML = original;
                }
            });
        }
    }

    // ── Prerender / crawler snapshots ──────────────────────────
    let prerenderPollTimer = null;
    let prerenderState_running = false;

    function fmtBytes(n) {
        if (n == null) return '—';
        if (n < 1024) return n + ' B';
        return (n / 1024).toFixed(0) + ' KB';
    }

    function fmtWhen(iso) {
        if (!iso) return 'Never';
        const d = new Date(iso);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function renderPrerenderTable(data) {
        const tbody = document.getElementById('prerender-tbody');
        if (!tbody) return;
        if (!data.pages || !data.pages.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell">No pages found.</td></tr>';
            return;
        }
        tbody.innerHTML = data.pages.map(function (p) {
            const built = !!p.builtAt;
            return '<tr>' +
                '<td><code>' + esc(p.path) + '</code></td>' +
                '<td>' + (built
                    ? '<span style="color:#15803d;"><i class="fa-solid fa-circle-check"></i> Built (' + fmtBytes(p.bytes) + ')</span>'
                    : '<span style="color:#94a3b8;"><i class="fa-regular fa-circle"></i> Not built</span>') +
                '</td>' +
                '<td>' + fmtWhen(p.builtAt) + '</td>' +
                '<td><button class="admin-refresh-btn" data-prerender-one="' + esc(p.path) + '" aria-label="Rebuild" type="button"><i class="fa-solid fa-rotate"></i></button></td>' +
                '</tr>';
        }).join('');

        tbody.querySelectorAll('[data-prerender-one]').forEach(function (btn) {
            btn.addEventListener('click', function () { buildPrerender(btn.getAttribute('data-prerender-one'), btn); });
        });
    }

    function updatePrerenderLog(log) {
        const wrap = document.getElementById('prerender-log-wrap');
        const pre  = document.getElementById('prerender-log');
        if (!wrap || !pre) return;
        if (!log) return;
        wrap.style.display = 'block';
        pre.textContent = log;
        pre.scrollTop = pre.scrollHeight;
    }

    async function loadPrerender() {
        try {
            const res = await apiFetch('/api/admin/prerender');
            if (!res.ok) throw new Error('Load failed');
            const data = await res.json();
            renderPrerenderTable(data);
            const statusEl = document.getElementById('prerender-status');
            if (statusEl) {
                statusEl.textContent = data.running
                    ? 'Build running… (' + data.built + '/' + data.total + ' already built)'
                    : data.built + ' / ' + data.total + ' pages have a snapshot.' +
                      (data.finishedAt ? ' Last build finished ' + fmtWhen(data.finishedAt) + (data.exitCode ? ' (exit ' + data.exitCode + ')' : '.') : '');
            }
            prerenderState_running = !!data.running;
            const buildBtn = document.getElementById('prerender-build-all-btn');
            if (buildBtn) buildBtn.disabled = !!data.running;

            if (data.log) updatePrerenderLog(data.log);

            clearTimeout(prerenderPollTimer);
            if (data.running) prerenderPollTimer = setTimeout(loadPrerender, 2500);
        } catch (err) {
            if (err.message !== 'Session expired') {
                const statusEl = document.getElementById('prerender-status');
                if (statusEl) statusEl.textContent = 'Could not load prerender status.';
            }
        }
    }

    async function buildPrerender(targetPath, triggerBtn) {
        const buildBtn = document.getElementById('prerender-build-all-btn');
        const statusEl = document.getElementById('prerender-status');
        const logWrap  = document.getElementById('prerender-log-wrap');
        const logPre   = document.getElementById('prerender-log');
        prerenderState_running = true;
        if (buildBtn) buildBtn.disabled = true;
        if (triggerBtn) triggerBtn.disabled = true;
        if (logWrap) logWrap.style.display = 'block';
        if (logPre)  logPre.textContent = 'Starting build…';
        try {
            const res = await apiFetch('/api/admin/prerender', {
                method: 'POST',
                body: JSON.stringify(targetPath ? { path: targetPath } : {}),
            });
            if (!res.ok) {
                const e = await res.json().catch(function () { return {}; });
                throw new Error(e.error || 'Build failed to start');
            }
            if (statusEl) statusEl.textContent = 'Build started' + (targetPath ? ' for ' + targetPath : ' for all pages') + '…';
            clearTimeout(prerenderPollTimer);
            prerenderPollTimer = setTimeout(loadPrerender, 1500);
        } catch (err) {
            if (err.message !== 'Session expired') {
                if (statusEl) statusEl.textContent = err.message || 'Could not start build.';
                if (logPre) logPre.textContent = err.message || 'Could not start build.';
                if (buildBtn) buildBtn.disabled = false;
                if (triggerBtn) triggerBtn.disabled = false;
            }
        }
    }

    function initPrerenderControls() {
        const refreshBtn = document.getElementById('prerender-refresh-btn');
        const buildAllBtn = document.getElementById('prerender-build-all-btn');
        const logClearBtn = document.getElementById('prerender-log-clear');
        if (refreshBtn) refreshBtn.addEventListener('click', function () { loadPrerender(); });
        if (buildAllBtn) buildAllBtn.addEventListener('click', function () { buildPrerender(null, buildAllBtn); });
        if (logClearBtn) logClearBtn.addEventListener('click', function () {
            const wrap = document.getElementById('prerender-log-wrap');
            if (wrap) wrap.style.display = 'none';
        });
    }

    // ── Utility ───────────────────────────────────────────────
    function esc(str) {
        return String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Boot ──────────────────────────────────────────────────
    function init() {
        initLogin();
        initEyeToggle();
        initLogout();
        initTheme();
        initPagesControls();
        initSitemapControls();
        initRobotsControls();
        initPrerenderControls();
        initNavTabs();

        if (getJwt()) {
            showDashboard();
        } else {
            showLogin();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
