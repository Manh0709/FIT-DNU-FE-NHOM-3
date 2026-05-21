// header.js — Chỉ dùng cho admin.html (yêu cầu đăng nhập)
import { getCurrentUser, logout, requireAuth } from './auth.js';

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Dùng cho admin.html — bắt buộc phải là admin
export function initHeader(requireAdmin = false) {
  const user = requireAuth(requireAdmin);
  if (!user) return null;

  const nav = document.querySelector('.header-nav');
  if (!nav) return user;

  const badge = document.createElement('div');
  badge.className = 'header-user';
  badge.innerHTML = `
    <span class="header-username" title="${escHtml(user.email)}">
      👤 ${escHtml(user.name || user.email)}
    </span>
    <button class="btn-logout" id="btn-logout">Đăng xuất</button>
  `;
  nav.appendChild(badge);
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) logout();
  });
  return user;
}