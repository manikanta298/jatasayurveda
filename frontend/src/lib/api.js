import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL || "https://lightcoral-chicken-920604.hostingersite.com/api/v1";

// Keep production deployments resilient to a Hostinger/Vite environment
// variable that contains only the backend host. The backend routes are mounted
// under /api/v1, so normalize the base URL before Axios creates requests.
function normalizeApiUrl(value) {
  const url = value.trim().replace(/\/+$/, "");

  if (/\/api\/v1$/i.test(url)) {
    return url;
  }

  return `${url}/api/v1`;
}

export const api = axios.create({
  baseURL: normalizeApiUrl(configuredApiUrl),
  withCredentials: true, // sends the httpOnly JWT cookie set by /auth/login
});

// Unwraps our backend's { success, data, meta } envelope and normalizes errors
// to a plain Error with a readable message, so call sites don't need to know
// about the response shape.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

export function unwrap(res) {
  return res.data.data;
}

export function unwrapWithMeta(res) {
  return { data: res.data.data, meta: res.data.meta };
}

export default api;
