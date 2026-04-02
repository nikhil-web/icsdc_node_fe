// ══════════════════════════════════════════════════════════
//  contentService.js
//  All page-level data fetchers.
//  Each function maps to exactly one Strapi endpoint.
//  Usage: import { getHomepage, getTestimonials, ... } from './contentService.js'
// ══════════════════════════════════════════════════════════

import { fetchAPI } from "./strapiClient.js";

// ──────────────────────────────────────────────────────────
//  SINGLE TYPES
// ──────────────────────────────────────────────────────────

/**
 * Navigation with nested menus → sections → items
 * Matches the existing nav render engine in main.js exactly.
 */
export function getNavigation() {
    return fetchAPI(
        "/api/navigation?" +
        "&populate[navLogo][populate]=*" +
        "&populate[LoginButton][populate]=*" +
        "&populate[menus][populate][sections][populate]=items&populate[menus][populate]=items"
    );
}

export function getFooter() {
    return fetchAPI(
        "/api/footer?" +
        "populate[commonFooter][populate][socialLinks]=*" +
        "&populate[commonFooter][populate][linkGroups][populate][links]=*" +
        "&populate[commonFooter][populate][logo]=true"
    );
}

// ──────────────────────────────────────────────────────────
//  DEDICATED SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Dedicated Server page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getDedicatedServerPage() {
    return fetchAPI(
        "/api/dedicated-server-page" +
        "?populate[seo]=*" +
        "&populate[hero][populate][ctaPrimary]=*" +
        "&populate[hero][populate][ctaSecondary]=*" +
        "&populate[hero][populate][serverRack]=*" +
        "&populate[featureHighlights]=*" +
        "&populate[pricingPlans][populate]=features" +
        "&populate[pillars]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[shieldVisual]=*" +
        "&populate[securityCards]=*" +
        "&populate[serviceButtons]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[performanceChecklist]=*" +
        "&populate[performanceCtaPrimary]=*" +
        "&populate[performanceCtaSecondary]=*" +
        "&populate[performanceStats]=*" +
        "&populate[locationPins]=*" +
        "&populate[locationTags]=*" +
        "&populate[whenCards]=*" +
        "&populate[useCaseCards]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  ZIMBRA HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Zimbra Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getZimbraHostingPage() {
    return fetchAPI(
        "/api/zimbra-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[featureBadges]=*" +
        "&populate[whyCards]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[migrationSteps]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  VPS HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire VPS Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getVpsHostingPage() {
    return fetchAPI(
        "/api/vps-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[infraCards]=*" +
        "&populate[pricingPlans][populate]=features" +
        "&populate[vpsTypes]=*" +
        "&populate[speedStats]=*" +
        "&populate[speedFeatures]=*" +
        "&populate[mgmtCards]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[diffCards]=*" +
        "&populate[globalCtaPrimary]=*" +
        "&populate[globalCtaSecondary]=*" +
        "&populate[locations]=*" +
        "&populate[useCases]=*" +
        "&populate[controlPanels]=*" +

        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Cloud Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getCloudHostingPage() {
    return fetchAPI(
        "/api/cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[pricingPlans][populate]=features" +
        "&populate[powerFeatures]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[frameworks]=*" +
        "&populate[choiceCards]=*" +
        "&populate[portalSteps]=*" +
        "&populate[whyReasons]=*" +
        "&populate[useCases]=*" +
        "&populate[workloadFeatures]=*" +
        "&populate[workloadStats]=*" +
        "&populate[dashboardFeatures]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[ctaBand3][populate][ctaPrimary]=*" +
        "&populate[ctaBand3][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  LINUX VPS HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Linux VPS Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getLinuxVpsHostingPage() {
    return fetchAPI(
        "/api/linux-vps-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=specs" +
        "&populate[powerFeatures]=*" +
        "&populate[osOptions]=*" +
        "&populate[controlPanels]=*" +
        "&populate[whyVpsCards]=*" +
        "&populate[useCases]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  GOOGLE WORKSPACE PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Google Workspace page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getSharedHostingPage() {
    return fetchAPI(
        "/api/shared-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[aboutItems]=*" +
        "&populate[features]=*" +
        "&populate[whyReasons]=*" +
        "&populate[techCards]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  EMAIL HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Email Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getEmailHostingPage() {
    return fetchAPI(
        "/api/email-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[features]=*" +
        "&populate[solutions]=*" +
        "&populate[useCases]=*" +

        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  DOMAIN REGISTRATION PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Domain Registration page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getDomainRegistrationPage() {
    return fetchAPI(
        "/api/domain-registration-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[tldCards]=*" +
        "&populate[features]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards]=*" +
        "&populate[tips]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  ACRONIS BACKUP PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Acronis Backup page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getAcronisBackupPage() {
    return fetchAPI(
        "/api/acronis-backup-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[heroStats]=*" +
        "&populate[pillars]=*" +
        "&populate[pricingCtaPrimary]=*" +
        "&populate[pricingCtaSecondary]=*" +
        "&populate[features]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  AWS CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire AWS Cloud Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getAwsCloudHostingPage() {
    return fetchAPI(
        "/api/aws-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[aboutItems]=*" +
        "&populate[strengths]=*" +
        "&populate[services]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  AZURE CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Azure Cloud Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getAzureCloudHostingPage() {
    return fetchAPI(
        "/api/azure-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[pillars]=*" +
        "&populate[advantages]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[whyCards]=*" +
        "&populate[processSteps]=*" +
        "&populate[techBadges]=*" +
        "&populate[securityFeatures]=*" +
        "&populate[pricingCtaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  WINDOWS CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Windows Cloud Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getWindowsCloudHostingPage() {
    return fetchAPI(
        "/api/windows-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[features]=*" +
        "&populate[whyCards]=*" +
        "&populate[useCaseItems]=*" +
        "&populate[appCards]=*" +

        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  WINDOWS DEDICATED SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Windows Dedicated Server page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getWindowsDedicatedServerPage() {
    return fetchAPI(
        "/api/windows-dedicated-server-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[pricingCtaPrimary]=*" +
        "&populate[pricingCtaSecondary]=*" +
        "&populate[aboutItems]=*" +
        "&populate[features]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards]=*" +
        "&populate[readyCards]=*" +
        "&populate[useCases]=*" +

        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  WINDOWS VPS HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Windows VPS Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getWindowsVpsHostingPage() {
    return fetchAPI(
        "/api/windows-vps-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[features]=*" +
        "&populate[securityCards]=*" +
        "&populate[useCases]=*" +

        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  LINUX DEDICATED SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Linux Dedicated Server page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getLinuxDedicatedServerPage() {
    return fetchAPI(
        "/api/linux-dedicated-server-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[pricingPlans][populate]=features" +
        "&populate[whyCards]=*" +
        "&populate[comparisonRows]=*" +
        "&populate[specsItems]=*" +
        "&populate[supportCards]=*" +
        "&populate[innovationCards]=*" +
        "&populate[useCases]=*" +

        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  HOMEPAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire Homepage content in a single API call.
 * Uses explicit deep populate matching the actual home-page schema.
 *
 * Field names match src/api/home-page/content-types/home-page/schema.json
 * Component schemas verified from /src/components/**
 */
export function getHomepagePage() {
    return fetchAPI(
        "/api/home-page" +
        "?populate[SEO]=*" +
        "&populate[CallToActionPrimary]=*" +
        "&populate[callToActionSecondary]=*" +
        "&populate[whyChooseUs]=*" +
        "&populate[whoWeAre][populate][featureCards]=*" +
        "&populate[LessCloudComplexity][populate][image]=true" +
        "&populate[CloudSolutionsEngineered]=*" +
        "&populate[IndustryLeadingExcellenceValidated][populate][image]=true" +
        "&populate[BeyondBestPracticeOurISOStandards][populate][image]=true" +
        "&populate[BestCloudServices][populate][featureCards]=*" +
        "&populate[Footer][populate][socialLinks]=*" +
        "&populate[Footer][populate][linkGroups][populate][links]=*" +
        "&populate[Footer][populate][logo]=true" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  DOMAIN TRANSFER PAGE
// ──────────────────────────────────────────────────────────
export function getDomainTransferPage() {
    return fetchAPI(
        "/api/domain-transfer-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[benefits]=*" +
        "&populate[whyRegisterCards]=*" +
        "&populate[highlightCards]=*" +
        "&populate[tips]=*" +
        "&populate[whySwitchCards]=*" +
        "&populate[relatedCards]=*" +
        "&populate[whatYouGetCards]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  GOOGLE WORKSPACE PAGE
// ──────────────────────────────────────────────────────────
export function getGoogleWorkspacePage() {
    return fetchAPI(
        "/api/google-workspace-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[features]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards]=*" +
        "&populate[steps]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  WORDPRESS HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────

/**
 * Fetches the entire WordPress Hosting page content in a single API call.
 * Uses explicit deep populate for all nested components.
 */
export function getWordpressHostingPage() {
    return fetchAPI(
        "/api/wordpress-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[featureCards]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[performanceCards]=*" +
        "&populate[managedFeatures]=*" +
        "&populate[whyChooseCards]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  AGGREGATE FETCH
//  Fetches all page data in parallel — call once on page load.
// ──────────────────────────────────────────────────────────
export function getLinuxCloudHostingPage() {
    return fetchAPI(
        "/api/linux-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=specs" +
        "&populate[powerFeatures]=*" +
        "&populate[frameworks]=*" +
        "&populate[whyLinuxCards]=*" +
        "&populate[useCases]=*" +
        "&populate[workloadFeatures]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  NVME DEDICATED SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getNvmeDedicatedServerPage() {
    return fetchAPI(
        "/api/nvme-dedicated-server-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[infraFeatures]=*" +
        "&populate[whyNvmeCards]=*" +
        "&populate[useCases]=*" +
        "&populate[whenCards]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  CPANEL HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getCpanelHostingPage() {
    return fetchAPI(
        "/api/cpanel-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[features]=*" +
        "&populate[whyCards]=*" +
        "&populate[whoCards]=*" +
        "&populate[builtinFeatures]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  MANAGED CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getManagedCloudHostingPage() {
    return fetchAPI(
        "/api/managed-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[features]=*" +
        "&populate[whyManagedCards]=*" +
        "&populate[servicesCards]=*" +
        "&populate[howItWorksSteps]=*" +
        "&populate[useCases]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  GOOGLE CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getGoogleCloudHostingPage() {
    return fetchAPI(
        "/api/google-cloud-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[whyGoogleCards]=*" +
        "&populate[servicesCards]=*" +
        "&populate[useCases]=*" +
        "&populate[migrationSteps]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  MANAGED VPS HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getManagedVpsHostingPage() {
    return fetchAPI(
        "/api/managed-vps-hosting-page" +
        "?populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars]=*" +
        "&populate[plans][populate]=features" +
        "&populate[features]=*" +
        "&populate[whatWeManage]=*" +
        "&populate[whyManagedCards]=*" +
        "&populate[useCases]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  VPS HOSTING TRIAL PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getVpsHostingTrialPage() {
    return fetchAPI(
        "/api/vps-hosting-trial-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[whenCards][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[howSteps][populate]=*" +
        "&populate[specs][populate]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  GPU CLOUD HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getGpuCloudHostingPage() {
    return fetchAPI(
        "/api/gpu-cloud-hosting-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[features][populate]=*" +
        "&populate[builtinFeatures][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[gpuPortfolio][populate]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  RESELLER HOSTING PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getResellerHostingPage() {
    return fetchAPI(
        "/api/reseller-hosting-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[features][populate]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[toolsCards][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  GPU DEDICATED SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getGpuDedicatedServerPage() {
    return fetchAPI(
        "/api/gpu-dedicated-server-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[features][populate]=*" +
        "&populate[usecases][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[models][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  MICROSOFT 365 PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getMicrosoft365Page() {
    return fetchAPI(
        "/api/microsoft-365-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[features][populate]=*" +
        "&populate[backupFeatures][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  BARE METAL SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
// export function getBareMetalServerPage() {
//     return fetchAPI(
//         "/api/bare-metal-server-page?" +
//         "populate[seo]=*" +
//         "&populate[heroCtaPrimary]=*" +
//         "&populate[heroCtaSecondary]=*" +
//         "&populate[pillars][populate]=*" +
//         "&populate[serverConfigs][populate]=*" +
//         "&populate[managedFeatures][populate]=*" +
//         "&populate[ctaBand1][populate][ctaPrimary]=*" +
//         "&populate[ctaBand1][populate][ctaSecondary]=*" +
//         "&populate[whyCards][populate]=*" +
//         "&populate[whoCards][populate]=*" +
//         "&populate[faq][populate]=*" +
//         "&populate[testimonials][populate]=*" +
//         "&populate[ctaBand2][populate][ctaPrimary]=*" +
//         "&populate[ctaBand2][populate][ctaSecondary]=*"
//     );
// }

// ──────────────────────────────────────────────────────────
//  CLOUD STORAGE PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getCloudStoragePage() {
    return fetchAPI(
        "/api/cloud-storage-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[plans][populate][features]=*" +
        "&populate[features][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  BARE METAL SERVER PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getBareMetalServerPage() {
    return fetchAPI(
        "/api/bare-metal-server-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[serverConfigs][populate]=*" +
        "&populate[managedFeatures][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  VEEAM BACKUP PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getVeeamBackupPage() {
    return fetchAPI(
        "/api/veeam-backup-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[features][populate]=*" +
        "&populate[compareRows][populate]=*" +
        "&populate[stats][populate]=*" +
        "&populate[steps][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  FIREWALL SECURITY PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getFirewallSecurityPage() {
    return fetchAPI(
        "/api/firewall-security-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[strengthCards][populate]=*" +
        "&populate[adaptsCards][populate]=*" +
        "&populate[envCards][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[servicesCards][populate]=*" +
        "&populate[useCasesCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  VIRTUAL MACHINE PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getVirtualMachinePage() {
    return fetchAPI(
        "/api/virtual-machine-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[vmPlans][populate]=*" +
        "&populate[features][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[useCases][populate]=*" +
        "&populate[whenCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ──────────────────────────────────────────────────────────
//  FOREX VPS PAGE (Single Type — full page data)
// ──────────────────────────────────────────────────────────
export function getForexVpsPage() {
    return fetchAPI(
        "/api/forex-vps-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[features][populate]=*" +
        "&populate[useCasesCards][populate]=*" +
        "&populate[whoCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*"
    );
}

// ----------------------------------------------------------
//  VAPT PAGE (Single Type � full page data)
// ----------------------------------------------------------
export function getVaptPage() {
    return fetchAPI(
        "/api/vapt-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[whyChooseCards][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[offeringsCards][populate]=*" +
        "&populate[steps][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ----------------------------------------------------------
//  TALLY ON CLOUD PAGE (Single Type � full page data)
// ----------------------------------------------------------
export function getTallyOnCloudPage() {
    return fetchAPI(
        "/api/tally-on-cloud-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[improvements][populate]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[compareRows][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[whoCanCards][populate]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}

// ----------------------------------------------------------
//  VPS CPANEL PAGE (Single Type � full page data)
// ----------------------------------------------------------
export function getVpsCpanelPage() {
    return fetchAPI(
        "/api/vps-cpanel-page?" +
        "populate[seo]=*" +
        "&populate[heroCtaPrimary]=*" +
        "&populate[heroCtaSecondary]=*" +
        "&populate[pillars][populate]=*" +
        "&populate[advantages][populate]=*" +
        "&populate[whyCards][populate]=*" +
        "&populate[ctaBand1][populate][ctaPrimary]=*" +
        "&populate[ctaBand1][populate][ctaSecondary]=*" +
        "&populate[testimonials][populate]=*" +
        "&populate[faq][populate]=*" +
        "&populate[ctaBand2][populate][ctaPrimary]=*" +
        "&populate[ctaBand2][populate][ctaSecondary]=*"
    );
}
