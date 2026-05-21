// main.js — EcoShop (load nhanh, không lag)
import { getProducts, getCertifications } from './api.js';
import { formatPrice, badgeHTML, debounce, escHtml, getProductImage } from './utils.js';
import { getCurrentUser, logout } from './auth.js';

let allProducts  = [];
let allCerts     = {};
let activeFilter = 'all';

// ── Header ────────────────────────────────────────────────
function initHeader() {
  const user = getCurrentUser();
  const nav  = document.querySelector('.header-nav');
  if (!nav) return;
  if (user) {
    document.getElementById('nav-auth-links')?.remove();
    const badge = document.createElement('div');
    badge.className = 'header-user';
    badge.innerHTML = `
      <span class="header-username" title="${escHtml(user.email)}">👤 ${escHtml(user.name || user.email)}</span>
      <button class="btn-logout" id="btn-logout">Đăng xuất</button>`;
    nav.appendChild(badge);
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đăng xuất?')) logout();
    });
    document.getElementById('guest-banner')?.remove();
    if (user.role === 'admin')
      document.getElementById('nav-admin-link')?.removeAttribute('hidden');
  } else {
    document.getElementById('nav-admin-link')?.setAttribute('hidden', '');
    document.getElementById('guest-banner')?.removeAttribute('hidden');
  }
}

// ── Bootstrap ─────────────────────────────────────────────
async function init() {
  initHeader();
  bindSearch();
  bindOrder();

  showSkeletons(8);

  try {
    // Fetch song song — api.js cache sẵn, lần sau trả ngay
    const [products, certs] = await Promise.all([getProducts(), getCertifications()]);
    applyData(products, certs);
  } catch {
    const grid = document.getElementById('product-grid');
    if (grid) grid.innerHTML = `
      <p class="error-msg">Không thể tải sản phẩm.
        <br><button onclick="location.reload()"
          style="margin-top:12px;padding:8px 20px;background:#2e7d52;
                 color:#fff;border:none;border-radius:20px;cursor:pointer">
          🔄 Thử lại</button></p>`;
  }
}

function applyData(products, certs) {
  allProducts = products;
  allCerts    = {};
  certs.forEach(c => { allCerts[c.id] = c; });
  renderFilters(certs);
  renderProducts(allProducts);
}

// ── Skeleton ──────────────────────────────────────────────
function showSkeletons(n) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  grid.innerHTML = Array(n).fill(`
    <div class="skeleton-card">
      <div class="sk sk-img"></div>
      <div class="sk-body">
        <div class="sk sk-title"></div>
        <div class="sk sk-line"></div>
        <div class="sk sk-line short"></div>
        <div class="sk sk-footer">
          <div class="sk sk-price"></div>
          <div class="sk sk-btn"></div>
        </div>
      </div>
    </div>`).join('');
}

// ── Filters ───────────────────────────────────────────────
function renderFilters(certs) {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;
  const newBar = bar.cloneNode(false);
  bar.parentNode.replaceChild(newBar, bar);
  newBar.innerHTML =
    `<button class="filter-btn active" data-id="all">Tất cả</button>` +
    certs.map(c => `<button class="filter-btn" data-id="${escHtml(c.id)}">${escHtml(c.name)}</button>`).join('');
  newBar.addEventListener('click', e => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    newBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.id;
    applyFilters();
  });
}

// ── Search ────────────────────────────────────────────────
function bindSearch() {
  document.getElementById('search-input')
    ?.addEventListener('input', debounce(applyFilters, 200));
  document.querySelector('.btn-search')
    ?.addEventListener('click', applyFilters);
}

// ── Order ─────────────────────────────────────────────────
function bindOrder() {
  document.addEventListener('click', e => {
    if (e.target.closest('.btn-order')) {
      openOrderModal(e.target.closest('.product-card')?.dataset.name ?? '');
    }
  });
  document.getElementById('order-close')
    ?.addEventListener('click', closeOrderModal);
  document.querySelector('.modal-cancel')
    ?.addEventListener('click', closeOrderModal);
  document.getElementById('order-form')
    ?.addEventListener('submit', handleOrder);
}

function openOrderModal(name) {
  document.getElementById('order-product-name').textContent = name;
  document.getElementById('order-modal').classList.add('active');
}
function closeOrderModal() {
  document.getElementById('order-modal').classList.remove('active');
  document.getElementById('order-form')?.reset();
}
function handleOrder(e) {
  e.preventDefault();
  if (!getCurrentUser()) { closeOrderModal(); window.location.href = 'auth.html'; return; }
  const name    = document.getElementById('order-name').value.trim();
  const phone   = document.getElementById('order-phone').value.trim();
  const product = document.getElementById('order-product-name').textContent;
  if (!name || !phone) return;
  closeOrderModal();
  const el = document.getElementById('success-msg');
  if (el) {
    el.textContent = `Cảm ơn ${name}! Đơn hàng "${product}" đã được ghi nhận.`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }
}

// ── Render ────────────────────────────────────────────────
function applyFilters() {
  const q = (document.getElementById('search-input')?.value ?? '').toLowerCase().trim();
  let list = allProducts;
  if (activeFilter !== 'all')
    list = list.filter(p => String(p.certificationId) === String(activeFilter));
  if (q)
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.origin ?? '').toLowerCase().includes(q));
  renderProducts(list);
}

function renderProducts(list) {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = '<p class="empty-msg">Không tìm thấy sản phẩm phù hợp.</p>';
    return;
  }
  grid.innerHTML = list.map(p => {
    const cert   = allCerts[p.certificationId];
    const imgSrc = getProductImage(p.name, p.image);
    return `
      <article class="product-card" data-name="${escHtml(p.name)}">
        <div class="card-img-wrap">
          <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}"
               loading="lazy" decoding="async" width="640" height="480"
               onerror="this.src='https://picsum.photos/seed/eco/640/480';this.onerror=null">
          ${cert ? `<div class="card-badge">${badgeHTML(cert)}</div>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-title">${escHtml(p.name)}</h3>
          <p class="card-origin">📍 ${escHtml(p.origin ?? '')}</p>
          <p class="card-desc">${escHtml(p.description ?? '')}</p>
          <div class="card-footer">
            <span class="card-price">${formatPrice(p.price)}</span>
            <button class="btn-order">Đặt hàng</button>
          </div>
        </div>
      </article>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', init);