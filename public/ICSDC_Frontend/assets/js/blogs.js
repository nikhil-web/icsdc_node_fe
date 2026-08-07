// ══════════════════════════════════════════════════════════
//  blogs.js — ICSDC blog index (/blogs)
//  Blog posts aren't a dedicated Strapi content type — they're builder pages
//  built from the "blog-post" template (see builder/templates.js). The server
//  scans every published builder page for a blogHeader section and exposes the
//  lean listing fields at GET /api/blog-posts (server.js), sorted newest first.
//  Each card links to /blogs/<slug>, which is where server.js serves the
//  article itself (the legacy top-level /<slug> 301s there).
// ══════════════════════════════════════════════════════════

import { hidePageLoader, markActiveNavLink } from './utils/cms-helpers.js';
import { getBlogIndexPage } from './services/contentService.js';

(function () {
    'use strict';

    var PAGE_SIZE = 9;

    // Fallbacks for the blog-index-page single-type (Strapi, see contentService.js
    // getBlogIndexPage()). Category "cards" and the sidebar help widget aren't
    // backed by blogHeader.category (that's free text with no taxonomy — no icon,
    // no description, no slug) — they're their own editable content now, seeded
    // via push_blog_index_page.py. These local copies are what render if Strapi
    // has no entry yet (or is unreachable), so the page is never empty pre-seed.
    var FALLBACK_CATEGORIES = [
        { title: 'Cloud Hosting', icon: 'fa-cloud', desc: 'Guides on scaling, migrating and managing cloud infrastructure.', link: '/cloud-hosting' },
        { title: 'VPS Hosting', icon: 'fa-server', desc: 'Tips for getting the most out of a virtual private server.', link: '/vps-hosting' },
        { title: 'Dedicated Servers', icon: 'fa-database', desc: 'Performance, security and setup for dedicated hardware.', link: '/dedicated-server' },
        { title: 'Backup & Security', icon: 'fa-shield-halved', desc: 'Protecting your data with backup, recovery and compliance.', link: '/cloud-storage' },
        { title: 'Web Hosting', icon: 'fa-globe', desc: 'Getting your website online — fast, secure and reliable.', link: '/web-hosting' },
        { title: 'Domain & Email', icon: 'fa-envelope', desc: 'Domains, DNS and business email, explained simply.', link: '/domain-registration' },
    ];

    var FALLBACK_HELP_LINKS = [
        { icon: 'fa-cloud', title: 'Cloud Hosting', link: '/cloud-hosting' },
        { icon: 'fa-server', title: 'VPS Hosting', link: '/vps-hosting' },
        { icon: 'fa-database', title: 'Dedicated Servers', link: '/dedicated-server' },
        { icon: 'fa-globe', title: 'Web Hosting', link: '/web-hosting' },
        { icon: 'fa-users', title: 'Reseller Hosting', link: '/reseller-hosting' },
        { icon: 'fa-shield-halved', title: 'Backup & Security', link: '/cloud-storage' },
    ];

    var posts = [];
    var activeCategory = '';
    var activeSearch = '';
    var activePage = 1;

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function metaLine(post) {
        return [post.authorName, post.publishDate, post.readTime]
            .filter(Boolean).map(esc).join('<span class="blog-dot">&middot;</span>');
    }

    function mediaHTML(post) {
        return post.coverImage
            ? '<img src="' + esc(post.coverImage) + '" alt="' + esc(post.coverAlt || post.title) + '" loading="lazy">'
            : '<div class="blog-media-empty"><i class="fa-regular fa-image" aria-hidden="true"></i></div>';
    }

    function cardHTML(post) {
        return (
            '<a class="blog-card" href="/blogs/' + esc(post.slug) + '">' +
            '<div class="blog-card-media">' + mediaHTML(post) + '</div>' +
            (post.category ? '<span class="blog-card-cat">' + esc(post.category) + '</span>' : '') +
            '<h3 class="blog-card-title">' + esc(post.title) + '</h3>' +
            '<div class="blog-meta">' + metaLine(post) + '</div>' +
            '</a>'
        );
    }

    function rowHTML(post) {
        return (
            '<li class="blog-row"><a href="/blogs/' + esc(post.slug) + '">' + esc(post.title) + '</a></li>'
        );
    }

    function renderFeatured(post) {
        var wrap = document.getElementById('blog-featured-wrap');
        if (!wrap || !post) return;

        document.getElementById('blog-featured-card').href = '/blogs/' + post.slug;
        document.getElementById('blog-featured-title').textContent = post.title || '';
        document.getElementById('blog-featured-meta').innerHTML = metaLine(post);

        var exc = document.getElementById('blog-featured-excerpt');
        exc.textContent = post.excerpt || '';
        exc.hidden = !post.excerpt;

        var media = document.querySelector('.blog-featured-media');
        media.innerHTML = post.coverImage
            ? '<img id="blog-featured-img" src="' + esc(post.coverImage) + '" alt="' +
              esc(post.coverAlt || post.title || '') + '">'
            : mediaHTML(post);

        wrap.hidden = false;
    }

    function renderRecent(list) {
        var wrap = document.getElementById('blog-recent-wrap');
        var grid = document.getElementById('blog-recent-grid');
        if (!list.length) { wrap.hidden = true; return; }
        grid.innerHTML = list.map(cardHTML).join('');
        wrap.hidden = false;
    }

    function renderChips() {
        var box = document.getElementById('blog-chips');
        var cats = [];
        posts.forEach(function (p) {
            if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category);
        });
        if (!cats.length) { box.innerHTML = ''; return; }

        box.innerHTML = ['All'].concat(cats).map(function (cat, i) {
            var value = i === 0 ? '' : cat;
            return '<button type="button" class="blog-chip' + (value === activeCategory ? ' blog-chip-active' : '') +
                '" data-cat="' + esc(value) + '">' + esc(cat) + '</button>';
        }).join('');

        box.querySelectorAll('.blog-chip').forEach(function (btn) {
            btn.addEventListener('click', function () {
                activeCategory = btn.dataset.cat || '';
                activePage = 1;
                renderChips();
                renderArchive();
            });
        });
    }

    // The archive list (all posts, filterable + paginated) is the "real"
    // browsable index — the featured slot and recent grid above it are just a
    // highlight reel and stay fixed regardless of filter/search/page state.
    function filteredPosts() {
        return posts.filter(function (p) {
            if (activeCategory && p.category !== activeCategory) return false;
            if (activeSearch) {
                var haystack = (p.title + ' ' + p.excerpt).toLowerCase();
                if (haystack.indexOf(activeSearch) === -1) return false;
            }
            return true;
        });
    }

    function renderArchive() {
        var list = filteredPosts();
        var list3col = document.getElementById('blog-archive-list');
        var noresults = document.getElementById('blog-noresults');
        var pager = document.getElementById('blog-pagination');

        if (!list.length) {
            list3col.innerHTML = '';
            pager.innerHTML = '';
            noresults.hidden = false;
            return;
        }
        noresults.hidden = true;

        var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        activePage = Math.min(Math.max(1, activePage), totalPages);
        var start = (activePage - 1) * PAGE_SIZE;
        var pagePosts = list.slice(start, start + PAGE_SIZE);

        list3col.innerHTML = pagePosts.map(rowHTML).join('');
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        var pager = document.getElementById('blog-pagination');
        if (totalPages <= 1) { pager.innerHTML = ''; return; }

        var buttons = [];
        buttons.push('<button type="button" class="blog-page-btn" data-page="' + (activePage - 1) +
            '"' + (activePage === 1 ? ' disabled' : '') + ' aria-label="Previous page">&larr;</button>');

        for (var i = 1; i <= totalPages; i++) {
            buttons.push('<button type="button" class="blog-page-btn' + (i === activePage ? ' blog-page-active' : '') +
                '" data-page="' + i + '">' + i + '</button>');
        }

        buttons.push('<button type="button" class="blog-page-btn" data-page="' + (activePage + 1) +
            '"' + (activePage === totalPages ? ' disabled' : '') + ' aria-label="Next page">&rarr;</button>');

        pager.innerHTML = buttons.join('');
        pager.querySelectorAll('.blog-page-btn:not([disabled])').forEach(function (btn) {
            btn.addEventListener('click', function () {
                activePage = parseInt(btn.dataset.page, 10);
                renderArchive();
                document.querySelector('.blog-archive-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function renderHelp(links) {
        document.getElementById('blog-help-grid').innerHTML = links.map(function (h) {
            return '<a class="blog-help-item" href="' + esc(h.link || '#') + '">' +
                '<i class="fa-solid ' + esc(h.icon || 'fa-circle') + '" aria-hidden="true"></i>' +
                '<span>' + esc(h.title) + '</span></a>';
        }).join('');
    }

    function renderCategories(cats) {
        document.getElementById('blog-categories-grid').innerHTML = cats.map(function (c) {
            return '<a class="blog-cat-card" href="' + esc(c.link || '#') + '">' +
                '<i class="fa-solid ' + esc(c.icon || 'fa-circle') + '" aria-hidden="true"></i>' +
                '<h3>' + esc(c.title) + '</h3>' +
                '<p>' + esc(c.desc || '') + '</p></a>';
        }).join('');
    }

    // ctaBand comes from Strapi's ds.cta-band component (title/description/
    // ctaPrimary{text,link}). blogs.html already has the same copy written in
    // as static fallback text, so only overwrite an element when Strapi actually
    // has a value for it — an empty CMS field should never blank out real copy.
    function renderCtaBand(ctaBand) {
        if (!ctaBand) return;
        if (ctaBand.title) document.getElementById('blog-cta-title').textContent = ctaBand.title;
        if (ctaBand.description) document.getElementById('blog-cta-desc').textContent = ctaBand.description;
        var btn = document.getElementById('blog-cta-btn');
        if (ctaBand.ctaPrimary && ctaBand.ctaPrimary.text) btn.textContent = ctaBand.ctaPrimary.text;
        if (ctaBand.ctaPrimary && ctaBand.ctaPrimary.link) btn.setAttribute('href', ctaBand.ctaPrimary.link);
    }

    function initSearch() {
        var input = document.getElementById('blog-search-input');
        var timer = null;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            var value = input.value;
            timer = setTimeout(function () {
                activeSearch = value.trim().toLowerCase();
                activePage = 1;
                renderArchive();
            }, 200);
        });
    }

    function byOrder(a, b) { return (a.order || 0) - (b.order || 0); }

    async function init() {
        markActiveNavLink();

        // Independent of the posts fetch below — if Strapi has no blog-index-page
        // entry yet, or is unreachable, this quietly keeps the local fallbacks
        // (already rendered) instead of failing the whole page.
        try {
            var cfgRes = await getBlogIndexPage();
            var cfg = cfgRes && cfgRes.data;
            renderHelp(cfg && cfg.helpLinks && cfg.helpLinks.length ? cfg.helpLinks.slice().sort(byOrder) : FALLBACK_HELP_LINKS);
            renderCategories(cfg && cfg.categories && cfg.categories.length ? cfg.categories.slice().sort(byOrder) : FALLBACK_CATEGORIES);
            if (cfg) renderCtaBand(cfg.ctaBand);
        } catch (err) {
            console.error('[blogs] failed to load blog-index-page config, using fallbacks:', err);
            renderHelp(FALLBACK_HELP_LINKS);
            renderCategories(FALLBACK_CATEGORIES);
        }

        try {
            var res = await fetch('/api/blog-posts');
            var data = await res.json();
            posts = (data && data.posts) || [];

            if (!posts.length) {
                document.getElementById('blog-empty').hidden = false;
            } else {
                renderFeatured(posts[0]);
                renderRecent(posts.slice(1, 5));
                renderChips();
                renderArchive();
                initSearch();
            }
        } catch (err) {
            console.error('[blogs] failed to load posts:', err);
            document.getElementById('blog-empty').hidden = false;
        }

        hidePageLoader();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
