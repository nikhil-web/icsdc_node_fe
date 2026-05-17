/* theme-init.js — loaded synchronously in <head> to prevent FOUC */
(function () {
    var saved = localStorage.getItem('icsdc-theme');
    var system = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', saved || system);
})();
