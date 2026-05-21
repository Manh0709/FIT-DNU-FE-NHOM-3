// cart.js — Giỏ hàng EcoShop (localStorage)

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
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
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

// ── Modal ─────────────────────────────────────────────────
export function openCartModal() {
  renderCartModal();
  document.getElementById('cart-modal')?.classList.add('active');
}
export function closeCartModal() {
  document.getElementById('cart-modal')?.classList.remove('active');
}

function renderCartModal() {
  const cart = getCart();
  const body = document.getElementById('cart-body');
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

  // Bind buttons
  body.querySelectorAll('.qty-minus').forEach(btn =>
    btn.addEventListener('click', () => { updateQty(btn.dataset.id, getCart().find(i=>i.id===btn.dataset.id)?.qty - 1); renderCartModal(); }));
  body.querySelectorAll('.qty-plus').forEach(btn =>
    btn.addEventListener('click', () => { updateQty(btn.dataset.id, getCart().find(i=>i.id===btn.dataset.id)?.qty + 1); renderCartModal(); }));
  body.querySelectorAll('.cart-item-remove').forEach(btn =>
    btn.addEventListener('click', () => { removeFromCart(btn.dataset.id); renderCartModal(); }));
}

// ── Init (gắn sự kiện cart icon + close) ─────────────────
export function initCart() {
  updateCartBadge();
  document.getElementById('cart-icon-btn')?.addEventListener('click', openCartModal);
  document.getElementById('cart-close')?.addEventListener('click', closeCartModal);
  document.getElementById('cart-clear')?.addEventListener('click', () => { clearCart(); renderCartModal(); });
  document.getElementById('cart-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('cart-modal')) closeCartModal();
  });
  window.addEventListener('cartUpdated', updateCartBadge);
}