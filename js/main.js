(function () {
  var header = document.getElementById('site-header');
  var onScroll = function () {
    if (window.scrollY > 8) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');
  navToggle.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.querySelector('.material-symbols-rounded').textContent = isOpen ? 'close' : 'menu';
  });
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.querySelector('.material-symbols-rounded').textContent = 'menu';
    });
  });
})();

(function () {
  var order = ['player', 'home', 'lyrics', 'search', 'settings', 'stats'];
  var tabs = document.querySelectorAll('.showcase-tab');
  var descs = document.querySelectorAll('.showcase-desc p');
  var imgs = document.querySelectorAll('.showcase-img');
  var current = 0;

  function activate(index) {
    current = (index + order.length) % order.length;
    var target = order[current];

    tabs.forEach(function (tab) {
      var isMatch = tab.getAttribute('data-target') === target;
      tab.classList.toggle('is-active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });

    descs.forEach(function (desc) {
      var isMatch = desc.getAttribute('data-desc') === target;
      desc.hidden = !isMatch;
      desc.classList.toggle('is-active', isMatch);
    });

    imgs.forEach(function (img) {
      var isMatch = img.getAttribute('data-screen') === target;
      img.hidden = !isMatch;
      img.classList.toggle('is-active', isMatch);
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      activate(index);
    });
  });

  var prevBtn = document.getElementById('showcasePrev');
  var nextBtn = document.getElementById('showcaseNext');
  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', function () {
      activate(current - 1);
    });
    nextBtn.addEventListener('click', function () {
      activate(current + 1);
    });
  }
})();

(function () {
  var placeholders = document.querySelectorAll('[data-download-placeholder]');
  placeholders.forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
    });
  });
})();

(function () {
  var WEB3FORMS_ACCESS_KEY = 'a7ad6f6e-c0dd-43a2-bacb-db0e33f5aa04';

  var overlay = document.getElementById('supportOverlay');
  var openTriggers = document.querySelectorAll('.js-open-support');
  var closeBtn = document.getElementById('supportClose');
  var form = document.getElementById('supportForm');
  var kindInput = document.getElementById('supportKind');
  var kindButtons = document.querySelectorAll('.support-kind-btn');
  var submitBtn = document.getElementById('supportSubmit');
  var statusEl = document.getElementById('supportStatus');
  var titleEl = document.getElementById('supportTitle');

  if (!overlay || !form) return;

  var KIND_TITLES = {
    'Comentario': 'Enviar comentario',
    'Solicitud de cambios o peticiones': 'Enviar petición',
    'Reporte de errores': 'Enviar reporte'
  };

  function updateTitle(kind) {
    if (titleEl) titleEl.textContent = KIND_TITLES[kind] || 'Enviar mensaje';
  }

  function openModal(event) {
    if (event) event.preventDefault();
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }

  openTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', openModal);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeModal();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !overlay.hidden) closeModal();
  });

  kindButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      kindButtons.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-checked', 'true');
      kindInput.value = btn.getAttribute('data-kind');
      updateTitle(kindInput.value);
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (WEB3FORMS_ACCESS_KEY === 'PON_AQUI_TU_ACCESS_KEY') {
      statusEl.textContent = 'Falta configurar la clave de envío del formulario.';
      statusEl.className = 'support-status is-error';
      return;
    }

    var formData = new FormData(form);
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', 'FrikiMusic — ' + formData.get('kind'));
    formData.append('from_name', 'FrikiMusic Web');

    submitBtn.disabled = true;
    statusEl.textContent = 'Enviando…';
    statusEl.className = 'support-status';

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        submitBtn.disabled = false;
        if (data.success) {
          statusEl.textContent = '¡Enviado! Gracias por escribir.';
          statusEl.className = 'support-status is-success';
          form.reset();
          kindButtons.forEach(function (b, i) {
            b.classList.toggle('is-active', i === 0);
            b.setAttribute('aria-checked', String(i === 0));
          });
          kindInput.value = 'Comentario';
          updateTitle(kindInput.value);
          setTimeout(closeModal, 1600);
        } else {
          statusEl.textContent = 'No se pudo enviar. Inténtalo de nuevo.';
          statusEl.className = 'support-status is-error';
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        statusEl.textContent = 'No se pudo enviar. Revisa tu conexión.';
        statusEl.className = 'support-status is-error';
      });
  });
})();

(function () {
  var API_URL = '/api/downloads';
  var REPO = 'jv8784815-ctrl/repositpory-for-apk-3wfqewfd32134';

  var versionEl = document.getElementById('dlVersion');
  var heroVersionEl = document.getElementById('heroVersion');
  var sizeEl = document.getElementById('dlSize');
  var dateEl = document.getElementById('dlDate');
  var totalEl = document.getElementById('dlTotal');
  var buttonEl = document.getElementById('dlButton');

  function isApk(asset) {
    return /\.apk$/i.test(asset.name || '');
  }

  function formatSize(bytes) {
    if (!bytes && bytes !== 0) return '—';
    var mb = bytes / (1024 * 1024);
    return (mb >= 100 ? mb.toFixed(0) : mb.toFixed(1)) + ' MB';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return '—';
    }
  }

  function formatCount(n) {
    try {
      return n.toLocaleString('es-ES');
    } catch (e) {
      return String(n);
    }
  }

  function formatVersionTag(v) {
    if (!v) return null;
    return /^v/i.test(v) ? v : 'v' + v;
  }

  function applyDirectDownload(url) {
    if (!buttonEl || !url) return;
    buttonEl.href = url;
    buttonEl.removeAttribute('target');
    buttonEl.removeAttribute('rel');
  }

  function renderInfo(data) {
    if (versionEl) versionEl.textContent = data.version || 'Sin versión publicada';
    if (heroVersionEl) heroVersionEl.textContent = formatVersionTag(data.version) || 'v1.0.0';
    if (sizeEl) sizeEl.textContent = formatSize(data.size);
    if (dateEl) dateEl.textContent = formatDate(data.publishedAt);
    if (totalEl) totalEl.textContent = formatCount(data.totalDownloads || 0);
    applyDirectDownload(data.downloadUrl);
  }

  function fetchAllReleasesFromGithub() {
    var headers = { Accept: 'application/vnd.github+json' };
    var releases = [];

    function fetchPage(page) {
      return fetch(
        'https://api.github.com/repos/' + REPO + '/releases?per_page=100&page=' + page,
        { headers: headers }
      ).then(function (res) {
        if (!res.ok) throw new Error('GitHub API ' + res.status);
        return res.json();
      }).then(function (batch) {
        releases = releases.concat(batch);
        if (batch.length === 100) return fetchPage(page + 1);
        return releases;
      });
    }

    return fetchPage(1);
  }

  function fetchFallback() {
    fetchAllReleasesFromGithub()
      .then(function (releases) {
        var totalDownloads = 0;
        var latestRelease = null;
        var latestAsset = null;

        releases.forEach(function (release) {
          (release.assets || []).forEach(function (asset) {
            if (isApk(asset)) {
              totalDownloads += asset.download_count || 0;
              if (!latestRelease) {
                latestRelease = release;
                latestAsset = asset;
              }
            }
          });
        });

        renderInfo({
          version: latestRelease ? (latestRelease.tag_name || latestRelease.name || null) : null,
          size: latestAsset ? latestAsset.size : null,
          publishedAt: latestRelease ? (latestRelease.published_at || latestRelease.created_at || null) : null,
          downloadUrl: latestAsset ? latestAsset.browser_download_url : null,
          totalDownloads: totalDownloads
        });
      })
      .catch(function () {
        if (versionEl) versionEl.textContent = 'No disponible';
        if (heroVersionEl) heroVersionEl.textContent = 'v1.0.0';
        if (sizeEl) sizeEl.textContent = '—';
        if (dateEl) dateEl.textContent = '—';
        if (totalEl) totalEl.textContent = '—';
      });
  }

  fetch(API_URL)
    .then(function (res) {
      if (!res.ok) throw new Error('API ' + res.status);
      return res.json();
    })
    .then(renderInfo)
    .catch(fetchFallback);
})();
