/* =========================================
   script.js — static site helpers
   - Theme toggle (dark/light) with localStorage
   - Smooth anchor scrolling
   - Static photo gallery (edit galleryImages[])
   - Masonry render + lightbox
   - External link hardening
   ========================================= */

/* ---------- Theme toggle ---------- */
(function themeToggleInit() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved === 'light') root.classList.add('light');

  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
})();

/* ---------- Smooth anchor scrolling ---------- */
(function smoothScrollInit() {
  const isHashLink = (a) => a.hash && a.pathname === location.pathname;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !isHashLink(a)) return;
    const target = document.querySelector(a.hash);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.pushState(null, '', a.hash);
  });
})();

/* ---------- External links: open safely ---------- */
(function externalLinksInit() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[target="_blank"]');
    if (a) a.setAttribute('rel', 'noopener noreferrer');
  });
})();

/* ---------- Static Gallery (edit this list) ---------- */
/* 1) Put your files in /assets
   2) Add one object per image below (case-sensitive paths) */
const galleryImages = [
  { src: 'assets/hero.jpg',    alt: 'Banner photo' },
  { src: 'assets/profile.jpg', alt: 'Profile portrait' }
  // Add more, e.g.:
  // { src: 'assets/cricket_award.jpg', alt: 'Cricket award ceremony' },
  // { src: 'assets/banff.jpg',         alt: 'Banff Lake at sunset' },
];

let currentIndex = 0;

/* Render gallery into #galleryGrid (masonry CSS handled in styles.css) */
function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = '';
  galleryImages.forEach((img, idx) => {
    const fig = document.createElement('figure');
    const el  = document.createElement('img');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.src = img.src;
    el.alt = img.alt || '';
    el.tabIndex = 0;
    el.setAttribute('data-index', String(idx));
    el.addEventListener('click', openLightbox);
    el.addEventListener('keypress', (e) => { if (e.key === 'Enter') openLightbox(e); });
    fig.appendChild(el);
    grid.appendChild(fig);
  });
}

/* ---------- Lightbox ---------- */
const lb     = document.getElementById('lightbox');
const lbImg  = document.getElementById('lightboxImg');
const lbCap  = document.getElementById('lightboxCaption');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbClose= document.getElementById('lbClose');

function openLightbox(e) {
  const target = e.currentTarget || e.target;
  const idx = Number(target.getAttribute('data-index'));
  if (Number.isNaN(idx)) return;
  currentIndex = idx;
  setLightboxImage(currentIndex);
  if (lb) {
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }
}

function closeLightbox() {
  if (!lb) return;
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
}

function setLightboxImage(i) {
  const item = galleryImages[i];
  if (!item || !lbImg || !lbCap) return;
  lbImg.src = item.src;
  lbImg.alt = item.alt || '';
  lbCap.textContent = item.alt || '';
}

function nextImage() {
  currentIndex = (currentIndex + 1) % galleryImages.length;
  setLightboxImage(currentIndex);
}

function prevImage() {
  currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
}

/* Controls & keyboard */
if (lbPrev)  lbPrev.addEventListener('click', prevImage);
if (lbNext)  lbNext.addEventListener('click', nextImage);
if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lb) {
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
}
document.addEventListener('keydown', (e) => {
  if (!lb || !lb.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft')  prevImage();
});

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderGallery();
});
