(function(){
    "use strict";
    var isSpeaking = false;

    function showToast(msg) {
        var t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        setTimeout(function(){ t.classList.remove("show"); }, 2500);
    }

    function getPlainText(html) {
        var d = document.createElement("div");
        d.innerHTML = html;
        return d.textContent || d.innerText || "";
    }

    // ── TTS ──
    function toggleTTS() {
        var btn = document.getElementById("btn-tts");
        if (!("speechSynthesis" in window)) { showToast("TTS not supported"); return; }
        if (isSpeaking) {
            window.speechSynthesis.cancel(); isSpeaking = false;
            if (btn) { btn.classList.remove("listening"); btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen'; }
            return;
        }
        var content = document.getElementById("post-content");
        if (!content) return;
        var text = getPlainText(content.innerHTML);
        if (!text.trim()) { showToast("No content"); return; }
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95; u.pitch = 1;
        u.onend = function() {
            isSpeaking = false;
            if (btn) { btn.classList.remove("listening"); btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen'; }
        };
        window.speechSynthesis.speak(u); isSpeaking = true;
        if (btn) { btn.classList.add("listening"); btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause'; }
    }

    // ── PDF ──
    function downloadPDF() {
        var title = document.getElementById("post-title");
        var content = document.getElementById("post-content");
        if (!content) return;
        showToast("Preparing PDF...");
        var w = window.open("", "_blank");
        if (!w) { showToast("Allow popups for PDF"); return; }
        w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + (title ? title.textContent : "Post") + '</title><link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&display=swap" rel="stylesheet"><style>body{font-family:"Crimson Pro",Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#1A1A1A;font-size:17px;line-height:1.8}h1{font-size:28px;font-weight:500;margin-bottom:8px}.meta{font-size:13px;color:#888;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #eee}h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin-top:24px}p{font-weight:300;margin:12px 0}strong{font-weight:600}blockquote{border-left:3px solid #8B5E3C;padding:8px 16px;margin:16px 0;color:#555;font-style:italic;background:#faf6f1;border-radius:0 8px 8px 0}code{font-family:monospace;font-size:0.85em;background:#f3f1ed;padding:2px 6px;border-radius:4px}pre{background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:10px;overflow-x:auto;font-size:14px;line-height:1.6}pre code{background:none;padding:0;color:inherit}ul,ol{padding-left:24px}li{margin:6px 0;font-weight:300}hr{border:none;height:1px;background:#eee;margin:32px 0}img{max-width:100%;border-radius:10px}.code-block-header{display:none}@media print{body{margin:0;padding:20px}}</style></head><body><h1>' + (title ? title.textContent : "") + '</h1><div class="meta">' + (document.getElementById("post-date") ? document.getElementById("post-date").textContent : "") + '</div>' + content.innerHTML + '</body></html>');
        w.document.close();
        setTimeout(function(){ w.print(); }, 600);
    }

    // ── Share ──
    function shareTwitter() {
        var t = document.getElementById("post-title");
        window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent((t ? t.textContent : document.title)) + "&url=" + encodeURIComponent(window.location.href), "_blank", "width=550,height=420");
    }
    function shareLinkedIn() {
        window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(window.location.href), "_blank", "width=550,height=420");
    }
    function doCopy(msg) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(window.location.href).then(function(){ showToast(msg); }).catch(function(){ fallback(msg); });
        } else { fallback(msg); }
    }
    function fallback(msg) {
        var ta = document.createElement("textarea"); ta.value = window.location.href;
        ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); showToast(msg); } catch(e) { showToast("Could not copy"); }
        document.body.removeChild(ta);
    }

    // ── Copy Code from block ──
    function copyCodeBlock(btn, codeEl) {
        var text = codeEl.textContent || codeEl.innerText || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                markCopied(btn);
            }).catch(function() {
                fallbackCopyCode(text, btn);
            });
        } else {
            fallbackCopyCode(text, btn);
        }
    }

    function fallbackCopyCode(text, btn) {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.cssText = "position:fixed;opacity:0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); markCopied(btn); }
        catch(e) { showToast("Could not copy code"); }
        document.body.removeChild(ta);
    }

    function markCopied(btn) {
        btn.classList.add("copied");
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied!';
        setTimeout(function() {
            btn.classList.remove("copied");
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy';
        }, 2000);
    }

    // ── Wrap code blocks with header + copy button ──
    function enhanceCodeBlocks() {
        var proseEl = document.getElementById("post-content");
        if (!proseEl) return;

        var pres = proseEl.querySelectorAll("pre");
        for (var i = 0; i < pres.length; i++) {
            var pre = pres[i];
            // Skip if already wrapped
            if (pre.parentElement && pre.parentElement.classList.contains("code-block-wrapper")) continue;

            var codeEl = pre.querySelector("code");
            var lang = "";

            if (codeEl) {
                // Extract language from class like "language-javascript" or "highlight-source-js"
                var classes = codeEl.className || "";
                var langMatch = classes.match(/language-(\w+)/);
                if (langMatch) lang = langMatch[1];

                // Also add the class to pre for Prism
                if (lang && !pre.classList.contains("language-" + lang)) {
                    pre.classList.add("language-" + lang);
                    codeEl.classList.add("language-" + lang);
                }
            }

            // Create wrapper
            var wrapper = document.createElement("div");
            wrapper.className = "code-block-wrapper";

            // Create header
            var header = document.createElement("div");
            header.className = "code-block-header";

            // Language label
            var label = document.createElement("span");
            label.className = "code-lang-label";
            var displayLang = lang || "code";
            // Prettify language names
            var langNames = {
                "js": "JavaScript", "javascript": "JavaScript",
                "ts": "TypeScript", "typescript": "TypeScript",
                "py": "Python", "python": "Python",
                "rb": "Ruby", "ruby": "Ruby",
                "rs": "Rust", "rust": "Rust",
                "go": "Go",
                "java": "Java",
                "c": "C", "cpp": "C++",
                "cs": "C#", "csharp": "C#",
                "swift": "Swift",
                "kt": "Kotlin", "kotlin": "Kotlin",
                "dart": "Dart",
                "html": "HTML", "markup": "HTML",
                "css": "CSS", "scss": "SCSS", "sass": "Sass",
                "bash": "Bash", "shell": "Shell", "sh": "Shell", "zsh": "Zsh",
                "json": "JSON",
                "yaml": "YAML", "yml": "YAML",
                "sql": "SQL",
                "php": "PHP",
                "r": "R",
                "lua": "Lua",
                "docker": "Dockerfile", "dockerfile": "Dockerfile",
                "graphql": "GraphQL", "gql": "GraphQL",
                "elixir": "Elixir", "ex": "Elixir",
                "xml": "XML",
                "md": "Markdown", "markdown": "Markdown"
            };
            label.textContent = langNames[lang.toLowerCase()] || displayLang.toUpperCase();
            label.setAttribute("data-lang", lang.toLowerCase());

            // Copy button
            var copyBtn = document.createElement("button");
            copyBtn.className = "code-copy-btn";
            copyBtn.title = "Copy code";
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy';

            // Attach copy handler
            (function(button, code) {
                button.addEventListener("click", function() {
                    copyCodeBlock(button, code);
                });
            })(copyBtn, codeEl || pre);

            header.appendChild(label);
            header.appendChild(copyBtn);

            // Wrap
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        }
    }

    // ── Run Prism syntax highlighting ──
    function highlightCode() {
        if (typeof Prism !== "undefined") {
            try { Prism.highlightAll(); } catch(e) { console.warn("Prism error:", e); }
        } else {
            // Prism may still be loading (defer), retry
            setTimeout(function() {
                if (typeof Prism !== "undefined") {
                    try { Prism.highlightAll(); } catch(e) {}
                }
            }, 800);
        }
    }

    // ── Render math with KaTeX auto-render ──
    function renderMath() {
        var el = document.getElementById("post-content");
        if (!el) return;

        function doRender() {
            if (typeof renderMathInElement !== "undefined") {
                try {
                    renderMathInElement(el, {
                        delimiters: [
                            { left: "$$", right: "$$", display: true },
                            { left: "$", right: "$", display: false },
                            { left: "\\(", right: "\\)", display: false },
                            { left: "\\[", right: "\\]", display: true }
                        ],
                        throwOnError: false,
                        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"]
                    });
                } catch(e) { console.warn("KaTeX error:", e); }
            }
        }

        if (typeof renderMathInElement !== "undefined") {
            doRender();
        } else {
            // Wait for deferred KaTeX scripts
            setTimeout(doRender, 500);
            setTimeout(doRender, 1500);
        }
    }

    // ── Boot ──
    function boot() {
        // Header scroll
        var header = document.querySelector(".site-header");
        if (header) {
            window.addEventListener("scroll", function() {
                header.classList.toggle("scrolled", window.scrollY > 10);
            }, { passive: true });
        }

        // Mobile nav
        var navToggle = document.querySelector(".nav-toggle");
        var navLinks = document.querySelector(".nav-links");
        if (navToggle && navLinks) {
            navToggle.addEventListener("click", function() { navLinks.classList.toggle("open"); });
            document.addEventListener("click", function(e) {
                if (!e.target.closest(".nav")) navLinks.classList.remove("open");
            });
        }

        // Toolbar buttons
        var b1 = document.getElementById("btn-tts");
        var b2 = document.getElementById("btn-pdf");
        var b3 = document.getElementById("btn-twitter");
        var b4 = document.getElementById("btn-linkedin");
        var b5 = document.getElementById("btn-instagram");
        var b6 = document.getElementById("btn-copy");

        if (b1) b1.addEventListener("click", toggleTTS);
        if (b2) b2.addEventListener("click", downloadPDF);
        if (b3) b3.addEventListener("click", shareTwitter);
        if (b4) b4.addEventListener("click", shareLinkedIn);
        if (b5) b5.addEventListener("click", function(){ doCopy("Link copied! Paste in Instagram"); });
        if (b6) b6.addEventListener("click", function(){ doCopy("Link copied!"); });

        window.addEventListener("beforeunload", function() {
            if (isSpeaking && window.speechSynthesis) window.speechSynthesis.cancel();
        });

        // Enhance code blocks FIRST (wrap with headers)
        enhanceCodeBlocks();

        // Then run syntax highlighting
        highlightCode();

        // Then render math (KaTeX)
        renderMath();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
})();
