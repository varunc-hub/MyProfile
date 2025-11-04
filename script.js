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

// Sample gallery loader
const sampleImages = [
  {src:'assets/hero2.jpg', alt:'Hero background sample'},
  {src:'assets/sample4.jpg', alt:'Profile sample'},
  {src:'assets/sample1.jpg', alt:'Project / life photo 1'},
  {src:'assets/sample2.jpg', alt:'Project / life photo 2'},
  {src:'assets/sample3.jpg', alt:'Project / life photo 3'}
];

const grid = document.getElementById('galleryGrid');
document.getElementById('loadGallery').addEventListener('click', () => {
  grid.innerHTML = '';
  sampleImages.forEach(img => {
    const fig = document.createElement('figure');
    const el = document.createElement('img');
    el.src = img.src; el.alt = img.alt;
    fig.appendChild(el);
    grid.appendChild(fig);
  });
});

// Accessible external links (open in new tab with rel)
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[target="_blank"]');
  if(a){ a.setAttribute('rel', 'noopener noreferrer'); }
});
