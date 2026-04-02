import {
    populateSEO,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    resolveIcon,
    populateCtaBand,
    populateTechBadges,
    initTestimonials,
    initFAQ
} from './utils/cms-helpers.js';
import { getAzureCloudHostingPage } from './services/contentService.js';

(function () {
    'use strict';

    function sortByOrder(items) {
        return (items || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    }

    function renderAzureCards(gridSelector, cards, cardClass, iconClass) {
        var grid = document.querySelector(gridSelector);
        if (!grid || !cards || !cards.length) return;

        var sorted = sortByOrder(cards);
        grid.innerHTML = sorted.map(function (card) {
            return '<div class="' + cardClass + '">' +
                '<div class="' + iconClass + '">' + resolveIcon(card.icon) + '</div>' +
                '<h3>' + (card.title || '') + '</h3>' +
                '<p>' + (card.description || '') + '</p>' +
                '</div>';
        }).join('');
    }

    function renderAzureComparison(columns, rows) {
        var section = document.getElementById('azure-compare');
        if (!section) return;

        if (columns && columns.length) {
            var ths = section.querySelectorAll('.azure-compare-table thead th');
            columns.forEach(function (label, i) {
                if (ths[i]) ths[i].textContent = label;
            });
        }

        if (!rows || !rows.length) return;
        var tbody = section.querySelector('.azure-compare-table tbody');
        if (!tbody) return;

        var sorted = sortByOrder(rows);
        tbody.innerHTML = sorted.map(function (row) {
            function statusIcon(status) {
                if (status === 'check') return '<span class="azure-compare-check">✔️</span>';
                if (status === 'cross') return '<span class="azure-compare-cross">❌</span>';
                return '<span class="azure-compare-both">✔️</span>';
            }

            return '<tr>' +
                '<td>' + (row.feature || '') + '</td>' +
                '<td>' + (row.microsoftStatus ? statusIcon(row.microsoftStatus) : (row.microsoft || '')) + '</td>' +
                '<td>' + (row.icsdcStatus ? statusIcon(row.icsdcStatus) : (row.icsdc || '')) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderAzureProcess(steps) {
        var container = document.querySelector('#azure-process .azure-process-steps');
        if (!container || !steps || !steps.length) return;

        var sorted = sortByOrder(steps);
        container.innerHTML = sorted.map(function (step, index) {
            return '<div class="azure-step">' +
                '<div class="azure-step-num" aria-hidden="true">' + (step.number || index + 1) + '</div>' +
                '<div class="azure-step-content">' +
                '<h3>' + (step.title || '') + '</h3>' +
                '<p>' + (step.description || '') + '</p>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    function setSectionHeader(sectionId, label, title, subtitle, selectors) {
        var section = document.getElementById(sectionId);
        if (!section) return;

        if (label) {
            var labelEl = section.querySelector(selectors.label || '.azure-section-label');
            if (labelEl) labelEl.textContent = label;
        }
        if (title) {
            var titleEl = section.querySelector(selectors.title || '.title');
            if (titleEl) titleEl.textContent = title;
        }
        if (subtitle) {
            var subEl = section.querySelector(selectors.subtitle || '.subtitle');
            if (subEl) subEl.innerHTML = subtitle;
        }
    }

    async function init() {
        markActiveNavLink();

        try {
            var res = await getAzureCloudHostingPage();
            var page = res.data;

            populateSEO(page.seo);

            var hero = document.querySelector('.hero-section');
            if (hero) {
                setText(hero, '.hero-title', page.heroTitle);
                setText(hero, '.hero-sub', page.heroSubtitle);
                setHTML(hero, '.hero-desc', page.heroDescription);
                setText(hero, '.azure-hero-form-title', page.heroFormTitle);
                setText(hero, '.azure-hero-form-sub', page.heroFormSubtitle);
                if (page.heroCtaPrimary?.text) setText(hero, '.hero-btns .btn-primary', page.heroCtaPrimary.text);
                if (page.heroCtaPrimary?.link) {
                    var primaryLink = hero.querySelector('.hero-btns .btn-primary');
                    if (primaryLink) primaryLink.setAttribute('href', page.heroCtaPrimary.link);
                }
                if (page.heroCtaSecondary?.text) setText(hero, '.hero-btns .btn-outline', page.heroCtaSecondary.text);
            }

            renderAzureCards('#azure-features .why-grid', page.pillars, 'why-card', 'why-icon');

            setSectionHeader('azure-who', page.aboutLabel, page.aboutTitle, null, {
                label: '.azure-section-label',
                title: '.azure-who-title'
            });
            if (page.aboutDescription) {
                setHTML(document.getElementById('azure-who'), '.azure-who-body', page.aboutDescription);
            }
            if (page.aboutImage) {
                var aboutImg = document.querySelector('#azure-who .azure-who-visual img');
                if (aboutImg) aboutImg.src = page.aboutImage;
            }

            setSectionHeader('azure-advantages', page.advantagesLabel, page.advantagesTitle, page.advantagesSubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            renderAzureCards('#azure-advantages .azure-advantages-grid', page.advantages, 'azure-adv-card', 'azure-adv-icon');

            setSectionHeader('azure-compare', page.comparisonLabel, page.comparisonTitle, page.comparisonSubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.azure-compare-subtitle'
            });
            renderAzureComparison(page.comparisonColumns, page.comparisonRows);

            setSectionHeader('azure-why', page.whyLabel, page.whyTitle, page.whySubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            renderAzureCards('#azure-why .azure-why-grid', page.whyCards, 'azure-why-card', 'azure-adv-icon');

            setSectionHeader('azure-process', page.processLabel, page.processTitle, page.processSubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            renderAzureProcess(page.processSteps);

            setSectionHeader('azure-stack', page.techLabel, page.techTitle, page.techSubtitle, {
                label: '.azure-section-label',
                title: '.azure-stack-headline',
                subtitle: '.azure-stack-subhead'
            });
            populateTechBadges('.azure-stack-grid', page.techBadges);

            setSectionHeader('azure-security', page.securityLabel, page.securityTitle, page.securityDescription, {
                label: '.azure-section-label',
                title: '.azure-security-title',
                subtitle: '.azure-security-intro'
            });

            if (page.pricingTitle) setText(document, '#azure-pricing-info h2', page.pricingTitle);
            if (page.pricingDescription) setHTML(document, '#azure-pricing-info .azure-pricing-callout-text > p', page.pricingDescription);

            populateCtaBand('.azure-cta-band', page.ctaBand1);



            if (page.testimonials && page.testimonials.length) {
                initTestimonials(page.testimonials)
            } else {
                //hide the entire section if no testimonials            
                var testiSection = document.getElementsByClassName('testi-section');
                if (testiSection) {
                    testiSection.style.display = 'none';
                }
            }

            initFAQ(page.faq);
        } catch (err) {
            console.error('[azure-cloud-hosting] CMS load failed:', err);
        }

        hidePageLoader();
    }

    init();
})();
