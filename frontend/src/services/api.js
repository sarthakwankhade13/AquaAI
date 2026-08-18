import axios from 'axios';

// Support environment variable for API base URL
// Expected format:
// http://localhost:5000
//
// The /api/v1 prefix is added here so all
// non-auth services can use the common API client.

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const API_BASE_URL = `${API_BASE}/api/v1`;

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;