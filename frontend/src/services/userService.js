import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// Attach Access Token
// ─────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const accessToken =
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────
// Get Users
// ─────────────────────────────────────────────

export const getUsers = async (params = {}) => {
  const response = await api.get('/users', {
    params,
  });

  return response.data;
};

// ─────────────────────────────────────────────
// Get User Statistics
// ─────────────────────────────────────────────

export const getUserStats = async () => {
  const response = await api.get('/users/stats');

  return response.data;
};

// ─────────────────────────────────────────────
// Get Roles
// ─────────────────────────────────────────────

export const getRoles = async () => {
  const response = await api.get('/users/roles');

  return response.data;
};

export default api;