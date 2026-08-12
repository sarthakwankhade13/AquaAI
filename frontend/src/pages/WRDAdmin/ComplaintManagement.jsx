import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import DonutChart from '../../components/admin/ui/DonutChart';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { MessageSquareWarning, AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';
import { getComplaintStats, getComplaints } from '../../services/complaintService';

export default function ComplaintManagement() {
  const [stats,     setStats]     = useState(null);
  const [complaints,setComplaints]= useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');

  useEffect(() => {
    Promise.all([getComplaintStats(), getComplaints()]).then(([s, c]) => {
      setStats(s); setComplaints(c); setLoading(false);
    });
  }, []);

  if (loading) return <AdminLayout title="Complaint Management" breadcrumb="Complaint Management"><LoadingState /></AdminLayout>;

  const filtered = filter === 'all' ? complaints : complaints.filter((c) => c.status === filter);

  return (
    <AdminLayout title="Complaint Management" breadcrumb="Complaint Management">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Complaint Management</div>
            <div className="adm-page-desc">Track and resolve citizen complaints across all districts</div>
          </div>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={MessageSquareWarning} label="Total Complaints"    value={stats.total}             iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Clock}                label="Pending"             value={stats.pending}           trend="warn" trendText="Awaiting"  iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={CheckCircle}          label="Resolved"            value={stats.resolved}          trend="up"   trendText="This week" iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={AlertTriangle}        label="Emergency"           value={stats.emergency}         trend="warn" trendText="Urgent"    iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
        </div>

        <div className="adm-grid-2">
          <div className="adm-card">
            <CardHeader title="Complaint Distribution" subtitle="By current status" />
            <div className="adm-card-pad">
              <DonutChart data={stats.chartData} size={150} centerLabel="Total" centerValue={stats.total} />
            </div>
          </div>
          <div className="adm-card">
            <CardHeader title="Status Summary" />
            <div className="adm-card-pad" style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {stats.chartData.map((c) => (
                <div key={c.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#f8fafc', borderRadius:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:'50%', background:c.color }} />
                    <span style={{ fontSize:13, color:'#334155', fontWeight:500 }}>{c.label}</span>
                  </div>
                  <span style={{ fontSize:18, fontWeight:800, color:c.color }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="adm-card">
          <CardHeader
            title="All Complaints"
            subtitle={`${filtered.length} complaints`}
            action={
              <div style={{ display:'flex', gap:8 }}>
                <select className="adm-btn adm-btn-ghost adm-btn-sm" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ cursor:'pointer' }}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="review">Under Verification</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="emergency">Emergency</option>
                </select>
                <button className="adm-btn adm-btn-ghost adm-btn-sm"><Filter size={12} /></button>
              </div>
            }
          />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Complaint ID</th><th>Village</th><th>District</th><th>Type</th><th>Priority</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#0369a1', fontWeight:600 }}>{c.id}</span></td>
                    <td className="td-main">{c.village}</td>
                    <td>{c.district}</td>
                    <td style={{ fontSize:12 }}>{c.type}</td>
                    <td><span className={`adm-badge ${c.priority.toLowerCase() === 'critical' || c.priority.toLowerCase() === 'emergency' ? 'emergency' : c.priority.toLowerCase()}`}>{c.priority}</span></td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{c.date}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm">View</button>
                        {(c.status === 'pending' || c.status === 'emergency') &&
                          <button className="adm-btn adm-btn-primary adm-btn-sm">Resolve</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
