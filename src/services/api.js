// Shim for process.env (common issue with some axios versions in Vite)
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

import axios from 'axios';
import { setupMockApi } from './mockApi';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize the mock adapter (safe to keep in development)
// setupMockApi(api);

// Interceptor for JWT tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('junglyst_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear session
      localStorage.removeItem('junglyst_token');
      localStorage.removeItem('junglyst_refresh');
      localStorage.removeItem('junglyst_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
