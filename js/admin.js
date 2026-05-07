document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('admin-product-list');

    // Hàm load dữ liệu và hiển thị lên bảng
    function loadAdminTable() {
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-stone-400">Đang tải dữ liệu...</td></tr>';

        getProducts()
            .then(products => {
                renderTable(products);
            })
            .catch(err => {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-red-500">Lỗi kết nối API. Vui lòng kiểm tra lại MockAPI.</td></tr>';
            });
    }

    function renderTable(products) {
        tbody.innerHTML = '';
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-10 text-center text-stone-400">Chưa có sản phẩm nào.</td></tr>';
            return;
        }

        products.forEach(p => {
            const row = `
                <tr class="hover:bg-stone-50 transition group">
                    <td class="p-5">
                        <div class="flex items-center gap-3">
                            <img src="${p.image || 'https://placehold.co/40x40?text=Eco'}" class="w-10 h-10 rounded-lg object-cover border border-stone-200">
                            <div>
                                <div class="font-bold text-stone-800">${p.name}</div>
                                <div class="text-xs text-stone-400 italic">${p.origin || 'Không rõ nguồn gốc'}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-5">
                        <span class="bg-green-100 text-green-800 text-[10px] font-black px-2.5 py-1 rounded-full uppercase border border-green-200">
                            ${p.certification || 'N/A'}
                        </span>
                    </td>
                    <td class="p-5 font-semibold text-stone-700">${formatVND(p.price)}</td>
                    <td class="p-5">
                        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="handleEdit('${p.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Chỉnh sửa">
                                <i data-lucide="edit-3" class="w-4 h-4"></i>
                            </button>
                            <button onclick="handleDelete('${p.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa bỏ">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        if (window.lucide) lucide.createIcons();
    }

    // Đưa các hàm xử lý ra window để dùng được với onclick="..."
    window.handleDelete = (id) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này không?')) {
            deleteProduct(id)
                .then(() => {
                    alert('Đã xóa thành công!');
                    loadAdminTable();
                })
                .catch(err => alert('Lỗi: ' + err.message));
        }
    };

    window.handleEdit = (id) => {
        alert('Tính năng đang phát triển: Chỉnh sửa ID ' + id);
    };

    window.openModal = () => {
        alert('Vui lòng tạo thêm một Form/Modal để nhập dữ liệu mới!');
    };

    // Khởi tạo
    loadAdminTable();
});