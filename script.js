// simple UI helpers: mobile menu + small interactions
document.addEventListener('DOMContentLoaded', function () {
  const ham = document.querySelector('.hamburger');
  const nav = document.querySelector('.nav');
  ham && ham.addEventListener('click', () => {
    const expanded = ham.getAttribute('aria-expanded') === 'true';
    ham.setAttribute('aria-expanded', String(!expanded));
    if (nav) nav.style.display = expanded ? '' : 'flex';
  });

  // simple fade-in for products
  const items = document.querySelectorAll('.product');
  items.forEach((el, i) => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(8px)';
    setTimeout(() => {
      el.style.transition = 'opacity .6s ease, transform .6s ease';
      el.style.opacity = 1;
      el.style.transform = '';
    }, 120 * i);
  });
});

