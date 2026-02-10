(function(){
    "use strict";
    var isSpeaking=false;

    function showToast(msg){
        var t=document.getElementById("toast");
        if(!t)return;t.textContent=msg;t.classList.add("show");
        setTimeout(function(){t.classList.remove("show")},2500);
    }

    function getPlainText(html){
        var d=document.createElement("div");d.innerHTML=html;
        return d.textContent||d.innerText||"";
    }

    function toggleTTS(){
        var btn=document.getElementById("btn-tts");
        if(!("speechSynthesis" in window)){showToast("TTS not supported");return}
        if(isSpeaking){
            window.speechSynthesis.cancel();isSpeaking=false;
            if(btn){btn.classList.remove("listening");btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen'}
            return;
        }
        var content=document.getElementById("post-content");
        if(!content)return;
        var text=getPlainText(content.innerHTML);
        if(!text.trim()){showToast("No content");return}
        var u=new SpeechSynthesisUtterance(text);
        u.rate=0.95;u.pitch=1;
        u.onend=function(){
            isSpeaking=false;
            if(btn){btn.classList.remove("listening");btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>Listen'}
        };
        window.speechSynthesis.speak(u);isSpeaking=true;
        if(btn){btn.classList.add("listening");btn.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pause'}
    }

    function downloadPDF(){
        var title=document.getElementById("post-title");
        var content=document.getElementById("post-content");
        if(!content)return;showToast("Preparing PDF...");
        var w=window.open("","_blank");
        if(!w){showToast("Allow popups for PDF");return}
        w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+(title?title.textContent:"Post")+'</title><link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&display=swap" rel="stylesheet"><style>body{font-family:"Crimson Pro",Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#1A1A1A;font-size:17px;line-height:1.8}h1{font-size:28px;font-weight:500;margin-bottom:8px}.meta{font-size:13px;color:#888;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #eee}h2{font-size:22px;margin-top:32px}h3{font-size:18px;margin-top:24px}p{font-weight:300;margin:12px 0}strong{font-weight:600}blockquote{border-left:3px solid #8B5E3C;padding:8px 16px;margin:16px 0;color:#555;font-style:italic;background:#faf6f1;border-radius:0 8px 8px 0}code{font-family:monospace;font-size:0.85em;background:#f3f1ed;padding:2px 6px;border-radius:4px}pre{background:#1e1e1e;color:#d4d4d4;padding:16px;border-radius:10px;overflow-x:auto;font-size:14px;line-height:1.6}pre code{background:none;padding:0;color:inherit}ul,ol{padding-left:24px}li{margin:6px 0;font-weight:300}hr{border:none;height:1px;background:#eee;margin:32px 0}img{max-width:100%;border-radius:10px}@media print{body{margin:0;padding:20px}}</style></head><body><h1>'+(title?title.textContent:"")+'</h1><div class="meta">'+(document.getElementById("post-date")?document.getElementById("post-date").textContent:"")+"</div>"+content.innerHTML+"</body></html>");
        w.document.close();setTimeout(function(){w.print()},600);
    }

    function shareTwitter(){
        var t=document.getElementById("post-title");
        window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent((t?t.textContent:document.title))+"&url="+encodeURIComponent(window.location.href),"_blank","width=550,height=420");
    }
    function shareLinkedIn(){window.open("https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(window.location.href),"_blank","width=550,height=420")}

    function doCopy(msg){
        if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(window.location.href).then(function(){showToast(msg)}).catch(function(){fallback(msg)});
        }else{fallback(msg)}
    }
    function fallback(msg){
        var ta=document.createElement("textarea");ta.value=window.location.href;ta.style.cssText="position:fixed;opacity:0";
        document.body.appendChild(ta);ta.select();
        try{document.execCommand("copy");showToast(msg)}catch(e){showToast("Could not copy")}
        document.body.removeChild(ta);
    }

    function renderMath(){
        if(typeof renderMathInElement!=="undefined"){
            try{
                renderMathInElement(document.getElementById("post-content"),{
                    delimiters:[
                        {left:"$$",right:"$$",display:true},
                        {left:"$",right:"$",display:false},
                        {left:"\\(",right:"\\)",display:false},
                        {left:"\\[",right:"\\]",display:true}
                    ],
                    throwOnError:false
                });
            }catch(e){console.warn("KaTeX error:",e)}
        }else{
            setTimeout(function(){
                if(typeof renderMathInElement!=="undefined"){
                    try{renderMathInElement(document.getElementById("post-content"),{delimiters:[{left:"$$",right:"$$",display:true},{left:"$",right:"$",display:false},{left:"\\(",right:"\\)",display:false},{left:"\\[",right:"\\]",display:true}],throwOnError:false})}catch(e){}
                }
            },1000);
        }
    }

    function boot(){
        var header=document.querySelector(".site-header");
        if(header)window.addEventListener("scroll",function(){header.classList.toggle("scrolled",window.scrollY>10)},{passive:true});

        var b1=document.getElementById("btn-tts");
        var b2=document.getElementById("btn-pdf");
        var b3=document.getElementById("btn-twitter");
        var b4=document.getElementById("btn-linkedin");
        var b5=document.getElementById("btn-instagram");
        var b6=document.getElementById("btn-copy");

        if(b1)b1.addEventListener("click",toggleTTS);
        if(b2)b2.addEventListener("click",downloadPDF);
        if(b3)b3.addEventListener("click",shareTwitter);
        if(b4)b4.addEventListener("click",shareLinkedIn);
        if(b5)b5.addEventListener("click",function(){doCopy("Link copied! Paste in Instagram")});
        if(b6)b6.addEventListener("click",function(){doCopy("Link copied!")});

        window.addEventListener("beforeunload",function(){if(isSpeaking&&window.speechSynthesis)window.speechSynthesis.cancel()});

        // Render math after page loads
        if(document.readyState==="complete")renderMath();
        else window.addEventListener("load",renderMath);
    }

    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
    else boot();
})();
