// ===== Carrusel de interfaz: pantalla completa / ventana compacta =====
const slides = [
  { id: 'full', title: 'Pantalla completa', desc: 'Portada grande, letra sincronizada al lado y controles abajo. Se activa con F11.' },
  { id: 'compact', title: 'Ventana compacta', desc: 'Angosta y flotante, para dejarla en un rincón del escritorio mientras hacés otra cosa.' },
  { id: 'android', title: 'App para Android', desc: 'La misma biblioteca y el mismo reproductor, adaptados a pantalla de celular.' },
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
const phoneMockEl = document.querySelector('.phone-mock');
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
  const isAndroid = slide.id === 'android';

  scenes.forEach(scene => {
    scene.classList.toggle('is-active', scene.dataset.viewPanel === slide.id);
  });
  thumbs.forEach(t => t.classList.toggle('is-active', t.dataset.view === slide.id));
  if (indexEl) indexEl.innerHTML = `<strong>${String(current + 1).padStart(2, '0')}</strong> / ${slides.length}`;
  if (captionTitle) captionTitle.textContent = slide.title;
  if (captionDesc) captionDesc.textContent = slide.desc;

  // El mockup de escritorio (monitor) y el de celular son contenedores
  // distintos: se muestra uno u otro según la plataforma de la vista activa.
  if (mockWrap) mockWrap.classList.toggle('is-hidden', isAndroid);
  if (phoneMockEl) phoneMockEl.classList.toggle('is-active', isAndroid);

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
// Nota: .hero-shot contiene cartas con position:fixed (la baraja expandida),
// y ponerle un "transform" inline —aunque sea momentáneo— la convertiría en el
// "containing block" de esas cartas fijas, rompiendo su centrado en pantalla.
// Por eso a .hero-shot solo se le anima la opacidad, nunca el transform.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  const transformTargets = document.querySelectorAll('.feature-card, .desktop-mock, .download-card');
  const opacityOnlyTargets = document.querySelectorAll('.hero-shot');

  transformTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });
  opacityOnlyTargets.forEach(el => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.6s ease';
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        if (transformTargets.length && Array.from(transformTargets).includes(entry.target)) {
          entry.target.style.transform = 'translateY(0)';
        }
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  transformTargets.forEach(el => io.observe(el));
  opacityOnlyTargets.forEach(el => io.observe(el));
}

// ===== Descarga directa de instaladores (Windows + Android) =====
// El link real y el repo viven en el servidor (api/download.js),
// acá el navegador del visitante solo pide /api/download?platform=....
function wireDownload(buttonId, versionId, platform) {
  const btn = document.getElementById(buttonId);
  const versionEl = document.getElementById(versionId);

  if (versionEl) {
    fetch(`/api/version?platform=${platform}`)
      .then(r => r.json())
      .then(({ tag }) => {
        if (tag) versionEl.textContent = `Versión ${tag.replace(/^v/i, '')}`;
      })
      .catch(() => { /* se queda el texto genérico */ });
  }

  if (btn) {
    btn.addEventListener('click', () => {
      const original = btn.textContent;
      btn.textContent = 'Preparando descarga…';
      btn.classList.add('btn-disabled');
      setTimeout(() => {
        btn.textContent = original;
        btn.classList.remove('btn-disabled');
      }, 2500);
    });
  }
}

wireDownload('downloadBtn', 'dlVersion', 'windows');
wireDownload('downloadBtnAndroid', 'dlVersionAndroid', 'android');

// ===== Baraja de cartas del hero =====
// Al pasar el dedo/cursor por la baraja, la carta que está debajo se "alza".
// Al tocar/cliquear una carta, se expande al centro por encima de las demás.
(function () {
  const deck = document.getElementById('cardDeck');
  const backdrop = document.getElementById('deckBackdrop');
  if (!deck || !backdrop) return;

  // ---- Fotos propias del usuario (assets/deck/1.png, 2.png, ...) ----
  // Si no subió nada todavía (404), la imagen se oculta y queda visible
  // el mockup dibujado de esa carta como relleno.
  const EXT_TRY_ORDER = ['png', 'jpg', 'jpeg', 'webp'];
  document.querySelectorAll('.deck-photo[data-photo]').forEach((img) => {
    const num = img.dataset.photo;
    let attempt = 0;
    function tryNext() {
      if (attempt >= EXT_TRY_ORDER.length) {
        img.remove(); // sin foto: se ve el mockup dibujado de abajo
        return;
      }
      img.src = `assets/deck/${num}.${EXT_TRY_ORDER[attempt]}`;
      attempt += 1;
    }
    img.addEventListener('error', tryNext);
    tryNext();
  });

  const cards = Array.from(deck.querySelectorAll('.deck-card'));
  let expanded = null;

  function liftOnly(card) {
    cards.forEach((c) => c.classList.toggle('is-lifted', c === card));
  }
  function clearLift() {
    cards.forEach((c) => c.classList.remove('is-lifted'));
  }
  function cardUnderPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.deck-card') : null;
  }

  function expand(card) {
    expanded = card;
    clearLift();
    deck.classList.add('is-expanding');
    card.classList.add('is-active');
    backdrop.classList.add('is-visible');
  }
  function collapse() {
    if (!expanded) return;
    expanded.classList.remove('is-active');
    deck.classList.remove('is-expanding');
    backdrop.classList.remove('is-visible');
    expanded = null;
  }

  // Alzar con el cursor (desktop)
  deck.addEventListener('pointermove', (e) => {
    if (expanded || e.pointerType !== 'mouse') return;
    const card = cardUnderPoint(e.clientX, e.clientY);
    if (card) liftOnly(card); else clearLift();
  });
  deck.addEventListener('pointerleave', () => { if (!expanded) clearLift(); });

  // Alzar arrastrando el dedo por la baraja (mobile)
  deck.addEventListener('touchmove', (e) => {
    if (expanded) return;
    const t = e.touches[0];
    if (!t) return;
    const card = cardUnderPoint(t.clientX, t.clientY);
    if (card) liftOnly(card);
  }, { passive: true });
  deck.addEventListener('touchend', () => { if (!expanded) clearLift(); });

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      if (expanded === card) collapse();
      else expand(card);
    });
  });

  backdrop.addEventListener('click', collapse);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });
})();
