// auth.js — Authentication logic for EcoShop
import { getUsers, getUsersByEmail, registerUser } from './api.js';
import { showToast } from './utils.js';

const STORAGE_KEY = 'ecoshop_currentUser';

// ── Session helpers ───────────────────────────────────────
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}
export function setCurrentUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('eco_products');
  localStorage.removeItem('eco_certs');
  window.location.replace('auth.html');
}

// Guard chỉ dùng cho admin.html
export function requireAuth(requireAdmin = false) {
  const user = getCurrentUser();
  if (!user) {
    // Chỉ redirect nếu đang KHÔNG ở auth.html
    if (!window.location.pathname.includes('auth')) {
      window.location.replace('auth.html');
    }
    return null;
  }
  if (requireAdmin && user.role !== 'admin') {
    showToast('Bạn không có quyền truy cập!', 'error');
    setTimeout(() => { window.location.replace('index.html'); }, 1200);
    return null;
  }
  return user;
}

// ── Tab switching ─────────────────────────────────────────
function switchTab(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.auth-tab')[type === 'login' ? 0 : 1]?.classList.add('active');
  document.getElementById(`${type}-form`)?.classList.add('active');
}

// ── Password toggle ───────────────────────────────────────
function bindPasswordToggles() {
  document.querySelectorAll('.pass-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? '🙈' : '👁';
    });
  });
}

// ── Register ──────────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const name     = document.getElementById('r-name').value.trim();
  const email    = document.getElementById('r-email').value.trim().toLowerCase();
  const password = document.getElementById('r-pass').value;
  const confirm  = document.getElementById('r-confirm').value;

  if (!name)                return showToast('Vui lòng nhập họ tên!', 'error');
  if (password.length < 6)  return showToast('Mật khẩu phải có ít nhất 6 ký tự!', 'error');
  if (password !== confirm)  return showToast('Mật khẩu xác nhận không khớp!', 'error');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Đang xử lý…';
  try {
    const users = await getUsers();
    if (users.some(u => u.email?.toLowerCase() === email))
      return showToast('Email này đã được đăng ký!', 'error');
    await registerUser({ name, email, password, role: 'user' });
    showToast('Đăng ký thành công! Vui lòng đăng nhập.');
    e.target.reset();
    switchTab('login');
    document.getElementById('l-email').value = email;
  } catch { showToast('Lỗi server, vui lòng thử lại!', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Tạo tài khoản'; }
}

// ── Login ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('l-email').value.trim().toLowerCase();
  const password = document.getElementById('l-pass').value;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = 'Đang kiểm tra…';
  try {
    // Tìm theo email để tránh fetch toàn bộ danh sách
    const users = await getUsersByEmail(email);
    const user  = users.find(u => u.email?.toLowerCase() === email && u.password === password);
    if (!user) return showToast('Email hoặc mật khẩu không đúng!', 'error');
    setCurrentUser(user);
    showToast(`Chào mừng, ${user.name || user.email}! 🌿`);
    setTimeout(() => {
      window.location.replace(user.role === 'admin' ? 'admin.html' : 'index.html');
    }, 800);
  } catch { showToast('Lỗi đăng nhập, vui lòng thử lại!', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Vào cửa hàng'; }
}

// ── Init (chỉ chạy trên auth.html) ───────────────────────
async function init() {
  const user = getCurrentUser();
  if (user) {
    window.location.replace(user.role === 'admin' ? 'admin.html' : 'index.html');
    return;
  }

  document.querySelectorAll('.auth-tab').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  document.getElementById('go-register')?.addEventListener('click', e => { e.preventDefault(); switchTab('register'); });
  document.getElementById('go-login')?.addEventListener('click',    e => { e.preventDefault(); switchTab('login'); });
  document.getElementById('register-form')?.addEventListener('submit', handleRegister);
  document.getElementById('login-form')?.addEventListener('submit',    handleLogin);
  bindPasswordToggles();

  const params = new URLSearchParams(window.location.search);
  if (params.get('tab') === 'register') switchTab('register');
}

document.addEventListener('DOMContentLoaded', () => { init(); });