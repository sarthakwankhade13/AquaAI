import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Users, UserCheck, Truck, Building2, Plus, Filter } from 'lucide-react';
import { getUsers, getUserStats } from '../../services/userService';

const ROLE_COLORS = {
  'District Admin':   { bg:'#dbeafe', color:'#1d4ed8' },
  'Village Officer':  { bg:'#dcfce7', color:'#15803d' },
  'Driver':           { bg:'#ede9fe', color:'#6d28d9' },
  'Citizen':          { bg:'#fef3c7', color:'#92400e' },
};

export default function UserManagement() {
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    Promise.all([getUsers(), getUserStats()]).then(([u, s]) => {
      setUsers(u); setStats(s); setLoading(false);
    });
  }, []);

  if (loading) return <AdminLayout title="User Management" breadcrumb="User Management"><LoadingState /></AdminLayout>;

  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <AdminLayout title="User Management" breadcrumb="User Management">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">User Management</div>
            <div className="adm-page-desc">Manage system users across all roles and districts</div>
          </div>
          <button className="adm-btn adm-btn-primary"><Plus size={14} /> Add User</button>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={Users}     label="Total Users"        value={stats.totalUsers}      iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Building2} label="District Admins"    value={stats.districtAdmins}  iconBg="#dbeafe" iconColor="#2563eb" accentColor="#3b82f6" />
          <StatCard icon={UserCheck} label="Village Officers"   value={stats.villageOfficers} iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={Truck}     label="Drivers"            value={stats.drivers}         iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
        </div>

        <div className="adm-card">
          <CardHeader
            title="All Users"
            subtitle={`${filtered.length} users`}
            action={
              <div style={{ display:'flex', gap:8 }}>
                <select className="adm-btn adm-btn-ghost adm-btn-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ cursor:'pointer' }}>
                  <option value="all">All Roles</option>
                  <option value="District Admin">District Admin</option>
                  <option value="Village Officer">Village Officer</option>
                  <option value="Driver">Driver</option>
                </select>
                <button className="adm-btn adm-btn-ghost adm-btn-sm"><Filter size={12} /></button>
              </div>
            }
          />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th>Role</th><th>District</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((u) => {
                  const rc = ROLE_COLORS[u.role] || { bg:'#f1f5f9', color:'#475569' };
                  return (
                    <tr key={u.id}>
                      <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#0369a1', fontWeight:600 }}>{u.id}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:rc.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:rc.color, flexShrink:0 }}>
                            {u.name.charAt(0)}
                          </div>
                          <div className="td-main">{u.name}</div>
                        </div>
                      </td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{u.email}</td>
                      <td><span className="adm-badge" style={{ background:rc.bg, color:rc.color }}>{u.role}</span></td>
                      <td style={{ fontSize:12 }}>{u.district}</td>
                      <td><StatusBadge status={u.status} /></td>
                      <td style={{ fontSize:11, color:'#94a3b8' }}>{u.lastLogin}</td>
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="adm-btn adm-btn-ghost adm-btn-sm">Edit</button>
                          <button className="adm-btn adm-btn-danger adm-btn-sm">Disable</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
