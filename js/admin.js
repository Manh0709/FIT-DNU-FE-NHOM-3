// admin.js — Admin panel nâng cao cho EcoShop
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCertifications, createCertification, updateCertification, deleteCertification,
} from './api.js';
import { formatPrice, showToast, escHtml, openModal, closeModal, getProductImage } from './utils.js';
import { requireAuth, logout } from './auth.js';

// ── State ─────────────────────────────────────────────────
const state = {
  products: [], suppliers: [], certifications: [],
  editingId: null, activeTab: 'dashboard',
  loaded: { products: false, suppliers: false, certs: false },
  sort: { products: { col: null, dir: 1 }, suppliers: { col: null, dir: 1 } },
  search: { products: '', suppliers: '', certs: '' },
};

// ── Auth ──────────────────────────────────────────────────
async function init() {
  const user = requireAuth(true);
  if (!user) return;

  // Inject user info vào sidebar
  const nameEl = document.getElementById('sidebar-name');
  if (nameEl) nameEl.textContent = user.name || user.email;

  document.getElementById('btn-logout')?.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) logout();
  });

  initSidebarNav();
  bindModals();
  bindSearch();
  bindImagePreview();
  bindExport();

  await loadAll();
}

async function loadAll() {
  await Promise.all([loadProducts(), loadSuppliers(), loadCertifications()]);
  renderDashboard();
}

// ── Sidebar navigation ────────────────────────────────────
const TAB_TITLES = {
  dashboard: '📊 Bảng điều khiển',
  products:  '🌿 Sản phẩm',
  suppliers: '🏭 Nhà cung cấp',
  certs:     '🏆 Chứng nhận',
};

function initSidebarNav() {
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.sidebar-link[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = TAB_TITLES[tab] || tab;
}

// ── Load data ─────────────────────────────────────────────
async function loadProducts() {
  try {
    const [products, certs] = await Promise.all([
      getProducts(),
      state.certifications.length ? Promise.resolve(state.certifications) : getCertifications(),
    ]);
    state.products = products;
    state.certifications = certs;
    state.loaded.products = true;
    renderProducts();
    updateCounts();
  } catch { showToast('Lỗi tải sản phẩm', 'error'); }
}

async function loadSuppliers() {
  try {
    state.suppliers = await getSuppliers();
    state.loaded.suppliers = true;
    renderSuppliers();
    updateCounts();
  } catch { showToast('Lỗi tải nhà cung cấp', 'error'); }
}

async function loadCertifications() {
  try {
    state.certifications = await getCertifications();
    state.loaded.certs = true;
    renderCertifications();
    updateCounts();
  } catch { showToast('Lỗi tải chứng nhận', 'error'); }
}

function updateCounts() {
  const p = document.getElementById('count-products');
  const s = document.getElementById('count-suppliers');
  const c = document.getElementById('count-certs');
  if (p) p.textContent = state.products.length || '—';
  if (s) s.textContent = state.suppliers.length || '—';
  if (c) c.textContent = state.certifications.length || '—';
}

// ── Dashboard ─────────────────────────────────────────────
function renderDashboard() {
  // Stats
  setValue('stat-products', state.products.length);
  setValue('stat-suppliers', state.suppliers.length);
  setValue('stat-certs', state.certifications.length);

  if (state.products.length) {
    const avg = state.products.reduce((s,p) => s + Number(p.price), 0) / state.products.length;
    setValue('stat-avg-price', Math.round(avg).toLocaleString('vi-VN') + ' ₫');
  }

  // Recent products
  const rp = document.getElementById('recent-products');
  if (rp) {
    const certMap = {};
    state.certifications.forEach(c => { certMap[c.id] = c; });
    const recent = [...state.products].reverse().slice(0, 5);
    if (!recent.length) { rp.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light)">Chưa có sản phẩm</div>'; }
    else rp.innerHTML = recent.map(p => {
      const imgSrc = getProductImage(p.name, p.image);
      return `<div class="recent-item">
        <img class="recent-thumb" src="${escHtml(imgSrc)}" onerror="this.src='https://picsum.photos/seed/eco/80/60'" alt="">
        <div class="recent-name">${escHtml(p.name)}</div>
        <div class="recent-price">${formatPrice(p.price)}</div>
      </div>`;
    }).join('');
  }

  // Recent suppliers
  const rs = document.getElementById('recent-suppliers');
  if (rs) {
    const recent = [...state.suppliers].reverse().slice(0, 5);
    if (!recent.length) { rs.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light)">Chưa có nhà cung cấp</div>'; }
    else rs.innerHTML = recent.map(s => `
      <div class="recent-item">
        <div style="font-size:1.2rem">🏭</div>
        <div class="recent-name">${escHtml(s.name)}</div>
        <div style="font-size:.78rem;color:var(--text-light)">${escHtml(s.contact || s.email || '')}</div>
      </div>`).join('');
  }
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Render Products ───────────────────────────────────────
function renderProducts() {
  const tbody = document.querySelector('#products-table tbody');
  if (!tbody) return;

  const certMap = {};
  state.certifications.forEach(c => { certMap[c.id] = c; });

  let list = [...state.products];

  // Search
  const q = state.search.products.toLowerCase().trim();
  if (q) list = list.filter(p =>
    p.name?.toLowerCase().includes(q) || (p.origin ?? '').toLowerCase().includes(q));

  // Sort
  const { col, dir } = state.sort.products;
  if (col) {
    list.sort((a, b) => {
      let av = a[col] ?? '', bv = b[col] ?? '';
      if (col === 'price') { av = Number(av); bv = Number(bv); }
      if (av < bv) return -dir;
      if (av > bv) return dir;
      return 0;
    });
  }

  const footer = document.getElementById('products-footer');
  if (footer) footer.textContent = `${list.length} / ${state.products.length} sản phẩm`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row"><div class="empty-row-inner"><div class="empty-icon">🌿</div><div>${q ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm'}</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const cert = certMap[p.certificationId];
    const imgSrc = getProductImage(p.name, p.image);
    const badgeHtml = cert ? `<span class="badge badge-${cert.badgeColor}">★ ${escHtml(cert.name)}</span>` : '—';
    return `<tr>
      <td><img src="${escHtml(imgSrc)}" class="thumb" alt="" data-preview="${escHtml(imgSrc)}"
               onerror="this.src='https://picsum.photos/seed/eco/80/60'"></td>
      <td class="td-name">${escHtml(p.name)}</td>
      <td class="td-price">${formatPrice(p.price)}</td>
      <td class="td-origin">📍 ${escHtml(p.origin ?? '—')}</td>
      <td>${badgeHtml}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${p.id}" data-type="product" title="Sửa">✏️</button>
        <button class="btn-del"  data-id="${p.id}" data-type="product" data-name="${escHtml(p.name)}" title="Xóa">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Render Suppliers ──────────────────────────────────────
function renderSuppliers() {
  const tbody = document.querySelector('#suppliers-table tbody');
  if (!tbody) return;

  let list = [...state.suppliers];

  const q = state.search.suppliers.toLowerCase().trim();
  if (q) list = list.filter(s =>
    s.name?.toLowerCase().includes(q) || (s.address ?? '').toLowerCase().includes(q));

  const { col, dir } = state.sort.suppliers;
  if (col) list.sort((a, b) => {
    const av = a[col] ?? '', bv = b[col] ?? '';
    if (av < bv) return -dir; if (av > bv) return dir; return 0;
  });

  const footer = document.getElementById('suppliers-footer');
  if (footer) footer.textContent = `${list.length} / ${state.suppliers.length} nhà cung cấp`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row"><div class="empty-row-inner"><div class="empty-icon">🏭</div><div>${q ? 'Không tìm thấy' : 'Chưa có nhà cung cấp'}</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td class="td-name">${escHtml(s.name)}</td>
      <td class="td-origin">📍 ${escHtml(s.address ?? '—')}</td>
      <td>${escHtml(s.contact ?? '—')}</td>
      <td><a href="mailto:${escHtml(s.email ?? '')}" style="color:var(--green-600)">${escHtml(s.email ?? '—')}</a></td>
      <td class="actions">
        <button class="btn-edit" data-id="${s.id}" data-type="supplier" title="Sửa">✏️</button>
        <button class="btn-del"  data-id="${s.id}" data-type="supplier" data-name="${escHtml(s.name)}" title="Xóa">🗑️</button>
      </td>
    </tr>`).join('');
}

// ── Render Certifications ─────────────────────────────────
function renderCertifications() {
  const tbody = document.querySelector('#certs-table tbody');
  if (!tbody) return;

  let list = [...state.certifications];
  const q = state.search.certs.toLowerCase().trim();
  if (q) list = list.filter(c =>
    c.name?.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q));

  const footer = document.getElementById('certs-footer');
  if (footer) footer.textContent = `${list.length} / ${state.certifications.length} chứng nhận`;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row"><div class="empty-row-inner"><div class="empty-icon">🏆</div><div>Chưa có chứng nhận</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => {
    const prodCount = state.products.filter(p => p.certificationId === c.id).length;
    return `<tr>
      <td><span class="badge badge-${c.badgeColor}">★ ${escHtml(c.name)}</span></td>
      <td>${escHtml(c.badgeColor)}</td>
      <td style="max-width:260px;color:var(--text-mid);font-size:.85rem">${escHtml(c.description ?? '—')}</td>
      <td><span style="font-weight:700;color:var(--green-700)">${prodCount}</span></td>
      <td class="actions">
        <button class="btn-edit" data-id="${c.id}" data-type="cert" title="Sửa">✏️</button>
        <button class="btn-del"  data-id="${c.id}" data-type="cert" data-name="${escHtml(c.name)}" title="Xóa">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

// ── Search / Sort ─────────────────────────────────────────
function bindSearch() {
  const bind = (inputId, key, renderFn) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    let t;
    el.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { state.search[key] = el.value; renderFn(); }, 180);
    });
  };
  bind('search-products',  'products',  renderProducts);
  bind('search-suppliers', 'suppliers', renderSuppliers);
  bind('search-certs',     'certs',     renderCertifications);

  // Table sort headers
  document.addEventListener('click', e => {
    const th = e.target.closest('th.sortable');
    if (!th) return;
    const table = th.closest('table');
    const tableId = table?.id;
    const colKey = tableId === 'products-table'  ? 'products'  :
                   tableId === 'suppliers-table' ? 'suppliers' : null;
    if (!colKey) return;
    const col = th.dataset.sort;
    const cur = state.sort[colKey];
    if (cur.col === col) cur.dir *= -1;
    else { cur.col = col; cur.dir = 1; }

    // Update header classes
    table.querySelectorAll('th.sortable').forEach(t => {
      t.classList.remove('sort-asc','sort-desc');
    });
    th.classList.add(cur.dir === 1 ? 'sort-asc' : 'sort-desc');

    if (colKey === 'products') renderProducts();
    else renderSuppliers();
  });
}

// ── Export CSV ────────────────────────────────────────────
function bindExport() {
  document.getElementById('btn-export-products')?.addEventListener('click', () => {
    const certMap = {};
    state.certifications.forEach(c => { certMap[c.id] = c.name; });
    exportCSV(
      ['Tên', 'Giá', 'Xuất xứ', 'Chứng nhận', 'Mô tả'],
      state.products.map(p => [p.name, p.price, p.origin ?? '', certMap[p.certificationId] ?? '', p.description ?? '']),
      'ecoshop-products.csv'
    );
  });
  document.getElementById('btn-export-suppliers')?.addEventListener('click', () => {
    exportCSV(
      ['Tên công ty', 'Địa chỉ', 'Điện thoại', 'Email'],
      state.suppliers.map(s => [s.name, s.address ?? '', s.contact ?? '', s.email ?? '']),
      'ecoshop-suppliers.csv'
    );
  });
}

function exportCSV(headers, rows, filename) {
  const escape = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  showToast(`Đã xuất ${filename}`);
}

// ── Image URL Preview ─────────────────────────────────────
function bindImagePreview() {
  const input = document.getElementById('p-image');
  const preview = document.getElementById('p-image-preview');
  if (!input || !preview) return;
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const url = input.value.trim();
      if (url) {
        preview.src = url;
        preview.classList.add('show');
        preview.onerror = () => preview.classList.remove('show');
      } else {
        preview.classList.remove('show');
      }
    }, 400);
  });

  // Big preview on thumb click
  document.addEventListener('click', e => {
    const thumb = e.target.closest('.thumb[data-preview]');
    if (!thumb) return;
    const modal = document.getElementById('img-preview-modal');
    const img   = document.getElementById('img-preview-src');
    if (modal && img) {
      img.src = thumb.dataset.preview;
      modal.classList.add('active');
    }
  });
  document.getElementById('img-preview-close')?.addEventListener('click', () =>
    document.getElementById('img-preview-modal')?.classList.remove('active'));
  document.getElementById('img-preview-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('img-preview-modal'))
      document.getElementById('img-preview-modal').classList.remove('active');
  });
}

// ── Modal binding ─────────────────────────────────────────
function bindModals() {
  document.getElementById('btn-add-product')?.addEventListener('click',  () => openProductModal());
  document.getElementById('btn-add-supplier')?.addEventListener('click', () => openSupplierModal());
  document.getElementById('btn-add-cert')?.addEventListener('click',     () => openCertModal());

  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn =>
    btn.addEventListener('click', () => {
      ['product-modal','supplier-modal','cert-modal','confirm-modal'].forEach(closeModal);
    })
  );

  document.addEventListener('click', e => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn  = e.target.closest('.btn-del');
    if (editBtn) handleEdit(editBtn.dataset.type, editBtn.dataset.id);
    if (delBtn)  handleDeletePrompt(delBtn.dataset.type, delBtn.dataset.id, delBtn.dataset.name);
  });

  document.getElementById('product-form')?.addEventListener('submit',  handleProductSave);
  document.getElementById('supplier-form')?.addEventListener('submit', handleSupplierSave);
  document.getElementById('cert-form')?.addEventListener('submit',     handleCertSave);

  document.getElementById('confirm-ok')?.addEventListener('click', executeDelete);
  document.getElementById('confirm-cancel')?.addEventListener('click', () => closeModal('confirm-modal'));
}

function handleEdit(type, id) {
  if (type === 'product')  { const p = state.products.find(x=>x.id===id);       if(p) openProductModal(p); }
  if (type === 'supplier') { const s = state.suppliers.find(x=>x.id===id);      if(s) openSupplierModal(s); }
  if (type === 'cert')     { const c = state.certifications.find(x=>x.id===id); if(c) openCertModal(c); }
}

let _pendingDelete = null;
function handleDeletePrompt(type, id, name = '') {
  _pendingDelete = { type, id };
  document.getElementById('confirm-msg').textContent = 'Bạn có chắc muốn xóa mục này?';
  document.getElementById('confirm-detail').textContent = name ? `"${name}"` : '';
  openModal('confirm-modal');
}
async function executeDelete() {
  if (!_pendingDelete) return;
  const { type, id } = _pendingDelete;
  const btn = document.getElementById('confirm-ok');
  if (btn) { btn.disabled = true; btn.textContent = 'Đang xóa…'; }
  try {
    if (type === 'product')  { await deleteProduct(id);       state.loaded.products = false;  await loadProducts(); renderDashboard(); }
    if (type === 'supplier') { await deleteSupplier(id);      state.loaded.suppliers = false; await loadSuppliers(); renderDashboard(); }
    if (type === 'cert')     { await deleteCertification(id); state.loaded.certs = false;     await loadCertifications(); renderDashboard(); }
    showToast('Đã xóa thành công!');
  } catch { showToast('Lỗi khi xóa', 'error'); }
  if (btn) { btn.disabled = false; btn.textContent = '🗑️ Xóa'; }
  _pendingDelete = null;
  closeModal('confirm-modal');
}

// ── Product Modal ─────────────────────────────────────────
function openProductModal(p = null) {
  state.editingId = p?.id ?? null;
  document.getElementById('product-modal-title').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới';
  const certSel = document.getElementById('p-cert');
  certSel.innerHTML = `<option value="">— Chọn chứng nhận —</option>` +
    state.certifications.map(c =>
      `<option value="${c.id}" ${p?.certificationId===c.id?'selected':''}>${escHtml(c.name)}</option>`
    ).join('');
  document.getElementById('p-name').value   = p?.name ?? '';
  document.getElementById('p-price').value  = p?.price ?? '';
  document.getElementById('p-origin').value = p?.origin ?? '';
  document.getElementById('p-desc').value   = p?.description ?? '';
  document.getElementById('p-image').value  = p?.image ?? '';
  // Trigger preview
  const preview = document.getElementById('p-image-preview');
  if (preview) {
    if (p?.image) { preview.src = p.image; preview.classList.add('show'); }
    else preview.classList.remove('show');
  }
  openModal('product-modal');
  setTimeout(() => document.getElementById('p-name')?.focus(), 100);
}
async function handleProductSave(e) {
  e.preventDefault();
  const data = {
    name:            document.getElementById('p-name').value.trim(),
    price:           document.getElementById('p-price').value.trim(),
    origin:          document.getElementById('p-origin').value.trim(),
    description:     document.getElementById('p-desc').value.trim(),
    image:           document.getElementById('p-image').value.trim(),
    certificationId: document.getElementById('p-cert').value || null,
  };
  if (!data.name || !data.price) { showToast('Vui lòng nhập tên và giá sản phẩm', 'error'); return; }
  const btn = e.submitter;
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu…'; }
  try {
    if (state.editingId) await updateProduct(state.editingId, data);
    else                 await createProduct(data);
    showToast(state.editingId ? '✅ Đã cập nhật sản phẩm!' : '✅ Đã thêm sản phẩm mới!');
    closeModal('product-modal');
    state.loaded.products = false;
    await loadProducts();
    renderDashboard();
  } catch { showToast('Lỗi lưu sản phẩm', 'error'); }
  if (btn) { btn.disabled = false; btn.textContent = '💾 Lưu sản phẩm'; }
}

// ── Supplier Modal ────────────────────────────────────────
function openSupplierModal(s = null) {
  state.editingId = s?.id ?? null;
  document.getElementById('supplier-modal-title').textContent = s ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới';
  document.getElementById('s-name').value    = s?.name ?? '';
  document.getElementById('s-address').value = s?.address ?? '';
  document.getElementById('s-contact').value = s?.contact ?? '';
  document.getElementById('s-email').value   = s?.email ?? '';
  openModal('supplier-modal');
  setTimeout(() => document.getElementById('s-name')?.focus(), 100);
}
async function handleSupplierSave(e) {
  e.preventDefault();
  const data = {
    name:    document.getElementById('s-name').value.trim(),
    address: document.getElementById('s-address').value.trim(),
    contact: document.getElementById('s-contact').value.trim(),
    email:   document.getElementById('s-email').value.trim(),
  };
  if (!data.name) { showToast('Vui lòng nhập tên công ty', 'error'); return; }
  const btn = e.submitter;
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu…'; }
  try {
    if (state.editingId) await updateSupplier(state.editingId, data);
    else                 await createSupplier(data);
    showToast(state.editingId ? '✅ Đã cập nhật!' : '✅ Đã thêm nhà cung cấp!');
    closeModal('supplier-modal');
    state.loaded.suppliers = false;
    await loadSuppliers();
    renderDashboard();
  } catch { showToast('Lỗi lưu nhà cung cấp', 'error'); }
  if (btn) { btn.disabled = false; btn.textContent = '💾 Lưu'; }
}

// ── Cert Modal ────────────────────────────────────────────
function openCertModal(c = null) {
  state.editingId = c?.id ?? null;
  document.getElementById('cert-modal-title').textContent = c ? 'Sửa chứng nhận' : 'Thêm chứng nhận mới';
  document.getElementById('c-name').value  = c?.name ?? '';
  document.getElementById('c-color').value = c?.badgeColor ?? 'green';
  document.getElementById('c-desc').value  = c?.description ?? '';
  openModal('cert-modal');
  setTimeout(() => document.getElementById('c-name')?.focus(), 100);
}
async function handleCertSave(e) {
  e.preventDefault();
  const data = {
    name:        document.getElementById('c-name').value.trim(),
    badgeColor:  document.getElementById('c-color').value,
    description: document.getElementById('c-desc').value.trim(),
  };
  if (!data.name) { showToast('Vui lòng nhập tên chứng nhận', 'error'); return; }
  const btn = e.submitter;
  if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu…'; }
  try {
    if (state.editingId) await updateCertification(state.editingId, data);
    else                 await createCertification(data);
    showToast(state.editingId ? '✅ Đã cập nhật!' : '✅ Đã thêm chứng nhận!');
    closeModal('cert-modal');
    state.loaded.certs = false;
    await loadCertifications();
    renderDashboard();
  } catch { showToast('Lỗi lưu chứng nhận', 'error'); }
  if (btn) { btn.disabled = false; btn.textContent = '💾 Lưu'; }
}

document.addEventListener('DOMContentLoaded', init);