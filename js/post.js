(function() {
    "use strict";

    var speechUtterance = null;
    var isSpeaking = false;

    // FIXED: Same base path logic as blog.js
    function getBase() {
        var loc = window.location;
        var path = loc.pathname;
        var lastSlash = path.lastIndexOf("/");
        var afterSlash = path.substring(lastSlash + 1);

        if (afterSlash.indexOf(".") !== -1) {
            path = path.substring(0, lastSlash + 1);
        } else {
            if (path.charAt(path.length - 1) !== "/") {
                path = path + "/";
            }
        }

        return loc.protocol + "//" + loc.host + path;
    }

    function fileUrl(f) { return getBase() + "me/" + f; }
    function indexUrl() { return getBase() + "me/index.json"; }
    function homeUrl() { return getBase() + "index.html"; }

    function getSlug() {
        var params = new URLSearchParams(window.location.search);
        return params.get("post") || "";
    }

    function fmtDate(d) {
        if (!d) return "";
        try { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
        catch(e) { return d; }
    }

    function showToast(msg) {
        var t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        setTimeout(function() { t.classList.remove("show"); }, 2500);
    }

    function getPlainText(html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        return d.textContent || d.innerText || "";
    }

    // TTS
    function toggleTTS() {
        var btn = document.getElementById("btn-tts");
        if (!("speechSynthesis" in window)) { showToast("TTS not supported in this browser"); return; }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            if (btn) btn.classList.remove("listening");
            if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen';
            return;
        }

        var content = document.getElementById("post-content");
        if (!content) return;
        var text = getPlainText(content.innerHTML);
        if (!text.trim()) { showToast("No content to read"); return; }

        speechUtterance = new SpeechSynthesisUtterance(text);
        speechUtterance.rate = 0.95;
        speechUtterance.pitch = 1;
        speechUtterance.onend = function() {
            isSpeaking = false;
            if (btn) btn.classList.remove("listening");
            if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen';
        };

        window.speechSynthesis.speak(speechUtterance);
        isSpeaking = true;
        if (btn) btn.classList.add("listening");
        if (btn) btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause';
    }

    // PDF
    function downloadPDF() {
        var title = document.getElementById("post-title");
        var content = document.getElementById("post-content");
        if (!content) return;

        showToast("Preparing PDF...");

        var printWin = window.open("", "_blank");
        if (!printWin) { showToast("Please allow popups for PDF"); return; }

        printWin.document.write(
            '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
            '<title>' + (title ? title.textContent : "Post") + '</title>' +
            '<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&display=swap" rel="stylesheet">' +
            '<style>' +
            'body{font-family:"Crimson Pro",Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#1A1A1A;font-size:17px;line-height:1.8}' +
            'h1{font-size:28px;font-weight:500;margin-bottom:8px;letter-spacing:-0.02em}' +
            '.meta{font-size:13px;color:#888;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #eee}' +
            'h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin-top:24px}' +
            'p{font-weight:300;margin:12px 0}strong{font-weight:600}' +
            'blockquote{border-left:3px solid #8B5E3C;padding:8px 16px;margin:16px 0;color:#555;font-style:italic;background:#faf6f1;border-radius:0 8px 8px 0}' +
            'code{font-family:monospace;font-size:0.85em;background:#f3f1ed;padding:2px 6px;border-radius:4px}' +
            'pre{background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:10px;overflow-x:auto;font-size:14px;line-height:1.6}' +
            'pre code{background:none;padding:0;color:inherit}' +
            'ul,ol{padding-left:24px}li{margin:6px 0;font-weight:300}' +
            'hr{border:none;height:1px;background:#eee;margin:32px 0}' +
            'img{max-width:100%;border-radius:10px}' +
            '@media print{body{margin:0;padding:20px}}' +
            '</style></head><body>' +
            '<h1>' + (title ? title.textContent : "") + '</h1>' +
            '<div class="meta">' + (document.getElementById("post-date") ? document.getElementById("post-date").textContent : "") + '</div>' +
            content.innerHTML +
            '</body></html>'
        );
        printWin.document.close();
        setTimeout(function() { printWin.print(); }, 600);
    }

    // Share
    function shareTwitter() {
        var title = document.getElementById("post-title");
        var t = title ? title.textContent : document.title;
        window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(window.location.href), "_blank", "width=550,height=420");
    }

    function shareLinkedIn() {
        window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(window.location.href), "_blank", "width=550,height=420");
    }

    function shareInstagram() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(function() {
                showToast("Link copied! Paste in Instagram");
            }).catch(function() { fallbackCopy(); });
        } else { fallbackCopy(); }
    }

    function copyLink() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(function() {
                showToast("Link copied to clipboard!");
            }).catch(function() { fallbackCopy(); });
        } else { fallbackCopy(); }
    }

    function fallbackCopy() {
        var ta = document.createElement("textarea");
        ta.value = window.location.href;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); showToast("Link copied!"); }
        catch(e) { showToast("Could not copy link"); }
        document.body.removeChild(ta);
    }

    // FIXED: Load post with correct paths
    function loadPost() {
        var slug = getSlug();
        var loadingEl = document.getElementById("post-loading-state");
        var errorEl = document.getElementById("post-error-state");
        var articleEl = document.getElementById("post-article");
        var toolbarEl = document.getElementById("post-toolbar");

        if (!slug) {
            if (loadingEl) loadingEl.style.display = "none";
            if (errorEl) { errorEl.style.display = "flex"; errorEl.querySelector("p").textContent = "No post specified."; }
            return;
        }

        var idxUrl = indexUrl();
        console.log("[Post] Fetching index:", idxUrl);
        console.log("[Post] Looking for slug:", slug);

        fetch(idxUrl)
            .then(function(r) {
                if (!r.ok) throw new Error("Could not load post index (HTTP " + r.status + "). URL: " + idxUrl);
                return r.json();
            })
            .then(function(data) {
                var allPosts = (data && data.posts) ? data.posts : [];
                var post = null;
                for (var i = 0; i < allPosts.length; i++) {
                    var s = allPosts[i].slug || allPosts[i].file.replace(".md", "");
                    if (s === slug) { post = allPosts[i]; break; }
                }
                if (!post) throw new Error("Post not found: " + slug);

                var mdUrl = fileUrl(post.file);
                console.log("[Post] Fetching markdown:", mdUrl);

                return fetch(mdUrl).then(function(r) {
                    if (!r.ok) throw new Error("Could not load post file (HTTP " + r.status + "). URL: " + mdUrl);
                    return r.text();
                });
            })
            .then(function(md) {
                var parsed = MarkdownParser.extractFrontMatter(md);
                var title = parsed.meta.title || slug;
                var date = parsed.meta.date || "";
                var rt = MarkdownParser.readingTime(parsed.content);
                var html = MarkdownParser.parse(parsed.content);

                document.title = title + " — Manas Tiwari";

                var titleEl = document.getElementById("post-title");
                var dateEl = document.getElementById("post-date");
                var rtEl = document.getElementById("post-rt");
                var contentEl = document.getElementById("post-content");

                if (titleEl) titleEl.textContent = title;
                if (dateEl) dateEl.textContent = fmtDate(date);
                if (rtEl) rtEl.textContent = rt;
                if (contentEl) contentEl.innerHTML = html;

                if (loadingEl) loadingEl.style.display = "none";
                if (articleEl) articleEl.style.display = "block";
                if (toolbarEl) toolbarEl.style.display = "flex";

                // Render math with KaTeX if loaded
                renderMath();
            })
            .catch(function(err) {
                console.error("[Post] Error:", err);
                if (loadingEl) loadingEl.style.display = "none";
                if (errorEl) {
                    errorEl.style.display = "flex";
                    var p = errorEl.querySelector("p");
                    if (p) p.textContent = err.message || "Failed to load post.";
                }
            });
    }

    function renderMath() {
        if (typeof katex === "undefined") {
            // KaTeX may still be loading (defer), retry once
            setTimeout(function() {
                if (typeof katex !== "undefined") doRenderMath();
            }, 500);
            return;
        }
        doRenderMath();
    }

    function doRenderMath() {
        if (typeof katex === "undefined") return;

        var blocks = document.querySelectorAll(".math-block[data-math]");
        for (var i = 0; i < blocks.length; i++) {
            var raw = blocks[i].getAttribute("data-math");
            var expr = raw.replace(/^\$\$/, "").replace(/\$\$$/, "").trim();
            if (expr) {
                try { katex.render(expr, blocks[i], { displayMode: true, throwOnError: false }); }
                catch (e) { console.warn("KaTeX block error:", e); }
            }
        }

        var inlines = document.querySelectorAll(".math-inline[data-math]");
        for (var j = 0; j < inlines.length; j++) {
            var rawI = inlines[j].getAttribute("data-math");
            var exprI = rawI.replace(/^\$/, "").replace(/\$$/, "").trim();
            if (exprI) {
                try { katex.render(exprI, inlines[j], { displayMode: false, throwOnError: false }); }
                catch (e) { console.warn("KaTeX inline error:", e); }
            }
        }
    }

    // FIXED: Update back links to use correct base
    function fixBackLinks() {
        var base = getBase();

        // Fix the back button in toolbar
        var backBtn = document.querySelector(".post-back");
        if (backBtn) backBtn.setAttribute("href", base + "index.html#blog");

        // Fix the error state back link
        var errBack = document.querySelector("#post-error-state a");
        if (errBack) errBack.setAttribute("href", base + "index.html#blog");

        // Fix nav links
        var navLinks = document.querySelectorAll(".nav-link, .nav-logo");
        for (var i = 0; i < navLinks.length; i++) {
            var el = navLinks[i];
            var href = el.getAttribute("href") || "";

            if (href === "index.html" || href === "./index.html") {
                el.setAttribute("href", base + "index.html");
            } else if (href === "index.html#projects" || href === "./index.html#projects") {
                el.setAttribute("href", base + "index.html#projects");
            } else if (href === "index.html#blog" || href === "./index.html#blog") {
                el.setAttribute("href", base + "index.html#blog");
            }
        }
    }

    function boot() {
        // Header scroll
        var header = document.querySelector(".site-header");
        if (header) {
            window.addEventListener("scroll", function() {
                header.classList.toggle("scrolled", window.scrollY > 10);
            }, { passive: true });
        }

        // Fix all navigation links for GitHub Pages
        fixBackLinks();

        // Toolbar buttons
        var btnTTS = document.getElementById("btn-tts");
        var btnPDF = document.getElementById("btn-pdf");
        var btnTwitter = document.getElementById("btn-twitter");
        var btnLinkedIn = document.getElementById("btn-linkedin");
        var btnIG = document.getElementById("btn-instagram");
        var btnCopy = document.getElementById("btn-copy");

        if (btnTTS) btnTTS.addEventListener("click", toggleTTS);
        if (btnPDF) btnPDF.addEventListener("click", downloadPDF);
        if (btnTwitter) btnTwitter.addEventListener("click", shareTwitter);
        if (btnLinkedIn) btnLinkedIn.addEventListener("click", shareLinkedIn);
        if (btnIG) btnIG.addEventListener("click", shareInstagram);
        if (btnCopy) btnCopy.addEventListener("click", copyLink);

        // Cancel TTS when leaving page
        window.addEventListener("beforeunload", function() {
            if (isSpeaking && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        loadPost();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
