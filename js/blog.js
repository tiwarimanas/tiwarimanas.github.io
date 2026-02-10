var BlogModule = (function() {
    "use strict";
    var posts = [];

    // FIXED: Resolve base path for GitHub Pages
    // On GitHub Pages: https://tiwarimanas.github.io/
    // On GitHub Pages with repo name: https://tiwarimanas.github.io/reponame/
    // Locally: http://localhost:8080/ or file:///path/
    function getBase() {
        // Use document.baseURI or build from location
        var loc = window.location;
        var path = loc.pathname;

        // Remove any filename at the end (e.g., /index.html, /blog.html)
        var lastSlash = path.lastIndexOf("/");
        var afterSlash = path.substring(lastSlash + 1);

        // If the last segment has a dot, it's a file — strip it
        if (afterSlash.indexOf(".") !== -1) {
            path = path.substring(0, lastSlash + 1);
        } else {
            // Ensure trailing slash
            if (path.charAt(path.length - 1) !== "/") {
                path = path + "/";
            }
        }

        return loc.protocol + "//" + loc.host + path;
    }

    function fileUrl(f) {
        return getBase() + "me/" + f;
    }

    function indexUrl() {
        return getBase() + "me/index.json";
    }

    function blogPageUrl(slug) {
        return getBase() + "blog.html?post=" + encodeURIComponent(slug);
    }

    function show(e) { if (e) e.hidden = false; }
    function hide(e) { if (e) e.hidden = true; }

    function fmtDate(d) {
        if (!d) return "";
        try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
        catch (e) { return d; }
    }

    function enrichPost(post) {
        var url = fileUrl(post.file);
        return fetch(url)
            .then(function(r) {
                if (!r.ok) throw new Error("HTTP " + r.status + " for " + url);
                return r.text();
            })
            .then(function(md) {
                var p = MarkdownParser.extractFrontMatter(md);
                post.title = p.meta.title || post.title || "Untitled";
                post.date = p.meta.date || post.date || "";
                post.excerpt = post.excerpt || MarkdownParser.excerpt(md);
                post.readingTime = MarkdownParser.readingTime(p.content);
                post.slug = post.slug || post.file.replace(".md", "");
            })
            .catch(function(err) {
                console.warn("[Blog] enrich failed for " + post.file + ":", err.message);
                post.slug = post.slug || post.file.replace(".md", "");
            });
    }

    function renderHomeWritings() {
        var container = document.getElementById("home-writings");
        if (!container || posts.length === 0) return;

        var recent = posts.slice(0, 3);
        var h = [];
        for (var i = 0; i < recent.length; i++) {
            var p = recent[i];
            var num = "0" + (i + 1);
            var href = blogPageUrl(p.slug);
            h.push(
                '<a href="' + href + '" class="writing-card reveal">' +
                '<div class="writing-card-num">' + num + '</div>' +
                '<div class="writing-card-date">' + fmtDate(p.date) + '</div>' +
                '<h3 class="writing-card-title">' + (p.title || "Untitled") + '</h3>' +
                (p.excerpt ? '<p class="writing-card-excerpt">' + p.excerpt + '</p>' : '') +
                '<div class="writing-card-meta">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                '<span>' + (p.readingTime || "1 min read") + '</span></div></a>'
            );
        }
        container.innerHTML = h.join("");
        if (typeof observeReveals === "function") observeReveals();
    }

    function renderBlogList() {
        var listEl = document.getElementById("blog-list");
        if (!listEl) return;

        if (posts.length === 0) {
            listEl.innerHTML = '<div class="empty-box"><p>No posts yet.</p></div>';
            return;
        }

        var h = [];
        for (var i = 0; i < posts.length; i++) {
            var p = posts[i];
            var href = blogPageUrl(p.slug);
            h.push(
                '<a href="' + href + '" class="blog-item reveal">' +
                '<div class="blog-item-date">' + fmtDate(p.date) + '</div>' +
                '<h3 class="blog-item-title">' + (p.title || "Untitled") + '</h3>' +
                (p.excerpt ? '<p class="blog-item-excerpt">' + p.excerpt + '</p>' : '') +
                (p.readingTime ? '<div class="blog-item-rt">' + p.readingTime + '</div>' : '') +
                '</a>'
            );
        }
        listEl.innerHTML = h.join("");
        if (typeof observeReveals === "function") observeReveals();
    }

    function load(callback) {
        var url = indexUrl();
        console.log("[Blog] Fetching index:", url);

        fetch(url)
            .then(function(r) {
                if (!r.ok) throw new Error("HTTP " + r.status + " fetching " + url);
                return r.json();
            })
            .then(function(data) {
                posts = (data && data.posts) ? data.posts : [];
                posts.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
                for (var i = 0; i < posts.length; i++) {
                    posts[i].slug = posts[i].slug || posts[i].file.replace(".md", "");
                }

                var promises = [];
                for (var j = 0; j < posts.length; j++) {
                    promises.push(enrichPost(posts[j]));
                }
                return Promise.all(promises);
            })
            .then(function() {
                posts.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
                console.log("[Blog] Loaded " + posts.length + " posts");
                if (callback) callback(null, posts);
            })
            .catch(function(err) {
                console.error("[Blog] Load error:", err);
                if (callback) callback(err, []);
            });
    }

    function init() {
        var blogLoadEl = document.getElementById("blog-loading");
        var blogErrEl = document.getElementById("blog-error");

        load(function(err) {
            if (blogLoadEl) hide(blogLoadEl);

            if (err && blogErrEl) {
                show(blogErrEl);
                var m = blogErrEl.querySelector(".error-msg");
                if (m) m.textContent = "Could not load posts.";
            }

            renderHomeWritings();
            renderBlogList();
        });
    }

    function getPosts() { return posts; }
    function getFileUrl(f) { return fileUrl(f); }

    return { init: init, getPosts: getPosts, getFileUrl: getFileUrl, load: load };
})();
