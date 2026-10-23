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
