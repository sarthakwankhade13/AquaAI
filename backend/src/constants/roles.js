/**
 * roles.js — Application Role Constants (RBAC)
 *
 * Single source of truth for all user roles.
 * Used in JWT payload, DB records, and the role middleware.
 * Frozen to prevent accidental mutation at runtime.
 *
 * Usage: import ROLES from '../constants/roles.js'
 */

const ROLES = Object.freeze({
  WRD_ADMIN    : 'wrd_admin',      // Super Admin — full system access
  OPERATOR     : 'operator',        // Field operator — limited access
  CITIZEN      : 'citizen',         // Public user — water requests
  TANKER_DRIVER: 'tanker_driver',   // Driver — trip management only
  ANALYST      : 'analyst',         // Data analyst — read-only reports
});

export default ROLES;
