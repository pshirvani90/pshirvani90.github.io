(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const targets = document.querySelectorAll('.introduction, .capabilities article, .work-card, .project-grid article, .education > div, .tool-grid article, .role-grid article, .metrics article, .learnings, .source-gallery > a, .stat-grid article, .academic-grid article, .insight-grid article, .pril-campaign-columns article, .samsung-campaign-grid article, .campaign-summary-panel');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('scroll-enter');
        void entry.target.offsetWidth;
        entry.target.classList.add('scroll-enter');
      } else entry.target.classList.remove('scroll-enter');
    });
  }, {threshold:0.12});
  targets.forEach(element => {
    const siblings = [...element.parentElement.children];
    element.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(element) % 3, 2) * 110}ms`);
    observer.observe(element);
  });
})();

// Preview professional case studies without leaving the project overview.
(() => {
 if (window.self !== window.top) return;
 const links = document.querySelectorAll('.work-card h3 a, .work-card a.view');
 if (!links.length || typeof HTMLDialogElement === 'undefined') return;
 const dialog = document.createElement('dialog');
 dialog.className = 'case-preview-dialog';
 dialog.setAttribute('aria-labelledby','case-preview-title');
 dialog.innerHTML = '<div class="case-preview-toolbar"><h2 id="case-preview-title"></h2><div><a class="case-preview-full">Open full case study <span aria-hidden="true">↗</span></a><button type="button" class="case-preview-close" aria-label="Close preview">×</button></div></div><div class="case-preview-viewport"><iframe title="Case study preview" allow="autoplay; fullscreen" loading="eager"></iframe></div>';
 document.body.append(dialog);
 const frame = dialog.querySelector('iframe');
 const viewport = dialog.querySelector('.case-preview-viewport');
 const title = dialog.querySelector('h2');
 const full = dialog.querySelector('.case-preview-full');
 const close = dialog.querySelector('button');
 let trigger;
 const resize = () => {
   const width = viewport.clientWidth;
   if (!width) return;
   const canvas = width < 650 ? width : 1200;
   const scale = width / canvas;
   frame.style.width = canvas + 'px';
   frame.style.height = Math.ceil(viewport.clientHeight / scale) + 'px';
   frame.style.transform = 'scale(' + scale + ')';
 };
 const stop = () => dialog.close();
 close.addEventListener('click',stop);
 dialog.addEventListener('click',event => { if(event.target === dialog) stop(); });
 dialog.addEventListener('close',() => {
   frame.src = 'about:blank';
   document.documentElement.classList.remove('case-preview-open');
   trigger?.focus();
 });
 window.addEventListener('message',event => {
   if(event.origin !== location.origin || event.source !== frame.contentWindow || !dialog.open) return;
   if(event.data?.type === 'portfolio-preview-close') stop();
   if(event.data?.type === 'portfolio-preview-navigate') {
     const url = new URL(event.data.path,location.href);
     if(url.origin === location.origin) location.assign(url.href);
   }
 });
 new ResizeObserver(resize).observe(viewport);
 links.forEach(link => {
   link.setAttribute('aria-haspopup','dialog');
   if(link.classList.contains('view')) link.textContent = 'Preview Case →';
   link.addEventListener('click',event => {
     if(event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
     const url = new URL(link.href,location.href);
     if(url.origin !== location.origin) return;
     event.preventDefault();
     trigger = link;
     const caseName = link.closest('.work-card').querySelector('h3').textContent.trim();
     title.textContent = caseName;
     full.href = url.href;
     url.searchParams.set('preview','1');
     frame.title = caseName + ' case study preview';
     frame.src = url.href;
     dialog.showModal();
     document.documentElement.classList.add('case-preview-open');
     resize();
     close.focus();
     document.dispatchEvent(new CustomEvent('portfolio:preview',{detail:{caseName}}));
   });
 });
})();

document.querySelectorAll('video[data-clip-start]').forEach(video => {
 const start = Number(video.dataset.clipStart), end = Number(video.dataset.clipEnd);
 const begin = () => { video.currentTime = start; video.play().catch(() => {}); };
 video.addEventListener('loadedmetadata', begin, {once:true});
 if (video.readyState >= 1) begin();
 video.addEventListener('timeupdate', () => {
   if (video.currentTime >= end || video.currentTime < start - .5) video.currentTime = start;
 });
 video.addEventListener('ended', () => { begin(); video.play().catch(() => {}); });
});

const photoHeaderVideo = document.querySelector('.trade-photo-hero video');
if (photoHeaderVideo) {
  // Uneven holds across the eleven 3-second source slides, averaging roughly 4x.
  const rates = [4.8, 3.2, 4.2, 5.0, 3.6, 4.6, 3.1, 5.2, 3.8, 4.7, 3.4];
  const pace = () => {
    const index = Math.min(10, Math.floor(photoHeaderVideo.currentTime / 3));
    photoHeaderVideo.playbackRate = rates[index];
  };
  photoHeaderVideo.defaultPlaybackRate = rates[0];
  photoHeaderVideo.addEventListener('loadedmetadata', pace);
  photoHeaderVideo.addEventListener('timeupdate', pace);
  pace();
}

// Preserve the native Instagram aspect while cropping engagement controls.
(() => {
  const crops = document.querySelectorAll('.taiste-instagram-crop');
  if (!crops.length) return;
  const observer = new ResizeObserver(entries => {
    for (const {target, contentRect} of entries) {
      const scale = contentRect.width / 326;
      target.style.height = `${404 * scale}px`;
      const frame = target.querySelector('iframe');
      if (frame) {
        const portrait = frame.dataset.portraitCorrection === 'true';
        frame.style.transform = portrait
          ? `scale(${scale}) translateX(45.64px) scaleX(0.72) translateY(-54px)`
          : `scale(${scale}) translateY(-54px)`;
        if (portrait) target.style.background = '#000';
      }
    }
  });
  crops.forEach(crop => observer.observe(crop));
})();

// Mobile navigation: keep the header compact and the expanded menu scrollable.
(() => {
 const toggle=document.querySelector('.nav-toggle');
 const menu=document.querySelector('#portfolio-menu');
 if(!toggle||!menu)return;
 const setOpen=open=>{
  toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Close menu':'Open menu');
  if(!open)menu.querySelectorAll('details[open]').forEach(detail=>detail.removeAttribute('open'));
 };
 toggle.addEventListener('click',()=>setOpen(toggle.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setOpen(false);toggle.focus();}});
 document.addEventListener('click',event=>{if(!event.target.closest('.site-nav'))setOpen(false);});
 menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);});
 matchMedia('(max-width:850px)').addEventListener('change',()=>setOpen(false));
})();
