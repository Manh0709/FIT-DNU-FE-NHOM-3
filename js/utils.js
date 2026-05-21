// utils.js — Shared utility functions

/** Format price as Vietnamese Dong */
export function formatPrice(price) {
  return Number(price).toLocaleString('vi-VN') + ' ₫';
}

/** Badge colour map from certificationId → CSS class */
export const BADGE_COLOR_MAP = { green: 'badge-green', blue: 'badge-blue', orange: 'badge-orange' };

/** Return badge HTML given a certification object */
export function badgeHTML(cert) {
  if (!cert) return '';
  const cls = BADGE_COLOR_MAP[cert.badgeColor] || 'badge-green';
  return `<span class="badge ${cls}">★ ${cert.name}</span>`;
}

/** Build a simple toast notification */
export function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/** Debounce helper */
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

/** Simple modal helper — opens/closes a dialog-like overlay */
export function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
export function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

/**
 * Map Vietnamese product keywords → Picsum photo seed IDs (stable, no redirect).
 * Picsum Photos: https://picsum.photos/seed/{seed}/640/480
 * Seeds are chosen to visually match each product category.
 */
const KEYWORD_MAP = [
  { vi: ['ống hút', 'hút tre'],          seed: 'bamboo1' },
  { vi: ['túi vải', 'canvas'],           seed: 'fabric2' },
  { vi: ['túi'],                         seed: 'bag3' },
  { vi: ['bàn chải', 'đánh răng'],       seed: 'brush4' },
  { vi: ['xà bông', 'xà phòng', 'soap'], seed: 'soap5' },
  { vi: ['hộp bã mía', 'bã mía'],        seed: 'box6' },
  { vi: ['bình nước', 'thủy tinh'],      seed: 'bottle7' },
  { vi: ['mút rửa', 'xơ mướp'],          seed: 'sponge8' },
  { vi: ['thìa', 'muỗng', 'gỗ dừa'],    seed: 'spoon9' },
  { vi: ['khăn tay', 'sợi tre'],         seed: 'cloth10' },
  { vi: ['sáp ong', 'bọc thực phẩm'],   seed: 'wax11' },
  { vi: ['lược', 'gỗ đào'],              seed: 'comb12' },
  { vi: ['tinh dầu', 'sả', 'chanh'],     seed: 'oil13' },
  { vi: ['dép cói', 'dép', 'cói'],       seed: 'slipper14' },
  { vi: ['sổ tay', 'giấy tái chế'],      seed: 'notebook15' },
  { vi: ['hộp gỗ', 'hộp'],              seed: 'wood16' },
  { vi: ['cây xanh', 'cây'],             seed: 'plant17' },
  { vi: ['trà', 'chè'],                  seed: 'tea18' },
  { vi: ['mật ong'],                     seed: 'honey19' },
  { vi: ['nến', 'thơm'],                seed: 'candle20' },
  { vi: ['túi lưới', 'lưới'],           seed: 'mesh21' },
];

/**
 * Given a product name (Vietnamese), return a stable Picsum image URL.
 * Uses name-based seed for deterministic results — no random redirects.
 */
export function getProductImage(name = '', existingUrl = '') {
  // Keep existing URL unless it's from broken sources
  if (existingUrl &&
      !existingUrl.includes('loremflickr.com') &&
      !existingUrl.includes('source.unsplash.com')) {
    return existingUrl;
  }

  const lower = name.toLowerCase();
  const match = KEYWORD_MAP.find(({ vi }) => vi.some(kw => lower.includes(kw)));
  // Use product name as seed for consistent image per product
  const seed = match ? match.seed : encodeURIComponent(name.slice(0, 20) || 'eco');
  return `https://picsum.photos/seed/${seed}/640/480`;
}

/** Escape HTML to prevent XSS */
export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}