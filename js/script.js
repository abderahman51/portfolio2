(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------------------------------------------
     Mobile nav
  --------------------------------------------- */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------
     Stats (count-up, language aware)
  --------------------------------------------- */
  var statEls = Array.prototype.slice.call(document.querySelectorAll('.hero-stats dt[data-count]'));

  function statText(el, value) {
    var isAr = root.lang === 'ar';
    var prefix = isAr ? (el.dataset.prefixAr || '') : (el.dataset.prefix || '');
    var suffix = (isAr && el.dataset.suffixAr !== undefined) ? el.dataset.suffixAr : (el.dataset.suffix || '');
    return prefix + value + suffix;
  }

  function finishStat(el) {
    el.dataset.done = '1';
    el.textContent = statText(el, parseInt(el.dataset.count, 10) || 0);
  }

  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var duration = 1000;
    var start = performance.now();
    function tick(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = statText(el, Math.round(eased * target));
      if (p < 1) { requestAnimationFrame(tick); } else { el.dataset.done = '1'; }
    }
    requestAnimationFrame(tick);
  }

  if (statEls.length) {
    if (prefersReducedMotion || !hasIO) {
      statEls.forEach(finishStat);
    } else {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      statEls.forEach(function (el) { statIo.observe(el); });
    }
  }

  /* ---------------------------------------------
     Language switch (English / Arabic)
  --------------------------------------------- */
  var AR = window.PORTFOLIO_AR || {};
  var i18nEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var EN = new Map();
  i18nEls.forEach(function (el) { EN.set(el, el.innerHTML); });

  var enTitle = document.title;
  var arTitle = 'عبدالرحمن صبري — محلل بيانات';
  var langBtn = document.getElementById('lang-toggle');
  var STORAGE_KEY = 'portfolio-lang';

  function setLang(lang) {
    var isAr = lang === 'ar';
    root.lang = isAr ? 'ar' : 'en';
    root.dir = isAr ? 'rtl' : 'ltr';

    i18nEls.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      el.innerHTML = (isAr && AR[key] !== undefined) ? AR[key] : EN.get(el);
    });

    document.title = isAr ? arTitle : enTitle;

    if (langBtn) {
      langBtn.textContent = isAr ? 'EN' : 'عربي';
      langBtn.setAttribute('aria-label', isAr ? 'Switch to English' : 'التبديل إلى العربية');
    }

    statEls.forEach(function (el) {
      if (el.dataset.done === '1') { finishStat(el); }
    });

    try { localStorage.setItem(STORAGE_KEY, isAr ? 'ar' : 'en'); } catch (e) { /* storage may be unavailable */ }
  }

  if (langBtn) {
    langBtn.addEventListener('click', function () {
      setLang(root.lang === 'ar' ? 'en' : 'ar');
    });
  }

  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  if (saved === 'ar') { setLang('ar'); }

  /* ---------------------------------------------
     Scroll reveal
  --------------------------------------------- */
  var sectionReveals = document.querySelectorAll('.reveal');
  var itemReveals = document.querySelectorAll('.project-card, .skill-group, .cert-list li, .contact-link');
  itemReveals.forEach(function (el) { el.classList.add('reveal-item'); });

  if (!prefersReducedMotion && hasIO) {
    var revealIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.classList.contains('reveal-item')) {
          var siblings = Array.prototype.slice.call(el.parentElement.children);
          el.style.setProperty('--d', (siblings.indexOf(el) % 3) * 90 + 'ms');
        }
        el.classList.add('is-visible');
        revealIo.unobserve(el);
      });
    }, { threshold: 0.12 });
    sectionReveals.forEach(function (el) { revealIo.observe(el); });
    itemReveals.forEach(function (el) { revealIo.observe(el); });
  } else {
    sectionReveals.forEach(function (el) { el.classList.add('is-visible'); });
    itemReveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------------------------------------------
     Cursor spotlight on cards
  --------------------------------------------- */
  document.querySelectorAll('.spot').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------------------------------------------
     Scroll progress bar + active nav link
  --------------------------------------------- */
  var bar = document.querySelector('.scroll-progress');
  function updateProgress() {
    if (!bar) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  if (hasIO) {
    var navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { navIo.observe(s); });
  }

  /* ---------------------------------------------
     Media modal (videos and full-size images)
  --------------------------------------------- */
  var modal = document.querySelector('.media-modal');
  var mVideo = modal ? modal.querySelector('video') : null;
  var mImg = modal ? modal.querySelector('.modal-image') : null;
  var mMissing = modal ? modal.querySelector('.media-missing') : null;
  var mClose = modal ? modal.querySelector('.media-close') : null;
  var lastFocus = null;

  function showModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (mClose) mClose.focus();
  }

  function openVideo(src) {
    if (!modal) return;
    mImg.hidden = true;
    mMissing.hidden = true;
    mVideo.hidden = false;
    mVideo.onerror = function () {
      mVideo.hidden = true;
      mMissing.hidden = false;
    };
    mVideo.src = src;
    showModal();
    var p = mVideo.play();
    if (p && p.catch) p.catch(function () { /* autoplay may be blocked; user can press play */ });
  }

  function openImage(src, alt) {
    if (!modal) return;
    mVideo.hidden = true;
    mMissing.hidden = true;
    mImg.hidden = false;
    mImg.src = src;
    mImg.alt = alt || '';
    showModal();
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    mVideo.onerror = null;
    mVideo.pause();
    mVideo.removeAttribute('src');
    mVideo.load();
    mImg.removeAttribute('src');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('.media-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var video = btn.getAttribute('data-video');
      var image = btn.getAttribute('data-image');
      if (video) {
        openVideo(video);
      } else if (image) {
        var card = btn.closest('.project-card');
        var alt = card ? (card.querySelector('h3') || {}).textContent : '';
        openImage(image, alt);
      }
    });
  });

  if (mClose) mClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
