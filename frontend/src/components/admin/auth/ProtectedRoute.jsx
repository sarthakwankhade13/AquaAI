import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — guards WRD Admin portal.
 * Checks for accessToken in localStorage.
 * When real auth with roles is wired up, also check decoded role === 'WRD_ADMIN'.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // TODO: decode JWT and verify role === 'WRD_ADMIN'
  // const payload = JSON.parse(atob(token.split('.')[1]));
  // if (payload.role !== 'WRD_ADMIN') return <Navigate to="/login" replace />;

  return children;
}
