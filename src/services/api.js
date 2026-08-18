// Shim for process.env (common issue with some axios versions in Vite)
if (typeof window !== 'undefined' && !window.process) {
  window.process = { env: {} };
}

import axios from 'axios';
import { setupMockApi } from './mockApi';
import { trackApiMetric } from '../utils/posthog';
import { getApiErrorMessage, getFieldErrors } from '../utils/apiError';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Collapse high-cardinality ids (UUIDs, numeric pks) so metric routes stay groupable,
// e.g. /sellers/store/abc-123/ → /sellers/store/:id/
function normalizeRoute(url = '') {
  return (url.split('?')[0] || '')
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id');
}

// Initialize the mock adapter (safe to keep in development)
// setupMockApi(api);

// Interceptor for JWT tokens (+ start timer for API metrics)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('junglyst_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.metadata = { startTime: (typeof performance !== 'undefined' ? performance.now() : Date.now()) };
    return config;
  },
  (error) => Promise.reject(error)
);

const elapsed = (config) => {
  const start = config?.metadata?.startTime;
  if (start == null) return 0;
  return (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;
};

// Response interceptor: record API metrics, then handle 401s
api.interceptors.response.use(
  (response) => {
    trackApiMetric({
      method: (response.config?.method || 'get').toUpperCase(),
      route: normalizeRoute(response.config?.url),
      status: response.status,
      durationMs: elapsed(response.config),
      success: true,
    });
    return response;
  },
  (error) => {
    // Attach a ready-to-display message + per-field map so every catch site can
    // surface the real reason (e.g. DRF field errors) instead of a generic string.
    try {
      error.userMessage = getApiErrorMessage(error);
      error.fieldErrors = getFieldErrors(error);
    } catch { /* never let error-shaping throw */ }

    // status 0 = network failure / CORS / timeout — only visible client-side
    trackApiMetric({
      method: (error.config?.method || 'get').toUpperCase(),
      route: normalizeRoute(error.config?.url),
      status: error.response?.status || 0,
      durationMs: elapsed(error.config),
      success: false,
      error: error.response?.status ? `HTTP ${error.response.status}` : (error.code || error.message),
      // What the server said was wrong, and what we sent — scrubbed in trackApiMetric.
      errorDetail: error.response?.data,
      requestPayload: error.config?.data,
    });

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
