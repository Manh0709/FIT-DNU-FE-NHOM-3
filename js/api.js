var API_BASE_URL = "https://69fc3788fce564e2591779a8.mockapi.io/api/v1/";
var ACCOUNTS_BASE_URL = "https://69fc38acfce564e2591784fc.mockapi.io/api/v1/";

var ENDPOINTS = {
    accounts: ACCOUNTS_BASE_URL + "/accounts",
    courses: API_BASE_URL + "/courses",
    // Lưu ý: Tên "/products" phải trùng với Resource Name trên MockAPI
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

// Hàm lấy danh sách sản phẩm
function getProducts() {
    return fetch(ENDPOINTS.products)
        .then(function (response) {
            return handleResponse(response, "Không thể kết nối API. Vui lòng kiểm tra lại MockAPI.");
        })
        .catch(function (error) {
            throw error;
        });
}

// Hàm xóa sản phẩm
function deleteProduct(id) {
    return fetch(ENDPOINTS.products + "/" + id, {
        method: "DELETE",
    })
    .then(function (response) {
        return handleResponse(response, "Không thể xóa sản phẩm");
    });
}