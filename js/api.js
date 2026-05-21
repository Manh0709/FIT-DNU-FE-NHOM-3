// api.js — Centralized API calls (localStorage cache + chống 429)

const API = {
  products:       'https://6a06d7ccc83ba8ad9b3df75f.mockapi.io/api/v1/products',
  suppliers:      'https://6a06d7ccc83ba8ad9b3df75f.mockapi.io/api/v1/suppliers',
  certifications: 'https://69fc38acfce564e2591784fc.mockapi.io/api/v1/certifications',
};

const TTL         = 10 * 60_000; 
const BACKOFF_TTL = 60_000;      
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

// ── 429 backoff tracker ───────────────────────────────────
const _blocked = new Map();

function isBlocked(url) {
  const ts = _blocked.get(url);
  if (!ts) return false;
  if (Date.now() - ts > BACKOFF_TTL) { _blocked.delete(url); return false; }
  return true;
}
function setBlocked(url) {
  _blocked.set(url, Date.now());
}

// ── Queue giải nghẽn ──────────────────────────────────────
let _queue = Promise.resolve();
const sleep = ms => new Promise(r => setTimeout(r, ms));

function enqueue(fn) {
  const result = _queue.then(fn);
  _queue = result.then(() => sleep(QUEUE_GAP), () => sleep(QUEUE_GAP));
  return result;
}

// ── Fetch an toàn ─────────────────────────────────────────
async function fetchWithRetry(url, options, isGet) {
  if (isGet && isBlocked(url)) {
    throw new Error('Hệ thống đang bận, vui lòng thử lại sau ít phút.');
  }

  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });

    if (res.status === 429) {
      if (isGet) setBlocked(url);
      throw new Error('Server quá tải (429). Đang chuyển hướng dữ liệu an toàn.');
    }

    if (!res.ok) {
      throw new Error(`Lỗi HTTP ${res.status}`);
    }

    const data = await res.json();
    if (isGet) lsSet(url, data);
    return data;

  } catch (error) {
    throw error;
  }
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