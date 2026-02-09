var BlogModule = (function() {
    "use strict";
    var posts = [];

    function getBase() {
        var b = window.location.protocol + "//" + window.location.host + window.location.pathname;
        if (b.match(/\/[^\/]+\.[^\/]+$/)) b = b.replace(/\/[^\/]+$/, "/");
        if (b.charAt(b.length - 1) !== "/") b += "/";
        return b;
    }

    function fileUrl(f) { return getBase() + "me/" + f; }
    function indexUrl() { return getBase() + "me/index.json"; }
    function show(e) { if (e) e.hidden = false; }
    function hide(e) { if (e) e.hidden = true; }

    function fmtDate(d) {
        if (!d) return "";
        try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }); }
        catch (e) { return d; }
    }

    function enrichPost(post) {
        return fetch(fileUrl(post.file))
            .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
            .then(function(md) {
                var p = MarkdownParser.extractFrontMatter(md);
                post.title = p.meta.title || post.title || "Untitled";
                post.date = p.meta.date || post.date || "";
                post.excerpt = post.excerpt || MarkdownParser.excerpt(md);
                post.readingTime = MarkdownParser.readingTime(p.content);
                post.slug = post.slug || post.file.replace(".md", "");
            })
            .catch(function() {
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
            h.push(
                '<a href="blog.html?post=' + encodeURIComponent(p.slug) + '" class="writing-card reveal">' +
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
        observeReveals();
    }

    function renderBlogList() {
        var listEl = document.getElementById("blog-list");
        var loadEl = document.getElementById("blog-loading");
        var errEl = document.getElementById("blog-error");
        if (!listEl) return;

        if (posts.length === 0) {
            listEl.innerHTML = '<div class="empty-box"><p>No posts yet.</p></div>';
            return;
        }

        var h = [];
        for (var i = 0; i < posts.length; i++) {
            var p = posts[i];
            h.push(
                '<a href="blog.html?post=' + encodeURIComponent(p.slug) + '" class="blog-item reveal">' +
                '<div class="blog-item-date">' + fmtDate(p.date) + '</div>' +
                '<h3 class="blog-item-title">' + (p.title || "Untitled") + '</h3>' +
                (p.excerpt ? '<p class="blog-item-excerpt">' + p.excerpt + '</p>' : '') +
                (p.readingTime ? '<div class="blog-item-rt">' + p.readingTime + '</div>' : '') +
                '</a>'
            );
        }
        listEl.innerHTML = h.join("");
        observeReveals();
    }

    function load(callback) {
        fetch(indexUrl())
            .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
            .then(function(data) {
                posts = (data && data.posts) ? data.posts : [];
                posts.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
                for (var i = 0; i < posts.length; i++) posts[i].slug = posts[i].slug || posts[i].file.replace(".md", "");

                var promises = [];
                for (var j = 0; j < posts.length; j++) promises.push(enrichPost(posts[j]));
                return Promise.all(promises);
            })
            .then(function() {
                posts.sort(function(a, b) { return new Date(b.date || 0) - new Date(a.date || 0); });
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
