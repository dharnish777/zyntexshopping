// Minimal UX: header shadow on scroll (keeps theme simple)
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header.style.boxShadow = '0 8px 30px rgba(2,6,23,0.06)';
    else header.style.boxShadow = 'none';
  });
});


