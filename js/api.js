var API_BASE_URL = "https://69fc3788fce564e2591779a8.mockapi.io/api/v1/";
var ACCOUNTS_BASE_URL = "https://69fc38acfce564e2591784fc.mockapi.io/api/v1/";

var ENDPOINTS = {
  accounts: ACCOUNTS_BASE_URL + "/accounts",
  courses: API_BASE_URL + "/courses",
  schedules: API_BASE_URL + "/schedules",
};

function handleResponse(response, errorMessage) {
  if (!response.ok) {
    throw new Error(errorMessage || "Yeu cau that bai");
  }
  return response.json();
}

function getAccounts() {
  return fetch(ENDPOINTS.accounts)
    .then(function (response) {
      return handleResponse(response, "Khong the lay danh sach tai khoan");
    })
    .catch(function (error) {
      throw error;
    });
}

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