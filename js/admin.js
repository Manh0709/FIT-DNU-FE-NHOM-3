document.addEventListener("DOMContentLoaded", function () {
    renderProducts();
});

function renderProducts() {
    const listContainer = document.getElementById("admin-product-list");
    
    // Hiển thị trạng thái đang tải
    listContainer.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-stone-400">Đang tải dữ liệu...</td></tr>`;

    getProducts()
        .then(function (products) {
            if (products.length === 0) {
                listContainer.innerHTML = `<tr><td colspan="4" class="p-10 text-center text-stone-400">Chưa có sản phẩm nào trong kho.</td></tr>`;
                return;
            }

            let html = "";
            products.forEach(function (item) {
                // Sử dụng đúng tên thuộc tính từ Schema MockAPI
                const name = item.tenSanPham || "Sản phẩm chưa đặt tên";
                const origin = item.nguonGoc || "Không rõ nguồn gốc";
                const price = item.gia ? Number(item.gia).toLocaleString('vi-VN') + " đ" : "Liên hệ";
                const cert = item.chungNhan || "Hữu cơ";
                const img = item.linkAnh || "https://via.placeholder.com/100?text=Eco";

                html += `
                <tr class="hover:bg-stone-50 transition-colors">
                    <td class="p-5">
                        <div class="flex items-center gap-4">
                            <img src="${img}" class="w-12 h-12 rounded-lg object-cover bg-stone-100 border" alt="img">
                            <div>
                                <h3 class="font-bold text-stone-800">${name}</h3>
                                <p class="text-sm text-stone-500">${origin}</p>
                            </div>
                        </div>
                    </td>
                    <td class="p-5">
                        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase">
                            ${cert}
                        </span>
                    </td>
                    <td class="p-5 font-semibold text-stone-700">${price}</td>
                    <td class="p-5 text-right">
                        <div class="flex justify-end gap-3">
                            <button class="text-stone-400 hover:text-blue-600 transition"><i data-lucide="edit-3" class="w-5 h-5"></i></button>
                            <button onclick="handleDelete('${item.id}')" class="text-stone-400 hover:text-red-600 transition"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
                        </div>
                    </td>
                </tr>`;
            });

            listContainer.innerHTML = html;
            lucide.createIcons(); // Cập nhật lại icon sau khi render
        })
        .catch(function (error) {
            // Hiển thị lỗi màu đỏ như hình image_af3001.png
            listContainer.innerHTML = `
                <tr>
                    <td colspan="4" class="p-10 text-center text-red-500 font-medium">
                        ${error.message}
                    </td>
                </tr>`;
        });
}

function handleDelete(id) {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
        deleteProduct(id)
            .then(() => {
                alert("Đã xóa sản phẩm thành công!");
                renderProducts(); // Tải lại danh sách
            })
            .catch(err => alert("Lỗi khi xóa: " + err.message));
    }
}