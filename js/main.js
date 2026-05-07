document.addEventListener('DOMContentLoaded', () => {
    const productListElement = document.getElementById('product-list');
    const filterSelect = document.querySelector('select'); // Dropdown lọc chứng nhận
    let allProducts = []; 

    // Lấy và hiển thị sản phẩm
    function loadProducts() {
        // Nếu API chưa có, mình tạo mảng fake tạm để test click
        getProducts()
            .then(products => {
                allProducts = products;
                renderProducts(products);
            })
            .catch(err => {
                console.error("Lỗi API, hiển thị dữ liệu mẫu để test click:", err);
                // Dữ liệu mẫu để bạn test click nếu MockAPI chưa chạy
                allProducts = [
                    { id: '1', name: 'Cải xoăn Kale Hữu Cơ', price: 45000, origin: 'Nông trại Đà Lạt', certification: 'USDA Organic', image: 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=400' },
                    { id: '2', name: 'Cà chua Cherry', price: 35000, origin: 'Nông trại Mộc Châu', certification: 'VietGAP', image: 'https://plus.unsplash.com/premium_photo-1664302152996-328b18dc8a8b?q=80&w=400&auto=format&fit=crop' }
                ];
                renderProducts(allProducts);
            });
    }

    // Render HTML
    function renderProducts(products) {
        productListElement.innerHTML = '';
        
        if (products.length === 0) {
            productListElement.innerHTML = `<p class="text-stone-500 col-span-full">Không tìm thấy sản phẩm nào.</p>`;
            return;
        }

        products.forEach(product => {
            const badge = product.certification 
                ? `<div class="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-green-200 z-10"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ${product.certification}</div>` 
                : '';

            const defaultImg = 'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&q=80&w=400';

            const html = `
            <div class="bg-white rounded-2xl shadow-sm border border-green-50 overflow-hidden card-hover fade-in relative flex flex-col">
                ${badge}
                <div class="h-48 bg-stone-200 overflow-hidden">
                    <img src="${product.image || defaultImg}" alt="${product.name}" class="w-full h-full object-cover">
                </div>
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="font-heading font-bold text-lg text-stone-800 mb-1">${product.name}</h3>
                    <p class="text-sm text-stone-500 mb-3 flex items-center gap-1">
                        <i data-lucide="map-pin" class="w-4 h-4"></i> ${product.origin || 'Đang cập nhật'}
                    </p>
                    <div class="mt-auto flex items-center justify-between">
                        <span class="text-green-700 font-bold text-lg">${formatVND(product.price)}</span>
                        <button class="add-to-cart-btn bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors" data-name="${product.name}">
                            <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
            productListElement.insertAdjacentHTML('beforeend', html);
        });
        renderIcons(); // Load lại icon
        attachCartEvents(); // Gắn sự kiện click cho các nút "Thêm vào giỏ" vừa tạo
    }

    // --- CÁC SỰ KIỆN CLICK ---

    // 1. Click Thêm vào giỏ hàng
    function attachCartEvents() {
        const cartBtns = document.querySelectorAll('.add-to-cart-btn');
        cartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Ngăn chặn sự kiện nổi bọt nếu có bọc thẻ a
                e.preventDefault(); 
                const productName = btn.getAttribute('data-name');
                alert(`Đã thêm "${productName}" vào giỏ hàng!`);
            });
        });
    }

    // 2. Click Gửi Đơn Hàng
    const orderBtn = document.querySelector('#order-section button');
    if (orderBtn) {
        orderBtn.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Gửi đơn hàng thành công! EcoShop sẽ liên hệ với bạn sớm.');
        });
    }

    // 3. Sự kiện lọc dropdown
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                renderProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => 
                    p.certification && p.certification.toLowerCase().includes(val.toLowerCase())
                );
                renderProducts(filtered);
            }
        });
    }

    // Chạy lúc mới vào trang
    loadProducts();
});