var ReposModule = (function() {
    "use strict";
    var USERNAME = "tiwarimanas";
    var API = "https://api.github.com/users/" + USERNAME + "/repos?per_page=100&type=public";
    var repos = [];
    var grid, loadEl, errEl, emptyEl, searchIn, sortSel, statsEl;

    var LC = {
        "JavaScript":"#F1E05A","TypeScript":"#3178C6","Python":"#3572A5",
        "Java":"#B07219","Go":"#00ADD8","Rust":"#DEA584","C":"#555555",
        "C++":"#F34B7D","C#":"#178600","Ruby":"#701516","PHP":"#4F5D95",
        "Swift":"#F05138","Kotlin":"#A97BFF","Dart":"#00B4AB",
        "HTML":"#E34C26","CSS":"#563D7C","Shell":"#89E051",
        "Vue":"#41B883","Jupyter Notebook":"#DA5B0B"
    };

    function lc(l){return LC[l]||"#9A9590"}
    function el(id){return document.getElementById(id)}
    function show(e){if(e)e.hidden=false}
    function hide(e){if(e)e.hidden=true}
    function esc(s){var d=document.createElement("span");d.textContent=s||"";return d.innerHTML}

    function ago(d){
        var s=Math.floor((Date.now()-new Date(d).getTime())/1000);
        var iv=[{l:"year",s:31536000},{l:"month",s:2592000},{l:"week",s:604800},{l:"day",s:86400},{l:"hour",s:3600},{l:"minute",s:60}];
        for(var i=0;i<iv.length;i++){var c=Math.floor(s/iv[i].s);if(c>=1)return c+" "+iv[i].l+(c>1?"s":"")+" ago";}
        return "just now";
    }

    function renderStats(d){
        if(!statsEl)return;
        var st=0,fk=0,lg={};
        for(var i=0;i<d.length;i++){st+=d[i].stargazers_count||0;fk+=d[i].forks_count||0;if(d[i].language)lg[d[i].language]=1;}
        statsEl.innerHTML=
            '<div class="stat animate-fade-up delay-4"><div class="stat-val">'+d.length+'</div><div class="stat-label">Repos</div></div>'+
            '<div class="stat animate-fade-up delay-5"><div class="stat-val">'+st+'</div><div class="stat-label">Stars</div></div>'+
            '<div class="stat animate-fade-up delay-6"><div class="stat-val">'+fk+'</div><div class="stat-label">Forks</div></div>'+
            '<div class="stat animate-fade-up delay-7"><div class="stat-val">'+Object.keys(lg).length+'</div><div class="stat-label">Languages</div></div>';
    }

    function renderRepos(list){
        if(!grid)return;
        if(!list.length){grid.innerHTML="";show(emptyEl);return;}
        hide(emptyEl);
        var h=[];
        for(var i=0;i<list.length;i++){
            var r=list[i];
            var ld=r.language?'<span class="repo-meta-item"><span class="repo-lang-dot" style="background:'+lc(r.language)+'"></span>'+esc(r.language)+'</span>':"";
            var sh=r.stargazers_count>0?'<span class="repo-meta-item"><svg class="repo-star-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'+r.stargazers_count+'</span>':"";
            var fh=r.forks_count>0?'<span class="repo-meta-item"><svg class="repo-fork-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>'+r.forks_count+'</span>':"";
            var dd=r.description?'<p class="repo-desc">'+esc(r.description)+'</p>':'<p class="repo-desc" style="color:var(--text-3);font-style:italic">No description</p>';
            h.push('<div class="repo-card reveal"><div class="repo-header"><h3 class="repo-name"><a href="'+esc(r.html_url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.name)+'</a></h3><span class="repo-badge">'+(r.fork?"fork":"public")+'</span></div>'+dd+'<div class="repo-meta">'+ld+sh+fh+'<span class="repo-updated">'+ago(r.updated_at)+'</span></div></div>');
        }
        grid.innerHTML=h.join("");
        observeReveals();
    }

    function sortR(l,by){
        var s=l.slice();
        switch(by){
            case"stars":s.sort(function(a,b){return b.stargazers_count-a.stargazers_count});break;
            case"name":s.sort(function(a,b){return a.name.localeCompare(b.name)});break;
            case"created":s.sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at)});break;
            default:s.sort(function(a,b){return new Date(b.updated_at)-new Date(a.updated_at)});
        }
        return s;
    }

    function filterRender(){
        if(!searchIn||!sortSel)return;
        var q=searchIn.value.toLowerCase().trim();
        var f=repos.filter(function(r){
            return (r.name||"").toLowerCase().indexOf(q)!==-1||(r.description||"").toLowerCase().indexOf(q)!==-1||(r.language||"").toLowerCase().indexOf(q)!==-1;
        });
        renderRepos(sortR(f,sortSel.value));
    }

    function load(){
        grid=el("repos-grid");loadEl=el("repos-loading");errEl=el("repos-error");
        emptyEl=el("repos-empty");statsEl=el("hero-stats");
        show(loadEl);hide(errEl);hide(emptyEl);
        if(grid)grid.innerHTML="";

        fetch(API,{headers:{"Accept":"application/vnd.github.v3+json"}})
        .then(function(r){
            if(!r.ok)throw new Error(r.status===403?"Rate limit exceeded. Try again soon.":"HTTP "+r.status);
            return r.json();
        })
        .then(function(d){
            repos=Array.isArray(d)?d:[];
            renderStats(repos);filterRender();hide(loadEl);
        })
        .catch(function(e){
            hide(loadEl);show(errEl);
            var m=errEl?errEl.querySelector(".error-msg"):null;
            if(m)m.textContent=e.message||"Failed to load.";
        });
    }

    function init(){
        searchIn=el("repo-search");sortSel=el("repo-sort");
        if(searchIn)searchIn.addEventListener("input",filterRender);
        if(sortSel)sortSel.addEventListener("change",filterRender);
        load();
    }

    return {init:init,load:load};
})();
