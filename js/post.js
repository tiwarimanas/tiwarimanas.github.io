(function() {
    "use strict";

    var speechUtterance = null;
    var isSpeaking = false;

    function getBase() {
        var b = window.location.protocol + "//" + window.location.host + window.location.pathname;
        if (b.match(/\/[^\/]+\.[^\/]+$/)) b = b.replace(/\/[^\/]+$/, "/");
        if (b.charAt(b.length - 1) !== "/") b += "/";
        return b;
    }

    function fileUrl(f) { return getBase() + "me/" + f; }
    function indexUrl() { return getBase() + "me/index.json"; }

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

    // PDF download
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
            'p{font-weight:300;margin:12px 0}' +
            'strong{font-weight:600}' +
            'blockquote{border-left:3px solid #8B5E3C;padding:8px 16px;margin:16px 0;color:#555;font-style:italic;background:#faf6f1;border-radius:0 8px 8px 0}' +
            'code{font-family:"JetBrains Mono",monospace;font-size:0.85em;background:#f3f1ed;padding:2px 6px;border-radius:4px}' +
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

    // Share functions
    function shareTwitter() {
        var title = document.getElementById("post-title");
        var t = title ? title.textContent : document.title;
        var url = window.location.href;
        window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(t) + "&url=" + encodeURIComponent(url), "_blank", "width=550,height=420");
    }

    function shareLinkedIn() {
        var url = window.location.href;
        window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url), "_blank", "width=550,height=420");
    }

    function shareInstagram() {
        // Instagram doesn't have a direct share URL — copy link instead
        navigator.clipboard.writeText(window.location.href).then(function() {
            showToast("Link copied! Paste in Instagram");
        }).catch(function() {
            showToast("Could not copy link");
        });
    }

    function copyLink() {
        navigator.clipboard.writeText(window.location.href).then(function() {
            showToast("Link copied to clipboard!");
        }).catch(function() {
            showToast("Could not copy link");
        });
    }

    // Load and render post
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

        fetch(indexUrl())
            .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
            .then(function(data) {
                var posts = (data && data.posts) ? data.posts : [];
                var post = null;
                for (var i = 0; i < posts.length; i++) {
                    var s = posts[i].slug || posts[i].file.replace(".md", "");
                    if (s === slug) { post = posts[i]; break; }
                }
                if (!post) throw new Error("Post not found: " + slug);
                return fetch(fileUrl(post.file)).then(function(r) {
                    if (!r.ok) throw new Error("HTTP " + r.status + " loading " + post.file);
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

                // Render math with KaTeX if available
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
        if (typeof katex === "undefined") return;
        // Block math
        var blocks = document.querySelectorAll(".math-block[data-math]");
        for (var i = 0; i < blocks.length; i++) {
            var raw = blocks[i].getAttribute("data-math");
            var expr = raw.replace(/^\$\$/, "").replace(/\$\$$/, "").trim();
            try { katex.render(expr, blocks[i], { displayMode: true, throwOnError: false }); }
            catch (e) { console.warn("KaTeX error:", e); }
        }
        // Inline math
        var inlines = document.querySelectorAll(".math-inline[data-math]");
        for (var j = 0; j < inlines.length; j++) {
            var rawI = inlines[j].getAttribute("data-math");
            var exprI = rawI.replace(/^\$/, "").replace(/\$$/, "").trim();
            try { katex.render(exprI, inlines[j], { displayMode: false, throwOnError: false }); }
            catch (e) { console.warn("KaTeX error:", e); }
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

        loadPost();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
