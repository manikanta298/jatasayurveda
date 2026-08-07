import { api, unwrap, unwrapWithMeta } from "./api";

// --- Catalog (public, published/enabled items only — enforced server-side) ---
export const listProducts = (params = {}) => api.get("/products", { params }).then(unwrap);
export const getProduct = (slug) => api.get(`/products/${slug}`).then(unwrap);
export const listServices = (params = {}) => api.get("/services", { params }).then(unwrap);
export const getService = (slug) => api.get(`/services/${slug}`).then(unwrap);
export const listCategories = (params = {}) => api.get("/categories", { params }).then(unwrap);

// --- Content ---
export const listBlogPosts = (params = {}) => api.get("/blog", { params }).then(unwrap);
export const getBlogPost = (slug) => api.get(`/blog/${slug}`).then(unwrap);
export const listResearch = (params = {}) => api.get("/research", { params }).then(unwrap);
export const listTestimonials = (params = {}) => api.get("/testimonials", { params }).then(unwrap);
export const listDoctors = (params = {}) => api.get("/doctors", { params }).then(unwrap);
export const listCertifications = (params = {}) => api.get("/certifications", { params }).then(unwrap);
export const listHeroBanners = (params = {}) => api.get("/hero-banners", { params }).then(unwrap);

// --- Site settings ---
export const getSettings = () => api.get("/settings").then(unwrap);

// The backend saves this to MongoDB, notifies staff, and best-effort
// forwards it to Google Sheets server-side (see backend/controllers/contact.controller.js).
// It's no longer called directly from the browser — that hit CORS errors
// since Apps Script doesn't send the headers browsers require for a
// cross-origin fetch, and it also meant submissions never reached the
// admin panel's contact inbox.
export const submitContact = (payload) => api.post("/contact", payload).then(unwrap);

// --- Coupons ---
export const validateCoupon = (code, subtotalPaise) =>
  api.post("/coupons/validate", { code, subtotalPaise }).then(unwrap);

// --- Orders / checkout (gateway-agnostic: Razorpay, Cash on Delivery, ICICI Bank) ---
export const listPaymentMethods = () => api.get("/orders/payment-methods").then(unwrap);
export const createOrder = (payload) => api.post("/orders", payload).then(unwrap);
export const verifyPayment = (payload) => api.post("/orders/verify", payload).then(unwrap);
export const getOrderByNumber = (orderNumber, verify = {}) =>
  api.get(`/orders/${orderNumber}`, { params: verify }).then(unwrap);

// --- Customer accounts (email-OTP registration + Google sign-in, separate from staff auth) ---
export const sendCustomerOtp = (payload) => api.post("/customers/auth/otp/send", payload).then(unwrap);
export const registerCustomer = (payload) => api.post("/customers/auth/register", payload).then(unwrap);
export const loginCustomer = (payload) => api.post("/customers/auth/login", payload).then(unwrap);
export const resetCustomerPassword = (payload) => api.post("/customers/auth/reset-password", payload).then(unwrap);
export const googleLoginCustomer = (payload) => api.post("/customers/auth/google", payload).then(unwrap);
export const logoutCustomer = () => api.post("/customers/auth/logout").then(unwrap);
export const getCurrentCustomer = () => api.get("/customers/auth/me").then(unwrap);
export const updateCustomerProfile = (payload) => api.patch("/customers/auth/profile", payload).then(unwrap);

// --- Media (admin only, multipart upload to Cloudinary via the backend) ---
export function uploadMedia(file, folder = "uploads") {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  return api.post("/media", form, { headers: { "Content-Type": "multipart/form-data" } }).then(unwrap);
}
export const listMedia = (params = {}) => api.get("/media", { params }).then(unwrap);
export const deleteMedia = (id) => api.delete(`/media/${id}`).then(unwrap);

// --- Admin: users ---
export const listAdminUsers = () => api.get("/users").then(unwrap);
export const createAdminUser = (payload) => api.post("/users", payload).then(unwrap);
export const updateAdminUser = (id, payload) => api.patch(`/users/${id}`, payload).then(unwrap);
export const deleteAdminUser = (id) => api.delete(`/users/${id}`).then(unwrap);

// --- Admin: orders ---
export const listAdminOrders = (params = {}) => api.get("/orders/admin/all", { params }).then(unwrapWithMeta);
export const getAdminOrder = (id) => api.get(`/orders/admin/${id}`).then(unwrap);
export const updateOrderStatus = (id, payload) => api.patch(`/orders/admin/${id}/status`, payload).then(unwrap);

// --- Admin: dashboard ---
export const getDashboardSummary = () => api.get("/dashboard/summary").then(unwrap);

// --- Admin: content CRUD (list "admin/all" sees drafts/disabled too) ---
export const listProductsAdmin = (params = {}) => api.get("/products/admin/all", { params }).then(unwrap);
export const getProductAdmin = (id) => api.get(`/products/admin/${id}`).then(unwrap);
export const createProduct = (payload) => api.post("/products", payload).then(unwrap);
export const updateProduct = (id, payload) => api.patch(`/products/${id}`, payload).then(unwrap);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(unwrap);

export const listBlogAdmin = (params = {}) => api.get("/blog/admin/all", { params }).then(unwrap);
export const getBlogAdmin = (id) => api.get(`/blog/admin/${id}`).then(unwrap);
export const createBlogPost = (payload) => api.post("/blog", payload).then(unwrap);
export const updateBlogPost = (id, payload) => api.patch(`/blog/${id}`, payload).then(unwrap);
export const deleteBlogPost = (id) => api.delete(`/blog/${id}`).then(unwrap);

export const listServicesAdmin = (params = {}) => api.get("/services/admin/all", { params }).then(unwrap);
export const getServiceAdmin = (id) => api.get(`/services/admin/${id}`).then(unwrap);
export const createService = (payload) => api.post("/services", payload).then(unwrap);
export const updateService = (id, payload) => api.patch(`/services/${id}`, payload).then(unwrap);
export const deleteService = (id) => api.delete(`/services/${id}`).then(unwrap);

export const listCategoriesAdmin = (params = {}) => api.get("/categories/admin/all", { params }).then(unwrap);
export const createCategory = (payload) => api.post("/categories", payload).then(unwrap);
export const updateCategory = (id, payload) => api.patch(`/categories/${id}`, payload).then(unwrap);
export const deleteCategory = (id) => api.delete(`/categories/${id}`).then(unwrap);

// --- Admin: settings (single-key upsert) ---
export const updateSetting = (key, value) => api.patch(`/settings/${key}`, { value }).then(unwrap);

// --- Auth ---
export async function login(email, password) {
  return await api.post("/auth/login", { email, password }).then(unwrap);
}
export async function logout() {
  return await api.post("/auth/logout").then(unwrap);
}
export const getMe = () => api.get("/auth/me").then(unwrap);
export const changePassword = (currentPassword, newPassword) =>
  api.patch("/auth/me/password", { currentPassword, newPassword }).then(unwrap);


