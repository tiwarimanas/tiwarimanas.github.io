const BlogModule = (() => {
    'use strict';

    const BLOG_DIR = 'me';
    const INDEX_URL = BLOG_DIR + '/index.json';

    let posts = [];
    let currentPost = null;

    const listEl = document.getElementById('blog-list');
    const postEl = document.getElementById('blog-post');
    const loadingEl = document.getElementById('blog-loading');
    const errorEl = document.getElementById('blog-error');
    const backBtn = document.getElementById('blog-back');
    const postTitle = document.getElementById('blog-post-title');
    const postDate = document.getElementById('blog-post-date');
    const postReadingTime = document.getElementById('blog-post-reading-time');
    const postContent = document.getElementById('blog-post-content');

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) { return dateStr; }
    }

    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return dateStr; }
    }

    function renderList() {
        if (posts.length === 0) {
            listEl.innerHTML = '<div class="empty-state"><p>No posts yet. Check back soon.</p></div>';
            return;
        }
        listEl.innerHTML = posts.map(function(post, index) {
            return '<div class="blog-list-item" data-index="' + index + '" role="button" tabindex="0" aria-label="Read ' + post.title + '">' +
                '<div class="blog-list-date">' + formatDateShort(post.date) + '</div>' +
                '<h3 class="blog-list-title">' + post.title + '</h3>' +
                (post.excerpt ? '<p class="blog-list-excerpt">' + post.excerpt + '</p>' : '') +
                (post.readingTime ? '<div class="blog-list-reading-time">' + post.readingTime + '</div>' : '') +
                '</div>';
        }).join('');

        listEl.querySelectorAll('.blog-list-item').forEach(function(item) {
            item.addEventListener('click', function() { openPost(parseInt(item.dataset.index, 10)); });
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPost(parseInt(item.dataset.index, 10)); }
            });
        });
    }

    async function openPost(index) {
        var post = posts[index];
        if (!post) return;
        currentPost = post;
        window.location.hash = 'blog/' + post.slug;
        try {
            var response = await fetch(BLOG_DIR + '/' + post.file);
            if (!response.ok) throw new Error('Could not load post');
            var md = await response.text();
            var parsed = MarkdownParser.extractFrontMatter(md);
            postTitle.textContent = parsed.meta.title || post.title;
            postDate.textContent = formatDate(parsed.meta.date || post.date);
            postReadingTime.textContent = MarkdownParser.readingTime(parsed.content);
            postContent.innerHTML = MarkdownParser.parse(parsed.content);
            listEl.hidden = true;
            postEl.hidden = false;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            postContent.innerHTML = '<p class="error-message">Failed to load this post. ' + err.message + '</p>';
            listEl.hidden = true;
            postEl.hidden = false;
        }
    }

    function closePost() {
        currentPost = null;
        postEl.hidden = true;
        listEl.hidden = false;
    }

    function handleHash() {
        var hash = window.location.hash.slice(1);
        if (hash.startsWith('blog/')) {
            var slug = hash.replace('blog/', '');
            var index = posts.findIndex(function(p) { return p.slug === slug; });
            if (index !== -1) { openPost(index); return true; }
        }
        return false;
    }

    async function load() {
        loadingEl.hidden = false;
        errorEl.hidden = true;
        listEl.innerHTML = '';
        try {
            var response = await fetch(INDEX_URL);
            if (!response.ok) throw new Error('Could not load blog index');
            var index = await response.json();
            posts = index.posts || [];
            posts.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

            await Promise.allSettled(posts.map(async function(post) {
                try {
                    var res = await fetch(BLOG_DIR + '/' + post.file);
                    if (res.ok) {
                        var md = await res.text();
                        var parsed = MarkdownParser.extractFrontMatter(md);
                        post.title = parsed.meta.title || post.title;
                        post.date = parsed.meta.date || post.date;
                        post.excerpt = post.excerpt || MarkdownParser.excerpt(md);
                        post.readingTime = MarkdownParser.readingTime(parsed.content);
                        post.slug = post.slug || post.file.replace('.md', '');
                    }
                } catch (e) {}
                return post;
            }));

            renderList();
        } catch (err) {
            errorEl.hidden = false;
            errorEl.querySelector('.error-message').textContent = 'Could not load blog posts. Make sure me/index.json exists.';
        } finally {
            loadingEl.hidden = true;
        }
    }

    function init() {
        backBtn.addEventListener('click', closePost);
        load().then(function() { handleHash(); });
    }

    return { init: init, handleHash: handleHash, closePost: closePost };
})();
