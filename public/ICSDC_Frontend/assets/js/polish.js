/**
 * polish.js — UI micro-interaction enhancements
 * Runs after page load. Does NOT modify existing logic.
 */
(function () {
    'use strict';

    /* ── 1. NAVBAR SCROLL SHADOW ──────────────────────────────── */
    (function initNavScroll() {
        const nav = document.querySelector('nav');
        if (!nav) return;

        let ticking = false;
        function onScroll() {
            if (!ticking) {
                requestAnimationFrame(function () {
                    if (window.scrollY > 8) {
                        nav.classList.add('scrolled');
                    } else {
                        nav.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // initial state
    })();


    /* ── 2. FAQ SMOOTH ACCORDION (overrides display:none) ─────── */
    (function initFaqAccordion() {
        // Wait for components.js to render FAQ items
        function attachFaqListeners() {
            const items = document.querySelectorAll('.faq-item');
            if (!items.length) return;

            items.forEach(function (item) {
                const btn = item.querySelector('.faq-question');
                const answer = item.querySelector('.faq-answer');
                if (!btn || !answer) return;

                // We switch from display:none to max-height CSS animation
                // Ensure answer is in block state so max-height transition works
                answer.style.display = 'block';
                answer.style.overflow = 'hidden';

                btn.addEventListener('click', function () {
                    const isOpen = item.classList.contains('faq-open');

                    // Close all others
                    document.querySelectorAll('.faq-item.faq-open').forEach(function (openItem) {
                        if (openItem !== item) {
                            openItem.classList.remove('faq-open');
                        }
                    });

                    if (isOpen) {
                        item.classList.remove('faq-open');
                    } else {
                        item.classList.add('faq-open');
                    }
                });
            });
        }

        // Run after components.js fires (300ms grace)
        setTimeout(attachFaqListeners, 400);
    })();


    /* ── 3. FLOATING CARDS — PAUSE FLOAT ON HOVER ──────────────── */
    (function initFloatingCards() {
        function attachCardHover() {
            const cards = document.querySelectorAll('.floating-card');
            if (!cards.length) return;

            cards.forEach(function (card) {
                card.addEventListener('mouseenter', function () {
                    card.style.animationPlayState = 'paused';
                    card.style.transform = 'translateY(-6px) scale(1.02)';
                    card.style.transition = 'transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease';
                });

                card.addEventListener('mouseleave', function () {
                    card.style.animationPlayState = 'running';
                    card.style.transform = '';
                    // Brief delay before restoring animation
                    setTimeout(function () {
                        card.style.transition = 'box-shadow 0.28s ease, border-color 0.28s ease';
                    }, 320);
                });
            });
        }

        // Cards are in HTML directly, so attach immediately on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachCardHover);
        } else {
            attachCardHover();
        }
    })();


    /* ── 4. CONTACT FORM — SUBMIT WITH LOADING STATE ───────────── */
    (function initContactForm() {
        function attachForm() {
            const form = document.getElementById('contact-form');
            const submitBtn = form && form.querySelector('.contact-submit');
            const successEl = document.getElementById('contact-success');

            if (!form || !submitBtn) return;

            form.addEventListener('submit', function (e) {
                e.preventDefault();

                // Loading state
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Sending…';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.75';

                // Simulate async submission
                setTimeout(function () {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '';

                    // Show success
                    if (successEl) {
                        form.style.display = 'none';
                        successEl.classList.add('contact-success-visible');
                    }
                }, 1200);
            });
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachForm);
        } else {
            attachForm();
        }
    })();


    /* ── 5. WHY-CARD GRADIENT SHIFT ON HOVER ───────────────────── */
    (function initWhyCardGradient() {
        // Gradient position shift is handled via CSS background-position.
        // This JS variant adds a smooth continuous gradient tracking.
        function attachCards() {
            const cards = document.querySelectorAll('.why-card');
            if (!cards.length) return;

            cards.forEach(function (card) {
                card.addEventListener('mousemove', function (e) {
                    const rect = card.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    card.style.backgroundPosition = '0 0, ' + x + '% ' + y + '%';
                });

                card.addEventListener('mouseleave', function () {
                    card.style.backgroundPosition = '0 0, 0% 50%';
                });
            });
        }

        // why-cards are rendered by JS (main.js), so wait
        setTimeout(attachCards, 600);
    })();


    /* ── 6. SMOOTH SCROLL FOR ANCHOR LINKS ─────────────────────── */
    (function initSmoothScroll() {
        document.addEventListener('click', function (e) {
            const anchor = e.target.closest('a[href^="#"]');
            if (!anchor) return;

            const targetId = anchor.getAttribute('href').slice(1);
            if (!targetId) return;

            const target = document.getElementById(targetId);
            if (!target) return;

            e.preventDefault();
            const navHeight = document.querySelector('nav')
                ? document.querySelector('nav').offsetHeight : 0;

            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY - navHeight - 16,
                behavior: 'smooth',
            });
        });
    })();


    /* ── 7. BUTTON RIPPLE EFFECT ─────────────────────────────────
       Adds a Material-style water ripple on click for primary buttons.   */
    (function initButtonRipple() {
        const style = document.createElement('style');
        style.textContent = `
            .btn-primary, .btn-login, .contact-submit, .faq-contact-btn {
                overflow: hidden;
                position: relative;
            }
            .ripple-effect {
                position: absolute;
                border-radius: 50%;
                background: rgba(255,255,255,0.28);
                transform: scale(0);
                animation: rippleAnim 0.5s linear;
                pointer-events: none;
            }
            @keyframes rippleAnim {
                to { transform: scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        function addRipple(e) {
            const btn = e.currentTarget;
            const existing = btn.querySelector('.ripple-effect');
            if (existing) existing.remove();

            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            ripple.style.cssText = [
                'width:' + size + 'px',
                'height:' + size + 'px',
                'left:' + x + 'px',
                'top:' + y + 'px',
            ].join(';');

            btn.appendChild(ripple);
            ripple.addEventListener('animationend', function () { ripple.remove(); });
        }

        function attachRippleButtons() {
            document.querySelectorAll('.btn-primary, .btn-login, .contact-submit, .faq-contact-btn')
                .forEach(function (btn) {
                    btn.removeEventListener('click', addRipple);
                    btn.addEventListener('click', addRipple);
                });
        }

        // Attach on load and again after dynamic content
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attachRippleButtons);
        } else {
            attachRippleButtons();
        }
        setTimeout(attachRippleButtons, 800); // catch dynamically rendered buttons
    })();

})();
