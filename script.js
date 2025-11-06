/* =========================================
   script.js — static site, no server
   - Theme toggle (localStorage)
   - Smooth anchor scrolling
   - Auto gallery: lists all files in /images via GitHub API
   - Masonry render + lightbox
   - External link hardening
   ========================================= */

/* ---------- Simple config (edit if needed) ---------- */
// If your site is served at https://<user>.github.io/<repo>/, the code below
// auto-detects owner & repo. If you use a custom domain, set OWNER/REPO manually.
const BRANCH = 'main';        // change if your default branch is different
const IMAGES_DIR = 'images';  // change to 'assets' if you keep images there

// Optional: hardcode these if auto-detect doesn’t fit your setup
let OWNER = '';
let REPO  = '';

(function detectOwnerRepo() {
  // Example GH Pages URL patterns:
  // 1) Project page: https://USERNAME.github.io/REPO/
  // 2) User/Org root page: https://USERNAME.github.io/
  const host = location.hostname;          // e.g., varunchaubey.github.io
  const path = location.pathname.replace(/^\/+|\/+$/g, ''); // e.g., "resume-site" or ""

  if (host.endsWith('github.io')) {
    OWNER = host.split('.')[0];           // before ".github.io"
    REPO  = path.split('/')[0] || `${OWNER}.github.io`; // project repo or root site repo
  }

  // If you use a custom domain, uncomment and fill these:
  // OWNER = 'your-github-username';
  // REPO  = 'your-repo-name';
})();

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

/* ---------- GitHub API helpers ---------- */
function buildContentsApiUrl(owner, repo, dir, branch) {
  // GET https://api.github.com/repos/{owner}/{repo}/contents/{path}?ref={branch}
  const base = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodeURIComponent(dir)}`;
  const ref  = branch ? `?ref=${encodeURIComponent(branch)}` : '';
  return `${base}${ref}`;
}

function toRawUrl(owner, repo, branch, dir, name) {
  // https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{dir}/{name}
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${dir}/${encodeURIComponent(name)}`;
}

/* ---------- Gallery via GitHub API ---------- */
async function fetchImageList() {
  if (!OWNER || !REPO) return [];
  const url = buildContentsApiUrl(OWNER, REPO, IMAGES_DIR, BRANCH);
  const resp = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'gh-gallery'
    }
  });

  if (resp.status === 404) {
    // Folder not found: treat as empty
    return [];
  }
  if (!resp.ok) {
    const errText = await resp.text().catch(() => '');
    console.error('GitHub list failed', resp.status, errText);
    return [];
  }

  const items = await resp.json();
  // items is an array of { name, path, type, download_url, ... }
  return (Array.isArray(items) ? items : [])
    .filter(i => i.type === 'file' && /\.(png|jpe?g|webp|gif|svg)$/i.test(i.name))
    .map(i => ({
      name: i.name,
      src:  toRawUrl(OWNER, REPO, BRANCH, IMAGES_DIR, i.name)
    }));
}

/* ---------- Masonry gallery render + lightbox ---------- */
let galleryImages = [];  // will be populated from GitHub API
let currentIndex = 0;

async function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  grid.innerHTML = '<p class="muted">Loading images...</p>';
  galleryImages = await fetchImageList();

  grid.innerHTML = '';
  if (!galleryImages.length) {
    grid.innerHTML = '<p class="muted">No images found in the images/ folder.</p>';
    return;
  }

  galleryImages.forEach((img, idx) => {
    const fig = document.createElement('figure');
    const el  = document.createElement('img');
    el.loading = 'lazy';
    el.decoding = 'async';
    el.src = img.src;
    el.alt = img.name;
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
  lbImg.alt = item.name || '';
  lbCap.textContent = item.name || '';
}

function nextImage() {
  if (!galleryImages.length) return;
  currentIndex = (currentIndex + 1) % galleryImages.length;
  setLightboxImage(currentIndex);
}

function prevImage() {
  if (!galleryImages.length) return;
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
document.addEventListener('DOMContentLoaded', renderGallery);

// Mailto submit: includes the user's email in the final message
(function contactFormInit(){
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cfName')?.value.trim() || '';
    const email = document.getElementById('cfEmail')?.value.trim() || '';
    const msg = document.getElementById('cfMessage')?.value.trim() || '';

    const to = 'varun.chaubey@queensu.ca'; // your inbox
    const subject = `Portfolio contact from ${name || 'Website visitor'}`;
    const body =
`Name: ${name}
Email: ${email}

${msg}`;

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  });
})();

