/* ══════════════════════════════════════════════════════════
   legal.js — TOC scroll-spy + smooth-scroll for /legal/*.html
   ══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    function init() {
        var sections = Array.prototype.slice.call(document.querySelectorAll('.legal-content > section[id]'));
        var links    = Array.prototype.slice.call(document.querySelectorAll('.legal-toc a[href^="#"]'));
        if (!sections.length || !links.length) return;

        // Build a quick lookup: section id → corresponding TOC link
        var linkBySection = {};
        links.forEach(function (a) {
            var href = a.getAttribute('href') || '';
            if (href.charAt(0) === '#') linkBySection[href.slice(1)] = a;
        });

        // Smooth-scroll on click (browsers without scroll-behavior:smooth)
        links.forEach(function (a) {
            a.addEventListener('click', function (e) {
                var href = a.getAttribute('href');
                if (!href || href.charAt(0) !== '#') return;
                var target = document.getElementById(href.slice(1));
                if (!target) return;
                e.preventDefault();
                var top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: top, behavior: 'smooth' });
                // Update URL hash without jumping
                history.replaceState(null, '', href);
                // Close mobile TOC accordion after click
                var details = a.closest('details.legal-toc-collapsed');
                if (details && window.innerWidth < 901) details.open = false;
            });
        });

        // Scroll-spy: highlight TOC link of the section currently in view
        var current = null;
        function setActive(id) {
            if (current === id) return;
            if (current && linkBySection[current]) linkBySection[current].classList.remove('is-active');
            current = id;
            if (current && linkBySection[current]) linkBySection[current].classList.add('is-active');
        }

        if ('IntersectionObserver' in window) {
            var io = new IntersectionObserver(function (entries) {
                // Find the entry closest to the top of viewport that's intersecting
                var topMost = null;
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) return;
                    if (!topMost || entry.boundingClientRect.top < topMost.boundingClientRect.top) {
                        topMost = entry;
                    }
                });
                if (topMost) setActive(topMost.target.id);
            }, {
                // Trigger when section header is within the top ~30% of the viewport
                rootMargin: '-80px 0px -65% 0px',
                threshold: 0,
            });
            sections.forEach(function (s) { io.observe(s); });
        } else {
            // Fallback for older browsers
            window.addEventListener('scroll', function () {
                var bestId = null;
                var bestTop = -Infinity;
                sections.forEach(function (s) {
                    var top = s.getBoundingClientRect().top - 100;
                    if (top <= 0 && top > bestTop) { bestTop = top; bestId = s.id; }
                });
                if (bestId) setActive(bestId);
            }, { passive: true });
        }

        // Default to the first section on load
        if (!window.location.hash && sections[0]) setActive(sections[0].id);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
