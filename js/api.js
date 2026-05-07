var API_BASE_URL = "https://69fc3788fce564e2591779a8.mockapi.io/api/v1/"; // Bạn có thể cần tạo lại các endpoint này trên MockAPI

var ENDPOINTS = {
  products: API_BASE_URL + "/products",
  suppliers: API_BASE_URL + "/suppliers",
  certifications: API_BASE_URL + "/certifications",
};

function handleResponse(response, errorMessage) {
  if (!response.ok) {
    throw new Error(errorMessage || "Yêu cầu thất bại");
  }
  return response.json();
}

// --- QUẢN LÝ SẢN PHẨM ---
function getProducts() {
  return fetch(ENDPOINTS.products)
    .then(response => handleResponse(response, "Không thể lấy danh sách sản phẩm"));
}

function createProduct(data) {
  return fetch(ENDPOINTS.products, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(response => handleResponse(response, "Không thể thêm sản phẩm"));
}

function deleteProduct(id) {
  return fetch(ENDPOINTS.products + "/" + id, {
    method: "DELETE",
  }).then(response => handleResponse(response, "Không thể xóa sản phẩm"));
}
