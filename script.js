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

// ===== Escalar el mockup de escritorio completo en pantallas angostas =====
// En vez de reacomodar el contenido (lo que lo hacía ver como una app de
// celular), se escala TODO el conjunto como una sola unidad. Así siempre
// se ve igual que la app de Windows, solo que más chico.
const mockWrap = document.querySelector('.desktop-mock');
const mockUnit = document.querySelector('.monitor-unit');
const MOCK_REFERENCE_WIDTH = 900; // ancho de diseño original del mockup

function scaleMock() {
  if (!mockWrap || !mockUnit) return;
  mockUnit.style.transform = 'scale(1)';
  const available = mockWrap.clientWidth;
  const scale = Math.min(1, available / MOCK_REFERENCE_WIDTH);
  mockUnit.style.transform = `scale(${scale})`;
  mockWrap.style.height = `${mockUnit.getBoundingClientRect().height}px`;
}

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
  scaleMock();
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

window.addEventListener('resize', scaleMock);
window.addEventListener('orientationchange', scaleMock);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(scaleMock);
}
scaleMock();

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
// El link real y el repo viven en el servidor (api/download.js),
// acá el navegador del visitante solo pide /api/download.
const downloadBtn = document.getElementById('downloadBtn');
const dlVersionEl = document.getElementById('dlVersion');

if (dlVersionEl) {
  fetch('/api/version')
    .then(r => r.json())
    .then(({ tag }) => {
      if (tag) dlVersionEl.textContent = `Versión ${tag.replace(/^v/i, '')}`;
    })
    .catch(() => { /* se queda el texto genérico */ });
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    const original = downloadBtn.textContent;
    downloadBtn.textContent = 'Preparando descarga…';
    downloadBtn.classList.add('btn-disabled');
    setTimeout(() => {
      downloadBtn.textContent = original;
      downloadBtn.classList.remove('btn-disabled');
    }, 2500);
  });
}
