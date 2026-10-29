(function () {
  var root = document.getElementById('versus');
  if (!root) return;

  var rows = Array.prototype.slice.call(root.querySelectorAll('.versus-row'));
  var board = root.querySelector('.versus-board');
  var panes = Array.prototype.slice.call(root.querySelectorAll('.demo-pane'));
  var steps = Array.prototype.slice.call(root.querySelectorAll('.versus-steps li'));
  var caption = document.getElementById('versusCaption');
  var win = document.getElementById('demoWin');
  var coCode = document.getElementById('coCode');
  var replay = document.getElementById('versusReplay');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ORDER = ['lyrics', 'downloads', 'color', 'sync'];
  var SCORE = { yes: 1, partial: 0.5, paid: 0, no: 0 };
  var ICON = { yes: 'check', partial: 'remove', paid: 'lock', no: 'close' };

  var CAPTION = {
    start: 'Cuatro apps de música. Cada una con su “pero”.',
    friki: 'La misma canción, ahora en FrikiMusic.',
    lyrics: 'Letras traducidas, línea a línea.',
    downloads: 'Descargas sin pagar Premium.',
    color: 'Toda la interfaz toma el color del álbum.',
    sync: 'Spotify y YouTube Music, juntos.',
    end: 'Todo incluido. Y gratis.'
  };

  // El “pero” de cada app (plan gratuito). Revisa estos textos de vez en cuando.
  var PERO = {
    spotify: ['paid', 'Descargas solo con Premium'],
    soundcloud: ['no', 'Sin letras sincronizadas'],
    ytmusic: ['paid', 'Descargas solo con Premium'],
    deezer: ['no', 'Letras sin traducción']
  };

  var DATA = {
    lyrics: {
      spotify: ['no', 'Letra sin traducción integrada'],
      soundcloud: ['no', 'Sin letras sincronizadas'],
      ytmusic: ['no', 'Letra sin traducción integrada'],
      deezer: ['partial', 'Letra sincronizada, sin traducción'],
      friki: ['yes', 'Traducida y sincronizada línea a línea']
    },
    downloads: {
      spotify: ['paid', 'Solo con Premium'],
      soundcloud: ['paid', 'Solo con un plan de pago'],
      ytmusic: ['paid', 'Solo con Premium'],
      deezer: ['paid', 'Solo con Premium'],
      friki: ['yes', 'Incluidas, sin suscripción']
    },
    color: {
      spotify: ['partial', 'Fondo según la portada'],
      soundcloud: ['no', 'Tema fijo'],
      ytmusic: ['partial', 'Fondo según la portada'],
      deezer: ['no', 'Tema fijo'],
      friki: ['yes', 'Toda la interfaz toma el color del álbum']
    },
    sync: {
      spotify: ['no', 'Solo su propio catálogo'],
      soundcloud: ['no', 'Solo su propio catálogo'],
      ytmusic: ['no', 'Solo su propio catálogo'],
      deezer: ['no', 'Solo su propio catálogo'],
      friki: ['yes', 'Conecta Spotify y YouTube Music']
    }
  };

  var PALETTES = [
    { a: '#d94f70', b: '#5b2a86' },
    { a: '#36c2c9', b: '#17407a' },
    { a: '#f0a23b', b: '#8a2a2a' },
    { a: '#7fd36b', b: '#1c4d3a' }
  ];

  var timers = [];
  var loops = [];
  var raf = 0;
  var started = false;

  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function fmt(n) { return n.toLocaleString('es', { minimumFractionDigits: n % 1 ? 1 : 0 }); }
  function rowOf(app) { return root.querySelector('.versus-row[data-app="' + app + '"]'); }

  function say(text) {
    if (caption.textContent === text) return;
    if (reduced) { caption.textContent = text; return; }
    caption.classList.add('is-swap');
    var t = setTimeout(function () {
      caption.textContent = text;
      caption.classList.remove('is-swap');
    }, 260);
    timers.push(t);
  }

  function paintRow(r, d, animate) {
    var apply = function () {
      r.querySelector('.vr-text').textContent = d[1];
      var st = r.querySelector('.vr-status');
      st.setAttribute('data-s', d[0]);
      st.firstChild.textContent = ICON[d[0]];
      r.classList.add('is-set');
    };
    if (!animate || reduced) { apply(); return; }
    r.classList.add('is-swap');
    timers.push(setTimeout(function () { apply(); r.classList.remove('is-swap'); }, 180));
  }

  function scoreUpTo(k) {
    var out = {};
    rows.forEach(function (r) {
      var app = r.getAttribute('data-app');
      var sum = 0;
      for (var i = 0; i <= k; i++) sum += SCORE[DATA[ORDER[i]][app][0]];
      out[app] = sum;
    });
    return out;
  }

  function paintMeters(k) {
    var s = k < 0 ? null : scoreUpTo(k);
    rows.forEach(function (r) {
      var app = r.getAttribute('data-app');
      var v = s ? s[app] : 0;
      r.querySelector('.vr-meter i').style.setProperty('--w', (v / ORDER.length * 100) + '%');
      r.querySelector('.vr-meter b').textContent = fmt(v) + ' / ' + ORDER.length;
    });
  }

  function clearLoops() {
    loops.forEach(function (id) { clearInterval(id); });
    loops = [];
    cancelAnimationFrame(raf);
  }

  function showPane(name) {
    panes.forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-pane') === name);
      if (p.getAttribute('data-pane') !== name) p.classList.remove('is-run');
    });
  }

  function countUp(pane) {
    var nums = pane.querySelectorAll('[data-count]');
    var total = document.getElementById('syTotal');
    var targets = Array.prototype.map.call(nums, function (n) { return +n.getAttribute('data-count'); });
    var sum = targets.reduce(function (a, b) { return a + b; }, 0);
    if (reduced) {
      Array.prototype.forEach.call(nums, function (n, i) { n.textContent = targets[i]; });
      total.textContent = sum;
      return;
    }
    var start = performance.now();
    (function tick(now) {
      var k = Math.min(Math.max((now - start - 300) / 1500, 0), 1);
      var e = 1 - Math.pow(1 - k, 3);
      Array.prototype.forEach.call(nums, function (n, i) { n.textContent = Math.round(targets[i] * e); });
      total.textContent = Math.round(sum * e);
      if (k < 1) raf = requestAnimationFrame(tick);
    })(start);
  }

  function runFeature(f) {
    clearLoops();
    showPane(f);
    var pane = root.querySelector('.demo-pane[data-pane="' + f + '"]');
    pane.classList.remove('is-run');

    if (f === 'lyrics') {
      var lines = pane.querySelectorAll('.ly-line');
      var i = 0;
      var show = function () {
        for (var k = 0; k < lines.length; k++) lines[k].classList.toggle('is-on', k === i);
        i = (i + 1) % lines.length;
      };
      show();
      if (!reduced) loops.push(setInterval(show, 780));
    }
    if (f === 'downloads' || f === 'sync') {
      void pane.offsetWidth;
      pane.classList.add('is-run');
    }
    if (f === 'sync') countUp(pane);
    if (f === 'color') {
      var p = 0;
      var tint = function () {
        var c = PALETTES[p];
        win.style.setProperty('--a', c.a);
        win.style.setProperty('--b', c.b);
        if (coCode) coCode.textContent = c.a.toUpperCase();
        p = (p + 1) % PALETTES.length;
      };
      tint();
      if (!reduced) loops.push(setInterval(tint, 780));
    } else {
      win.style.setProperty('--a', PALETTES[0].a);
      win.style.setProperty('--b', PALETTES[0].b);
    }
  }

  function setSteps(active, done) {
    steps.forEach(function (li, i) {
      li.classList.toggle('is-active', i === active);
      li.classList.toggle('is-done', i < done);
    });
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    clearLoops();
    caption.textContent = CAPTION.start;
    caption.classList.remove('is-swap');
    win.classList.add('is-idle');
    board.classList.remove('is-scoring');
    rows.forEach(function (r) {
      r.classList.remove('is-in', 'is-set', 'is-swap');
    });
    paintMeters(-1);
    setSteps(-1, 0);
    showPane('idle');
    win.style.setProperty('--a', PALETTES[0].a);
    win.style.setProperty('--b', PALETTES[0].b);
    replay.hidden = true;
  }

  // Estado final, sin movimiento
  function showFinal() {
    rows.forEach(function (r) {
      r.classList.add('is-in');
      var app = r.getAttribute('data-app');
      paintRow(r, DATA.lyrics[app], false);
    });
    board.classList.add('is-scoring');
    paintMeters(ORDER.length - 1);
    win.classList.remove('is-idle');
    setSteps(-1, ORDER.length);
    caption.textContent = CAPTION.end;
    runFeature('lyrics');
  }

  var STEP = 3300;

  function play() {
    reset();
    started = true;
    var t = 300;
    var apps = ['spotify', 'soundcloud', 'ytmusic', 'deezer'];

    // Escena 1: cada app aparece y enseña su “pero”
    apps.forEach(function (app, i) {
      var r = rowOf(app);
      at(t + i * 650, function () { r.classList.add('is-in'); });
      at(t + i * 650 + 450, function () { paintRow(r, PERO[app], true); });
    });

    // Escena 2: entra FrikiMusic
    var s2 = t + apps.length * 650 + 1200;
    at(s2, function () { say(CAPTION.friki); });
    at(s2 + 500, function () { rowOf('friki').classList.add('is-in'); });
    at(s2 + 900, function () { win.classList.remove('is-idle'); });

    // Escena 3: función por función, y el marcador sube
    var s3 = s2 + 2400;
    ORDER.forEach(function (f, k) {
      var t0 = s3 + k * STEP;
      at(t0, function () {
        say(CAPTION[f]);
        setSteps(k, k);
        board.classList.add('is-scoring');
        runFeature(f);
        rows.forEach(function (r, i) {
          var app = r.getAttribute('data-app');
          var delay = app === 'friki' ? 700 : i * 70;
          timers.push(setTimeout(function () { paintRow(r, DATA[f][app], true); }, delay));
        });
        timers.push(setTimeout(function () { paintMeters(k); }, 900));
      });
    });

    // Final
    var end = s3 + ORDER.length * STEP;
    at(end, function () {
      clearLoops();
      setSteps(-1, ORDER.length);
      say(CAPTION.end);
      replay.hidden = false;
    });
  }

  replay.addEventListener('click', play);

  reset();

  if (reduced || !('IntersectionObserver' in window)) {
    showFinal();
    return;
  }

  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting && e.intersectionRatio >= 0.4 && !started) {
        play();
      } else if (!e.isIntersecting && started) {
        started = false;
        reset();
      }
    });
  }, { threshold: [0, 0.4] }).observe(root);
})();
