// api.js — Centralized API calls (localStorage cache + chống 429)

const API = {
  products:       'https://6a06d7ccc83ba8ad9b3df75f.mockapi.io/api/v1/products',
  suppliers:      'https://6a06d7ccc83ba8ad9b3df75f.mockapi.io/api/v1/suppliers',
  certifications: 'https://69fc38acfce564e2591784fc.mockapi.io/api/v1/certifications',
  users:          'https://69fc38acfce564e2591784fc.mockapi.io/api/v1/user',
};

const TTL         = 10 * 60_000; // cache data 10 phút
const BACKOFF_TTL = 60_000;      // nếu bị 429, chờ 60 giây trước khi thử lại
const LS_PREFIX   = 'eco_';
const QUEUE_GAP   = 150;

// ── localStorage cache ────────────────────────────────────
function lsGet(url) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + url);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL) { localStorage.removeItem(LS_PREFIX + url); return null; }
    return data;
  } catch { return null; }
}
function lsSet(url, data) {
  try { localStorage.setItem(LS_PREFIX + url, JSON.stringify({ data, ts: Date.now() })); }
  catch {}
}
export function lsClear(url) {
  try {
    if (url) {
      localStorage.removeItem(LS_PREFIX + url);
      const base = url.replace(/\/[^/]+$/, '');
      localStorage.removeItem(LS_PREFIX + base);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(LS_PREFIX))
        .forEach(k => localStorage.removeItem(k));
    }
  } catch {}
}

// ── 429 backoff tracker (in-memory, reset khi reload) ─────
const _blocked = new Map(); // url → timestamp bị block

function isBlocked(url) {
  const ts = _blocked.get(url);
  if (!ts) return false;
  if (Date.now() - ts > BACKOFF_TTL) { _blocked.delete(url); return false; }
  return true;
}
function setBlocked(url) {
  _blocked.set(url, Date.now());
}

// ── Queue chỉ cho mutations ───────────────────────────────
let _queue = Promise.resolve();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function enqueue(fn) {
  const result = _queue.then(fn);
  _queue = result.then(() => sleep(QUEUE_GAP), () => sleep(QUEUE_GAP));
  return result;
}

// ── Fetch với exponential backoff ─────────────────────────
async function fetchWithRetry(url, options, isGet) {
  // Nếu URL đang trong backoff period, trả lỗi ngay — không spam thêm
  if (isGet && isBlocked(url)) {
    throw new Error('Đang chờ rate limit, thử lại sau.');
  }

  const delays = [0, 1500, 4000]; // 3 lần: ngay, 1.5s, 4s
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await sleep(delays[i]);
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 429) {
      if (isGet) setBlocked(url); // đánh dấu block, không retry nữa
      throw new Error('Quá nhiều request (429). Tự động thử lại sau 60 giây.');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (isGet) lsSet(url, data);
    return data;
  }
  throw new Error('Không thể kết nối, thử lại sau.');
}

async function apiFetch(url, options = {}) {
  const isGet = !options.method || options.method === 'GET';

  if (isGet) {
    const cached = lsGet(url);
    if (cached) return cached;
    return fetchWithRetry(url, options, true);
  }

  return enqueue(async () => {
    lsClear(url);
    return fetchWithRetry(url, options, false);
  });
}

// ── Products ──────────────────────────────────────────────
export const getProducts    = ()      => apiFetch(API.products);
export const getProduct     = id      => apiFetch(`${API.products}/${id}`);
export const createProduct  = d       => apiFetch(API.products, { method: 'POST', body: JSON.stringify(d) });
export const updateProduct  = (id, d) => apiFetch(`${API.products}/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteProduct  = id      => apiFetch(`${API.products}/${id}`, { method: 'DELETE' });

// ── Suppliers ─────────────────────────────────────────────
export const getSuppliers   = ()      => apiFetch(API.suppliers);
export const getSupplier    = id      => apiFetch(`${API.suppliers}/${id}`);
export const createSupplier = d       => apiFetch(API.suppliers, { method: 'POST', body: JSON.stringify(d) });
export const updateSupplier = (id, d) => apiFetch(`${API.suppliers}/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteSupplier = id      => apiFetch(`${API.suppliers}/${id}`, { method: 'DELETE' });

// ── Certifications ────────────────────────────────────────
export const getCertifications   = ()      => apiFetch(API.certifications);
export const getCertification    = id      => apiFetch(`${API.certifications}/${id}`);
export const createCertification = d       => apiFetch(API.certifications, { method: 'POST', body: JSON.stringify(d) });
export const updateCertification = (id, d) => apiFetch(`${API.certifications}/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteCertification = id      => apiFetch(`${API.certifications}/${id}`, { method: 'DELETE' });

// ── Users ─────────────────────────────────────────────────
export const getUsers        = ()      => apiFetch(API.users);
export const getUsersByEmail = (email) => apiFetch(`${API.users}?email=${encodeURIComponent(email)}`);
export const getUser         = id      => apiFetch(`${API.users}/${id}`);
export const registerUser    = d       => apiFetch(API.users, { method: 'POST', body: JSON.stringify(d) });
export const updateUser      = (id, d) => apiFetch(`${API.users}/${id}`, { method: 'PUT', body: JSON.stringify(d) });
export const deleteUser      = id      => apiFetch(`${API.users}/${id}`, { method: 'DELETE' });