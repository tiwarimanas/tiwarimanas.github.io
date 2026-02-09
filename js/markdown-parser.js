var MarkdownParser = (function() {
    "use strict";

    function esc(s) {
        if (!s) return "";
        return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    function inline(t) {
        if (!t) return "";
        // Preserve math before other processing
        // Inline math: $...$
        t = t.replace(/\$\$(.+?)\$\$/g, '<span class="math-block" data-math="$$$$1$$">$$$$1$$</span>');
        t = t.replace(/\$([^\$\n]+?)\$/g, '<span class="math-inline" data-math="$$$1$">$$$1$</span>');
        // Images
        t = t.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
        // Links
        t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        // Code
        t = t.replace(/`([^`]+)`/g, function(m, c) { return "<code>" + esc(c) + "</code>"; });
        // Bold+italic
        t = t.replace(/\*{3}(.+?)\*{3}/g, "<strong><em>$1</em></strong>");
        t = t.replace(/_{3}(.+?)_{3}/g, "<strong><em>$1</em></strong>");
        // Bold
        t = t.replace(/\*{2}(.+?)\*{2}/g, "<strong>$1</strong>");
        t = t.replace(/_{2}(.+?)_{2}/g, "<strong>$1</strong>");
        // Italic
        t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");
        t = t.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
        return t;
    }

    function parse(md) {
        if (!md) return "";
        var lines = md.split("\n");
        var out = [];
        var inCode = false, codeLines = [], codeLang = "";
        var inList = false, listTag = "", listItems = [];
        var inMathBlock = false, mathLines = [];

        function flushList() {
            if (!inList) return;
            out.push("<" + listTag + ">");
            for (var i = 0; i < listItems.length; i++) out.push("<li>" + inline(listItems[i]) + "</li>");
            out.push("</" + listTag + ">");
            inList = false; listItems = []; listTag = "";
        }

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmed = line.trim();

            // Math block ($$...$$)
            if (trimmed === "$$") {
                if (!inMathBlock) {
                    flushList();
                    inMathBlock = true;
                    mathLines = [];
                } else {
                    var mathContent = mathLines.join("\n");
                    out.push('<div class="math-block" data-math="$$' + esc(mathContent) + '$$">$$' + esc(mathContent) + '$$</div>');
                    inMathBlock = false;
                    mathLines = [];
                }
                continue;
            }
            if (inMathBlock) { mathLines.push(line); continue; }

            // Code fence
            if (trimmed.indexOf("```") === 0) {
                if (!inCode) {
                    flushList(); inCode = true;
                    codeLang = trimmed.slice(3).trim(); codeLines = [];
                } else {
                    var attr = codeLang ? ' class="language-' + esc(codeLang) + '"' : "";
                    out.push("<pre><code" + attr + ">" + esc(codeLines.join("\n")) + "</code></pre>");
                    inCode = false; codeLines = []; codeLang = "";
                }
                continue;
            }
            if (inCode) { codeLines.push(line); continue; }

            if (trimmed === "") { flushList(); continue; }
            if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) { flushList(); out.push("<hr>"); continue; }

            var hM = line.match(/^(#{1,6})\s+(.+)/);
            if (hM) {
                flushList();
                var lvl = hM[1].length;
                var hText = hM[2].replace(/\s*#{1,6}\s*$/, "");
                out.push("<h" + lvl + ">" + inline(hText) + "</h" + lvl + ">");
                continue;
            }

            if (trimmed.indexOf(">") === 0) {
                flushList();
                var qText = line.replace(/^>\s?/, "");
                out.push("<blockquote><p>" + inline(qText) + "</p></blockquote>");
                continue;
            }

            var ulM = line.match(/^\s*[*\-+]\s+(.+)/);
            if (ulM) {
                if (!inList || listTag !== "ul") { flushList(); inList = true; listTag = "ul"; }
                listItems.push(ulM[1]); continue;
            }

            var olM = line.match(/^\s*\d+\.\s+(.+)/);
            if (olM) {
                if (!inList || listTag !== "ol") { flushList(); inList = true; listTag = "ol"; }
                listItems.push(olM[1]); continue;
            }

            flushList();
            out.push("<p>" + inline(line) + "</p>");
        }

        flushList();
        if (inCode) out.push("<pre><code>" + esc(codeLines.join("\n")) + "</code></pre>");
        if (inMathBlock) out.push('<div class="math-block" data-math="$$' + esc(mathLines.join("\n")) + '$$">$$' + esc(mathLines.join("\n")) + '$$</div>');

        return out.join("\n");
    }

    function extractFrontMatter(md) {
        var meta = {}, content = md || "";
        if (!md) return { meta: meta, content: content };
        var m = md.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*\n([\s\S]*)$/);
        if (m) {
            content = m[2];
            var fmLines = m[1].split("\n");
            for (var i = 0; i < fmLines.length; i++) {
                var kv = fmLines[i].match(/^([A-Za-z_][\w\s-]*?):\s*(.+)$/);
                if (kv) {
                    var key = kv[1].trim().toLowerCase().replace(/\s+/g, "_");
                    var val = kv[2].trim();
                    if ((val.charAt(0) === '"' && val.charAt(val.length-1) === '"') ||
                        (val.charAt(0) === "'" && val.charAt(val.length-1) === "'"))
                        val = val.slice(1,-1);
                    meta[key] = val;
                }
            }
        }
        return { meta: meta, content: content };
    }

    function readingTime(text) {
        if (!text) return "1 min read";
        var words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 220)) + " min read";
    }

    function excerpt(md, maxLen) {
        maxLen = maxLen || 150;
        var p = extractFrontMatter(md);
        var lines = p.content.split("\n");
        for (var i = 0; i < lines.length; i++) {
            var t = lines[i].trim();
            if (t && t.charAt(0) !== "#" && t.indexOf("```") !== 0 &&
                t.charAt(0) !== ">" && t.charAt(0) !== "-" &&
                t.charAt(0) !== "*" && t.indexOf("![") !== 0 && t !== "$$") {
                var clean = t.replace(/\[([^\]]+)\]\([^)]+\)/g,"$1").replace(/[*_`$]/g,"");
                if (clean.length > maxLen) clean = clean.substring(0, maxLen).replace(/\s\S*$/,"") + "...";
                return clean;
            }
        }
        return "";
    }

    return { parse: parse, extractFrontMatter: extractFrontMatter, readingTime: readingTime, excerpt: excerpt };
})();
