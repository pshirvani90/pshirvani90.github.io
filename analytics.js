(() => {
  'use strict';
  const id = 'G-8Z3G9QW3B1';
  const query = new URLSearchParams(location.search);
  const embedded = query.get('preview') === '1' && window.self !== window.top;
  if (embedded) {
    document.documentElement.classList.add('preview-embedded');
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') parent.postMessage({type:'portfolio-preview-close'}, location.origin);
    });
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const url = new URL(link.href, location.href);
      if (url.origin === location.origin && url.pathname !== location.pathname) {
        event.preventDefault();
        parent.postMessage({type:'portfolio-preview-navigate', path:url.pathname + url.hash}, location.origin);
      }
    });
    return;
  }
  const store = {
    get() { try { return localStorage.getItem('portfolio_analytics_optout') === '1'; } catch { return false; } },
    set(value) { try { localStorage.setItem('portfolio_analytics_optout', value ? '1' : '0'); } catch {} }
  };
  if (query.get('analytics') === 'off') store.set(true);
  if (query.get('analytics') === 'on') store.set(false);
  const disabled = store.get() || ['localhost','127.0.0.1',''].includes(location.hostname);
  window['ga-disable-' + id] = disabled;
  const debug = query.get('analytics_debug') === '1';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
  const caseNames = {
    'persil.html':'Persil', 'pril.html':'Pril', 'samsung.html':'Samsung',
    'trade-collective.html':'B2B Marketing', 'taiste.html':'T(AI)STE Studio',
    'campaigns.html':'More Campaign Work', 'strategy.html':'Strategy Projects',
    'analytics.html':'Marketing Analytics', 'academic.html':'Academic Case Studies',
    'campaigniq.html':'CampaignIQ'
  };
  const file = location.pathname.split('/').pop() || 'index.html';
  const cleanLocation = new URL(location.origin + location.pathname);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(key => {
    const value = query.get(key);
    if (value) cleanLocation.searchParams.set(key, value);
  });
  if (!disabled) {
    gtag('js', new Date());
    gtag('config', id, {page_location:cleanLocation.href, ...(debug ? {debug_mode:true} : {})});
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.append(script);
  }
  const track = (name, parameters = {}) => {
    if (disabled) return;
    gtag('event', name, {page_path:location.pathname, ...parameters, ...(debug ? {debug_mode:true} : {})});
  };
  window.portfolioTrack = track;
  const ready = () => {
    if (query.has('analytics')) {
      const notice = document.createElement('aside');
      notice.className = 'analytics-owner-notice';
      notice.setAttribute('role','status');
      notice.append(document.createTextNode(disabled ? 'Your visits in this browser are excluded from portfolio analytics. ' : 'Portfolio analytics is enabled in this browser. '));
      const change = document.createElement('a');
      change.textContent = disabled ? 'Enable analytics' : 'Exclude my visits';
      change.href = location.pathname + '?analytics=' + (disabled ? 'on' : 'off');
      notice.append(change);
      document.body.append(notice);
    }
    if (disabled) return;
    if (caseNames[file]) track('case_view', {case_name:caseNames[file]});
    const recent = new Map();
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;
      const url = new URL(link.href, location.href);
      const placement = link.closest('.site-nav') ? 'navigation' : link.closest('footer') ? 'footer' : 'content';
      let name;
      if (link.matches('.home-banner a.home-iq-button') && url.origin === location.origin && url.pathname === location.pathname && url.hash === '#professional-work') name = 'explore_work_click';
      else if (url.protocol === 'mailto:') name = 'contact_email';
      else if (url.protocol === 'tel:') name = 'contact_phone';
      else if (/(^|\.)linkedin\.com$/.test(url.hostname)) name = 'linkedin_click';
      else if (url.origin === location.origin && url.pathname.startsWith('/campaign-analyzer')) name = 'campaigniq_click';
      else if (url.origin === location.origin && /\.(pdf|docx?)$/i.test(url.pathname) && /resume|cv/i.test(url.pathname)) name = 'resume_download';
      if (!name) return;
      if (Date.now() - (recent.get(name) || 0) < 1000) return;
      recent.set(name, Date.now());
      track(name, {link_placement:placement});
    });
    document.addEventListener('portfolio:preview', event => {
      const label = event.detail.caseName.replace(/^HENKEL\s*\|\s*/i, '');
      const caseName = caseNames[event.detail.casePath] || Object.values(caseNames).find(name => name.toLowerCase() === label.toLowerCase()) || label;
      track('case_preview', {case_name:caseName});
    });
    const sections = {
      about:'About', 'professional-work':'Professional Experience', projects:'Independent Projects',
      capabilities:'Capabilities', 'brand-planning':'Pril Strategy', 'annual-social-strategy':'Pril Annual Social Strategy',
      'loyalty-program':'Pril Loyalty Program', 'henkel-ecommerce':'Henkel E-commerce Strategy',
      'partner-invitation':'Partner Invitation'
    };
    if ('IntersectionObserver' in window) {
      const timers = new Map();
      const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        const target = entry.target;
        if (entry.isIntersecting && document.visibilityState === 'visible') {
          if (timers.has(target)) return;
          timers.set(target, setTimeout(() => {
            if (document.visibilityState === 'visible') {
              track('section_view', {section_name:target.dataset.analyticsSection});
              sectionObserver.unobserve(target);
            }
            timers.delete(target);
          }, 1500));
        } else {
          clearTimeout(timers.get(target));
          timers.delete(target);
        }
      }), {threshold:0.5});
      Object.entries(sections).forEach(([sectionId, label]) => {
        const section = document.getElementById(sectionId);
        if (!section) return;
        const target = section.querySelector('h2,h3,p') || section;
        target.dataset.analyticsSection = label;
        sectionObserver.observe(target);
      });
    }
    const depths = new Set();
    let scheduled = false;
    const measureDepth = () => {
      scheduled = false;
      if (document.visibilityState !== 'visible') return;
      const available = document.documentElement.scrollHeight - innerHeight;
      if (available <= 0) return;
      const depth = Math.min(100, Math.round(scrollY / available * 100));
      [25,50,75].forEach(percent => {
        if (depth >= percent && !depths.has(percent)) {
          depths.add(percent); track('portfolio_scroll', {percent_scrolled:percent});
        }
      });
    };
    addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; requestAnimationFrame(measureDepth); }
    }, {passive:true});
    document.querySelectorAll('video').forEach((video,index) => {
      let interacted = false, started = false;
      const progress = new Set();
      const title = video.getAttribute('aria-label') || `${caseNames[file] || 'Portfolio'} video ${index + 1}`;
      const start = () => {
        if (started || !interacted || document.visibilityState !== 'visible') return;
        started = true;
        track('portfolio_video_start', {video_title:title});
      };
      const interact = () => {
        interacted = true;
        if (!video.paused) start();
      };
      video.addEventListener('pointerdown', interact);
      video.addEventListener('keydown', interact);
      video.addEventListener('play', start);
      video.addEventListener('timeupdate', () => {
        if (!started || video.seeking || video.paused || !isFinite(video.duration)) return;
        const percent = video.currentTime / video.duration * 100;
        [25,50,75].forEach(point => {
          if (percent >= point && !progress.has(point)) {
            progress.add(point); track('portfolio_video_progress', {video_title:title, video_percent:point});
          }
        });
      });
      video.addEventListener('ended', () => {
        if (started && !progress.has(100)) {
          progress.add(100); track('portfolio_video_complete', {video_title:title});
        }
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, {once:true});
  else ready();
})();
