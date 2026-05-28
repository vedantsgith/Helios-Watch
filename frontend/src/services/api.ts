/**
 * Axios API Client — Helios-Watch Frontend
 *
 * Single shared axios instance configured with base URL and credentials.
 * All API calls should use this instance (not raw axios.create() in components).
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for httpOnly cookie auth
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
