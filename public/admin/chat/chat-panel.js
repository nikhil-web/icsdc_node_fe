/**
 * chat-panel.js
 * ─────────────
 * Admin Live Chat panel. Loaded as ES module from index.html.
 * Requires socket.io client at /socket.io/socket.io.js (auto-served by Node server).
 *
 * Exposes:  window.initChatPanel()
 */

(function () {
    'use strict';

    const JWT_KEY = 'icsdc_admin_jwt';

    function getJwt() { return sessionStorage.getItem(JWT_KEY); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function fmtTime(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    function fmtDate(iso) {
        if (!iso) return '';
        return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    // ── State ────────────────────────────────────────────────
    let adminTypingTimer = null;
    let socket        = null;
    let sessions      = [];      // full session list
    let activeSession = null;    // currently selected session object
    let filterStatus  = 'all';   // 'all' | 'bot' | 'live' | 'closed'
    let searchQuery   = '';

    // ── DOM refs ─────────────────────────────────────────────
    let sessionListEl, convAreaEl, convNameEl, convMetaEl, convBubblesEl,
        replyBox, replyInput, replySendBtn, takeoverBtn, closeSessionBtn,
        filterBtns, searchInput, emptyState, convPanel;

    // ── Mount ────────────────────────────────────────────────
    function mount(container) {
        container.innerHTML = `
<div class="acp-layout">

  <!-- Left: session list -->
  <aside class="acp-sidebar">
    <div class="acp-sidebar-head">
      <h2 class="acp-sidebar-title">Live Chat</h2>
      <span class="acp-live-dot" id="acp-socket-dot" title="Connecting…"></span>
    </div>
    <input class="admin-search acp-search" type="search" placeholder="Search sessions…" id="acp-search" />
    <div class="admin-filter-btns acp-filters">
      <button class="admin-filter-btn active" data-acp-filter="all">All</button>
      <button class="admin-filter-btn" data-acp-filter="live">Live</button>
      <button class="admin-filter-btn" data-acp-filter="bot">Bot</button>
      <button class="admin-filter-btn" data-acp-filter="closed">Closed</button>
    </div>
    <div class="acp-session-list" id="acp-session-list"></div>
  </aside>

  <!-- Right: conversation -->
  <main class="acp-conv" id="acp-conv-panel">
    <div class="acp-empty-state" id="acp-empty">
      <i class="fa-solid fa-comments" aria-hidden="true"></i>
      <p>Select a chat session to view the conversation.</p>
    </div>

    <div class="acp-conv-inner" id="acp-conv-inner" hidden>
      <div class="acp-conv-head">
        <div>
          <div class="acp-conv-name" id="acp-conv-name">—</div>
          <div class="acp-conv-meta" id="acp-conv-meta"></div>
        </div>
        <div class="acp-conv-actions">
          <button class="admin-btn admin-btn-primary" id="acp-takeover-btn" hidden>
            <i class="fa-solid fa-headset"></i> Take Over
          </button>
          <button class="admin-btn admin-btn-secondary" id="acp-close-btn" hidden>
            <i class="fa-solid fa-xmark"></i> Close Chat
          </button>
        </div>
      </div>

      <div class="acp-bubbles" id="acp-bubbles"></div>

      <div class="acp-reply-box" id="acp-reply-box" hidden>
        <textarea class="acp-reply-input" id="acp-reply-input" rows="1" placeholder="Type a reply…"></textarea>
        <button class="acp-reply-send" id="acp-reply-send" type="button">
          <i class="fa-solid fa-paper-plane" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  </main>

</div>`;

        // Bind refs
        sessionListEl   = container.querySelector('#acp-session-list');
        convAreaEl      = container.querySelector('#acp-conv-inner');
        convNameEl      = container.querySelector('#acp-conv-name');
        convMetaEl      = container.querySelector('#acp-conv-meta');
        convBubblesEl   = container.querySelector('#acp-bubbles');
        replyBox        = container.querySelector('#acp-reply-box');
        replyInput      = container.querySelector('#acp-reply-input');
        replySendBtn    = container.querySelector('#acp-reply-send');
        takeoverBtn     = container.querySelector('#acp-takeover-btn');
        closeSessionBtn = container.querySelector('#acp-close-btn');
        emptyState      = container.querySelector('#acp-empty');
        filterBtns      = container.querySelectorAll('[data-acp-filter]');
        searchInput     = container.querySelector('#acp-search');

        // Filter
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterStatus = btn.dataset.acpFilter;
                filterBtns.forEach(function (b) { b.classList.toggle('active', b === btn); });
                renderSessionList();
            });
        });

        // Search
        searchInput.addEventListener('input', function () {
            searchQuery = searchInput.value.toLowerCase().trim();
            renderSessionList();
        });

        // Takeover
        takeoverBtn.addEventListener('click', function () {
            if (!activeSession) return;
            socket && socket.emit('admin:takeover', { sessionId: activeSession.sessionId });
            takeoverBtn.hidden = true;
        });

        // Close session
        closeSessionBtn.addEventListener('click', function () {
            if (!activeSession) return;
            socket && socket.emit('admin:close', { sessionId: activeSession.sessionId });
        });

        // Reply send
        replySendBtn.addEventListener('click', sendReply);
        replyInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
        });
        replyInput.addEventListener('input', function () {
            replyInput.style.height = 'auto';
            replyInput.style.height = Math.min(replyInput.scrollHeight, 96) + 'px';
            emitAdminTyping();
        });
    }

    function emitAdminTyping() {
        if (!socket || !activeSession) return;
        socket.emit('admin:typing', { sessionId: activeSession.sessionId });
        clearTimeout(adminTypingTimer);
        adminTypingTimer = setTimeout(function () {
            socket.emit('admin:typing-stop', { sessionId: activeSession.sessionId });
        }, 2000);
    }

    function showVisitorTyping() {
        if (document.getElementById('acp-visitor-typing')) return;
        const t = document.createElement('div');
        t.className = 'acp-typing';
        t.id = 'acp-visitor-typing';
        const label = document.createElement('span');
        label.className = 'acp-typing-label';
        label.textContent = 'Visitor';
        t.appendChild(label);
        const dots = document.createElement('div');
        dots.className = 'acp-typing-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        t.appendChild(dots);
        convBubblesEl.appendChild(t);
        convBubblesEl.scrollTop = convBubblesEl.scrollHeight;
    }

    function removeVisitorTyping() {
        const t = document.getElementById('acp-visitor-typing');
        if (t) t.remove();
    }

    function sendReply() {
        if (!activeSession || !replyInput.value.trim()) return;
        const text = replyInput.value.trim();
        // Stop typing indicator immediately on send
        clearTimeout(adminTypingTimer);
        socket && socket.emit('admin:typing-stop', { sessionId: activeSession.sessionId });
        socket && socket.emit('admin:message', { sessionId: activeSession.sessionId, text });
        replyInput.value = '';
        replyInput.style.height = '';
        // Optimistically render
        appendBubble({ role: 'admin', text, ts: new Date().toISOString() });
    }

    // ── Session list rendering ────────────────────────────────
    function renderSessionList() {
        const filtered = sessions.filter(function (s) {
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            if (searchQuery) {
                const hay = (s.name + ' ' + s.phone + ' ' + s.service).toLowerCase();
                return hay.includes(searchQuery);
            }
            return true;
        });

        if (!filtered.length) {
            sessionListEl.innerHTML = '<div class="acp-no-sessions">No sessions found.</div>';
            return;
        }

        sessionListEl.innerHTML = filtered.map(function (s) {
            const lastMsg = s.messages && s.messages.length
                ? s.messages[s.messages.length - 1]
                : null;
            const preview = lastMsg ? lastMsg.text.slice(0, 50) + (lastMsg.text.length > 50 ? '…' : '') : 'No messages yet';
            const statusClass = { bot: 'acp-badge--bot', live: 'acp-badge--live', closed: 'acp-badge--closed' }[s.status] || '';
            const isActive = activeSession && activeSession.sessionId === s.sessionId;
            const onlineDot = s.visitorOnline ? '<span class="acp-online-dot" title="Visitor online"></span>' : '';
            return `<button type="button" class="acp-session-card${isActive ? ' is-active' : ''}" data-sid="${esc(s.sessionId)}">
  <div class="acp-card-top">
    <span class="acp-card-name">${esc(s.name || 'Anonymous')} ${onlineDot}</span>
    <span class="acp-badge ${statusClass}">${esc(s.status)}</span>
  </div>
  <div class="acp-card-phone">${esc(s.phone || '—')}</div>
  <div class="acp-card-preview">${esc(preview)}</div>
  <div class="acp-card-time">${fmtDate(s.createdAt)}</div>
</button>`;
        }).join('');

        sessionListEl.querySelectorAll('.acp-session-card').forEach(function (card) {
            card.addEventListener('click', function () {
                const sid = card.dataset.sid;
                const s   = sessions.find(function (x) { return x.sessionId === sid; });
                if (s) openSession(s);
            });
        });
    }

    // ── Conversation view ─────────────────────────────────────
    function openSession(session) {
        activeSession = session;
        emptyState.hidden  = true;
        convAreaEl.hidden  = false;

        // Header
        convNameEl.textContent = session.name || 'Anonymous';
        convMetaEl.textContent = [
            session.phone   ? '📞 ' + session.phone   : '',
            session.service ? '🔧 ' + session.service : '',
            session.company ? '🏢 ' + session.company : '',
            session.budget  ? '💰 ' + session.budget  : '',
        ].filter(Boolean).join(' · ');

        // Takeover / close buttons
        takeoverBtn.hidden    = session.status !== 'bot';
        closeSessionBtn.hidden = session.status === 'closed';
        replyBox.hidden        = session.status !== 'live';

        // Render messages
        convBubblesEl.innerHTML = '';
        (session.messages || []).forEach(function (msg) { appendBubble(msg); });

        // Mark active in list
        renderSessionList();
    }

    function appendBubble(msg) {
        const div = document.createElement('div');
        div.className = 'acp-bubble acp-bubble--' + (msg.role || 'bot');
        // Bug 4: stamp a composite key so dedup can avoid re-rendering the same message
        div.dataset.msgId = (msg.ts || '') + '|' + (msg.role || '');

        const labelMap = { bot: 'Bot', admin: 'Support (You)', visitor: 'Visitor' };
        div.innerHTML =
            '<div class="acp-bubble-label">' + esc(labelMap[msg.role] || msg.role) + ' · ' + fmtTime(msg.ts) + '</div>' +
            '<div class="acp-bubble-text">' + esc(msg.text) + '</div>';

        convBubblesEl.appendChild(div);
        convBubblesEl.scrollTop = convBubblesEl.scrollHeight;
    }

    // ── Socket.io ─────────────────────────────────────────────
    function connectSocket() {
        const dot = document.getElementById('acp-socket-dot');

        if (typeof io === 'undefined') {
            console.warn('[chat-panel] socket.io not loaded');
            return;
        }

        socket = io({ transports: ['websocket', 'polling'] });

        socket.on('connect', function () {
            if (dot) { dot.classList.add('is-connected'); dot.title = 'Connected'; }
            socket.emit('admin:auth', { token: getJwt() });
        });

        socket.on('disconnect', function () {
            if (dot) { dot.classList.remove('is-connected'); dot.title = 'Disconnected'; }
        });

        socket.on('admin:auth-ok', function () {
            console.log('[chat-panel] authenticated');
        });

        socket.on('admin:session-list', function (list) {
            sessions = list;
            renderSessionList();
        });

        socket.on('admin:session-new', function (session) {
            // Add to top of list if not already present
            const idx = sessions.findIndex(function (s) { return s.sessionId === session.sessionId; });
            if (idx === -1) sessions.unshift(session);
            else            sessions[idx] = session;
            renderSessionList();
            showToast('New chat from ' + (session.name || 'a visitor'));
        });

        socket.on('admin:session-update', function (session) {
            const idx = sessions.findIndex(function (s) { return s.sessionId === session.sessionId; });
            if (idx === -1) sessions.unshift(session);
            else            sessions[idx] = session;
            // Bug 9: keep list sorted newest-first so status changes bubble to correct position
            sessions.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });

            // If this is the open session, refresh conv view
            if (activeSession && activeSession.sessionId === session.sessionId) {
                activeSession = session;
                // Bug 4: use timestamp+role key to avoid duplicating messages
                const existing = new Set(
                    Array.from(convBubblesEl.querySelectorAll('.acp-bubble')).map(function (el) { return el.dataset.msgId; })
                );
                (session.messages || []).forEach(function (msg) {
                    const id = (msg.ts || '') + '|' + (msg.role || '');
                    if (!existing.has(id)) {
                        appendBubble(msg);
                        existing.add(id);
                    }
                });
                // Sync button + reply-box state
                takeoverBtn.hidden     = session.status !== 'bot';
                closeSessionBtn.hidden = session.status === 'closed';
                replyBox.hidden        = session.status !== 'live';
                // Update header meta in case new fields arrived
                convMetaEl.textContent = [
                    session.phone   ? '📞 ' + session.phone   : '',
                    session.service ? '🔧 ' + session.service : '',
                    session.company ? '🏢 ' + session.company : '',
                    session.budget  ? '💰 ' + session.budget  : '',
                ].filter(Boolean).join(' · ');
            }
            renderSessionList();
        });

        socket.on('admin:visitor-status', function (data) {
            const s = sessions.find(function (x) { return x.sessionId === data.sessionId; });
            if (s) { s.visitorOnline = data.online; renderSessionList(); }
        });

        socket.on('admin:visitor-message', function (data) {
            if (activeSession && activeSession.sessionId === data.sessionId) {
                removeVisitorTyping();
                appendBubble({ role: 'visitor', text: data.text, ts: new Date().toISOString() });
            }
        });

        socket.on('visitor:typing', function (data) {
            if (activeSession && activeSession.sessionId === data.sessionId) {
                showVisitorTyping();
            }
        });

        socket.on('visitor:typing-stop', function (data) {
            if (activeSession && activeSession.sessionId === data.sessionId) {
                removeVisitorTyping();
            }
        });

        // Bug 3: another admin already took over this session
        socket.on('admin:takeover-fail', function (data) {
            showToast('⚠️ ' + (data.reason || 'Could not take over this chat.'));
            // Re-show the takeover button so they can see the session is already live
            if (takeoverBtn) takeoverBtn.hidden = false;
        });
    }

    // ── Toast notification ────────────────────────────────────
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'acp-toast';
        t.innerHTML = '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i> ' + esc(msg);
        document.body.appendChild(t);
        setTimeout(function () { t.classList.add('is-visible'); }, 50);
        setTimeout(function () { t.classList.remove('is-visible'); setTimeout(function () { t.remove(); }, 300); }, 3500);
    }

    // ── Public init ───────────────────────────────────────────
    window.initChatPanel = function (container) {
        mount(container);
        connectSocket();
    };

    // ── Auto-init guard ───────────────────────────────────────
    // admin.js runs applyRoute() before this script finishes loading,
    // so if the user lands directly on /admin/chat the initChatPanel
    // call in applyRoute() finds window.initChatPanel === undefined.
    // This self-init fires after the IIFE sets window.initChatPanel.
    if (!window.__icsdc_chatLoaded &&
        window.location.pathname.startsWith('/admin/chat')) {
        const mainChat = document.getElementById('view-chat');
        if (mainChat) {
            window.__icsdc_chatLoaded = true;
            mainChat.hidden = false;
            window.initChatPanel(mainChat);
        }
    }
})();
