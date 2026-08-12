import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Truck, Plus, Wrench } from 'lucide-react';
import { getTankerStats, getTankers } from '../../services/tankerService';

export default function TankerManagement() {
  const [stats,   setStats]   = useState(null);
  const [tankers, setTankers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTankerStats(), getTankers()]).then(([s, t]) => {
      setStats(s); setTankers(t); setLoading(false);
    });
  }, []);

  if (loading) return <AdminLayout title="Tanker Management" breadcrumb="Tanker Management"><LoadingState /></AdminLayout>;

  return (
    <AdminLayout title="Tanker Management" breadcrumb="Tanker Management">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Tanker Management</div>
            <div className="adm-page-desc">Fleet overview, status tracking and assignment</div>
          </div>
          <button className="adm-btn adm-btn-primary"><Plus size={14} /> Add Tanker</button>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={Truck} label="Total Fleet"   value={stats.total}       iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Truck} label="Available"     value={stats.available}   trend="up"  trendText="Ready"     iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={Truck} label="On Trip"       value={stats.onTrip}      trend="neu" trendText="Active"    iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={Wrench} label="Maintenance"  value={stats.maintenance} trend="warn" trendText="Offline"  iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
        </div>

        <div className="adm-card">
          <CardHeader title="Fleet Utilization" subtitle="Current period" />
          <div className="adm-card-pad" style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <ProgressBar label={`Available (${stats.available})`} value={stats.available}   max={stats.total} color="#22c55e" />
            <ProgressBar label={`On Trip (${stats.onTrip})`}      value={stats.onTrip}      max={stats.total} color="#8b5cf6" />
            <ProgressBar label={`Assigned (${stats.assigned})`}   value={stats.assigned}    max={stats.total} color="#3b82f6" />
            <ProgressBar label={`Maintenance (${stats.maintenance})`} value={stats.maintenance} max={stats.total} color="#f59e0b" />
          </div>
        </div>

        <div className="adm-card">
          <CardHeader title="Tanker Fleet" subtitle={`${tankers.length} vehicles registered`} />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Vehicle No.</th><th>Driver</th><th>Capacity</th><th>Status</th><th>Current Location</th><th>Trip ID</th><th>Actions</th></tr></thead>
              <tbody>
                {tankers.map((t) => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'#0f172a' }}>{t.vehicle}</span></td>
                    <td className="td-main">{t.driver}</td>
                    <td>{t.capacity}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td style={{ fontSize:12, color:'#64748b' }}>{t.location}</td>
                    <td>
                      {t.trip !== '-'
                        ? <span style={{ fontFamily:'monospace', fontSize:12, color:'#7c3aed', fontWeight:600 }}>{t.trip}</span>
                        : <span style={{ color:'#94a3b8' }}>—</span>
                      }
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm">View</button>
                        {t.status === 'available' && <button className="adm-btn adm-btn-primary adm-btn-sm">Assign</button>}
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
