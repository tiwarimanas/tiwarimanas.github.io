(() => {
    'use strict';

    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('[data-nav]');
    const navToggle = document.querySelector('.nav-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const header = document.querySelector('.site-header');

    let currentSection = 'home';

    function navigateTo(sectionId) {
        if (!sectionId) sectionId = 'home';
        navLinksContainer.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');

        if (sectionId !== 'blog' && typeof BlogModule !== 'undefined') BlogModule.closePost();
        if (sectionId === 'blog') {
            var hash = window.location.hash.slice(1);
            if (!hash.startsWith('blog/') && typeof BlogModule !== 'undefined') BlogModule.closePost();
        }

        sections.forEach(function(s) { s.classList.toggle('active', s.id === sectionId); });
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.toggle('active', link.dataset.nav === sectionId);
        });

        currentSection = sectionId;

        if (sectionId !== 'blog' || !window.location.hash.startsWith('#blog/')) {
            if (sectionId === 'home') history.replaceState(null, '', window.location.pathname);
            else window.location.hash = sectionId;
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleRoute() {
        var hash = window.location.hash.slice(1);
        if (!hash || hash === 'home') navigateTo('home');
        else if (hash === 'projects') navigateTo('projects');
        else if (hash === 'blog' || hash.startsWith('blog/')) {
            navigateTo('blog');
            if (hash.startsWith('blog/') && typeof BlogModule !== 'undefined') BlogModule.handleHash();
        }
        else navigateTo('home');
    }

    function initNav() {
        navLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                navigateTo(link.dataset.nav);
            });
        });

        navToggle.addEventListener('click', function() {
            var isOpen = navLinksContainer.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen.toString());
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-container')) {
                navLinksContainer.classList.remove('open');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });

        window.addEventListener('scroll', function() {
            header.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });

        window.addEventListener('hashchange', handleRoute);
    }

    function init() {
        initNav();
        if (typeof ReposModule !== 'undefined') ReposModule.init();
        if (typeof BlogModule !== 'undefined') BlogModule.init();
        handleRoute();
    }

    window.reposModule = typeof ReposModule !== 'undefined' ? ReposModule : { load: function() {} };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
