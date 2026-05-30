(function () {
    'use strict';

    const JWT_KEY  = 'icsdc_admin_jwt';
    const USER_KEY = 'icsdc_admin_user';

    // ── Auth helpers ──────────────────────────────────────────
    function getJwt()  { return sessionStorage.getItem(JWT_KEY); }
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
        loadDashboard();
    }

    // ── Login ─────────────────────────────────────────────────
    function initLogin() {
        const form   = document.getElementById('login-form');
        const errEl  = document.getElementById('login-error');
        const errTxt = document.getElementById('login-error-text');
        const btn    = document.getElementById('login-btn');

        function showError(msg) {
            errTxt.textContent = msg;
            errEl.hidden = false;
        }

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            errEl.hidden = true;

            const identifier = document.getElementById('login-email').value.trim();
            const password   = document.getElementById('login-password').value;

            if (!identifier || !password) {
                showError('Please enter your email and password.');
                return;
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in…';

            try {
                const res  = await fetch('/api/admin/login', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ identifier, password }),
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
                btn.innerHTML = 'Sign In &rarr;';
            }
        });
    }

    // ── Password eye toggle ───────────────────────────────────
    function initEyeToggle() {
        const btn   = document.getElementById('eye-toggle');
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
        await loadSubmissions();
        await loadPages();
    }

    // ── Health ────────────────────────────────────────────────
    async function loadHealth() {
        const chip   = document.getElementById('chip-strapi');
        const status = document.getElementById('strapi-status');
        try {
            const res  = await apiFetch('/api/admin/health');
            const data = await res.json();
            const up   = data.strapi === 'ok';
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
            const res   = await apiFetch('/api/admin/submissions');
            const data  = await res.json();
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
            const d    = item.attributes || item;
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
                const panel    = document.getElementById(btn.closest('tr').dataset.detail);
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
    let allPages      = [];
    let activeFilter  = 'all';

    async function loadPages() {
        const tbody = document.getElementById('pages-body');
        tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell"><i class="fa-solid fa-spinner fa-spin"></i> Loading…</td></tr>';
        try {
            const res  = await apiFetch('/api/admin/pages');
            const data = await res.json();
            allPages   = data?.data || [];
            updatePageCounts();
            renderPages();
        } catch (err) {
            if (err.message !== 'Session expired') {
                tbody.innerHTML = '<tr><td colspan="4" class="admin-loading-cell">Failed to load pages.</td></tr>';
            }
        }
    }

    function updatePageCounts() {
        const live   = allPages.filter(function (p) { return (p.attributes || p).isLive !== false; }).length;
        const hidden = allPages.length - live;
        document.getElementById('count-all').textContent    = allPages.length;
        document.getElementById('count-live').textContent   = live;
        document.getElementById('count-hidden').textContent = hidden;
    }

    function renderPages() {
        const query  = (document.getElementById('search-pages').value || '').toLowerCase();
        const tbody  = document.getElementById('pages-body');

        const filtered = allPages.filter(function (item) {
            const d    = item.attributes || item;
            const live = d.isLive !== false;

            if (activeFilter === 'live'   && !live) return false;
            if (activeFilter === 'hidden' &&  live) return false;

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
            const d    = item.attributes || item;
            const id   = item.documentId || item.id;
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
        const id      = btn.dataset.id;
        const wasLive = btn.dataset.live === 'true';
        const newLive = !wasLive;

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const res = await apiFetch(`/api/admin/pages/${id}`, {
                method: 'PATCH',
                body:   JSON.stringify({ isLive: newLive }),
            });
            if (!res.ok) throw new Error('Toggle failed');

            // Update in-memory data
            const entry = allPages.find(function (p) { return (p.documentId || String(p.id)) === String(id); });
            if (entry) {
                if (entry.attributes) entry.attributes.isLive = newLive;
                else                  entry.isLive            = newLive;
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

    // ── Utility ───────────────────────────────────────────────
    function esc(str) {
        return String(str || '')
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;');
    }

    // ── Boot ──────────────────────────────────────────────────
    function init() {
        initLogin();
        initEyeToggle();
        initLogout();
        initTheme();
        initSubmissionsSearch();
        initPagesControls();

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
