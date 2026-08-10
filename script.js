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

const mockWrap = document.querySelector('.desktop-mock');
const mockUnit = document.querySelector('.monitor-unit');
const MOCK_REFERENCE_WIDTH = 900;

const supportsZoom = window.CSS && CSS.supports && CSS.supports('zoom', '1');

function scaleMock() {
  if (!mockWrap || !mockUnit) return;
  const available = mockWrap.clientWidth;
  const scale = Math.min(1, available / MOCK_REFERENCE_WIDTH);

  if (supportsZoom) {
    mockUnit.style.transform = '';
    mockUnit.style.zoom = 1;
    mockUnit.style.zoom = scale;
  } else {
    mockUnit.style.zoom = '';
    mockUnit.style.transform = 'scale(1)';
    mockUnit.style.transform = `scale(${scale})`;
  }
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

const downloadBtn = document.getElementById('downloadBtn');
const dlVersionEl = document.getElementById('dlVersion');

if (dlVersionEl) {
  fetch('/api/version')
    .then(r => r.json())
    .then(({ tag }) => {
      if (tag) dlVersionEl.textContent = `Versión ${tag.replace(/^v/i, '')}`;
    })
    .catch(() => { /* jeje */ });
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

const heroTiltZone = document.querySelector('.hero-shot');
const heroTiltCard = document.querySelector('.app-window--hero');
const canHoverPrecise = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (heroTiltZone && heroTiltCard && canHoverPrecise) {
  const BASE_ROT_X = 6;
  const BASE_ROT_Y = -8;
  const MAX_ROT = 8;
  const MAX_SHIFT = 22;

  heroTiltZone.addEventListener('mousemove', (e) => {
    const rect = heroTiltZone.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    const shiftX = px * MAX_SHIFT * 2;
    const shiftY = py * MAX_SHIFT * 2;
    const rotY = BASE_ROT_Y + px * MAX_ROT * 2;
    const rotX = BASE_ROT_X - py * MAX_ROT * 2;

    heroTiltCard.style.transform =
      `translate(${shiftX}px, ${shiftY}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
  });

  heroTiltZone.addEventListener('mouseleave', () => {
    heroTiltCard.style.transform =
      `translate(0px, 0px) rotateX(${BASE_ROT_X}deg) rotateY(${BASE_ROT_Y}deg)`;
  });
}
