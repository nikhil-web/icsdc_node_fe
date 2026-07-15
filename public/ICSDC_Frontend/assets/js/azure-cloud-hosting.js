import { wireCtaLink } from './utils/cms-helpers.js';
import {
    populateSEO,
    populateHero,
    hidePageLoader,
    markActiveNavLink,
    setText,
    setHTML,
    resolveIcon,
    populateCtaBand,
    populateTechBadges,
    initTestimonials,
    initFAQ,
    initHeroContactForm
} from './utils/cms-helpers.js';
import { getAzureCloudHostingPage } from './services/contentService.js';
import { inlineRichText } from './utils/cms-helpers.js';
import { uploadURL } from './services/strapiClient.js';

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
                '<p>' + inlineRichText(card.description || card.desc || '') + '</p>' +
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

        function statusIcon(status) {
            if (status === 'cross') return '<span class="azure-compare-cross"><i class="fa-solid fa-xmark" aria-hidden="true"></i></span>';
            if (status === 'partial' || status === 'neutral') return '<span class="azure-compare-partial"><i class="fa-solid fa-minus" aria-hidden="true"></i></span>';
            return '<span class="azure-compare-check"><i class="fa-solid fa-check" aria-hidden="true"></i></span>';
        }
        function cell(status, text) {
            if (status) return statusIcon(status);
            if (text) return '<span class="azure-compare-text">' + text + '</span>';
            return '';
        }

        var sorted = sortByOrder(rows);
        tbody.innerHTML = sorted.map(function (row) {
            // A row with no status enums but text values (e.g. "Best Suited For") is a text row
            var isTextRow = !row.othersStatus && !row.icsdcStatus && (row.others || row.icsdc);
            return '<tr' + (isTextRow ? ' class="azure-compare-textrow"' : '') + '>' +
                '<td>' + (row.feature || '') + '</td>' +
                '<td>' + cell(row.othersStatus, row.others) + '</td>' +
                '<td>' + cell(row.icsdcStatus, row.icsdc) + '</td>' +
                '</tr>';
        }).join('');
    }

    function renderAzurePlans(plans) {
        var grid = document.querySelector('#azure-plans .azure-plans-grid');
        if (!grid || !plans || !plans.length) return;
        var sorted = sortByOrder(plans);
        grid.innerHTML = sorted.map(function (plan) {
            var isFeatured = plan.isFeatured || plan.popular || false;
            var featuredClass = isFeatured ? ' azure-plan-featured' : '';
            var badgeLabel = plan.badge || (isFeatured ? 'Most Popular' : '');
            var badgeHtml = badgeLabel ? '<div class="azure-plan-badge">' + badgeLabel + '</div>' : '';
            var currency = plan.currency || '₹';
            var period = plan.period || 'mo';
            var priceHtml = plan.price
                ? '<div class="azure-plan-price">' + currency + plan.price + ' <span>/' + period + '</span></div>' : '';
            var taglineHtml = plan.tagline ? '<div class="azure-plan-tagline">' + plan.tagline + '</div>' : '';
            var featuresArr = plan.features || [];
            var featuresHtml = featuresArr.length
                ? '<ul class="azure-plan-features">' + featuresArr.map(function (f) {
                    return '<li>' + (f.label || f.text || f.name || f) + '</li>';
                }).join('') + '</ul>' : '';
            var ctaText = plan.ctaText || 'Get Started';
            var btnClass = isFeatured ? 'azure-plan-btn-featured' : 'azure-plan-btn';
            return '<div class="azure-plan-card' + featuredClass + '">' + badgeHtml +
                '<div class="azure-plan-name">' + (plan.tier || plan.name || '') + '</div>' +
                priceHtml + taglineHtml + featuresHtml +
                '<a href="/contact-us" class="' + btnClass + '">' + ctaText + ' </a></div>';
        }).join('');
    }

    function renderAzureAboutItems(items) {
        var list = document.getElementById('azure-who-list');
        if (!list || !items || !items.length) return;
        var sorted = sortByOrder(items);
        list.innerHTML = sorted.map(function (item) {
            return '<li>' +
                '<span class="azure-who-check" aria-hidden="true">' + resolveIcon(item.icon) + '</span>' +
                (item.title || item.text || item.label || '') +
                '</li>';
        }).join('');
    }

    function renderAzurePricingPoints(points) {
        var list = document.getElementById('azure-pricing-points');
        if (!list || !points || !points.length) return;
        list.innerHTML = points.map(function (pt) { return '<li>' + pt + '</li>'; }).join('');
    }

    function renderAzureSecurity(features) {
        var list = document.querySelector('#azure-security .azure-security-list');
        if (!list || !features || !features.length) return;
        var sorted = sortByOrder(features);
        list.innerHTML = sorted.map(function (f) {
            return '<li>' +
                '<span class="azure-who-check" aria-hidden="true">' + resolveIcon(f.icon) + '</span>' +
                (f.title || f.text || f.label || '') +
                '</li>';
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
                '<p>' + inlineRichText(step.description || step.desc || '') + '</p>' +
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
                if (page.heroFormTitle) setText(hero, '.cu-hero-form-title', page.heroFormTitle);
                // Primary CTA — render when present, hide the button when deleted/empty in Strapi
                var primaryBtn = hero.querySelector('.hero-btns .btn-primary');
                if (primaryBtn) {
                    if (page.heroCtaPrimary && page.heroCtaPrimary.text) {
                        primaryBtn.textContent = page.heroCtaPrimary.text;
                        if (page.heroCtaPrimary.link) primaryBtn.setAttribute('href', page.heroCtaPrimary.link);
                        primaryBtn.style.display = '';
                    } else {
                        primaryBtn.style.display = 'none';
                    }
                }
                // Secondary CTA — same: hide when deleted/empty in Strapi
                var secondaryBtn = hero.querySelector('.hero-btns .btn-outline');
                if (secondaryBtn) {
                    if (page.heroCtaSecondary && page.heroCtaSecondary.text) {
                        secondaryBtn.textContent = page.heroCtaSecondary.text;
                        if (page.heroCtaSecondary.link) {
                            wireCtaLink(secondaryBtn, page.heroCtaSecondary.link);
                        }
                        secondaryBtn.style.display = '';
                    } else {
                        secondaryBtn.style.display = 'none';
                    }
                }
            }
            // Form visible by default; only hidden when explicitly set false in Strapi
            var heroFormOn = page.heroFormEnabled !== false;
            populateHero('.hero-section', {
                heroImage: page.heroImage,
                heroFormEnabled: heroFormOn
            });
            if (heroFormOn) initHeroContactForm('hf-form', 'hf-success');

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
                if (aboutImg) {
                    var aboutImgUrl = uploadURL(page.aboutImage);
                    if (aboutImgUrl) aboutImg.src = aboutImgUrl;
                }
            }
            renderAzureAboutItems(page.aboutItems);

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

            // Tailored-plan CTA band (after comparison)
            if (page.ctaBand2) {
                var qb = page.ctaBand2;
                if (qb.title) setText(document, '#azure-quote-cta-title', qb.title);
                var qDesc = document.getElementById('azure-quote-cta-desc');
                if (qDesc && qb.description) { qDesc.textContent = qb.description; qDesc.hidden = false; }
                var qBtn = document.getElementById('azure-quote-cta-btn');
                if (qBtn && qb.ctaPrimary) {
                    if (qb.ctaPrimary.text) qBtn.innerHTML = qb.ctaPrimary.text + ' ';
                    wireCtaLink(qBtn, qb.ctaPrimary.link);
                }
            }

            setSectionHeader('azure-plans', page.plansLabel, page.plansTitle, page.plansSubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            renderAzurePlans(page.plans);

            setSectionHeader('azure-why', page.whyLabel, page.whyTitle, page.whySubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            if (page.whySubheading) setText(document, '#azure-why-subheading', page.whySubheading);
            renderAzureCards('#azure-why .azure-why-grid', page.whyCards, 'azure-why-card', 'azure-adv-icon');

            setSectionHeader('azure-process', page.processLabel, page.processTitle, page.processSubtitle, {
                label: '.azure-section-label',
                title: '.title',
                subtitle: '.subtitle'
            });
            renderAzureProcess(page.processSteps);
            if (page.processImage && page.processImage.image) {
                var procImg = document.getElementById('azure-process-img');
                if (procImg) {
                    var procImgUrl = uploadURL(page.processImage.image);
                    if (procImgUrl) { procImg.src = procImgUrl; procImg.style.display = ''; }
                }
            }

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
            renderAzureSecurity(page.securityFeatures);
            if (page.securityImage && page.securityImage.image) {
                var secImg = document.getElementById('azure-security-img');
                if (secImg) {
                    var secImgUrl = uploadURL(page.securityImage.image);
                    if (secImgUrl) secImg.src = secImgUrl;
                }
            }

            if (page.pricingTitle) setText(document, '#azure-pricing-info h2', page.pricingTitle);
            if (page.pricingDescription) setHTML(document, '#azure-pricing-info .azure-pricing-callout-text > p', page.pricingDescription);
            if (page.pricingNote) setText(document, '#azure-pricing-info .azure-pricing-note', page.pricingNote);
            renderAzurePricingPoints(page.pricingPoints);

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
