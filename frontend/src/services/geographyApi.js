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

// Helper to get token if present
const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET /api/v1/districts
 * Return all 11 Vidarbha districts
 */
export const getDistricts = async () => {
  const response = await api.get('/districts');
  return response.data;
};

/**
 * GET /api/v1/districts/:districtId
 * Return one district by ID
 */
export const getDistrictById = async (districtId) => {
  const response = await api.get(`/districts/${districtId}`);
  return response.data;
};

/**
 * GET /api/v1/districts/:districtId/talukas
 * Return all talukas belonging to that district
 */
export const getTalukasByDistrict = async (districtId) => {
  const response = await api.get(`/districts/${districtId}/talukas`);
  return response.data;
};

/**
 * GET /api/v1/talukas/:talukaId
 * Return one taluka by ID
 */
export const getTalukaById = async (talukaId) => {
  const response = await api.get(`/talukas/${talukaId}`);
  return response.data;
};

/**
 * GET /api/v1/talukas/:talukaId/villages
 * Return all villages belonging to that taluka
 */
export const getVillagesByTaluka = async (talukaId) => {
  const response = await api.get(`/talukas/${talukaId}/villages`);
  return response.data;
};

/**
 * GET /api/v1/villages/:villageId
 * Return one village by ID
 */
export const getVillageById = async (villageId) => {
  const response = await api.get(`/villages/${villageId}`);
  return response.data;
};

/**
 * GET /api/v1/villages
 * Filter villages by district_id, taluka_id, search
 */
export const getVillages = async ({ districtId, talukaId, search } = {}) => {
  const params = {};
  if (districtId) params.district_id = districtId;
  if (talukaId) params.taluka_id = talukaId;
  if (search) params.search = search;

  const response = await api.get('/villages', { params });
  return response.data;
};

/**
 * POST /api/v1/admin/geography/sync
 * Trigger Vidarbha geography synchronization (WRD Super Admin protected)
 */
export const syncGeographyData = async () => {
  const response = await api.post('/admin/geography/sync', {}, { headers: getAuthHeaders() });
  return response.data;
};

export default {
  getDistricts,
  getDistrictById,
  getTalukasByDistrict,
  getTalukaById,
  getVillagesByTaluka,
  getVillageById,
  getVillages,
  syncGeographyData,
};
