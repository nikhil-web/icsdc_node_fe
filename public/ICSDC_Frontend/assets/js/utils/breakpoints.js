/**
 * breakpoints.js — the site's responsive breakpoints, defined once.
 *
 *   Mobile         0 – 639px
 *   Tablet       640 – 1023px
 *   Desktop     1024 – 1439px   (laptops, incl. 1920×1080 at 125–150% scaling)
 *   Large       1440px and up
 *
 * CSS can't read variables inside @media, so stylesheets use these exact
 * numbers literally — and ONLY these numbers:
 *
 *   @media (max-width: 639px)                          mobile
 *   @media (min-width: 640px)  and (max-width: 1023px) tablet
 *   @media (max-width: 1023px)                         tablet and below
 *   @media (min-width: 1024px)                         desktop and up
 *   @media (min-width: 1024px) and (max-width: 1439px) desktop
 *   @media (max-width: 1439px)                         below large
 *   @media (min-width: 1440px)                         large
 *
 * `npm run check:breakpoints` fails on any other width in a media query, a
 * matchMedia() call, or an innerWidth comparison, so a one-off breakpoint
 * can't quietly creep back in. Scripts that are ES modules import MEDIA from
 * here; the few classic (non-module) scripts use the same literal queries.
 *
 * Why the desktop tier starts at 1024 and not 1366: 1366 made every laptop
 * narrower than that a tablet — including the very common 1920×1080 panel at
 * 150% Windows scaling, which reports a 1280px-wide viewport and was getting
 * the hamburger menu and a single-column hero.
 */

export const BREAKPOINTS = Object.freeze({
    mobileMax: 639,
    tabletMin: 640,
    tabletMax: 1023,
    desktopMin: 1024,
    desktopMax: 1439,
    largeMin: 1440,
});

export const MEDIA = Object.freeze({
    mobile: '(max-width: 639px)',
    tablet: '(min-width: 640px) and (max-width: 1023px)',
    tabletDown: '(max-width: 1023px)',
    desktopUp: '(min-width: 1024px)',
    desktop: '(min-width: 1024px) and (max-width: 1439px)',
    belowLarge: '(max-width: 1439px)',
    large: '(min-width: 1440px)',
});

/** True when the named tier (a key of MEDIA) currently matches. */
export function isViewport(name) {
    const query = MEDIA[name];
    if (!query) throw new Error('Unknown breakpoint tier: ' + name);
    return window.matchMedia(query).matches;
}
