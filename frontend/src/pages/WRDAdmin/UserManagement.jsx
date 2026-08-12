import React, { useState, useEffect } from 'react';

import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import { LoadingState } from '../../components/admin/ui/LoadingState';

import {
  Users,
  UserCheck,
  Truck,
  Building2,
  Plus,
  Filter,
  X,
} from 'lucide-react';

import {
  getUsers,
  getUserStats,
  getRoles,
} from '../../services/userService';

// ─────────────────────────────────────────────────────────────────────────────
// Role Colors
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLORS = {
  wrd_admin: {
    bg: '#dbeafe',
    color: '#1d4ed8',
  },

  operator: {
    bg: '#dcfce7',
    color: '#15803d',
  },

  citizen: {
    bg: '#fef3c7',
    color: '#92400e',
  },

  tanker_driver: {
    bg: '#ede9fe',
    color: '#6d28d9',
  },

  analyst: {
    bg: '#fce7f3',
    color: '#be185d',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Convert database role name to UI label
// ─────────────────────────────────────────────────────────────────────────────

const formatRoleName = (roleName) => {
  const roleLabels = {
    wrd_admin: 'WRD Super Admin',
    operator: 'Operator',
    citizen: 'Citizen',
    tanker_driver: 'Tanker Driver',
    analyst: 'Analyst',
  };

  if (roleLabels[roleName]) {
    return roleLabels[roleName];
  }

  return String(roleName || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('all');

  // Add User modal
  const [showAddUser, setShowAddUser] = useState(false);

  // Add User form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    gender: '',
    roleId: '',
    address: '',
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Load User Management data
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const loadUserManagement = async () => {
      try {
        setLoading(true);

        const [usersResponse, statsResponse, rolesResponse] =
          await Promise.all([
            getUsers(),
            getUserStats(),
            getRoles(),
          ]);

        // Backend response:
        // {
        //   success: true,
        //   data: [...]
        // }

        const usersData =
          Array.isArray(usersResponse)
            ? usersResponse
            : usersResponse?.data || [];

        const statsData =
          statsResponse?.data || statsResponse || {};

        const rolesData =
          Array.isArray(rolesResponse)
            ? rolesResponse
            : rolesResponse?.data || [];

        setUsers(usersData);
        setStats(statsData);
        setRoles(rolesData);
      } catch (error) {
        console.error(
          'Failed to load User Management:',
          error
        );

        setUsers([]);
        setStats({
          totalUsers: 0,
          districtAdmins: 0,
          villageOfficers: 0,
          drivers: 0,
          citizens: 0,
        });

        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserManagement();
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // Handle form input
  // ───────────────────────────────────────────────────────────────────────────

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Open Add User
  // ───────────────────────────────────────────────────────────────────────────

  const handleOpenAddUser = () => {
    setFormData({
      fullName: '',
      email: '',
      mobile: '',
      password: '',
      gender: '',
      roleId: '',
      address: '',
    });

    setShowAddUser(true);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Close Add User
  // ───────────────────────────────────────────────────────────────────────────

  const handleCloseAddUser = () => {
    setShowAddUser(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Submit Add User
  // ───────────────────────────────────────────────────────────────────────────

  const handleSubmitUser = (event) => {
    event.preventDefault();

    /*
     * IMPORTANT:
     * Database POST API will be connected in the next step.
     *
     * For now we only verify that the form is collecting
     * the correct values, including the database role_id.
     */

    console.log('Add User form submitted:', formData);

    alert(
      'User form submitted successfully. Database connection will be added next.'
    );
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Loading State
  // ───────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AdminLayout
        title="User Management"
        breadcrumb="User Management"
      >
        <LoadingState />
      </AdminLayout>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Filter Users
  // ───────────────────────────────────────────────────────────────────────────

  const filtered =
    filter === 'all'
      ? users
      : users.filter((user) => {
        const roleName =
          user.role_name ||
          user.role ||
          '';

        return roleName === filter;
      });

  // ───────────────────────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      title="User Management"
      breadcrumb="User Management"
    >
      <div className="adm-page">

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* Page Header */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">
              User Management
            </div>

            <div className="adm-page-desc">
              Manage system users across all roles and districts
            </div>
          </div>

          <button
            type="button"
            className="adm-btn adm-btn-primary"
            onClick={handleOpenAddUser}
          >
            <Plus size={14} />
            Add User
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* Statistics */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <div className="adm-grid-4">

          <StatCard
            icon={Users}
            label="Total Users"
            value={stats?.totalUsers || 0}
            iconBg="#e0f2fe"
            iconColor="#0284c7"
            accentColor="#0ea5e9"
          />

          <StatCard
            icon={Building2}
            label="District Admins"
            value={stats?.districtAdmins || 0}
            iconBg="#dbeafe"
            iconColor="#2563eb"
            accentColor="#3b82f6"
          />

          <StatCard
            icon={UserCheck}
            label="Village Officers"
            value={stats?.villageOfficers || 0}
            iconBg="#dcfce7"
            iconColor="#16a34a"
            accentColor="#22c55e"
          />

          <StatCard
            icon={Truck}
            label="Drivers"
            value={stats?.drivers || 0}
            iconBg="#ede9fe"
            iconColor="#7c3aed"
            accentColor="#8b5cf6"
          />

        </div>

        {/* ─────────────────────────────────────────────────────────────── */}
        {/* Users Table */}
        {/* ─────────────────────────────────────────────────────────────── */}

        <div className="adm-card">

          <CardHeader
            title="All Users"
            subtitle={`${filtered.length} users`}
            action={
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                }}
              >

                {/* Database Roles Filter */}
                <select
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">
                    All Roles
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.role_id}
                      value={role.role_name}
                    >
                      {formatRoleName(role.role_name)}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                >
                  <Filter size={12} />
                </button>

              </div>
            }
          />

          <div className="adm-table-wrap">

            <table className="adm-table">

              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filtered.map((user) => {

                  const databaseRole =
                    user.role_name ||
                    user.role ||
                    '';

                  const roleColor =
                    ROLE_COLORS[databaseRole] || {
                      bg: '#f1f5f9',
                      color: '#475569',
                    };

                  const userId =
                    user.user_id ||
                    user.id ||
                    '';

                  const userName =
                    user.full_name ||
                    user.name ||
                    '';

                  const userEmail =
                    user.email ||
                    '';

                  const userDistrict =
                    user.district ||
                    user.district_name ||
                    '';

                  const userStatus =
                    user.is_active !== undefined
                      ? user.is_active
                        ? 'Active'
                        : 'Inactive'
                      : user.status || '';

                  const lastLogin =
                    user.last_login ||
                    user.lastLogin ||
                    '';

                  return (
                    <tr key={userId}>

                      {/* User ID */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: '#0369a1',
                            fontWeight: 600,
                          }}
                        >
                          {userId}
                        </span>
                      </td>

                      {/* Name */}
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >

                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: roleColor.bg,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 700,
                              color: roleColor.color,
                              flexShrink: 0,
                            }}
                          >
                            {userName?.charAt(0) || '?'}
                          </div>

                          <div className="td-main">
                            {userName}
                          </div>

                        </div>
                      </td>

                      {/* Email */}
                      <td
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                        }}
                      >
                        {userEmail}
                      </td>

                      {/* Role */}
                      <td>
                        <span
                          className="adm-badge"
                          style={{
                            background: roleColor.bg,
                            color: roleColor.color,
                          }}
                        >
                          {formatRoleName(databaseRole)}
                        </span>
                      </td>

                      {/* District */}
                      <td
                        style={{
                          fontSize: 12,
                        }}
                      >
                        {userDistrict || '-'}
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge status={userStatus} />
                      </td>

                      {/* Last Login */}
                      <td
                        style={{
                          fontSize: 11,
                          color: '#94a3b8',
                        }}
                      >
                        {lastLogin || '-'}
                      </td>

                      {/* Actions */}
                      <td>

                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                          }}
                        >

                          <button
                            type="button"
                            className="adm-btn adm-btn-ghost adm-btn-sm"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="adm-btn adm-btn-danger adm-btn-sm"
                          >
                            Disable
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign: 'center',
                        padding: 40,
                        color: '#64748b',
                      }}
                    >
                      No users found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ADD USER MODAL */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {showAddUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseAddUser();
            }
          }}
        >

          <div
            style={{
              width: '100%',
              maxWidth: 650,
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 14,
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >

            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  Add New User
                </h2>

                <p
                  style={{
                    margin: '5px 0 0',
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  Create a new AquaAI system user
                </p>

              </div>

              <button
                type="button"
                onClick={handleCloseAddUser}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>

            </div>

            {/* Form */}
            <form onSubmit={handleSubmitUser}>

              <div
                style={{
                  padding: 24,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                }}
              >

                {/* Full Name */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >

                  <label style={labelStyle}>
                    Full Name *
                  </label>

                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                    style={inputStyle}
                  />

                </div>

                {/* Email */}
                <div>

                  <label style={labelStyle}>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@wrd.gov.in"
                    required
                    style={inputStyle}
                  />

                </div>

                {/* Mobile */}
                <div>

                  <label style={labelStyle}>
                    Mobile *
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter mobile number"
                    required
                    style={inputStyle}
                  />

                </div>

                {/* Password */}
                <div>

                  <label style={labelStyle}>
                    Password *
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    required
                    style={inputStyle}
                  />

                </div>

                {/* Gender */}
                <div>

                  <label style={labelStyle}>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>

                  </select>

                </div>

                {/* Role */}
                <div>

                  <label style={labelStyle}>
                    Role *
                  </label>

                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange}
                    required
                    style={inputStyle}
                  >

                    <option value="">
                      Select role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.role_id}
                        value={role.role_id}
                      >
                        {formatRoleName(role.role_name)}
                      </option>
                    ))}

                  </select>

                </div>

                {/* Address */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >

                  <label style={labelStyle}>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    rows={3}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                    }}
                  />

                </div>

              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  padding: '16px 24px',
                  borderTop: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  borderRadius: '0 0 14px 14px',
                }}
              >

                <button
                  type="button"
                  className="adm-btn adm-btn-ghost"
                  onClick={handleCloseAddUser}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="adm-btn adm-btn-primary"
                >
                  <Plus size={14} />
                  Create User
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </AdminLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input Styles
// ─────────────────────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 7,
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  outline: 'none',
  fontSize: 13,
  color: '#0f172a',
  background: '#ffffff',
};