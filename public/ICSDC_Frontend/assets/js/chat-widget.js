/**
 * chat-widget.js
 * ──────────────
 * Visitor-facing live chat widget with scripted bot + real-time admin takeover.
 * Loaded via dynamic import() from main.js.
 * Requires: /socket.io/socket.io.js served by the Node server automatically.
 */

let socket = null;
let sessionId = null;
let isOpen = false;
let unreadCount = 0;
let inputLocked = false;
let currentStepType = 'text';  // 'text' | 'tel' | 'textarea' | 'chips'
let currentOptional = false;

// ── DOM refs (set after render) ───────────────────────────
let bubble, chatWindow, messagesEl, inputEl, sendBtn, skipBtn, chipsRow, badgeEl;

// ── Session persistence ───────────────────────────────────
function getSid() { return sessionStorage.getItem('icsdc_chat_sid'); }
function setSid(id) { sessionStorage.setItem('icsdc_chat_sid', id); }

// ── Unique session ID generator ───────────────────────────
function generateSid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Render widget DOM ─────────────────────────────────────
function renderWidget() {
    // Bubble
    bubble = document.createElement('button');
    bubble.className = 'chat-bubble';
    bubble.setAttribute('aria-label', 'Open chat');
    bubble.setAttribute('type', 'button');
    bubble.innerHTML = '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>';

    // Chat window
    chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.innerHTML =
        '<div class="chat-head">' +
        '<div class="chat-head-avatar"><i class="fa-solid fa-headset" aria-hidden="true"></i></div>' +
        '<div class="chat-head-info">' +
        '<div class="chat-head-title">ICSDC Support</div>' +
        '<div class="chat-head-status"><span class="chat-status-dot"></span> Online</div>' +
        '</div>' +
        '<button class="chat-head-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="chat-messages"></div>' +
        '<div class="chat-input-area">' +
        '<div class="chat-chips" style="display:none;"></div>' +
        '<div class="chat-input-row">' +
        '<textarea class="chat-input" rows="1" placeholder="Type a message…"></textarea>' +
        '<button class="chat-send-btn" type="button" aria-label="Send"><i class="fa-solid fa-paper-plane" aria-hidden="true"></i></button>' +
        '</div>' +
        '<button class="chat-skip-btn" style="display:none;" type="button">Skip (optional)</button>' +
        '</div>';

    document.body.appendChild(bubble);
    document.body.appendChild(chatWindow);

    messagesEl = chatWindow.querySelector('.chat-messages');
    inputEl    = chatWindow.querySelector('.chat-input');
    sendBtn    = chatWindow.querySelector('.chat-send-btn');
    skipBtn    = chatWindow.querySelector('.chat-skip-btn');
    chipsRow   = chatWindow.querySelector('.chat-chips');

    // Events
    bubble.addEventListener('click', toggleChat);
    chatWindow.querySelector('.chat-head-close').addEventListener('click', closeChat);
    sendBtn.addEventListener('click', handleSend);
    skipBtn.addEventListener('click', function () { handleSend(null, ''); });
    inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    // Auto-grow textarea + emit typing
    inputEl.addEventListener('input', function () {
        inputEl.style.height = 'auto';
        inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + 'px';
        emitVisitorTyping();
    });
    // ESC to close
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) closeChat();
    });
}

// ── Open / close ──────────────────────────────────────────
function toggleChat() {
    if (isOpen) closeChat();
    else        openChat();
}

function openChat() {
    isOpen = true;
    chatWindow.classList.add('is-open');
    bubble.setAttribute('aria-label', 'Close chat');
    clearUnread();
    scrollToBottom();
    // Delay focus so animation completes
    setTimeout(function () { if (currentStepType !== 'chips') inputEl.focus(); }, 250);
}

function closeChat() {
    isOpen = false;
    chatWindow.classList.remove('is-open');
    bubble.setAttribute('aria-label', 'Open chat');
}

// ── Unread badge ──────────────────────────────────────────
function incrementUnread() {
    if (isOpen) return;
    unreadCount++;
    if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'chat-unread-badge';
        bubble.appendChild(badgeEl);
    }
    badgeEl.textContent = unreadCount > 9 ? '9+' : unreadCount;
}

function clearUnread() {
    unreadCount = 0;
    if (badgeEl) { badgeEl.remove(); badgeEl = null; }
}

// ── Message rendering ─────────────────────────────────────
function appendMsg(role, text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-msg chat-msg--' + role;

    const labelMap = { bot: 'Bot', admin: 'Support', visitor: 'You' };
    const label    = document.createElement('div');
    label.className = 'chat-msg-label';
    label.textContent = labelMap[role] || role;

    const bub = document.createElement('div');
    bub.className = 'chat-msg-bubble';
    bub.textContent = text;

    wrapper.appendChild(label);
    wrapper.appendChild(bub);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
}

function showTyping() {
    const t = document.createElement('div');
    t.className = 'chat-typing';
    t.id = 'chat-typing-indicator';
    t.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(t);
    scrollToBottom();
    return t;
}

function removeTyping() {
    const t = document.getElementById('chat-typing-indicator');
    if (t) t.remove();
}

// Admin typing indicator (separate from bot typing indicator)
function showAdminTyping() {
    if (document.getElementById('chat-admin-typing')) return;
    const t = document.createElement('div');
    t.className = 'chat-typing chat-typing--admin';
    t.id = 'chat-admin-typing';
    const label = document.createElement('span');
    label.className = 'chat-typing-label';
    label.textContent = 'Support';
    t.innerHTML = '<span></span><span></span><span></span>';
    t.prepend(label);
    messagesEl.appendChild(t);
    scrollToBottom();
}

function removeAdminTyping() {
    const t = document.getElementById('chat-admin-typing');
    if (t) t.remove();
}

// Visitor typing — debounced emit
let visitorTypingTimer = null;
function emitVisitorTyping() {
    if (!socket || !sessionId || inputLocked) return;
    socket.emit('visitor:typing', { sessionId });
    clearTimeout(visitorTypingTimer);
    visitorTypingTimer = setTimeout(function () {
        socket.emit('visitor:typing-stop', { sessionId });
    }, 2000);
}

function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ── Input state ───────────────────────────────────────────
function setInputState(step) {
    if (!step) {
        // Done state
        inputEl.style.display = 'none';
        sendBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        chipsRow.style.display = 'none';
        inputLocked = true;
        return;
    }

    currentStepType = step.type || 'text';
    currentOptional = !!step.optional;

    if (step.type === 'chips' && step.options && step.options.length) {
        chipsRow.style.display = 'flex';
        inputEl.style.display  = 'none';
        sendBtn.style.display  = 'none';
        skipBtn.style.display  = 'none';
        chipsRow.innerHTML = '';
        step.options.forEach(function (opt) {
            const chip = document.createElement('button');
            chip.className = 'chat-chip';
            chip.textContent = opt;
            chip.type = 'button';
            chip.addEventListener('click', function () {
                // Disable all chips immediately
                chipsRow.querySelectorAll('.chat-chip').forEach(function (c) { c.disabled = true; });
                chipsRow.style.display = 'none';
                sendMessage(opt);
            });
            chipsRow.appendChild(chip);
        });
    } else {
        chipsRow.style.display = 'none';
        inputEl.style.display  = '';
        sendBtn.style.display  = '';
        inputEl.placeholder = step.type === 'tel' ? 'e.g. 9876543210' : 'Type here…';
        inputEl.style.height = '';
        inputEl.value = '';
        skipBtn.style.display = step.optional ? '' : 'none';
        if (isOpen) inputEl.focus();
    }

    inputLocked = false;
}

// ── Send logic ────────────────────────────────────────────
function handleSend(e, overrideText) {
    if (inputLocked) return;
    const text = overrideText !== undefined ? overrideText : (inputEl.value || '').trim();
    if (!text && overrideText !== '') return;
    sendMessage(text);
}

function sendMessage(text) {
    if (!socket || !sessionId) return;
    const display = text || '(skipped)';
    appendMsg('visitor', display);
    inputEl.value = '';
    inputEl.style.height = '';
    inputLocked = true;
    sendBtn.disabled = true;

    // Show typing indicator with small delay to feel natural
    setTimeout(function () { showTyping(); }, 300);
    socket.emit('chat:message', { sessionId, text: display });
}

// ── Socket.io connection ──────────────────────────────────
function connectSocket() {
    // socket.io.js is auto-served by the Node server
    if (typeof io === 'undefined') {
        console.warn('[chat] socket.io client not loaded');
        return;
    }

    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', function () {
        socket.emit('chat:init', { sessionId });
    });

    socket.on('chat:bot-message', function (step) {
        removeTyping();
        appendMsg('bot', step.question);
        if (!isOpen) incrementUnread();
        setInputState(step);
        sendBtn.disabled = false;
        inputLocked = false;
    });

    socket.on('chat:agent-joined', function (data) {
        removeTyping();
        appendMsg('admin', data.text || "You're connected with a support agent. 👤");
        if (!isOpen) incrementUnread();
        // Enable input for live chat
        inputEl.style.display  = '';
        sendBtn.style.display  = '';
        chipsRow.style.display = 'none';
        skipBtn.style.display  = 'none';
        inputEl.placeholder = 'Type your message…';
        inputLocked = false;
        sendBtn.disabled = false;
    });

    socket.on('chat:admin-message', function (data) {
        removeAdminTyping();
        appendMsg('admin', data.text);
        if (!isOpen) incrementUnread();
    });

    socket.on('admin:typing', function () {
        removeAdminTyping();
        showAdminTyping();
    });

    socket.on('admin:typing-stop', function () {
        removeAdminTyping();
    });

    socket.on('chat:complete', function (data) {
        removeTyping();
        appendMsg('bot', data.text);
        if (!isOpen) incrementUnread();
        // Hide input but do NOT permanently lock — admin may still take over
        inputEl.style.display = 'none';
        sendBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        chipsRow.style.display = 'none';
        inputLocked = false;  // stays unlocked so chat:agent-joined can re-enable
    });

    socket.on('chat:ended', function (data) {
        removeTyping();
        appendMsg('admin', data.text || 'Chat closed. We\'ll follow up soon!');
        if (!isOpen) incrementUnread();
        setInputState(null);
    });

    socket.on('disconnect', function () {
        console.warn('[chat] disconnected from server');
    });
}

// ── Public init ───────────────────────────────────────────
export function initChatWidget() {
    // Load socket.io client script if not already present
    if (typeof io === 'undefined') {
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = function () { boot(); };
        document.head.appendChild(script);
    } else {
        boot();
    }
}

function boot() {
    sessionId = getSid();
    if (!sessionId) {
        sessionId = generateSid();
        setSid(sessionId);
    }
    renderWidget();
    connectSocket();
}
