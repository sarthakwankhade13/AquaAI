/**
 * AquaAI — Application Roles
 *
 * IMPORTANT:
 * These values MUST match the role_name values stored
 * in the MySQL `roles` table.
 */

const ROLES = {
  WRD_SUPER_ADMIN: 'WRD Super Admin',
  WRD_ADMIN: 'WRD Admin',
  WRD_OFFICER: 'WRD Officer',

  DISTRICT_ADMIN: 'District Admin',
  TALUKA_ADMIN: 'Taluka Admin',

  VILLAGE_HEAD: 'Village Head',
  FARMER: 'Farmer',
  GUEST: 'Guest',
};

export default ROLES;