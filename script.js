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

// === Persistent Gallery ===
// Add/maintain your images here. Files go in /assets.
const galleryImages = [
  { src: 'assets/hero.jpg',    alt: 'Banner photo' },
  { src: 'assets/profile.jpg', alt: 'Profile portrait' }
  // Add more:
  // { src: 'assets/cricket_award.jpg', alt: 'Cricket award ceremony' },
  // { src: 'assets/banff.jpg', alt: 'Banff Lake in summer' },
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

// === Lightbox ===
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

function nextImage() {
  currentIndex = (currentIndex + 1) % galleryImages.length;
  setLightboxImage(currentIndex);
}
function prevImage() {
  currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
  setLightboxImage(currentIndex);
}

// Controls
if (lbPrev) lbPrev.addEventListener('click', prevImage);
if (lbNext) lbNext.addEventListener('click', nextImage);
if (lbClose) lbClose.addEventListener('click', closeLightbox);

// Close on backdrop click
if (lb) {
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape')  closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft')  prevImage();
});

// Render on page load
document.addEventListener('DOMContentLoaded', renderGallery);

// === Image Upload Preview (local only) ===
const uploadInput = document.getElementById('imageUpload');
if (uploadInput) {
  uploadInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    const grid = document.getElementById('galleryGrid');
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.src = e.target.result;
        img.alt = file.name;
        fig.appendChild(img);
        grid.appendChild(fig);
      };
      reader.readAsDataURL(file);
    });
  });
}


// Accessible external links (open in new tab with rel)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[target="_blank"]');
  if(a){ a.setAttribute('rel', 'noopener noreferrer'); }
});

function hasAdminCookie() {
  return document.cookie.split(';').some(c => c.trim().startsWith((window.COOKIE_NAME || 'vc_admin') + '=')); 
}

const loginForm   = document.getElementById('loginForm');
const adminPassEl = document.getElementById('adminPassword');
const loginStatus = document.getElementById('loginStatus');
const logoutBtn   = document.getElementById('logoutBtn');
const uploadForm  = document.getElementById('uploadForm');

async function refreshAdminUI() {
  const authed = hasAdminCookie();
  if (authed) {
    uploadForm.style.display = '';
    logoutBtn.style.display = '';
    loginStatus.textContent = 'Logged in as admin';
  } else {
    uploadForm.style.display = 'none';
    logoutBtn.style.display = 'none';
    loginStatus.textContent = '';
  }
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = adminPassEl.value.trim();
    if (!password) return;
    loginStatus.textContent = 'Logging in...';
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password })
    });
    if (resp.ok) {
      loginStatus.textContent = 'Success. Admin enabled.';
      adminPassEl.value = '';
      await refreshAdminUI();
    } else {
      const err = await resp.json().catch(()=>({}));
      loginStatus.textContent = `Error: ${err.error || 'Login failed'}`;
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    await refreshAdminUI();
  });
}

document.addEventListener('DOMContentLoaded', refreshAdminUI);

async function fileToBase64(file) {
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
  return String(dataUrl).split(',')[1]; // strip "data:*/*;base64,"
}

if (uploadForm) {
  const input = document.getElementById('imageInput');
  const statusEl = document.getElementById('uploadStatus');

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const files = Array.from(input.files || []);
    if (!files.length) return;

    statusEl.textContent = `Uploading ${files.length} file(s)...`;
    uploadForm.querySelector('button[type="submit"]').disabled = true;

    try {
      for (const f of files) {
        const base64 = await fileToBase64(f);
        const resp = await fetch('/api/upload', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ filename: f.name, base64, message: `feat: upload ${f.name} via site` })
        });
        if (!resp.ok) {
          const err = await resp.json().catch(()=>({}));
          throw new Error(err.error || 'Upload failed');
        }
      }
      statusEl.textContent = 'Upload complete. Refreshing gallery...';
      input.value = '';
      await loadGalleryFromRepo();
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
    } finally {
      uploadForm.querySelector('button[type="submit"]').disabled = false;
    }
  });
}

async function loadGalleryFromRepo() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  const resp = await fetch('/api/list-assets');
  if (!resp.ok) { grid.innerHTML = '<p class="muted">Unable to load images.</p>'; return; }
  const data = await resp.json();
  (data.images || []).forEach((img, idx) => {
    const fig = document.createElement('figure');
    const el = document.createElement('img');
    el.src = img.raw;
    el.alt = img.name;
    el.loading = 'lazy';
    el.decoding = 'async';
    fig.appendChild(el);
    grid.appendChild(fig);
  });
}
document.addEventListener('DOMContentLoaded', loadGalleryFromRepo);
