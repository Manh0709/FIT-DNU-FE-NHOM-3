var API_BASE_URL = "https://69fc3788fce564e2591779a8.mockapi.io/api/v1/";
var ACCOUNTS_BASE_URL = "https://69fc38acfce564e2591784fc.mockapi.io/api/v1/";

var ENDPOINTS = {
  // Cũ
  accounts: ACCOUNTS_BASE_URL + "/accounts",
  courses: API_BASE_URL + "/courses",
  schedules: API_BASE_URL + "/schedules",
  // Mới thêm
  products: API_BASE_URL + "/products",
  suppliers: API_BASE_URL + "/suppliers",
  certifications: API_BASE_URL + "/certifications",
};

function handleResponse(response, errorMessage) {
  if (!response.ok) {
    throw new Error(errorMessage || "Yeu cau that bai");
  }
  return response.json();
}

// ==========================================
// API TÀI KHOẢN (ACCOUNTS)
// ==========================================
function getAccounts() {
  return fetch(ENDPOINTS.accounts)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach tai khoan");
    })
    .catch(function (error) {
      throw error;
    });
}

// ==========================================
// API MÔN HỌC (COURSES)
// ==========================================
function getCourses() {
  return fetch(ENDPOINTS.courses)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach mon hoc");
    })
    .catch(function (error) {
      throw error;
    });
}

function getCourseById(id) {
  return fetch(ENDPOINTS.courses + "/" + id)
    .then(function (response) {
      return handleResponse(response, "Khong the lay mon hoc");
    })
    .catch(function (error) {
      throw error;
    });
}

function createCourse(data) {
  return fetch(ENDPOINTS.courses, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the them mon hoc");
    })
    .catch(function (error) {
      throw error;
    });
}

function updateCourse(id, data) {
  return fetch(ENDPOINTS.courses + "/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the cap nhat mon hoc");
    })
    .catch(function (error) {
      throw error;
    });
}

function deleteCourse(id) {
  return fetch(ENDPOINTS.courses + "/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      return handleResponse(response, "Khong the xoa mon hoc");
    })
    .catch(function (error) {
      throw error;
    });
}

// ==========================================
// API SẢN PHẨM (PRODUCTS)
// ==========================================
function getProducts() {
  return fetch(ENDPOINTS.products)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach san pham");
    })
    .catch(function (error) {
      throw error;
    });
}

function getProductById(id) {
  return fetch(ENDPOINTS.products + "/" + id)
    .then(function (response) {
      return handleResponse(response, "Khong the lay san pham");
    })
    .catch(function (error) {
      throw error;
    });
}

function createProduct(data) {
  return fetch(ENDPOINTS.products, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the them san pham");
    })
    .catch(function (error) {
      throw error;
    });
}

function updateProduct(id, data) {
  return fetch(ENDPOINTS.products + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the cap nhat san pham");
    })
    .catch(function (error) {
      throw error;
    });
}

function deleteProduct(id) {
  return fetch(ENDPOINTS.products + "/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      return handleResponse(response, "Khong the xoa san pham");
    })
    .catch(function (error) {
      throw error;
    });
}

// ==========================================
// API NHÀ CUNG CẤP (SUPPLIERS)
// ==========================================
function getSuppliers() {
  return fetch(ENDPOINTS.suppliers)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach nha cung cap");
    })
    .catch(function (error) {
      throw error;
    });
}

function getSupplierById(id) {
  return fetch(ENDPOINTS.suppliers + "/" + id)
    .then(function (response) {
      return handleResponse(response, "Khong the lay nha cung cap");
    })
    .catch(function (error) {
      throw error;
    });
}

function createSupplier(data) {
  return fetch(ENDPOINTS.suppliers, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the them nha cung cap");
    })
    .catch(function (error) {
      throw error;
    });
}

function updateSupplier(id, data) {
  return fetch(ENDPOINTS.suppliers + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the cap nhat nha cung cap");
    })
    .catch(function (error) {
      throw error;
    });
}

function deleteSupplier(id) {
  return fetch(ENDPOINTS.suppliers + "/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      return handleResponse(response, "Khong the xoa nha cung cap");
    })
    .catch(function (error) {
      throw error;
    });
}

// ==========================================
// API CHỨNG NHẬN (CERTIFICATIONS)
// ==========================================
function getCertifications() {
  return fetch(ENDPOINTS.certifications)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach chung nhan");
    })
    .catch(function (error) {
      throw error;
    });
}

function getCertificationById(id) {
  return fetch(ENDPOINTS.certifications + "/" + id)
    .then(function (response) {
      return handleResponse(response, "Khong the lay chung nhan");
    })
    .catch(function (error) {
      throw error;
    });
}

function createCertification(data) {
  return fetch(ENDPOINTS.certifications, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the them chung nhan");
    })
    .catch(function (error) {
      throw error;
    });
}

function updateCertification(id, data) {
  return fetch(ENDPOINTS.certifications + "/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then(function (response) {
      return handleResponse(response, "Khong the cap nhat chung nhan");
    })
    .catch(function (error) {
      throw error;
    });
}

function deleteCertification(id) {
  return fetch(ENDPOINTS.certifications + "/" + id, {
    method: "DELETE",
  })
    .then(function (response) {
      return handleResponse(response, "Khong the xoa chung nhan");
    })
    .catch(function (error) {
      throw error;
    });
}