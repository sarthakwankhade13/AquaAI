import axios from 'axios';

// Support environment variable for API base URL
// Expected format: http://localhost:5000 (without /api/v1)
// We'll append /api/v1/auth for auth endpoints
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api/v1/auth`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export const loginApi = async (email, password) => {
  try {
    const response = await api.post('/login', {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message || 'Login failed. Please try again.'
      );
    }

    throw new Error(
      'Server unreachable. Please ensure the backend is running.'
    );
  }
};

// ─────────────────────────────────────────────
// Get Roles (public endpoint for signup form)
// ─────────────────────────────────────────────

export const getRolesApi = async () => {
  try {
    const response = await api.get('/roles');
    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message || 'Failed to fetch roles.'
      );
    }

    throw new Error(
      'Server unreachable. Please ensure the backend is running.'
    );
  }
};

// ─────────────────────────────────────────────
// Signup
// ─────────────────────────────────────────────

export const signupApi = async (payload) => {
  try {
    const response = await api.post('/register', payload);

    return response.data;
  } catch (error) {
    if (error.response?.data) {
      throw new Error(
        error.response.data.message ||
        'Registration failed. Please try again.'
      );
    }

    throw new Error(
      'Server unreachable. Please ensure the backend is running.'
    );
  }
};

export default api;