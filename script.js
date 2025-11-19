/* js/app.js — full e-commerce front-end
   Features:
   - Product data (can be pulled from Firebase later)
   - Voice search (Web Speech API)
   - Floating search with autocomplete suggestions
   - Cart (localStorage): add / remove / qty / total
   - Product page loader
   - Categories filter
   - Simple auth (localStorage) + placeholders for Firebase Auth
   - Checkout UI with Razorpay frontend example
   - Dark mode toggle
*/

/* ---------- Config (replace when integrating) ---------- */
// Optional Firebase config (if you want backend)
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_APIKEY",
  authDomain: "YOUR_FIREBASE_DOMAIN",
  projectId: "YOUR_FIREBASE_PROJECTID",
  // ... rest of config
};

// Razorpay key placeholder (test key)
const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY";

/* ---------- Sample Product Data (replace with DB) ---------- */
const PRODUCTS = [
  {id:1, title:"Premium Headphones", price:2499, img:"https://m.media-amazon.com/images/I/61X9Z3orAFL._AC_UY327_.jpg", desc:"Studio-quality sound with long battery.", category:"Accessories"},
  {id:2, title:"Smart Fitness Watch", price:1899, img:"https://m.media-amazon.com/images/I/71tCOhEkolL._AC_UY327_.jpg", desc:"All-day health tracking & GPS.", category:"Electronics"},
  {id:3, title:"Bluetooth Speaker", price:999, img:"https://m.media-amazon.com/images/I/71m-tTHuYCL._AC_UY327_.jpg", desc:"Portable speaker with great bass.", category:"Electronics"},
  {id:4, title:"Designer Backpack", price:799, img:"https://m.media-amazon.com/images/I/61o0P2f9FFL._AC_UY327_.jpg", desc:"Sleek, water-resistant travel pack.", category:"Fashion"},
  // add more items...
];

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

/* ---------- Voice Search (Web Speech API) ---------- */
function initVoiceSearch() {
  const voiceBtn = document.createElement('button');
  voiceBtn.textContent = '🎤';
  voiceBtn.style.cssText = 'margin-left:8px;padding:8px;border-radius:8px;border:0;cursor:pointer;background:transparent';
  const float = document.querySelector('.floating-search');
  if(float) float.querySelector('.search-actions')?.appendChild(voiceBtn);

  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceBtn.style.display = 'none';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  voiceBtn.addEventListener('click', () => {
    recognition.start();
    voiceBtn.textContent = '🎙️';
  });

  recognition.addEventListener('result', (e) => {
    const text = e.results[0][0].transcript;
    const input = $('#advSearchInput');
    if(input) {
      input.value = text;
      input.dispatchEvent(new Event('input'));
    }
  });

  recognition.addEventListener('end', ()=> voiceBtn.textContent = '🎤');
}

/* ---------- Search + Suggestions ---------- */
const SUGGESTIONS = Array.from(new Set([
  ...PRODUCTS.map(p => p.title.toLowerCase()),
  'headphones','speaker','watch','backpack','earbuds','fitness watch','smartwatch'
]));

function initFloatingSearch() {
  const input = $('#advSearchInput');
  const box = $('#suggestionsBox');
  if(!input || !box) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    box.innerHTML = '';
    if(!q) { box.style.display='none'; return; }
    const list = SUGGESTIONS.filter(s => s.includes(q)).slice(0,6);
    if(list.length===0){ box.style.display='none'; return; }
    list.forEach(s => {
      const d = document.createElement('div'); d.textContent = s;
      d.addEventListener('click', () => {
        input.value = s;
        box.style.display='none';
        filterProducts(s);
      });
      box.appendChild(d);
    });
    box.style.display='block';
  });

  // pressing Enter filters
  input.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') filterProducts(input.value.trim());
  });
}

/* ---------- Filter products by query or category ---------- */
function filterProducts(q) {
  const query = (q||$('#advSearchInput')?.value || '').toLowerCase();
  const grid = document.querySelectorAll('.product-box, .card');
  grid && grid.forEach(card => {
    const title = (card.querySelector('h3')?.innerText || card.querySelector('h4')?.innerText || '').toLowerCase();
    const cat = (card.dataset?.category || '').toLowerCase();
    const show = title.includes(query) || cat.includes(query) || query==='';
    card.style.display = show ? 'block' : 'none';
  });
}

/* ---------- Render product grid (generic) ---------- */
function renderProductsGrid(containerSelector = '#grid', items = PRODUCTS) {
  const container = document.querySelector(containerSelector);
  if(!container) return;
  container.innerHTML = '';
  items.forEach(p => {
    const el = document.createElement('div');
    el.className = containerSelector.includes('product-box') ? 'product-box' : 'card';
    el.dataset.category = p.category || '';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <h4>${p.title}</h4>
      <div class="meta">
        <div class="price">₹${p.price}</div>
      </div>
      <div class="actions">
        <button class="action add" data-id="${p.id}">Add</button>
        <button class="action view" data-id="${p.id}">View</button>
      </div>
    `;
    container.appendChild(el);
  });
  // attach events
  $$('.action.add').forEach(b => b.addEventListener('click', e => addToCart(+b.dataset.id)));
  $$('.action.view').forEach(b => b.addEventListener('click', e => location.href = `product.html?id=${b.dataset.id}`));
}

/* ---------- CART (localStorage) ---------- */
function getCart(){ return JSON.parse(localStorage.getItem('zyn_cart') || '[]'); }
function saveCart(cart){ localStorage.setItem('zyn_cart', JSON.stringify(cart)); }
function addToCart(id, qty=1){
  const prod = PRODUCTS.find(p => p.id === id);
  if(!prod) return;
  const cart = getCart();
  const found = cart.find(i => i.id === id);
  if(found) found.qty += qty; else cart.push({id:prod.id,title:prod.title,price:prod.price,img:prod.img,qty});
  saveCart(cart);
  updateCartBadge();
  toast(`${prod.title} added to cart`);
}
function removeFromCart(id){
  let c = getCart(); c = c.filter(i => i.id !== id); saveCart(c); renderCart(); updateCartBadge();
}
function setQty(id, qty){
  const c = getCart(); const it = c.find(i => i.id === id); if(!it) return;
  it.qty = qty; if(it.qty<=0) removeFromCart(id); else saveCart(c); renderCart(); updateCartBadge();
}
function cartCount(){ return getCart().reduce((s,i)=>s + i.qty,0); }
function updateCartBadge(){ const el = $('#cart-count'); if(el) el.textContent = cartCount(); }

/* ---------- Render cart page ---------- */
function renderCart(){
  const container = $('#cart-list'); if(!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if(cart.length === 0){ container.innerHTML = '<div class="center">Your cart is empty</div>'; $('#cart-total') && ($('#cart-total').textContent='₹0'); return; }
  cart.forEach(item => {
    const div = document.createElement('div'); div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.img}" alt="${item.title}">
      <div style="flex:1">
        <div style="font-weight:700">${item.title}</div>
        <div style="color:var(--muted)">₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</div>
        <div style="margin-top:8px">
          <button onclick="setQty(${item.id}, ${item.qty - 1})">−</button>
          <span style="padding:0 8px">${item.qty}</span>
          <button onclick="setQty(${item.id}, ${item.qty + 1})">+</button>
          <button style="margin-left:10px" onclick="removeFromCart(${item.id})">Remove</button>
        </div>
      </div>
    `;
    container.appendChild(div);
  });
  const total = cart.reduce((s,i)=> s + i.price * i.qty,0);
  $('#cart-total') && ($('#cart-total').textContent = '₹' + total);
}

/* ---------- Product detail loader ---------- */
function loadProductPage(){
  const params = new URLSearchParams(location.search);
  const id = +params.get('id');
  if(!id) return;
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  const img = $('#prod-img'), title = $('#prod-title'), price = $('#prod-price'), desc = $('#prod-desc');
  if(img) img.src = p.img;
  if(title) title.textContent = p.title;
  if(price) price.textContent = '₹' + p.price;
  if(desc) desc.textContent = p.desc;
  const atc = $('#add-to-cart'); if(atc) atc.addEventListener('click', ()=> addToCart(p.id, Number($('#qty').value || 1)));
}

/* ---------- Categories rendering ---------- */
function renderCategories(){
  const categories = Array.from(new Set(PRODUCTS.map(p => p.category))).filter(Boolean);
  const container = document.querySelector('.categories') || $('#category-list');
  if(!container) return;
  container.innerHTML = '';
  categories.forEach(c => {
    const d = document.createElement('div'); d.className = 'category'; d.textContent = c;
    d.addEventListener('click', ()=> {
      const filtered = PRODUCTS.filter(p => p.category === c);
      renderProductsGrid('#grid', filtered);
    });
    container.appendChild(d);
  });
}

/* ---------- Simple Auth (localStorage) ---------- */
function signup(email, password, name){
  const users = JSON.parse(localStorage.getItem('zyn_users') || '[]');
  if(users.find(u => u.email === email)) return {ok:false, msg:'User exists'};
  users.push({email, password, name});
  localStorage.setItem('zyn_users', JSON.stringify(users));
  localStorage.setItem('zyn_user', JSON.stringify({email,name}));
  return {ok:true};
}
function login(email, password){
  const users = JSON.parse(localStorage.getItem('zyn_users') || '[]');
  const u = users.find(x => x.email === email && x.password === password);
  if(!u) return {ok:false, msg:'Invalid credentials'};
  localStorage.setItem('zyn_user', JSON.stringify({email: u.email, name: u.name}));
  return {ok:true};
}
function logout(){
  localStorage.removeItem('zyn_user');
  location.href = 'index.html';
}
function currentUser(){ return JSON.parse(localStorage.getItem('zyn_user') || 'null'); }

/* ---------- Toast ---------- */
function toast(msg){
  let t = $('#zyn-toast');
  if(!t){ t = document.createElement('div'); t.id='zyn-toast'; t.style.cssText='position:fixed;right:20px;bottom:20px;padding:12px 16px;background:rgba(0,0,0,0.8);color:#fff;border-radius:10px;z-index:9999;transition:opacity .3s'; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = 1;
  setTimeout(()=> t.style.opacity = 0,2000);
}

/* ---------- Dark mode toggle ---------- */
function initThemeToggle(){
  const btn = document.getElementById('theme-toggle');
  if(!btn) return;
  const saved = localStorage.getItem('zyn_theme');
  if(saved === 'dark') document.body.classList.add('dark');
  btn.addEventListener('click', ()=> {
    document.body.classList.toggle('dark');
    localStorage.setItem('zyn_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

/* ---------- Checkout (Razorpay example) ---------- */
function checkoutWithRazorpay() {
  const cart = getCart();
  if(cart.length === 0) return alert('Cart empty');
  const amount = cart.reduce((s,i) => s + i.price*i.qty, 0) * 100; // paise
  if(!RAZORPAY_KEY || RAZORPAY_KEY === 'YOUR_RAZORPAY_KEY') {
    alert('Razorpay key not set. Checkout will simulate success.');
    // simulate success
    setTimeout(()=> { alert('Payment simulated — order placed'); localStorage.removeItem('zyn_cart'); updateCartBadge(); renderCart(); location.href = 'index.html'; }, 800);
    return;
  }

  const options = {
    key: RAZORPAY_KEY,
    amount: amount,
    currency: "INR",
    name: "ZyntexShopping",
    description: "Order Payment",
    handler: function (response){
      // response.razorpay_payment_id -> call backend to verify
      alert('Payment success: ' + response.razorpay_payment_id);
      // clear cart
      localStorage.removeItem('zyn_cart'); updateCartBadge(); renderCart(); location.href='index.html';
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

/* ---------- Admin (add product) - stores to localStorage or Firebase if set ---------- */
function adminAddProduct(p){
  // local add: push into PRODUCTS and save to localStorage for persistence
  const stored = JSON.parse(localStorage.getItem('zyn_products') || '[]');
  stored.push(p);
  localStorage.setItem('zyn_products', JSON.stringify(stored));
  PRODUCTS.push(p);
  toast('Product added (local)');
  // re-render if on products page
  if(document.querySelector('#grid')) renderProductsGrid('#grid');
}

/* ---------- Init on page load ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // load optionally saved products from local storage
  const savedProducts = JSON.parse(localStorage.getItem('zyn_products') || '[]');
  if(savedProducts.length) {
    savedProducts.forEach(sp => { if(!PRODUCTS.find(p=>p.id===sp.id)) PRODUCTS.push(sp); }
  )}

  // render grids
  if(document.querySelector('#grid')) renderProductsGrid('#grid');
  if(document.querySelector('.product-box')) renderProductsGrid('.product-box', PRODUCTS);
  renderCategories();
  initFloatingSearch();
  initVoiceSearch();
  initThemeToggle();
  updateCartBadge();
  renderCart();
  loadProductPage();
});



