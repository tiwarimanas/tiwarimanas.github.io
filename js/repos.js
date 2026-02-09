const ReposModule = (() => {
    'use strict';

    const USERNAME = 'tiwarimanas';
    const API_URL = 'https://api.github.com/users/' + USERNAME + '/repos?per_page=100&type=public';

    let repos = [];
    let filteredRepos = [];

    const grid = document.getElementById('repos-grid');
    const loadingEl = document.getElementById('repos-loading');
    const errorEl = document.getElementById('repos-error');
    const emptyEl = document.getElementById('repos-empty');
    const searchInput = document.getElementById('repo-search');
    const sortSelect = document.getElementById('repo-sort');
    const statsEl = document.getElementById('hero-stats');

    const langColors = {
        'JavaScript': '#F1E05A', 'TypeScript': '#3178C6', 'Python': '#3572A5',
        'Java': '#B07219', 'Go': '#00ADD8', 'Rust': '#DEA584', 'C': '#555555',
        'C++': '#F34B7D', 'C#': '#178600', 'Ruby': '#701516', 'PHP': '#4F5D95',
        'Swift': '#F05138', 'Kotlin': '#A97BFF', 'Dart': '#00B4AB',
        'HTML': '#E34C26', 'CSS': '#563D7C', 'SCSS': '#C6538C',
        'Shell': '#89E051', 'Vue': '#41B883', 'Svelte': '#FF3E00',
        'Lua': '#000080', 'R': '#198CE7', 'Jupyter Notebook': '#DA5B0B'
    };

    function getLangColor(lang) { return langColors[lang] || '#9A9590'; }

    function timeAgo(dateStr) {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 }, { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 }, { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 }, { label: 'minute', seconds: 60 }
        ];
        for (const interval of intervals) {
            const count = Math.floor(seconds / interval.seconds);
            if (count >= 1) return count + ' ' + interval.label + (count !== 1 ? 's' : '') + ' ago';
        }
        return 'just now';
    }

    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    function renderStats(repoData) {
        const totalStars = repoData.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
        const totalForks = repoData.reduce((sum, r) => sum + (r.forks_count || 0), 0);
        const languages = new Set(repoData.map(r => r.language).filter(Boolean));
        statsEl.innerHTML =
            '<div class="hero-stat"><div class="hero-stat-value">' + repoData.length + '</div><div class="hero-stat-label">Repositories</div></div>' +
            '<div class="hero-stat"><div class="hero-stat-value">' + totalStars + '</div><div class="hero-stat-label">Stars</div></div>' +
            '<div class="hero-stat"><div class="hero-stat-value">' + totalForks + '</div><div class="hero-stat-label">Forks</div></div>' +
            '<div class="hero-stat"><div class="hero-stat-value">' + languages.size + '</div><div class="hero-stat-label">Languages</div></div>';
    }

    function renderRepos(repoList) {
        if (repoList.length === 0) { grid.innerHTML = ''; emptyEl.hidden = false; return; }
        emptyEl.hidden = true;
        grid.innerHTML = repoList.map(function(repo) {
            var langDot = repo.language
                ? '<span class="repo-meta-item"><span class="repo-lang-dot" style="background:' + getLangColor(repo.language) + '"></span>' + repo.language + '</span>'
                : '';
            var stars = repo.stargazers_count > 0
                ? '<span class="repo-meta-item"><svg class="repo-star-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + repo.stargazers_count + '</span>'
                : '';
            var forks = repo.forks_count > 0
                ? '<span class="repo-meta-item"><svg class="repo-fork-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' + repo.forks_count + '</span>'
                : '';
            return '<div class="repo-card">' +
                '<div class="repo-card-header">' +
                '<h3 class="repo-name"><a href="' + repo.html_url + '" target="_blank" rel="noopener noreferrer">' + repo.name + '</a></h3>' +
                '<span class="repo-visibility">' + (repo.fork ? 'fork' : 'public') + '</span>' +
                '</div>' +
                (repo.description ? '<p class="repo-description">' + escapeHtml(repo.description) + '</p>' : '<p class="repo-description" style="color:var(--color-text-tertiary);font-style:italic;">No description</p>') +
                '<div class="repo-meta">' + langDot + stars + forks +
                '<span class="repo-updated">Updated ' + timeAgo(repo.updated_at) + '</span>' +
                '</div></div>';
        }).join('');
    }

    function sortRepos(repoList, sortBy) {
        var sorted = repoList.slice();
        switch (sortBy) {
            case 'stars': sorted.sort(function(a, b) { return b.stargazers_count - a.stargazers_count; }); break;
            case 'name': sorted.sort(function(a, b) { return a.name.localeCompare(b.name); }); break;
            case 'created': sorted.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); }); break;
            default: sorted.sort(function(a, b) { return new Date(b.updated_at) - new Date(a.updated_at); }); break;
        }
        return sorted;
    }

    function filterAndRender() {
        var query = searchInput.value.toLowerCase().trim();
        var sortBy = sortSelect.value;
        filteredRepos = repos.filter(function(r) {
            var name = (r.name || '').toLowerCase();
            var desc = (r.description || '').toLowerCase();
            var lang = (r.language || '').toLowerCase();
            return name.indexOf(query) !== -1 || desc.indexOf(query) !== -1 || lang.indexOf(query) !== -1;
        });
        filteredRepos = sortRepos(filteredRepos, sortBy);
        renderRepos(filteredRepos);
    }

    async function load() {
        loadingEl.hidden = false;
        errorEl.hidden = true;
        emptyEl.hidden = true;
        grid.innerHTML = '';
        try {
            var response = await fetch(API_URL, { headers: { 'Accept': 'application/vnd.github.v3+json' } });
            if (!response.ok) {
                throw new Error(response.status === 403 ? 'API rate limit exceeded. Please try again later.' : 'Failed to fetch repositories (' + response.status + ')');
            }
            repos = await response.json();
            renderStats(repos);
            filterAndRender();
        } catch (err) {
            errorEl.hidden = false;
            errorEl.querySelector('.error-message').textContent = err.message;
        } finally {
            loadingEl.hidden = true;
        }
    }

    function init() {
        searchInput.addEventListener('input', filterAndRender);
        sortSelect.addEventListener('change', filterAndRender);
        load();
    }

    return { init: init, load: load };
})();
