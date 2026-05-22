// product.js — Trang chi tiết sản phẩm
import { getProduct, getCertifications } from './api.js';
import { badgeHTML, escHtml, getProductImage, formatPrice } from './utils.js';
import { getCurrentUser, logout } from './auth.js';
import { addToCart, initCart } from './cart.js';

let qty = 1;

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
    if (user.role === 'admin')
      document.getElementById('nav-admin-link')?.removeAttribute('hidden');
  }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  initHeader();
  initCart();

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { showError(); return; }

  // FIX: tách riêng 2 request thay vì Promise.all
  // Nếu getCertifications() bị 429, sản phẩm vẫn hiển thị bình thường (chỉ mất badge)
  let product = null;
  let certs   = [];

  try {
    product = await getProduct(id);
  } catch (err) {
    console.error('[product.js] Lỗi lấy sản phẩm:', err);
    showError();
    return;
  }

  if (!product || !product.id) {
    console.warn('[product.js] Không có dữ liệu sản phẩm cho id:', id);
    showError();
    return;
  }

  try {
    certs = await getCertifications();
  } catch (err) {
    // Không nghiêm trọng — thiếu badge thôi
    console.warn('[product.js] Không lấy được certifications:', err);
    certs = [];
  }

  renderProduct(product, certs);
}

function renderProduct(p, certs) {
  // FIX: dùng == thay vì === để tránh lỗi string vs number từ MockAPI
  const cert   = certs.find(c => String(c.id) === String(p.certificationId));
  const imgSrc = getProductImage(p.name, p.image);

  // Breadcrumb
  document.getElementById('breadcrumb-name').textContent = p.name;
  document.title = `${p.name} — EcoShop`;

  // Ảnh
  const img = document.getElementById('detail-img');
  img.src = imgSrc;
  img.alt = p.name;

  // Badge
  if (cert) {
    document.getElementById('detail-badge-wrap').innerHTML = badgeHTML(cert);
  }

  // Thông tin
  document.getElementById('detail-name').textContent  = p.name;
  document.getElementById('detail-price').textContent = formatPrice(p.price);
  document.getElementById('detail-desc').textContent  = p.description || 'Chưa có mô tả.';
  document.getElementById('detail-origin').innerHTML  = p.origin ? `📍 ${escHtml(p.origin)}` : '';
  document.getElementById('detail-cert').innerHTML    = cert ? badgeHTML(cert) : '';

  // Hiện nội dung, ẩn skeleton
  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-content').style.display  = 'flex';

  // Qty control
  document.getElementById('qty-minus').addEventListener('click', () => {
    if (qty > 1) { qty--; document.getElementById('qty-value').textContent = qty; }
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    qty++;
    document.getElementById('qty-value').textContent = qty;
  });

  // Thêm vào giỏ
  document.getElementById('btn-add-cart-detail').addEventListener('click', () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: p.id, name: p.name, price: p.price, imgSrc });
    }
    const btn = document.getElementById('btn-add-cart-detail');
    btn.textContent = '✅ Đã thêm vào giỏ!';
    setTimeout(() => { btn.textContent = '🛒 Thêm vào giỏ hàng'; }, 1500);
  });

  // Mua ngay → thêm vào giỏ rồi mở giỏ
  document.getElementById('btn-buy-now').addEventListener('click', () => {
    for (let i = 0; i < qty; i++) {
      addToCart({ id: p.id, name: p.name, price: p.price, imgSrc });
    }
    document.getElementById('cart-icon-btn')?.click();
  });
}

function showError() {
  document.getElementById('product-loading').style.display = 'none';
  document.getElementById('product-error').style.display   = 'block';
}

document.addEventListener('DOMContentLoaded', init);