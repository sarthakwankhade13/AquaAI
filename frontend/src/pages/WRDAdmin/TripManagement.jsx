import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import MapPlaceholder from '../../components/admin/ui/MapPlaceholder';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Route, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getActiveTrips } from '../../services/tankerService';

export default function TripManagement() {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveTrips().then((t) => { setTrips(t); setLoading(false); });
  }, []);

  if (loading) return <AdminLayout title="Trip Management" breadcrumb="Trip Management"><LoadingState /></AdminLayout>;

  const active    = trips.filter((t) => t.status === 'on-route').length;
  const delayed   = trips.filter((t) => t.status === 'delayed').length;
  const delivered = trips.filter((t) => t.status === 'delivered').length;

  return (
    <AdminLayout title="Trip Management" breadcrumb="Trip Management">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Trip Management</div>
            <div className="adm-page-desc">Live monitoring of all active tanker trips</div>
          </div>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={Route}         label="Active Trips"   value={active}    trend="neu" trendText="On route"  iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={AlertTriangle} label="Delayed Trips"  value={delayed}   trend="warn" trendText="Urgent"   iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
          <StatCard icon={CheckCircle}   label="Delivered Today" value={delivered} trend="up"  trendText="Complete" iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={Clock}         label="Avg Trip Time"  value="2.4 hrs"   trend="neu" trendText="This week" iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
        </div>

        {/* Map */}
        <div className="adm-card">
          <CardHeader title="Live Trip Map" subtitle="GPS positions updated every 30 seconds" />
          <div className="adm-card-pad"><MapPlaceholder activeTrips={active} /></div>
        </div>

        {/* Trips table */}
        <div className="adm-card">
          <CardHeader title="Active & Recent Trips" subtitle="Current trip status" />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Trip ID</th><th>Tanker</th><th>Driver</th><th>Route</th><th>Quantity</th><th>ETA</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#7c3aed', fontWeight:600 }}>{t.id}</span></td>
                    <td style={{ fontFamily:'monospace', fontSize:12 }}>{t.tanker}</td>
                    <td className="td-main">{t.driver}</td>
                    <td>
                      <div style={{ fontSize:12 }}>
                        <span style={{ fontWeight:600 }}>{t.from}</span>
                        <span style={{ color:'#94a3b8', margin:'0 4px' }}>→</span>
                        <span style={{ fontWeight:600, color:'#0369a1' }}>{t.to}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight:600 }}>{t.qty}</td>
                    <td>
                      <span style={{ fontWeight:700, color: t.delay ? '#ef4444' : '#334155' }}>{t.eta}</span>
                      {t.delay && <div style={{ fontSize:10, color:'#ef4444', fontWeight:600 }}>DELAYED</div>}
                    </td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><button className="adm-btn adm-btn-ghost adm-btn-sm">Track</button></td>
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
