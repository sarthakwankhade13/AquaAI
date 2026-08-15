/**
 * geographyService.js
 * All geography API calls go through this service.
 * React components NEVER call the Maharashtra Govt APIs directly.
 * They call AquaAI's own backend which serves from its SQL database.
 */

import api from './authApi';   // reuses the existing axios instance (baseURL /api/v1/auth)

// The geography base is /api/v1 (not /api/v1/auth), so create a separate base URL
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
const API_BASE_URL = `${API_BASE}/api/v1`;

const geoApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Authorization header from localStorage on every request
geoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Districts ─────────────────────────────────────────────────
export const fetchDistricts = async () => {
  const res = await geoApi.get('/districts');
  return res.data.data || [];
};

export const fetchDistrictById = async (districtId) => {
  const res = await geoApi.get(`/districts/${districtId}`);
  return res.data.data;
};

// ── Talukas ───────────────────────────────────────────────────
export const fetchTalukasByDistrict = async (districtId) => {
  const res = await geoApi.get(`/districts/${districtId}/talukas`);
  return res.data.data || [];
};

export const fetchTalukaById = async (talukaId) => {
  const res = await geoApi.get(`/talukas/${talukaId}`);
  return res.data.data;
};

// ── Villages ──────────────────────────────────────────────────
export const fetchVillagesByTaluka = async (talukaId) => {
  const res = await geoApi.get(`/talukas/${talukaId}/villages`);
  return res.data.data || [];
};

export const fetchVillages = async ({ districtId, talukaId, search } = {}) => {
  const params = {};
  if (districtId) params.district_id = districtId;
  if (talukaId)   params.taluka_id   = talukaId;
  if (search)     params.search      = search;
  const res = await geoApi.get('/villages', { params });
  return res.data.data || [];
};

export const fetchVillageById = async (villageId) => {
  const res = await geoApi.get(`/villages/${villageId}`);
  return res.data.data;
};

// ── Admin Sync (WRD_ADMIN only) ───────────────────────────────
export const triggerGeographySync = async () => {
  const res = await geoApi.post('/admin/geography/sync');
  return res.data;
};

export const validateGeography = async () => {
  const res = await geoApi.get('/admin/geography/validate');
  return res.data;
};
