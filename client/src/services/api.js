// services/api.js
// A single axios instance used by the whole app, so base URL, auth token
// and error handling live in one place instead of every component.

import axios from 'axios';

const api = axios.create({
  // In development Vite proxies /api to the Express server (see vite.config.js).
  // In production the built files are served by the same Express server.
  baseURL: '/api',
  timeout: 60000, // link checks can take a while (we allow several 12s checks in a row)
});

// Attach the JWT to every outgoing request if the user is logged in.
// The token is stored in localStorage — simple and explainable. For a
// portfolio app this is acceptable (httpOnly cookies would be the next step).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('linkgraveyard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Centralized 401 handling: an expired/invalid token logs the user out and
// sends them back to the login page, no matter which page they were on.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('linkgraveyard_token');
      // Only redirect if we're not already on an auth page (prevents loops).
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Small helper so components don't have to dig into axios error objects.
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!error.response) return 'Could not reach the server. Check your connection.';
  return fallback;
}

export default api;
