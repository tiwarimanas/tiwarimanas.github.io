(function() {
    "use strict";

    var sections, navToggle, navLinksEl, header;

    function navigateTo(id) {
        id = id || "home";
        if (navLinksEl) navLinksEl.classList.remove("open");

        if (sections) {
            for (var i = 0; i < sections.length; i++) {
                if (sections[i].id === id) sections[i].classList.add("active");
                else sections[i].classList.remove("active");
            }
        }

        var links = document.querySelectorAll(".nav-link");
        for (var j = 0; j < links.length; j++) {
            if (links[j].getAttribute("data-nav") === id) links[j].classList.add("active");
            else links[j].classList.remove("active");
        }

        if (id === "home") {
            if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
        } else {
            window.history.replaceState(null, "", "#" + id);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function route() {
        var h = window.location.hash.slice(1);
        if (h === "projects") navigateTo("projects");
        else if (h === "blog") navigateTo("blog");
        else navigateTo("home");
    }

    function boot() {
        sections = document.querySelectorAll(".section");
        navToggle = document.querySelector(".nav-toggle");
        navLinksEl = document.querySelector(".nav-links");
        header = document.querySelector(".site-header");

        // Nav clicks
        var navEls = document.querySelectorAll("[data-nav]");
        for (var i = 0; i < navEls.length; i++) {
            (function(el) {
                el.addEventListener("click", function(e) {
                    e.preventDefault();
                    navigateTo(el.getAttribute("data-nav"));
                });
            })(navEls[i]);
        }

        // Mobile toggle
        if (navToggle && navLinksEl) {
            navToggle.addEventListener("click", function() {
                navLinksEl.classList.toggle("open");
            });
        }

        // Close mobile on outside click
        document.addEventListener("click", function(e) {
            if (navLinksEl && !e.target.closest(".nav")) navLinksEl.classList.remove("open");
        });

        // Header scroll
        if (header) {
            window.addEventListener("scroll", function() {
                header.classList.toggle("scrolled", window.scrollY > 10);
            }, { passive: true });
        }

        window.addEventListener("hashchange", route);

        // Init modules
        if (typeof ReposModule !== "undefined") try { ReposModule.init(); } catch(e) { console.error(e); }
        if (typeof BlogModule !== "undefined") try { BlogModule.init(); } catch(e) { console.error(e); }

        window.reposModule = typeof ReposModule !== "undefined" ? ReposModule : { load: function(){} };

        // Scroll reveal
        observeReveals();

        route();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();

// Global scroll reveal observer
function observeReveals() {
    var els = document.querySelectorAll(".reveal:not(.visible)");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
        for (var i = 0; i < els.length; i++) els[i].classList.add("visible");
        return;
    }
    var obs = new IntersectionObserver(function(entries) {
        for (var j = 0; j < entries.length; j++) {
            if (entries[j].isIntersecting) {
                entries[j].target.classList.add("visible");
                obs.unobserve(entries[j].target);
            }
        }
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    for (var k = 0; k < els.length; k++) obs.observe(els[k]);
}
