/* FrikiMusic · interacciones Material 3 (sin dependencias) */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- Ripple (M3): onda desde el punto de pulsación ---------- */
  var RIPPLE = '.btn, .m3-chip, .m3-seg-btn, .m3-iconbtn, .theme-toggle, .nav-toggle, .m3-fab';
  doc.addEventListener('pointerdown', function (e) {
    var t = e.target.closest && e.target.closest(RIPPLE);
    if (!t || t.disabled) return;
    var r = t.getBoundingClientRect();
    var d = Math.hypot(Math.max(e.clientX - r.left, r.right - e.clientX), Math.max(e.clientY - r.top, r.bottom - e.clientY)) * 2;
    var s = doc.createElement('span');
    s.className = 'm3-ripple';
    s.style.width = s.style.height = d + 'px';
    s.style.left = (e.clientX - r.left - d / 2) + 'px';
    s.style.top = (e.clientY - r.top - d / 2) + 'px';
    t.appendChild(s);
    setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650);
  }, { passive: true });

  /* ---------- Progreso de scroll + FAB extendido ---------- */
  var bar = doc.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<span></span>';
  doc.body.appendChild(bar);
  var barFill = bar.firstChild;
  var fab = $('#m3fab');
  var lastY = window.scrollY, ticking = false;

  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    barFill.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    if (fab) {
      var dl = $('#descargas');
      var nearDl = dl && dl.getBoundingClientRect().top < window.innerHeight * 0.55;
      var show = y > window.innerHeight * 0.6 && !nearDl;
      fab.classList.toggle('is-visible', show);
      fab.tabIndex = show ? 0 : -1;
      if (show) {
        if (y > lastY + 6) fab.classList.add('is-collapsed');      // bajando → se contrae
        else if (y < lastY - 6) fab.classList.remove('is-collapsed'); // subiendo → se extiende
      } else { fab.classList.remove('is-collapsed'); }
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Snackbar al cambiar el tema ---------- */
  var snack = $('#m3snack'), snackText = $('#m3snackText'), snackT = 0;
  function showSnack(msg) {
    if (!snack) return;
    snackText.textContent = msg;
    snack.classList.add('is-open');
    clearTimeout(snackT);
    snackT = setTimeout(function () { snack.classList.remove('is-open'); }, 2600);
  }
  var themeBtn = $('#themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    setTimeout(function () { showSnack(themeBtn.getAttribute('aria-label') || 'Tema cambiado'); }, 0);
  });

  /* ---------- Revelado al hacer scroll ---------- */
  var targets = $$('.section-head, .feature-card, .download-card, .community-panel, .help-card, .pcshots-hero, .m3-seg, .winlab-head, .m3-chips, .m3car-foot, .pcs-lockup');
  if ('IntersectionObserver' in window && targets.length) {
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el, i) {
      el.classList.add('m3-reveal');
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--i', String(Math.min(sib, 6)));
      io.observe(el);
    });
  }

  /* ---------- Carrusel (arrastrable, con inercia, snap y perspectiva) ---------- */
  function makeCarousel(o) {
    var car = $(o.car);
    if (!car) return;
    var items = $$('.m3car-item', car);
    var chips = o.chips ? $$(o.chips) : [];
    var copy = $(o.copy);
    var titleEl = $(o.title), descEl = $(o.desc), numEl = $(o.num), barEl = $(o.bar);
    var prev = $(o.prev), next = $(o.next);
    var cur = -1, raf = 0;

    function centerScroll(i) { var it = items[i]; return it.offsetLeft + it.offsetWidth / 2 - car.clientWidth / 2; }
    function goTo(i, instant) {
      i = clamp(i, 0, items.length - 1);
      car.scrollTo({ left: centerScroll(i), behavior: instant ? 'auto' : 'smooth' });
    }
    function setActive(i) {
      var dir = i > cur ? 24 : -24;
      cur = i;
      items.forEach(function (it, k) { it.classList.toggle('is-active', k === i); });
      var key = items[i].getAttribute('data-screen');
      chips.forEach(function (c) {
        var on = c.getAttribute('data-target') === key;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-selected', String(on));
      });
      if (copy) {
        copy.style.setProperty('--dir', dir + 'px');
        copy.classList.remove('is-swapping');
        void copy.offsetWidth;
        titleEl.textContent = items[i].getAttribute('data-title');
        descEl.textContent = items[i].getAttribute('data-desc');
        copy.classList.add('is-swapping');
      }
      if (numEl) numEl.textContent = (i + 1 < 10 ? '0' : '') + (i + 1);
      if (barEl) barEl.style.transform = 'translateX(' + (i * 100) + '%)';
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === items.length - 1;
    }
    function update() {
      raf = 0;
      var mid = car.scrollLeft + car.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, k) {
        var dd = it.offsetLeft + it.offsetWidth / 2 - mid, d = Math.abs(dd);
        var t = clamp(d / it.offsetWidth, 0, 1);
        it.style.setProperty('--t', t.toFixed(3));
        it.style.setProperty('--s', clamp(dd / it.offsetWidth, -1, 1).toFixed(3));
        it.style.zIndex = String(100 - Math.round(t * 50));
        if (d < bd) { bd = d; best = k; }
      });
      if (best !== cur) setActive(best);
    }
    function req() { if (!raf) raf = requestAnimationFrame(update); }
    car.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', function () { goTo(Math.max(cur, 0), true); req(); });

    var drag = null;
    car.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, left: car.scrollLeft, lx: e.clientX, lt: performance.now(), v: 0, moved: false };
      car.classList.add('is-dragging');
      try { car.setPointerCapture(e.pointerId); } catch (err) {}
    });
    car.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      car.scrollLeft = drag.left - dx;
      var now = performance.now(), dt = Math.max(1, now - drag.lt);
      drag.v = 0.8 * drag.v + 0.2 * ((e.clientX - drag.lx) / dt);
      drag.lx = e.clientX; drag.lt = now;
    });
    function endDrag() {
      if (!drag) return;
      var v = drag.v, moved = drag.moved;
      drag = null;
      car.classList.remove('is-dragging');
      if (!moved) return;
      var target = car.scrollLeft - v * 260, best = 0, bd = 1e9;
      items.forEach(function (_, k) { var d = Math.abs(centerScroll(k) - target); if (d < bd) { bd = d; best = k; } });
      goTo(best);
    }
    car.addEventListener('pointerup', endDrag);
    car.addEventListener('pointercancel', endDrag);

    items.forEach(function (it, k) { it.addEventListener('click', function () { if (k !== cur) goTo(k); }); });
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var key = c.getAttribute('data-target');
        items.forEach(function (it, k) { if (it.getAttribute('data-screen') === key) goTo(k); });
      });
    });
    if (prev) prev.addEventListener('click', function () { goTo(cur - 1); });
    if (next) next.addEventListener('click', function () { goTo(cur + 1); });
    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(cur - 1); }
      else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      else if (e.key === 'End') { e.preventDefault(); goTo(items.length - 1); }
    });

    goTo(0, true);
    update();
    window.addEventListener('load', function () { goTo(Math.max(cur, 0), true); update(); });
  }
  makeCarousel({ car: '#m3car', chips: '.m3-chip[data-target]', copy: '.m3car-copy:not(#winCopy)', title: '#m3carTitle', desc: '#m3carDesc', num: '#m3carNum', bar: '#m3carBar', prev: '#showcasePrev', next: '#showcaseNext' });
  makeCarousel({ car: '#winCar', copy: '#winCopy', title: '#winTitle', desc: '#winDesc', num: '#winNum', bar: '#winBar', prev: '#winPrev', next: '#winNext' });

  /* ---------- Botón segmentado: alterna las dos vistas de PC ---------- */
  (function () {
    var seg = $('#pcSeg'), hero = $('#pcHero');
    if (!seg || !hero) return;
    var btns = $$('.m3-seg-btn', seg), imgs = $$('img', hero);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var v = Number(b.getAttribute('data-view'));
        btns.forEach(function (o) {
          var on = o === b;
          o.classList.toggle('is-selected', on);
          o.setAttribute('aria-checked', String(on));
        });
        imgs.forEach(function (im, i) { im.classList.toggle('is-on', i === v); });
      });
    });
  })();
})();
