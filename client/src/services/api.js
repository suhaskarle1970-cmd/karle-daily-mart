import axios from "axios";

const TOKEN_KEY = "kdm_admin_token";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================
// Automatically attach the admin JWT to API requests.

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================
// If an authenticated admin request returns 401,
// clear the invalid session and redirect to admin login.

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;
    const pathname = window.location.pathname;

    const isAdminRoute = pathname.startsWith("/admin");
    const isLoginPage = pathname === "/admin/login";

    if (status === 401 && isAdminRoute) {
      localStorage.removeItem(TOKEN_KEY);

      if (!isLoginPage) {
        window.location.replace("/admin/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;