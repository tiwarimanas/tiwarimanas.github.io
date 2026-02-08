
Act as a Senior Front-End Developer. I need you to set up a lightweight, Jekyll-based portfolio site in this repository.

The goal is to create a landing page that:
1. Lists my GitHub repositories dynamically using JavaScript.
2. Serves a personal blog where posts are generated from Markdown files located in a specific folder named "/me".

Please execute the following file creation and directory setup tasks exactly as described.

### Step 1: Clean and Prepare
If they exist, delete any existing index.html or theme files to ensure a clean slate. Create the following directory structure if it does not exist:
- _layouts
- _includes
- assets/css
- assets/js
- me

### Step 2: Create Configuration File
Create a file named `_config.yml` in the root directory with the following content. This configuration defines the "/me" folder as a Jekyll collection.

```yaml
title: Manas Tiwari
description: Developer & Writer
url: "https://tiwarimanas.github.io"
theme: null

# Define the custom collection for the blog
collections:
  me:
    output: true
    permalink: /blog/:path/

markdown: kramdown
plugins:
  - jekyll-feed
```

### Step 3: Create the Layout
Create a file named `_layouts/default.html`. This is the master template.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ page.title }} | {{ site.title }}</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <header>
        <div class="container">
            <h1><a href="/">{{ site.title }}</a></h1>
            <nav>
                <a href="/#about">About</a>
                <a href="/#blog">Blog</a>
                <a href="/#projects">Projects</a>
            </nav>
        </div>
    </header>

    <main class="container">
        {{ content }}
    </main>

    <footer>
        <div class="container">
            <p>&copy; {{ site.time | date: '%Y' }} Manas Tiwari.</p>
        </div>
    </footer>

    <script src="/assets/js/main.js"></script>
</body>
</html>
```

### Step 4: Create Styles
Create a file named `assets/css/style.css`. Use a minimal dark theme.

```css
:root {
    --bg-color: #0d1117;
    --card-bg: #161b22;
    --text-main: #c9d1d9;
    --text-muted: #8b949e;
    --accent: #58a6ff;
    --border: #30363d;
}
body {
    font-family: system-ui, -apple-system, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-main);
    margin: 0;
    line-height: 1.6;
}
a { color: var(--accent); text-decoration: none; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; }
header { padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 40px; }
header .container { display: flex; justify-content: space-between; align-items: center; }
nav a { margin-left: 15px; color: var(--text-main); }
h2 { border-bottom: 1px solid var(--border); padding-bottom: 10px; margin-bottom: 20px; }
/* Blog List */
.blog-list { list-style: none; padding: 0; }
.blog-item { margin-bottom: 15px; display: block; }
.blog-date { font-size: 0.85rem; color: var(--text-muted); margin-right: 10px; }
.blog-title { font-weight: 600; font-size: 1.1rem; }
/* Repo Grid */
#repo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; }
.repo-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    padding: 15px;
    border-radius: 6px;
}
.repo-name { font-weight: bold; display: block; margin-bottom: 5px; }
.repo-desc { font-size: 0.9rem; color: var(--text-muted); display: block; margin-bottom: 10px; }
/* Post Content */
.post-content pre { background: var(--card-bg); padding: 15px; overflow-x: auto; }
```

### Step 5: Create Repository Fetcher Script
Create a file named `assets/js/main.js`. This script fetches public repositories for user 'tiwarimanas'.

```javascript
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
```

### Step 6: Create the Homepage
Create `index.html` in the root directory. This page aggregates the blog collection and the repo grid.

```html
---
layout: default
title: Home
---

<section id="about">
    <h2>Hello, I'm Manas.</h2>
    <p>Welcome to my personal page. I write code and share my thoughts here.</p>
</section>

<section id="blog">
    <h2>From /me</h2>
    <ul class="blog-list">
        {% for post in site.me %}
        <li class="blog-item">
            <span class="blog-date">{{ post.date | date: "%Y-%m-%d" }}</span>
            <a href="{{ post.url }}" class="blog-title">{{ post.title }}</a>
        </li>
        {% endfor %}
    </ul>
    {% if site.me.size == 0 %}
    <p>No posts found. Add markdown files to the /me folder.</p>
    {% endif %}
</section>

<section id="projects">
    <h2>Projects</h2>
    <div id="repo-grid">Loading repositories...</div>
</section>
```

### Step 7: Create a Sample Blog Post
Create a file named `me/welcome.md` to ensure the collection works immediately.

```markdown
---
layout: default
title: "Welcome to my Digital Garden"
date: 2023-10-27
---

<div class="post-content">

# Hello World

This is a sample post located in the `/me` directory. The main page automatically picks this up.

## Code Example

```javascript
console.log("It works!");
```

</div>
```

### Final Instructions
Once these files are created, please commit them to the repository.
```