// admin.js — Admin panel logic for EcoShop
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCertifications, createCertification, updateCertification, deleteCertification,
} from './api.js';
import { formatPrice, showToast, escHtml, openModal, closeModal, getProductImage } from './utils.js';
import { initHeader } from './header.js';

// ── State ─────────────────────────────────────────────────
const state = {
  products: [], suppliers: [], certifications: [],
  editingId: null, activeTab: 'products',
  loaded: { products: false, suppliers: false, certs: false }, // lazy load tracker
};

// ── Tab switching ─────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      state.activeTab = btn.dataset.tab;
      document.getElementById(`tab-${state.activeTab}`)?.classList.add('active');
      // Lazy load: chỉ fetch khi tab được mở lần đầu
      lazyLoad(state.activeTab);
    });
  });
}

async function lazyLoad(tab) {
  if (tab === 'products'  && !state.loaded.products)  await loadProducts();
  if (tab === 'suppliers' && !state.loaded.suppliers) await loadSuppliers();
  if (tab === 'certs'     && !state.loaded.certs)     await loadCertifications();
}

// ── Bootstrap ─────────────────────────────────────────────
async function init() {
  const user = initHeader(true);
  if (!user) return;

  initTabs();
  bindModals();

  // Chỉ load tab đang active lúc đầu (products)
  await loadProducts();
}

// ════════════════════════════════════════════════════════════
//  PRODUCTS
// ════════════════════════════════════════════════════════════
async function loadProducts() {
  try {
    // Certs cần cho product form — dùng cache nếu có, không fetch riêng
    const [products, certs] = await Promise.all([
      getProducts(),
      state.certifications.length ? Promise.resolve(state.certifications) : getCertifications(),
    ]);
    state.products       = products;
    state.certifications = certs;
    state.loaded.products = true;
    renderProducts();
  } catch { showToast('Lỗi tải sản phẩm', 'error'); }
}

function renderProducts() {
  const tbody = document.querySelector('#products-table tbody');
  if (!tbody) return;
  if (!state.products.length) { tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Chưa có sản phẩm</td></tr>`; return; }
  const certMap = {};
  state.certifications.forEach(c => { certMap[c.id] = c.name; });
  tbody.innerHTML = state.products.map(p => {
    const imgSrc = getProductImage(p.name, p.image);
    return `
    <tr>
      <td><img src="${escHtml(imgSrc)}" class="thumb" alt=""
               onerror="this.src='https://picsum.photos/seed/eco/80/60'"></td>
      <td>${escHtml(p.name)}</td>
      <td>${formatPrice(p.price)}</td>
      <td>${escHtml(p.origin ?? '')}</td>
      <td>${escHtml(certMap[p.certificationId] ?? '—')}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${p.id}" data-type="product">✏️</button>
        <button class="btn-del"  data-id="${p.id}" data-type="product">🗑️</button>
      </td>
    </tr>`}).join('');
}

// ════════════════════════════════════════════════════════════
//  SUPPLIERS
// ════════════════════════════════════════════════════════════
async function loadSuppliers() {
  try {
    state.suppliers = await getSuppliers();
    state.loaded.suppliers = true;
    renderSuppliers();
  } catch { showToast('Lỗi tải nhà cung cấp', 'error'); }
}

function renderSuppliers() {
  const tbody = document.querySelector('#suppliers-table tbody');
  if (!tbody) return;
  if (!state.suppliers.length) { tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Chưa có nhà cung cấp</td></tr>`; return; }
  tbody.innerHTML = state.suppliers.map(s => `
    <tr>
      <td>${escHtml(s.name)}</td>
      <td>${escHtml(s.address ?? '')}</td>
      <td>${escHtml(s.contact ?? '')}</td>
      <td>${escHtml(s.email ?? '')}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${s.id}" data-type="supplier">✏️</button>
        <button class="btn-del"  data-id="${s.id}" data-type="supplier">🗑️</button>
      </td>
    </tr>`).join('');
}

// ════════════════════════════════════════════════════════════
//  CERTIFICATIONS
// ════════════════════════════════════════════════════════════
async function loadCertifications() {
  try {
    state.certifications = await getCertifications();
    state.loaded.certs = true;
    renderCertifications();
  } catch { showToast('Lỗi tải chứng nhận', 'error'); }
}

function renderCertifications() {
  const tbody = document.querySelector('#certs-table tbody');
  if (!tbody) return;
  if (!state.certifications.length) { tbody.innerHTML = `<tr><td colspan="4" class="empty-row">Chưa có chứng nhận</td></tr>`; return; }
  tbody.innerHTML = state.certifications.map(c => `
    <tr>
      <td><span class="badge badge-${c.badgeColor}">★ ${escHtml(c.name)}</span></td>
      <td>${escHtml(c.badgeColor)}</td>
      <td>${escHtml(c.description ?? '')}</td>
      <td class="actions">
        <button class="btn-edit" data-id="${c.id}" data-type="cert">✏️</button>
        <button class="btn-del"  data-id="${c.id}" data-type="cert">🗑️</button>
      </td>
    </tr>`).join('');
}

// ════════════════════════════════════════════════════════════
//  MODAL BINDING
// ════════════════════════════════════════════════════════════
function bindModals() {
  document.getElementById('btn-add-product')?.addEventListener('click',  () => openProductModal());
  document.getElementById('btn-add-supplier')?.addEventListener('click', () => openSupplierModal());
  document.getElementById('btn-add-cert')?.addEventListener('click',     () => openCertModal());

  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn =>
    btn.addEventListener('click', () => {
      closeModal('product-modal');
      closeModal('supplier-modal');
      closeModal('cert-modal');
      closeModal('confirm-modal');
    })
  );

  document.addEventListener('click', async e => {
    const editBtn = e.target.closest('.btn-edit');
    const delBtn  = e.target.closest('.btn-del');
    if (editBtn) handleEdit(editBtn.dataset.type, editBtn.dataset.id);
    if (delBtn)  handleDeletePrompt(delBtn.dataset.type, delBtn.dataset.id);
  });

  document.getElementById('product-form')?.addEventListener('submit',  handleProductSave);
  document.getElementById('supplier-form')?.addEventListener('submit', handleSupplierSave);
  document.getElementById('cert-form')?.addEventListener('submit',     handleCertSave);

  document.getElementById('confirm-ok')?.addEventListener('click', executeDelete);
  document.getElementById('confirm-cancel')?.addEventListener('click', () => closeModal('confirm-modal'));
}

// ── Edit router ───────────────────────────────────────────
function handleEdit(type, id) {
  if (type === 'product')  { const p = state.products.find(x=>x.id===id);        if(p) openProductModal(p); }
  if (type === 'supplier') { const s = state.suppliers.find(x=>x.id===id);       if(s) openSupplierModal(s); }
  if (type === 'cert')     { const c = state.certifications.find(x=>x.id===id);  if(c) openCertModal(c); }
}

// ── Delete prompt ─────────────────────────────────────────
let _pendingDelete = null;
function handleDeletePrompt(type, id) {
  _pendingDelete = { type, id };
  document.getElementById('confirm-msg').textContent = 'Bạn có chắc muốn xóa mục này không?';
  openModal('confirm-modal');
}
async function executeDelete() {
  if (!_pendingDelete) return;
  const { type, id } = _pendingDelete;
  try {
    if (type === 'product')  { await deleteProduct(id);       state.loaded.products  = false; await loadProducts(); }
    if (type === 'supplier') { await deleteSupplier(id);      state.loaded.suppliers = false; await loadSuppliers(); }
    if (type === 'cert')     { await deleteCertification(id); state.loaded.certs     = false; await loadCertifications(); }
    showToast('Đã xóa thành công!');
  } catch { showToast('Lỗi khi xóa', 'error'); }
  _pendingDelete = null;
  closeModal('confirm-modal');
}

// ── Product Modal ─────────────────────────────────────────
function openProductModal(p = null) {
  state.editingId = p?.id ?? null;
  document.getElementById('product-modal-title').textContent = p ? 'Sửa sản phẩm' : 'Thêm sản phẩm';
  const certSel = document.getElementById('p-cert');
  certSel.innerHTML = state.certifications.map(c =>
    `<option value="${c.id}" ${p?.certificationId===c.id?'selected':''}>${escHtml(c.name)}</option>`
  ).join('');
  document.getElementById('p-name').value    = p?.name ?? '';
  document.getElementById('p-price').value   = p?.price ?? '';
  document.getElementById('p-origin').value  = p?.origin ?? '';
  document.getElementById('p-desc').value    = p?.description ?? '';
  document.getElementById('p-image').value   = p?.image ?? '';
  openModal('product-modal');
}
async function handleProductSave(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('p-name').value.trim(),
    price: document.getElementById('p-price').value.trim(),
    origin: document.getElementById('p-origin').value.trim(),
    description: document.getElementById('p-desc').value.trim(),
    image: document.getElementById('p-image').value.trim(),
    certificationId: document.getElementById('p-cert').value,
  };
  try {
    if (state.editingId) await updateProduct(state.editingId, data);
    else                 await createProduct(data);
    showToast(state.editingId ? 'Đã cập nhật!' : 'Đã thêm sản phẩm!');
    closeModal('product-modal');
    state.loaded.products = false;
    await loadProducts();
  } catch { showToast('Lỗi lưu sản phẩm', 'error'); }
}

// ── Supplier Modal ────────────────────────────────────────
function openSupplierModal(s = null) {
  state.editingId = s?.id ?? null;
  document.getElementById('supplier-modal-title').textContent = s ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp';
  document.getElementById('s-name').value    = s?.name ?? '';
  document.getElementById('s-address').value = s?.address ?? '';
  document.getElementById('s-contact').value = s?.contact ?? '';
  document.getElementById('s-email').value   = s?.email ?? '';
  openModal('supplier-modal');
}
async function handleSupplierSave(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('s-name').value.trim(),
    address: document.getElementById('s-address').value.trim(),
    contact: document.getElementById('s-contact').value.trim(),
    email: document.getElementById('s-email').value.trim(),
  };
  try {
    if (state.editingId) await updateSupplier(state.editingId, data);
    else                 await createSupplier(data);
    showToast(state.editingId ? 'Đã cập nhật!' : 'Đã thêm nhà cung cấp!');
    closeModal('supplier-modal');
    state.loaded.suppliers = false;
    await loadSuppliers();
  } catch { showToast('Lỗi lưu nhà cung cấp', 'error'); }
}

// ── Cert Modal ────────────────────────────────────────────
function openCertModal(c = null) {
  state.editingId = c?.id ?? null;
  document.getElementById('cert-modal-title').textContent = c ? 'Sửa chứng nhận' : 'Thêm chứng nhận';
  document.getElementById('c-name').value  = c?.name ?? '';
  document.getElementById('c-color').value = c?.badgeColor ?? 'green';
  document.getElementById('c-desc').value  = c?.description ?? '';
  openModal('cert-modal');
}
async function handleCertSave(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('c-name').value.trim(),
    badgeColor: document.getElementById('c-color').value,
    description: document.getElementById('c-desc').value.trim(),
  };
  try {
    if (state.editingId) await updateCertification(state.editingId, data);
    else                 await createCertification(data);
    showToast(state.editingId ? 'Đã cập nhật!' : 'Đã thêm chứng nhận!');
    closeModal('cert-modal');
    state.loaded.certs = false;
    await loadCertifications();
  } catch { showToast('Lỗi lưu chứng nhận', 'error'); }
}

document.addEventListener('DOMContentLoaded', init);