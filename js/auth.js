// auth.js — Module chuẩn ES, export đầy đủ cho các file khác import

const STORAGE_KEY  = 'ecoshop_currentUser';
const USERS_DB_KEY = 'ecoshop_local_users';

// ── Khởi tạo DB mặc định ──────────────────────────────────
function initDatabase() {
  if (!localStorage.getItem(USERS_DB_KEY)) {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify([
      { id: '1', name: 'Quản trị viên', email: 'admin@gmail.com', password: 'adminpassword', role: 'admin' },
      { id: '2', name: 'Người dùng Eco', email: 'user@gmail.com',  password: 'git add .',  role: 'user'  },
    ]));
  }
}
initDatabase();

// ── Helpers dùng chung ────────────────────────────────────
export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
  catch { return null; }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = 'auth.html';
}

/**
 * Kiểm tra auth — dùng trong admin.js / header.js
 * Nếu chưa đăng nhập hoặc không đủ quyền → redirect về auth.html
 */
export function requireAuth(requireAdmin = false) {
  const user = getCurrentUser();
  if (!user) { window.location.replace('auth.html'); return null; }
  if (requireAdmin && user.role !== 'admin') { window.location.replace('index.html'); return null; }
  return user;
}

// ── Toast (dùng nội bộ cho trang auth) ───────────────────
function showLocalToast(message, type = 'success') {
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
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2500);
}

// ── Tab switching ─────────────────────────────────────────
function switchTab(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  const tabs = document.querySelectorAll('.auth-tab');
  if (type === 'login'    && tabs[0]) tabs[0].classList.add('active');
  if (type === 'register' && tabs[1]) tabs[1].classList.add('active');
  document.getElementById(`${type}-form`)?.classList.add('active');
}

// ── Đăng nhập ─────────────────────────────────────────────
function doLogin() {
  const email    = document.getElementById('l-email').value.trim().toLowerCase();
  const password = document.getElementById('l-pass').value;
  if (!email || !password) { showLocalToast('Vui lòng nhập đầy đủ Email và Mật khẩu!', 'error'); return; }

  const btn = document.getElementById('btn-login-submit');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang đăng nhập...'; }

  const users = JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [];
  const user  = users.find(u => u.email === email && u.password === password);

  if (!user) {
    showLocalToast('Email hoặc mật khẩu không chính xác!', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Vào cửa hàng'; }
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  showLocalToast('Đăng nhập thành công! Đang chuyển hướng... 🌿');
  // Dùng replace để không lưu auth.html vào history → tránh back về trang login
  setTimeout(() => window.location.replace(user.role === 'admin' ? 'admin.html' : 'index.html'), 400);
}

// ── Đăng ký ───────────────────────────────────────────────
function doRegister() {
  const name     = document.getElementById('r-name').value.trim();
  const email    = document.getElementById('r-email').value.trim().toLowerCase();
  const password = document.getElementById('r-pass').value;
  const confirm  = document.getElementById('r-confirm').value;

  if (!name || !email || !password) { showLocalToast('Vui lòng điền toàn bộ thông tin!', 'error'); return; }
  if (password !== confirm)         { showLocalToast('Mật khẩu xác nhận không trùng khớp!', 'error'); return; }
  if (password.length < 6)          { showLocalToast('Mật khẩu phải ít nhất 6 ký tự!', 'error'); return; }

  const users = JSON.parse(localStorage.getItem(USERS_DB_KEY)) || [];
  if (users.some(u => u.email === email)) { showLocalToast('Email này đã được đăng ký rồi!', 'error'); return; }

  users.push({ id: String(Date.now()), name, email, password, role: 'user' });
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  showLocalToast('Tạo tài khoản thành công! Xin mời đăng nhập.');
  switchTab('login');
  document.getElementById('l-email').value = email;
}

// ── Init trang auth (chỉ chạy nếu có form đăng nhập) ─────
document.addEventListener('DOMContentLoaded', () => {
  // Chỉ chạy logic auth nếu đang ở auth.html
  if (!document.getElementById('btn-login-submit')) return;

  // Nếu đã đăng nhập → đá thẳng ra trang phù hợp
  const current = getCurrentUser();
  if (current) {
    window.location.replace(current.role === 'admin' ? 'admin.html' : 'index.html');
    return;
  }

  document.getElementById('btn-login-submit').onclick    = doLogin;
  document.getElementById('btn-register-submit').onclick = doRegister;

  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
  document.getElementById('go-register')?.addEventListener('click', e => { e.preventDefault(); switchTab('register'); });
  document.getElementById('go-login')?.addEventListener('click',    e => { e.preventDefault(); switchTab('login'); });

  // Hỗ trợ query string ?tab=register
  if (new URLSearchParams(location.search).get('tab') === 'register') switchTab('register');
});