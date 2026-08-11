import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginApi = async (identifier, password) => {
  try {
    const response = await api.post('/login', {
      mobile: identifier,
      password: password,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Login failed. Please try again.');
    }
    throw new Error('Server unreachable. Please ensure the backend is running.');
  }
};

export const signupApi = async (payload) => {
  try {
    const response = await api.post('/register', payload);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'Registration failed. Please try again.');
    }
    throw new Error('Server unreachable. Please ensure the backend is running.');
  }
};

export default api;
