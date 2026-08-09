// ===== Carrusel de interfaz: pantalla completa / ventana compacta =====
const slides = [
  { id: 'full', title: 'Pantalla completa', desc: 'Portada grande, letra sincronizada al lado y controles abajo. Se activa con F11.' },
  { id: 'compact', title: 'Ventana compacta', desc: 'Angosta y flotante, para dejarla en un rincón del escritorio mientras hacés otra cosa.' },
];

const scenes = document.querySelectorAll('[data-view-panel]');
const thumbs = document.querySelectorAll('.car-thumb');
const prevBtn = document.querySelector('.car-prev');
const nextBtn = document.querySelector('.car-next');
const indexEl = document.querySelector('.car-index');
const captionTitle = document.querySelector('.car-caption strong');
const captionDesc = document.querySelector('.car-caption p');

let current = 0;

function renderSlide() {
  const slide = slides[current];
  scenes.forEach(scene => {
    scene.classList.toggle('is-active', scene.dataset.viewPanel === slide.id);
  });
  thumbs.forEach(t => t.classList.toggle('is-active', t.dataset.view === slide.id));
  if (indexEl) indexEl.innerHTML = `<strong>${String(current + 1).padStart(2, '0')}</strong> / ${slides.length}`;
  if (captionTitle) captionTitle.textContent = slide.title;
  if (captionDesc) captionDesc.textContent = slide.desc;
}

function goTo(index) {
  current = (index + slides.length) % slides.length;
  renderSlide();
}

if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
thumbs.forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = slides.findIndex(s => s.id === btn.dataset.view);
    if (idx !== -1) goTo(idx);
  });
});

renderSlide();

// ===== Fade-in sutil al entrar en viewport =====
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  const targets = document.querySelectorAll('.feature-card, .desktop-mock, .download-card, .hero-shot');
  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  targets.forEach(el => io.observe(el));
}

// ===== Descarga directa del instalador =====
// El nombre del .exe cambia en cada versión (FrikiMusic_Setup_1.4.0.3.exe, etc.),
// así que en vez de hardcodear un link que se rompe en la próxima actualización,
// se le pregunta a la API pública de GitHub cuál es el asset .exe del release
// más reciente y se descarga ese, en el momento del click.
const REPO_OWNER = 'jv8784815-ctrl';
const REPO_NAME = 'repositpory-for-apk-3wfqewfd32134';
const RELEASES_FALLBACK_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/latest`;

const downloadBtn = document.getElementById('downloadBtn');
const dlVersionEl = document.getElementById('dlVersion');

async function getLatestExeAsset() {
  const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`);
  if (!res.ok) throw new Error('No se pudo consultar GitHub');
  const release = await res.json();
  const exeAsset = (release.assets || []).find(a => a.name.toLowerCase().endsWith('.exe'));
  if (!exeAsset) throw new Error('El último release no tiene un .exe adjunto');
  return { url: exeAsset.browser_download_url, tag: release.tag_name };
}

// Mostrar la versión real apenas carga la página (mejor esfuerzo, sin bloquear nada)
if (dlVersionEl) {
  getLatestExeAsset()
    .then(({ tag }) => { dlVersionEl.textContent = tag ? `Versión ${tag.replace(/^v/i, '')}` : 'Última versión estable'; })
    .catch(() => { /* se queda el texto genérico */ });
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const original = downloadBtn.textContent;
    downloadBtn.textContent = 'Buscando el instalador…';
    downloadBtn.style.pointerEvents = 'none';

    getLatestExeAsset()
      .then(({ url }) => { window.location.href = url; })
      .catch(() => { window.location.href = RELEASES_FALLBACK_URL; })
      .finally(() => {
        setTimeout(() => {
          downloadBtn.textContent = original;
          downloadBtn.style.pointerEvents = '';
        }, 1500);
      });
  });
}
