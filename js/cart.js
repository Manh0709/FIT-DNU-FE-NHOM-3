// cart.js — Giỏ hàng EcoShop (localStorage)
import { getCurrentUser } from './auth.js';
import { createOrder, ORDER_STATUS } from './orders.js';

const CART_KEY = 'ecoshop_cart';

// ── Đọc/ghi cart ──────────────────────────────────────────
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

// ── CRUD ──────────────────────────────────────────────────
export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.qty += 1; }
  else { cart.push({ ...product, qty: 1 }); }
  saveCart(cart);
}

export function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

export function updateQty(id, qty) {
  if (qty < 1) { removeFromCart(id); return; }
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) { item.qty = qty; saveCart(cart); }
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

// ── Badge ─────────────────────────────────────────────────
export function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

// ── Modal giỏ hàng ────────────────────────────────────────
export function openCartModal() {
  renderCartModal();
  document.getElementById('cart-modal')?.classList.add('active');
}
export function closeCartModal() {
  document.getElementById('cart-modal')?.classList.remove('active');
}

function renderCartModal() {
  const cart   = getCart();
  const body   = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  if (!body) return;

  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">🛒<p>Giỏ hàng trống</p><span>Hãy thêm sản phẩm vào giỏ!</span></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  body.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <img src="${item.imgSrc || 'https://picsum.photos/seed/eco/80/60'}"
           onerror="this.src='https://picsum.photos/seed/eco/80/60'" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${Number(item.price).toLocaleString('vi-VN')} ₫</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
      </div>
      <div class="cart-item-subtotal">${(Number(item.price) * item.qty).toLocaleString('vi-VN')} ₫</div>
      <button class="cart-item-remove" data-id="${item.id}">✕</button>
    </div>
  `).join('');

  document.getElementById('cart-total').textContent =
    getCartTotal().toLocaleString('vi-VN') + ' ₫';

  body.querySelectorAll('.qty-minus').forEach(btn =>
    btn.addEventListener('click', () => { updateQty(btn.dataset.id, getCart().find(i=>i.id===btn.dataset.id)?.qty - 1); renderCartModal(); }));
  body.querySelectorAll('.qty-plus').forEach(btn =>
    btn.addEventListener('click', () => { updateQty(btn.dataset.id, getCart().find(i=>i.id===btn.dataset.id)?.qty + 1); renderCartModal(); }));
  body.querySelectorAll('.cart-item-remove').forEach(btn =>
    btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); renderCartModal(); }));
}

// ── Modal checkout (form địa chỉ) ─────────────────────────
function openCheckoutModal() {
  let modal = document.getElementById('checkout-modal');
  if (!modal) {
    modal = buildCheckoutModal();
    document.body.appendChild(modal);
  }
  // Reset form
  modal.querySelector('#co-phone').value   = '';
  modal.querySelector('#co-address').value = '';
  modal.querySelector('#co-note').value    = '';
  modal.querySelector('.co-error').textContent = '';

  // Điền sẵn tóm tắt đơn
  const cart  = getCart();
  const total = getCartTotal();
  const summary = modal.querySelector('.co-summary');
  summary.innerHTML = cart.map(i =>
    `<div class="co-item">
      <span>${i.name} × ${i.qty}</span>
      <span>${(Number(i.price)*i.qty).toLocaleString('vi-VN')} ₫</span>
    </div>`
  ).join('') +
  `<div class="co-item co-total-row">
    <strong>Tổng cộng</strong>
    <strong>${total.toLocaleString('vi-VN')} ₫</strong>
  </div>`;

  closeCartModal();
  modal.classList.add('active');
}

function buildCheckoutModal() {
  const modal = document.createElement('div');
  modal.id        = 'checkout-modal';
  modal.className = 'modal-overlay';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.innerHTML = `
    <div class="modal-box checkout-modal-box">
      <div class="modal-header">
        <h3>📦 Thông tin giao hàng</h3>
        <button id="checkout-close" class="modal-close" aria-label="Đóng">✕</button>
      </div>
      <div class="co-body">
        <div class="co-summary"></div>
        <div class="co-form">
          <div class="form-group">
            <label for="co-phone">Số điện thoại *</label>
            <input id="co-phone" type="tel" placeholder="VD: 0912 345 678" maxlength="15">
          </div>
          <div class="form-group">
            <label for="co-address">Địa chỉ giao hàng *</label>
            <input id="co-address" type="text" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố">
          </div>
          <div class="form-group">
            <label for="co-note">Ghi chú (tuỳ chọn)</label>
            <textarea id="co-note" rows="2" placeholder="VD: Giao buổi sáng, gọi trước 30 phút…"></textarea>
          </div>
          <p class="co-error" style="color:#c0392b;font-size:.85rem;margin-top:4px"></p>
        </div>
      </div>
      <div class="modal-footer-actions">
        <button id="checkout-cancel" class="btn-secondary">← Quay lại</button>
        <button id="checkout-submit" class="btn-primary">✅ Xác nhận đặt hàng</button>
      </div>
    </div>`;

  // Events
  modal.querySelector('#checkout-close').addEventListener('click', () => modal.classList.remove('active'));
  modal.querySelector('#checkout-cancel').addEventListener('click', () => {
    modal.classList.remove('active');
    openCartModal();
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
  modal.querySelector('#checkout-submit').addEventListener('click', () => submitOrder(modal));

  return modal;
}

function submitOrder(modal) {
  const user    = getCurrentUser();
  const phone   = modal.querySelector('#co-phone').value.trim();
  const address = modal.querySelector('#co-address').value.trim();
  const note    = modal.querySelector('#co-note').value.trim();
  const errEl   = modal.querySelector('.co-error');

  if (!phone)   { errEl.textContent = '⚠️ Vui lòng nhập số điện thoại.'; return; }
  if (!address) { errEl.textContent = '⚠️ Vui lòng nhập địa chỉ giao hàng.'; return; }
  errEl.textContent = '';

  const cart  = getCart();
  const total = getCartTotal();

  createOrder({ user, items: cart, total, address, phone, note });
  clearCart();
  modal.classList.remove('active');
  showSuccessToast(`✅ Đặt hàng thành công! Cảm ơn ${user.name || 'bạn'} 🌿 Đơn hàng sẽ được giao đến: ${address}`);
}

function showSuccessToast(msg) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast toast-success';
  toast.textContent = msg;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 5000);
}

// ── Checkout handler ──────────────────────────────────────
function handleCheckout() {
  const user = getCurrentUser();
  if (!user) { window.location.href = 'auth.html'; return; }
  openCheckoutModal();
}

// ── Init ──────────────────────────────────────────────────
export function initCart() {
  updateCartBadge();
  document.getElementById('cart-icon-btn')?.addEventListener('click', openCartModal);
  document.getElementById('cart-close')?.addEventListener('click', closeCartModal);
  document.getElementById('cart-clear')?.addEventListener('click', () => { clearCart(); renderCartModal(); });
  document.getElementById('cart-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('cart-modal')) { closeCartModal(); return; }
    if (e.target.closest('#btn-checkout')) handleCheckout();
  });
  // Re-render modal nếu đang mở khi giỏ hàng thay đổi (VD: thêm item 2 trong khi modal đang hiển thị)
  window.addEventListener('cartUpdated', () => {
    updateCartBadge();
    if (document.getElementById('cart-modal')?.classList.contains('active')) {
      renderCartModal();
    }
  });
}