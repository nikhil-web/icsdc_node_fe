/* ══════════════════════════════════════
   PRICING PAGE — pricing.js
   • Scroll-spy sidebar
   • Mobile tab bar sync
   • 3-phase sidebar positioning
   • Billing toggle (monthly / annual)
   • CTA button handlers

   NOTE: All sidebar/section DOM elements are
   built by pricing-cms.js asynchronously.
   We wait for the 'pricing:ready' event before
   querying them or attaching click listeners.
══════════════════════════════════════ */
(function () {
  'use strict';

  /* ── static refs (exist in initial HTML) ── */
  const sidebar     = document.querySelector('.pr-sidebar');
  const sidebarWrap = document.querySelector('.pr-sidebar-wrap');
  const prContent   = document.querySelector('.pr-content');

  /* ─────────────────────────────────────
     1. SCROLL-SPY
     Queries sections live on every call so
     it works after CMS renders them.
  ───────────────────────────────────── */
  function setActive(id) {
    // Live queries — elements are CMS-rendered
    document.querySelectorAll('.pr-sidebar-link').forEach(l =>
      l.classList.toggle('is-active', l.dataset.target === id));
    document.querySelectorAll('.pr-mob-tab').forEach(t =>
      t.classList.toggle('is-active', t.dataset.target === id));

    // Scroll sidebar so active link stays visible
    if (sidebar) {
      const activeLink = sidebar.querySelector(`.pr-sidebar-link[data-target="${id}"]`);
      if (activeLink) {
        const linkTop    = activeLink.offsetTop;
        const linkBottom = linkTop + activeLink.offsetHeight;
        const viewTop    = sidebar.scrollTop;
        const viewBottom = viewTop + sidebar.clientHeight;
        if (linkTop < viewTop)            sidebar.scrollTop = linkTop - 16;
        else if (linkBottom > viewBottom) sidebar.scrollTop = linkBottom - sidebar.clientHeight + 16;
      }
    }
  }

  function updateActiveSection() {
    const sections = document.querySelectorAll('.pr-section[id]');
    if (!sections.length) return;

    const navH     = parseInt(getComputedStyle(document.documentElement)
                       .getPropertyValue('--nav-height')) || 72;
    const triggerY = navH + (window.innerHeight - navH) * 0.25;
    let   best     = null;
    let   bestDist = Infinity;

    sections.forEach(s => {
      const top = s.getBoundingClientRect().top;
      if (top <= triggerY) {
        const dist = triggerY - top;
        if (dist < bestDist) { bestDist = dist; best = s; }
      }
    });

    if (!best) best = sections[0];
    setActive(best.id);
  }

  window.addEventListener('scroll', updateActiveSection, { passive: true });
  window.addEventListener('resize', updateActiveSection, { passive: true });

  /* ─────────────────────────────────────
     2. CLICK-TO-SCROLL
  ───────────────────────────────────── */
  function scrollToSection(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const navH   = parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--nav-height')) || 72;
    const mobBar = document.querySelector('.pr-mob-bar');
    const mobH   = mobBar && mobBar.offsetParent ? mobBar.offsetHeight : 0;
    const offset = navH + mobH + 16;
    const top    = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // Event delegation — sidebar and mob-bar may not exist yet at script run
  document.addEventListener('click', function (e) {
    const link = e.target.closest('.pr-sidebar-link');
    if (link) { scrollToSection(link.dataset.target); return; }
    const tab = e.target.closest('.pr-mob-tab');
    if (tab)  { scrollToSection(tab.dataset.target); }
  });

  /* ─────────────────────────────────────
     3. SIDEBAR STICKY-WITHIN-CONTAINER
     Phase 1 — relative (before centre)
     Phase 2 — fixed at viewport centre
     Phase 3 — absolute at wrap bottom
  ───────────────────────────────────── */
  let wrapLeft = 0;

  function cacheWrapLeft() {
    if (!sidebarWrap) return;
    const prev = sidebar ? sidebar.style.position : '';
    if (prev !== 'relative' && sidebar) {
      sidebar.style.position = 'relative';
      wrapLeft = sidebarWrap.getBoundingClientRect().left;
      sidebar.style.position = prev;
    } else {
      wrapLeft = sidebarWrap.getBoundingClientRect().left;
    }
  }

  window.addEventListener('resize', cacheWrapLeft, { passive: true });

  function updateSidebarPhase() {
    if (!sidebar || !sidebarWrap || !prContent) return;

    const sidebarH  = sidebar.offsetHeight;
    const viewH     = window.innerHeight;
    const sidebarW  = sidebarWrap.offsetWidth || 220;
    const centreTop = Math.round((viewH - sidebarH) / 2);
    const ref       = prContent.getBoundingClientRect();

    if (ref.top > centreTop) {
      // Phase 1 — before centre
      sidebar.style.position = 'relative';
      sidebar.style.top      = '0';
      sidebar.style.left     = '';
      sidebar.style.bottom   = '';
      sidebar.style.width    = '';
      wrapLeft = sidebarWrap.getBoundingClientRect().left;

    } else if (ref.bottom < centreTop + sidebarH) {
      // Phase 3 — pin to wrap bottom
      sidebar.style.position = 'absolute';
      sidebar.style.top      = 'auto';
      sidebar.style.bottom   = '0';
      sidebar.style.left     = '0';
      sidebar.style.width    = sidebarW + 'px';

    } else {
      // Phase 2 — fixed at viewport centre
      sidebar.style.position = 'fixed';
      sidebar.style.top      = centreTop + 'px';
      sidebar.style.left     = wrapLeft + 'px';
      sidebar.style.bottom   = '';
      sidebar.style.width    = sidebarW + 'px';
    }
  }

  window.addEventListener('scroll', updateSidebarPhase, { passive: true });
  window.addEventListener('resize', updateSidebarPhase, { passive: true });

  /* ─────────────────────────────────────
     PRICING:READY — fired by pricing-cms.js
     after all sections & sidebar links are
     in the DOM. Re-run all initialisers.
  ───────────────────────────────────── */
  document.addEventListener('pricing:ready', function () {
    cacheWrapLeft();
    updateSidebarPhase();
    updateActiveSection();
    applyBilling();
  });

  /* ─────────────────────────────────────
     4. BILLING TOGGLE
  ───────────────────────────────────── */
  const billingSwitch = document.querySelector('.pr-billing-switch');
  const optMonthly    = document.querySelector('.pr-bill-opt.is-monthly');
  const optAnnual     = document.querySelector('.pr-bill-opt.is-annual');
  let   isAnnual      = false;

  function applyBilling() {
    billingSwitch && billingSwitch.classList.toggle('is-annual', isAnnual);
    optMonthly    && optMonthly.classList.toggle('is-active', !isAnnual);
    optAnnual     && optAnnual.classList.toggle('is-active',  isAnnual);
    document.querySelectorAll('[data-price-monthly]').forEach(el => el.style.display = isAnnual ? 'none' : '');
    document.querySelectorAll('[data-price-annual]').forEach(el  => el.style.display = isAnnual ? ''     : 'none');
  }

  billingSwitch && billingSwitch.addEventListener('click', () => { isAnnual = !isAnnual; applyBilling(); });
  optMonthly    && optMonthly.addEventListener('click',    () => { isAnnual = false;      applyBilling(); });
  optAnnual     && optAnnual.addEventListener('click',     () => { isAnnual = true;       applyBilling(); });

  /* ─────────────────────────────────────
     5. CTA BUTTONS
  ───────────────────────────────────── */
  document.addEventListener('click', function (e) {
    if (e.target.matches('.pr-row-btn, .pr-cta-primary')) {
      window.location.href = '/contact-us.html';
    } else if (e.target.matches('.pr-cta-outline')) {
      window.location.href = 'tel:+919810958857';
    }
  });

})();
