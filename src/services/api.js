// Shim for process.env (common issue with some axios versions in Vite)
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

import axios from 'axios';
import { setupMockApi } from './mockApi';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
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
    if (token && !config.url.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
