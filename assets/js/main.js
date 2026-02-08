document.addEventListener("DOMContentLoaded", function() {
    const username = 'tiwarimanas';
    const repoContainer = document.getElementById('repo-grid');

    if(repoContainer) {
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc`)
            .then(response => response.json())
            .then(data => {
                const repos = data.filter(repo => !repo.fork).slice(0, 6); 
                repos.forEach(repo => {
                    const card = document.createElement('div');
                    card.className = 'repo-card';
                    card.innerHTML = `
                        <a href="${repo.html_url}" target="_blank" class="repo-name">${repo.name}</a>
                        <span class="repo-desc">${repo.description || 'No description available.'}</span>
                        <div style="font-size:0.8rem; color: #8b949e;">⭐ ${repo.stargazers_count} | ${repo.language || 'Code'}</div>
                    `;
                    repoContainer.appendChild(card);
                });
            })
            .catch(error => console.error('Error fetching repos:', error));
    }
});
