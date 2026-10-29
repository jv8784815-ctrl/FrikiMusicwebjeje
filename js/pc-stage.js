(function () {
  var stage = document.getElementById('pcStage');
  if (!stage) return;

  var apps = Array.prototype.slice.call(stage.querySelectorAll('.pcs-app'));
  var strokes = Array.prototype.slice.call(stage.querySelectorAll('.pcs-stroke'));
  var glyph = document.getElementById('pcGlyph');
  var tile = document.getElementById('pcTile');
  var caption = document.getElementById('pcCaption');
  var nameEl = document.getElementById('pcName');
  var lockup = document.getElementById('pcLockup');
  // Si Windows/el navegador tiene «reducir movimiento» activado, antes la escena saltaba
  // directa al final y nunca se animaba. Ponlo en true para volver a respetar ese ajuste.
  var RESPECT_REDUCED_MOTION = false;
  var reduced = RESPECT_REDUCED_MOTION && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) document.documentElement.classList.add('pcs-reduced');

  var TEXT = {
    start: '¿Cuántas apps abres para escuchar música?',
    draw: 'Cuatro caminos… y\u00a0una\u00a0buena\u00a0alternativa.',
    merge: 'Todas tus fuentes, en\u00a0una\u00a0sola\u00a0aplicación.',
    done: 'FrikiMusic llega a tu PC.'
  };

  // Desplazamiento (en unidades del dibujo 256×256) de cada trazo respecto al símbolo final
  var OFF = [{ x: -34, y: -30 }, { x: 34, y: -30 }, { x: -34, y: 32 }, { x: 34, y: 32 }];

  var T = {
    pop0: 400,
    popGap: 380,
    popDur: 600,
    draw0: 2500,
    drawGap: 450,
    drawDur: 1500,
    merge: 5600,
    mergeDur: 1100,
    logo: 7000,
    lockup: 7900,
    end: 8400
  };

  var M = { W: 0, H: 0, S: 260, k: 1, app: 48 };
  var L = 0;
  var raf = 0, u = 0, last = 0, played = false;
  var st = {};

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function eob(t) { var c1 = 1.8, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function eio(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function freshState() { st = { name: -1, draw: false, merge: false, merged: false, logo: false, lockup: false }; }

  function measure() {
    var W = stage.clientWidth;
    var S = Math.min(W * 0.8, 300);
    var H = S + 70;
    stage.style.height = H + 'px';
    glyph.style.width = glyph.style.height = S + 'px';
    glyph.style.marginLeft = glyph.style.marginTop = (-S / 2) + 'px';
    var ts = S * 0.67;
    tile.style.width = tile.style.height = ts + 'px';
    var app = Math.max(36, Math.min(S * 0.17, 54));
    stage.style.setProperty('--app', app + 'px');
    M.W = W; M.H = H; M.S = S; M.k = S / 256; M.app = app;
    L = strokes[0].getTotalLength();
    render(u);
  }

  function setText(el, text) {
    if (el.textContent === text && !el._t) return;
    clearTimeout(el._t);
    el.classList.add('is-swap');
    el._t = setTimeout(function () {
      el.textContent = text;
      el.classList.remove('is-swap');
      el._t = 0;
    }, 220);
  }

  function setNow(el, text) {
    clearTimeout(el._t);
    el._t = 0;
    el.classList.remove('is-swap');
    el.textContent = text;
  }

  function paint() {
    strokes.forEach(function (path) {
      var c = path.getAttribute('data-c');
      path.style.stroke = c;
      path.style.filter = 'drop-shadow(0 0 6px ' + c + ') drop-shadow(0 0 16px ' + c + ')';
    });
    apps.forEach(function (el) {
      var c = el.getAttribute('data-c');
      el.style.filter = 'drop-shadow(0 0 8px ' + c + ') drop-shadow(0 0 18px ' + c + ')';
    });
  }

  function pulse(color, x, y, size) {
    var ring = document.createElement('span');
    ring.className = 'pcs-pulse';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.width = ring.style.height = size + 'px';
    ring.style.marginLeft = ring.style.marginTop = (-size / 2) + 'px';
    ring.style.borderColor = color;
    ring.style.boxShadow = '0 0 16px ' + color + ', inset 0 0 14px ' + color;
    stage.appendChild(ring);
    var a = ring.animate(
      [{ transform: 'scale(0.2)', opacity: 0.9 }, { transform: 'scale(1)', opacity: 0 }],
      { duration: 850, easing: 'cubic-bezier(.2,.7,.2,1)' }
    );
    a.onfinish = function () { ring.remove(); };
  }

  // Posición en pantalla (px, relativa al escenario) de un punto del trazo i
  function screenPos(i, frac, conv) {
    var pt = strokes[i].getPointAtLength(clamp(frac, 0, 1) * L);
    var ox = OFF[i].x * (1 - conv), oy = OFF[i].y * (1 - conv);
    return { x: M.W / 2 + (pt.x + ox - 128) * M.k, y: M.H / 2 + (pt.y + oy - 128) * M.k };
  }

  function render(t) {
    var conv = eio(clamp((t - T.merge) / T.mergeDur, 0, 1));

    strokes.forEach(function (path, i) {
      var d = eio(clamp((t - (T.draw0 + i * T.drawGap)) / T.drawDur, 0, 1));
      var ox = OFF[i].x * (1 - conv), oy = OFF[i].y * (1 - conv);
      path.setAttribute('transform', 'translate(' + ox.toFixed(2) + ' ' + oy.toFixed(2) + ')');
      path.style.strokeDashoffset = (1 - d).toFixed(4);
    });

    apps.forEach(function (el, i) {
      var p = clamp((t - (T.pop0 + i * T.popGap)) / T.popDur, 0, 1);
      if (p === 0) { el.style.opacity = 0; return; }
      var d = eio(clamp((t - (T.draw0 + i * T.drawGap)) / T.drawDur, 0, 1));
      var pos = screenPos(i, d, conv);
      var s = clamp(eob(p), 0, 1.15) * (1 - 0.8 * conv);
      var fade = conv > 0.6 ? clamp((1 - conv) / 0.4, 0, 1) : 1;
      var rot = (1 - p) * -50 + conv * 140;
      el.style.opacity = (clamp(p * 2.2, 0, 1) * fade).toFixed(3);
      el.style.transform = 'translate3d(' + pos.x.toFixed(1) + 'px,' + pos.y.toFixed(1) + 'px,0) scale(' + s.toFixed(3) + ') rotate(' + rot.toFixed(1) + 'deg)';
    });
  }

  function step(now) {
    var dt = clamp(now - last, 0, 50);
    last = now;
    u += dt;

    var launched = Math.floor((u - T.pop0) / T.popGap);
    for (var k = st.name + 1; k <= Math.min(launched, apps.length - 1); k++) {
      if (k >= 0) {
        st.name = k;
        setText(nameEl, apps[k].getAttribute('data-name'));
        var p0 = screenPos(k, 0, 0);
        pulse(apps[k].getAttribute('data-c'), p0.x, p0.y, M.app * 2.2);
      }
    }

    if (!st.draw && u >= T.draw0 - 200) {
      st.draw = true;
      setText(caption, TEXT.draw);
      setText(nameEl, '');
    }
    if (!st.merge && u >= T.merge) {
      st.merge = true;
      setText(caption, TEXT.merge);
    }
    if (!st.merged && u >= T.merge + T.mergeDur - 150) {
      st.merged = true;
      stage.classList.add('is-merged');
      pulse('#ffffff', M.W / 2, M.H / 2, M.S * 0.6);
    }
    if (!st.logo && u >= T.logo) {
      st.logo = true;
      stage.classList.add('is-logo');
      pulse('#8fb2ff', M.W / 2, M.H / 2, M.S * 0.95);
      setText(caption, TEXT.done);
    }
    if (!st.lockup && u >= T.lockup) {
      st.lockup = true;
      lockup.classList.add('is-on');
    }

    render(u);
    raf = u < T.end ? requestAnimationFrame(step) : 0;
  }

  function reset() {
    cancelAnimationFrame(raf);
    raf = 0;
    stage.classList.remove('is-merged', 'is-logo');
    lockup.classList.remove('is-on');
    setNow(caption, TEXT.start);
    setNow(nameEl, '');
    stage.querySelectorAll('.pcs-pulse').forEach(function (n) { n.remove(); });
    freshState();
    u = 0;
    render(0);
  }

  function play() {
    reset();
    void stage.offsetWidth;
    last = performance.now();
    raf = requestAnimationFrame(step);
  }

  function showFinal() {
    u = T.end + 1000;
    stage.classList.add('is-merged', 'is-logo');
    lockup.classList.add('is-on');
    setNow(caption, TEXT.done);
    setNow(nameEl, '');
    render(u);
  }

  freshState();
  paint();
  measure();

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { measure(); }).observe(stage);
  } else {
    window.addEventListener('resize', measure);
  }

  if (reduced) { showFinal(); return; }

  // --- Disparo de la animación ---------------------------------------------
  // Antes arrancaba en cuanto la escena asomaba, a veces ya al cargar (monitores
  // grandes o scroll restaurado tras refrescar) y se acababa sin que nadie la viera.
  // Ahora: espera a que la página esté cargada, exige que la escena se vea casi
  // entera y, si ya está a la vista al cargar, aguarda un instante antes de empezar.
  var ready = false;      // página cargada y fuentes listas
  var visible = false;    // escena ≥ 60 % visible
  var startTimer = 0;
  var loadedAt = 0;

  function tryStart() {
    clearTimeout(startTimer);
    if (!ready || !visible || played) return;
    var wait = Math.max(0, 900 - (performance.now() - loadedAt));
    startTimer = setTimeout(function () {
      if (visible && !played) { played = true; play(); }
    }, wait);
  }

  function rearm() {
    clearTimeout(startTimer);
    played = false;
    reset();
    tryStart();
  }

  function markReady() {
    if (ready) return;
    ready = true;
    loadedAt = performance.now();
    measure();
    tryStart();
  }

  if ('IntersectionObserver' in window) {
    // Una sola vigilancia sobre la escena:
    //  - ≥ 60 % visible  -> arranca (si la página ya cargó)
    //  - < 35 % visible  -> se reinicia, así al volver a bajar empieza de cero
    var thr = [];
    for (var q = 0; q <= 20; q++) thr.push(q / 20);
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var r = e.intersectionRatio;
        visible = r >= 0.6;
        if (visible) {
          tryStart();
        } else {
          clearTimeout(startTimer);
          if (r < 0.35 && (played || u > 0)) { played = false; reset(); }
        }
      });
    }, { threshold: thr }).observe(stage);
  } else {
    visible = true;
  }

  // Refrescar o volver con «atrás» (bfcache): siempre desde el principio
  window.addEventListener('pageshow', function (ev) {
    if (ev.persisted) { loadedAt = performance.now(); rearm(); }
  });

  var go = function () {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(markReady, markReady);
    } else {
      markReady();
    }
  };
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go);
})();
