// main.js — EcoShop (load nhanh, không lag)
import { getProducts, getCertifications } from './api.js';
import { formatPrice, badgeHTML, debounce, escHtml, getProductImage } from './utils.js';
import { getCurrentUser, logout } from './auth.js';
import { addToCart, initCart } from './cart.js';

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
  initCart();
  bindSearch();

  showSkeletons(8);

  try {
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
  renderFeaturedSections(allProducts);
  renderProducts(allProducts);
}

// ── Featured Sections ─────────────────────────────────────
function renderFeaturedSections(products) {
  const container = document.getElementById('featured-sections');
  if (!container) return;

  const sale = [], newItems = [], hot = [];
  products.forEach(p => {
    const promo = getPromo(p);
    if (promo?.type === 'sale') sale.push({ ...p, _promo: promo });
    else if (promo?.type === 'new') newItems.push({ ...p, _promo: promo });
    else if (promo?.type === 'hot') hot.push({ ...p, _promo: promo });
  });

  const sections = [
    {
      id: 'section-sale', icon: '🔥', title: 'Đang Giảm Giá',
      sub: 'Ưu đãi có hạn — đừng bỏ lỡ!', items: sale.slice(0, 6), theme: 'theme-sale',
    },
    {
      id: 'section-new', icon: '✨', title: 'Sản Phẩm Mới',
      sub: 'Vừa cập bến — tươi mới mỗi ngày', items: newItems.slice(0, 6), theme: 'theme-new',
    },
    {
      id: 'section-hot', icon: '🌶️', title: 'Đang Được Yêu Thích',
      sub: 'Top sản phẩm bán chạy tuần này', items: hot.slice(0, 6), theme: 'theme-hot',
    },
  ];

  container.innerHTML = sections
    .filter(s => s.items.length > 0)
    .map(s => `
      <section class="featured-section ${s.theme}" id="${s.id}">
        <div class="featured-header">
          <div class="featured-title-group">
            <span class="featured-icon">${s.icon}</span>
            <div>
              <h2 class="featured-title">${s.title}</h2>
              <p class="featured-sub">${s.sub}</p>
            </div>
          </div>
          <button class="featured-see-all" data-section="${s.id}">Xem tất cả →</button>
        </div>
        <div class="featured-scroll-wrap">
          <div class="featured-row" id="${s.id}-row">
            ${s.items.map(p => renderFeaturedCard(p)).join("")}
          </div>
        </div>
      </section>`
    ).join("");

  container.querySelectorAll(".featured-see-all").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  container.querySelectorAll(".btn-featured-cart").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      addToCart({ id: btn.dataset.id, name: btn.dataset.name, price: btn.dataset.price, imgSrc: btn.dataset.img });
      btn.textContent = "✅";
      btn.style.background = "var(--green-700)";
      setTimeout(() => { btn.textContent = "🛒"; btn.style.background = ""; }, 1200);
    });
  });
}

function renderFeaturedCard(p) {
  const imgSrc = getProductImage(p.name, p.image);
  const promo  = p._promo;
  const cert   = allCerts[p.certificationId];

  let priceHTML;
  if (promo?.type === "sale" && promo.discount) {
    const orig = Number(p.price);
    const sale = Math.round(orig * (1 - promo.discount / 100));
    priceHTML = `<span class="fc-price-orig">${formatPrice(orig)}</span><span class="fc-price-sale">${formatPrice(sale)}</span>`;
  } else {
    priceHTML = `<span class="fc-price">${formatPrice(p.price)}</span>`;
  }

  const discountBadge = promo?.type === "sale" && promo.discount
    ? `<div class="fc-discount-badge">-${promo.discount}%</div>` : "";

  const certBadge = cert ? `<div class="fc-cert">${escHtml(cert.name)}</div>` : "";

  return `
    <article class="featured-card" onclick="window.location.href='product.html?id=${escHtml(p.id)}'">
      ${discountBadge}
      <div class="fc-img-wrap">
        <img src="${escHtml(imgSrc)}" alt="${escHtml(p.name)}" loading="lazy"
             onerror="this.src='https://picsum.photos/seed/eco/400/300';this.onerror=null">
        ${certBadge}
      </div>
      <div class="fc-body">
        <h3 class="fc-name">${escHtml(p.name)}</h3>
        <p class="fc-origin">📍 ${escHtml(p.origin ?? "")}</p>
        <div class="fc-footer">
          <div class="fc-prices">${priceHTML}</div>
          <button class="btn-featured-cart"
            data-id="${escHtml(p.id)}"
            data-name="${escHtml(p.name)}"
            data-price="${escHtml(String(p.price))}"
            data-img="${escHtml(imgSrc)}">🛒</button>
        </div>
      </div>
    </article>`;
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

// ── Promo helpers ─────────────────────────────────────────
/**
 * Deterministic promo assignment based on product id hash.
 * ~30% of products get a promo tag; distribution: SALE 40%, NEW 30%, HOT 20%, ECO 10%
 */
function getPromo(p) {
  // Use a simple hash of the product id for determinism
  let h = 0;
  const s = String(p.id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  if (h % 10 >= 3) return null; // ~70% no promo
  const r = h % 100;
  if (r < 40) return { type: 'sale', label: '🔥 SALE', ribbonClass: 'ribbon-sale', tagClass: 'tag-sale', discount: 10 + (h % 3) * 5 };
  if (r < 70) return { type: 'new',  label: '✨ MỚI',  ribbonClass: 'ribbon-new',  tagClass: 'tag-new'  };
  if (r < 90) return { type: 'hot',  label: '🔥 HOT',  ribbonClass: 'ribbon-hot',  tagClass: 'tag-hot'  };
  return           { type: 'eco',  label: '🌿 ECO',  ribbonClass: 'ribbon-eco',  tagClass: 'tag-eco'  };
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
    const promo  = getPromo(p);

    // Price display
    let priceHTML;
    if (promo?.type === 'sale' && promo.discount) {
      const orig  = Number(p.price);
      const sale  = Math.round(orig * (1 - promo.discount / 100));
      priceHTML = `
        <div class="price-wrap">
          <span class="price-original">${formatPrice(orig)}</span>
          <span class="card-price price-sale">${formatPrice(sale)}</span>
        </div>`;
    } else {
      priceHTML = `<span class="card-price">${formatPrice(p.price)}</span>`;
    }

    // Promo tag next to price
    const tagHTML = promo
      ? `<span class="promo-tag ${promo.tagClass}">${promo.label}${promo.discount ? ` -${promo.discount}%` : ''}</span>`
      : '';

    // Ribbon corner
    const ribbonHTML = promo
      ? `<div class="promo-ribbon ${promo.ribbonClass}">${promo.discount ? `-${promo.discount}%` : promo.label.replace(/[^\w ]/g,'').trim()}</div>`
      : '';

    return `
      <article class="product-card" data-id="${escHtml(p.id)}" data-name="${escHtml(p.name)}" onclick="if(!event.target.closest('.btn-add-cart'))window.location.href='product.html?id=${escHtml(p.id)}'">
        ${ribbonHTML}
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
            <div class="card-price-area">
              ${priceHTML}
              ${tagHTML}
            </div>
            <button class="btn-add-cart"
              data-id="${escHtml(p.id)}"
              data-name="${escHtml(p.name)}"
              data-price="${escHtml(String(p.price))}"
              data-img="${escHtml(imgSrc)}">
              🛒 Thêm vào giỏ
            </button>
          </div>
        </div>
      </article>`;
  }).join('');

  // Bind add to cart
  grid.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart({
        id:     btn.dataset.id,
        name:   btn.dataset.name,
        price:  btn.dataset.price,
        imgSrc: btn.dataset.img,
      });
      // Hiệu ứng feedback
      btn.textContent = '✅ Đã thêm!';
      btn.style.background = 'var(--green-700)';
      setTimeout(() => {
        btn.textContent = '🛒 Thêm vào giỏ';
        btn.style.background = '';
      }, 1200);
    });
  });
}

// ── Welcome Modal ─────────────────────────────────────────
function showWelcomeModal() {
  const DISMISSED_KEY = 'ecoshop_welcome_dismissed';
  if (localStorage.getItem(DISMISSED_KEY)) return;

  const overlay = document.createElement('div');
  overlay.className = 'welcome-overlay';
  overlay.id = 'welcome-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Chào mừng đến với EcoShop');

  overlay.innerHTML = `
    <div class="welcome-box">
      <div class="welcome-banner">
        <button class="welcome-close" id="welcome-close" aria-label="Đóng">✕</button>
        <div class="welcome-leaves">
          <span class="welcome-leaf">🌿</span>
          <span class="welcome-leaf">🌱</span>
          <span class="welcome-leaf">🍃</span>
          <span class="welcome-leaf">🌾</span>
          <span class="welcome-leaf">🌿</span>
        </div>
        <h2 class="welcome-title">Chào mừng đến<br><em>EcoShop</em> 🌏</h2>
        <p class="welcome-subtitle">Nơi mua sắm xanh — vì một Việt Nam bền vững hơn</p>
      </div>
      <div class="welcome-body">
        <div class="welcome-features">
          <div class="welcome-feature">
            <span class="welcome-feature-icon">🌿</span>
            <div class="welcome-feature-text">
              <strong>100% Hữu cơ</strong>
              <span>Sản phẩm có chứng nhận chất lượng rõ ràng</span>
            </div>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">📦</span>
            <div class="welcome-feature-text">
              <strong>Giao toàn quốc</strong>
              <span>Đóng gói thân thiện môi trường</span>
            </div>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">✅</span>
            <div class="welcome-feature-text">
              <strong>Nguồn gốc rõ ràng</strong>
              <span>Biết rõ xuất xứ từng sản phẩm</span>
            </div>
          </div>
          <div class="welcome-feature">
            <span class="welcome-feature-icon">💚</span>
            <div class="welcome-feature-text">
              <strong>Thân thiện môi trường</strong>
              <span>Mỗi đơn hàng góp 1 cây xanh</span>
            </div>
          </div>
        </div>
        <div class="welcome-cta-group">
          <button class="btn-welcome-primary" id="welcome-shop">🛒 Khám phá ngay</button>
          <button class="btn-welcome-secondary" id="welcome-register">📝 Đăng ký miễn phí</button>
        </div>
        <label class="welcome-no-show">
          <input type="checkbox" id="welcome-no-show-chk">
          Không hiển thị lại lần sau
        </label>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  function closeWelcome() {
    if (document.getElementById('welcome-no-show-chk')?.checked) {
      localStorage.setItem(DISMISSED_KEY, '1');
    }
    overlay.classList.add('closing');
    setTimeout(() => overlay.remove(), 450);
  }

  overlay.querySelector('#welcome-close').addEventListener('click', closeWelcome);
  overlay.querySelector('#welcome-shop').addEventListener('click', closeWelcome);
  overlay.querySelector('#welcome-register').addEventListener('click', () => {
    closeWelcome();
    setTimeout(() => { window.location.href = 'auth.html?tab=register'; }, 150);
  });
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeWelcome();
  });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { closeWelcome(); document.removeEventListener('keydown', esc); }
  });
}

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', () => {
  // Hiện modal sau khi trang load xong một chút để không chặn render
  setTimeout(showWelcomeModal, 600);
});