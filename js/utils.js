// Hàm format tiền tệ VNĐ
function formatVND(amount) {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Hàm khởi tạo lại icon Lucide sau khi render HTML động
function renderIcons() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}