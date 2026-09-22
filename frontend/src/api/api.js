import axios from "axios";

// In local dev, Vite proxies "/api" to the backend (see vite.config.js).
// In production (Vercel), set VITE_API_BASE_URL to your Render backend URL,
// e.g. https://your-backend.onrender.com/api
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export const getListings = (params) => api.get("/listings", { params }).then((r) => r.data);

export const predictPrice = (payload) => api.post("/predict", payload).then((r) => r.data);

export const trainModel = () => api.post("/predict/train").then((r) => r.data);

export const getComparablesByListing = (listingId) =>
  api.get(`/comps/${listingId}`).then((r) => r.data);

export const getComparablesAdHoc = (payload) => api.post("/comps", payload).then((r) => r.data);

export const getTrends = (city, months = 12) =>
  api.get(`/trends/${city}`, { params: { months } }).then((r) => r.data);

export const getAlerts = (city, threshold) =>
  api.get(`/alerts/${city}`, { params: { threshold } }).then((r) => r.data);

export default api;
