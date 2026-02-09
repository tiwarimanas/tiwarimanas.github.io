const MarkdownParser = (() => {
    'use strict';

    function parse(md) {
        if (!md) return '';
        const lines = md.split('\n');
        const html = [];
        let inCodeBlock = false;
        let codeBlockContent = [];
        let codeBlockLang = '';
        let inList = false;
        let listType = '';
        let listItems = [];

        function flushList() {
            if (!inList) return;
            const tag = listType === 'ul' ? 'ul' : 'ol';
            html.push('<' + tag + '>');
            listItems.forEach(item => {
                html.push('<li>' + inlineFormat(item) + '</li>');
            });
            html.push('</' + tag + '>');
            inList = false;
            listItems = [];
            listType = '';
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.trimStart().startsWith('```')) {
                if (!inCodeBlock) {
                    flushList();
                    inCodeBlock = true;
                    codeBlockLang = line.trim().slice(3).trim();
                    codeBlockContent = [];
                } else {
                    const langAttr = codeBlockLang ? ' class="language-' + escapeHtml(codeBlockLang) + '"' : '';
                    html.push('<pre><code' + langAttr + '>' + escapeHtml(codeBlockContent.join('\n')) + '</code></pre>');
                    inCodeBlock = false;
                    codeBlockContent = [];
                    codeBlockLang = '';
                }
                continue;
            }

            if (inCodeBlock) { codeBlockContent.push(line); continue; }
            if (line.trim() === '') { flushList(); continue; }
            if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) { flushList(); html.push('<hr>'); continue; }

            const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                flushList();
                const level = headingMatch[1].length;
                const text = headingMatch[2].replace(/\s*#{1,6}\s*$/, '');
                html.push('<h' + level + '>' + inlineFormat(text) + '</h' + level + '>');
                continue;
            }

            if (line.trimStart().startsWith('> ')) {
                flushList();
                const quoteText = line.replace(/^>\s?/, '');
                html.push('<blockquote><p>' + inlineFormat(quoteText) + '</p></blockquote>');
                continue;
            }

            const ulMatch = line.match(/^(\s*)[*\-+]\s+(.+)/);
            if (ulMatch) {
                if (!inList || listType !== 'ul') { flushList(); inList = true; listType = 'ul'; }
                listItems.push(ulMatch[2]);
                continue;
            }

            const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/);
            if (olMatch) {
                if (!inList || listType !== 'ol') { flushList(); inList = true; listType = 'ol'; }
                listItems.push(olMatch[2]);
                continue;
            }

            flushList();
            html.push('<p>' + inlineFormat(line) + '</p>');
        }

        flushList();
        if (inCodeBlock) {
            html.push('<pre><code>' + escapeHtml(codeBlockContent.join('\n')) + '</code></pre>');
        }
        return html.join('\n');
    }

    function inlineFormat(text) {
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        text = text.replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>');
        text = text.replace(/_{3}(.+?)_{3}/g, '<strong><em>$1</em></strong>');
        text = text.replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>');
        text = text.replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>');
        text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
        text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
        return text;
    }

    function escapeHtml(str) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return str.replace(/[&<>"']/g, c => map[c]);
    }

    function extractFrontMatter(md) {
        const meta = {};
        let content = md;
        const fmMatch = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
        if (fmMatch) {
            const fmBlock = fmMatch[1];
            content = fmMatch[2];
            fmBlock.split('\n').forEach(line => {
                const kv = line.match(/^(\w[\w\s-]*?):\s*(.+)$/);
                if (kv) {
                    const key = kv[1].trim().toLowerCase().replace(/\s+/g, '_');
                    let val = kv[2].trim();
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.slice(1, -1);
                    }
                    meta[key] = val;
                }
            });
        }
        return { meta, content };
    }

    function readingTime(text) {
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.max(1, Math.round(words / 220));
        return minutes + ' min read';
    }

    function excerpt(md, maxLength) {
        maxLength = maxLength || 160;
        const { content } = extractFrontMatter(md);
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```') &&
                !trimmed.startsWith('>') && !trimmed.startsWith('-') &&
                !trimmed.startsWith('*') && !trimmed.startsWith('![')) {
                let clean = trimmed
                    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    .replace(/[*_`]/g, '');
                if (clean.length > maxLength) {
                    clean = clean.substring(0, maxLength).replace(/\s\S*$/, '') + '...';
                }
                return clean;
            }
        }
        return '';
    }

    return { parse, extractFrontMatter, readingTime, excerpt };
})();
