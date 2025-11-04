// If you're on GitHub Pages, call the Vercel API via absolute URL.
// If you're on the same domain (deployed on Vercel), '' keeps it relative.
const API_BASE = (location.hostname.endsWith('github.io'))
  ? 'https://YOUR-VERCEL-PROJECT.vercel.app'
  : '';

// Theme toggle with localStorage
(function(){
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if(saved === 'light') root.classList.add('light');
  document.getElementById('themeToggle').addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('theme', root.classList.contains('light') ? 'light' : 'dark');
  });
})();

// === Static Gallery (no backend) ===
// 1) Put files into /assets
// 2) List them here. That's it.
const galleryImages = [
  { src: 'assets/hero.jpg',    alt: 'Banner photo' },
  { src: 'assets/profile.jpg', alt: 'Profile portrait' }
  // Add more:
  // { src: 'assets/cricket_award.jpg', alt: 'Cricket award ceremony' },
  // { src: 'assets/banff.jpg',         alt: 'Banff Lake at sunset' },
];

let currentIndex = 0;

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

// Lightbox
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
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
}

function setLightboxImage(i) {
  const item = galleryImages[i];
  if (!item) return;
  lbImg.src = item.src;
  lbImg.alt = item.alt || '';
  lbCap.textContent = item.alt || '';
}

function nextImage() { currentIndex = (currentIndex + 1) % galleryImages.length; setLightboxImage(currentIndex); }
function prevImage() { currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length; setLightboxImage(currentIndex); }

if (lbPrev)  lbPrev.addEventListener('click', prevImage);
if (lbNext)  lbNext.addEventListener('click', nextImage);
if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lb) {
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
}
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft')  prevImage();
});

document.addEventListener('DOMContentLoaded', renderGallery);


// Accessible external links (open in new tab with rel)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[target="_blank"]');
  if(a){ a.setAttribute('rel', 'noopener noreferrer'); }
});