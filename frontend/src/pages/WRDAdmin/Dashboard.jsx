import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import StatCard from '../../components/admin/ui/StatCard';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import ActivityTimeline from '../../components/admin/ui/ActivityTimeline';
import AlertCard from '../../components/admin/ui/AlertCard';
import QuickActions from '../../components/admin/ui/QuickActions';
import DonutChart from '../../components/admin/ui/DonutChart';
import DualBarChart from '../../components/admin/ui/DualBarChart';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import MapPlaceholder from '../../components/admin/ui/MapPlaceholder';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import {
  Map, Building2, Truck, Route, Droplets, MessageSquareWarning,
  AlertTriangle, Database, RefreshCw,
} from 'lucide-react';
import { getKpiStats, getRecentActivity } from '../../services/dashboardService';
import { getDroughtSummary } from '../../services/predictionService';
import { getWaterAvailability, getWaterRequests } from '../../services/waterRequestService';
import { getTankerStats } from '../../services/tankerService';
import { getComplaintStats } from '../../services/complaintService';

export default function Dashboard() {
  const [kpi, setKpi] = useState(null);
  const [drought, setDrought] = useState(null);
  const [water, setWater] = useState(null);
  const [activity, setActivity] = useState([]);
  const [tankers, setTankers] = useState(null);
  const [complaints, setComp] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getKpiStats(), getDroughtSummary(), getWaterAvailability(),
      getRecentActivity(), getTankerStats(), getComplaintStats(), getWaterRequests(),
    ]).then(([k, d, w, a, t, c, r]) => {
      setKpi(k); setDrought(d); setWater(w);
      setActivity(a); setTankers(t); setComp(c); setRequests(r.slice(0, 5));
      setLoading(false);
    });
  }, []);

  // Read logged-in user for scope header
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    currentUser = {};
  }

  const roleName = currentUser.role_name || currentUser.roleName || 'SUPER_ADMIN';
  const scopeDistrict = currentUser.district_name || '';
  const scopeVillage = currentUser.village_name || '';

  if (loading) return <AdminLayout title="Dashboard" breadcrumb="Dashboard"><LoadingState /></AdminLayout>;

  return (
    <AdminLayout title="Dashboard" breadcrumb="Dashboard">
      <div className="adm-page">

        {/* ── Role Scope Header Banner ── */}
        <div className="adm-card adm-card-pad" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                Welcome, {currentUser.full_name || 'Officer'}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                {roleName === 'DISTRICT_ADMIN' && `District Jurisdiction Scope: ${scopeDistrict} District`}
                {roleName === 'TALUKA_ADMIN' && `Taluka level administrative Officer : ${scopeVillage} Gram Panchayat (${scopeDistrict} District)`}
                {roleName === 'SUPER_ADMIN' && `WRD Super Admin Scope: All 11 Districts of Vidarbha Region`}
              </div>
            </div>
            <div style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
              {roleName}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="adm-grid-4">
          <StatCard icon={Map} label="Total Districts" value={kpi.totalDistricts} trend="neu" trendText="Vidarbha" iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Building2} label="Total Villages" value={kpi.totalVillages.toLocaleString()} trend="neu" trendText="Official MRSAC" iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={Truck} label="Active Tankers" value={kpi.activeTankers} trend="neu" trendText="System" iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={Route} label="Active Trips" value={kpi.activeTrips} trend="neu" trendText="System" iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={Droplets} label="Pending Requests" value={kpi.pendingWaterRequests} trend="neu" trendText="System" iconBg="#dbeafe" iconColor="#1d4ed8" accentColor="#3b82f6" />
          <StatCard icon={MessageSquareWarning} label="Open Complaints" value={kpi.openComplaints} trend="neu" trendText="System" iconBg="#ffedd5" iconColor="#c2410c" accentColor="#f97316" />
          <StatCard icon={AlertTriangle} label="High Risk Villages" value={kpi.highRiskVillages} trend="neu" trendText="Pending AI" iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
          <StatCard icon={Database} label="Available Water" value={kpi.availableWaterML} trend="neu" trendText="System" iconBg="#ccfbf1" iconColor="#0f766e" accentColor="#14b8a6" />
        </div>

        {/* ── Emergency Alerts ── */}
        <div className="adm-card">
          <CardHeader
            title="🚨 Emergency Alerts"
            subtitle="Requires immediate attention"
            action={<button className="adm-btn adm-btn-ghost adm-btn-sm"><RefreshCw size={12} /> Refresh</button>}
          />
          <div className="adm-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center', color: '#64748b', padding: '24px' }}>
            No active emergency alerts recorded. System operating normally.
          </div>
        </div>

        {/* ── Drought + Water ── */}
        <div className="adm-grid-2">
          {/* Drought Risk */}
          <div className="adm-card">
            <CardHeader title="AI Drought Risk Overview" subtitle={`Confidence: ${drought.confidence}% · Water Stress: ${drought.waterStressIndex}`} />
            <div className="adm-card-pad">
              <DonutChart
                data={drought.distribution}
                size={150}
                centerLabel="Overall"
                centerValue={drought.overallRisk}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                {[
                  { label: 'High Risk', val: drought.highRiskVillages, color: '#f97316' },
                  { label: 'Moderate', val: drought.moderateRiskVillages, color: '#f59e0b' },
                  { label: 'Severe', val: drought.severeVillages, color: '#ef4444' },
                  { label: 'Low Risk', val: drought.lowRiskVillages, color: '#22c55e' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label} Villages</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Water Availability */}
          <div className="adm-card">
            <CardHeader title="Water Availability vs Demand" subtitle="Last 7 days (Million Litres)" />
            <div className="adm-card-pad">
              <DualBarChart
                data={water.weeklyData}
                label1="Supply (ML)" label2="Demand (ML)"
                color1="#0ea5e9" color2="#f97316"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <ProgressBar label="Reservoir Storage" value={water.reservoirStoragePct} color="#0ea5e9" />
                <ProgressBar label="Groundwater Level" value={water.groundwaterStatusPct} color="#22c55e" />
                <ProgressBar label="Daily Supply / Demand" value={water.dailyConsumptionML} max={water.dailyDemandML} color="#f97316" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tanker + Map ── */}
        <div className="adm-grid-2">
          {/* Tanker Status */}
          <div className="adm-card">
            <CardHeader title="Tanker Operations" subtitle="Fleet status overview" />
            <div className="adm-card-pad">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total', val: tankers.total, color: '#0ea5e9', bg: '#e0f2fe' },
                  { label: 'Available', val: tankers.available, color: '#22c55e', bg: '#dcfce7' },
                  { label: 'On Trip', val: tankers.onTrip, color: '#8b5cf6', bg: '#ede9fe' },
                  { label: 'Assigned', val: tankers.assigned, color: '#3b82f6', bg: '#dbeafe' },
                  { label: 'Maintenance', val: tankers.maintenance, color: '#f59e0b', bg: '#fef3c7' },
                  { label: 'Utilization', val: `${Math.round((tankers.onTrip / tankers.total) * 100)}%`, color: '#14b8a6', bg: '#ccfbf1' },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '12px 8px', background: bg, borderRadius: 10 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
              <ProgressBar label="Fleet Utilization" value={tankers.onTrip + tankers.assigned} max={tankers.total} color="#0ea5e9" />
            </div>
          </div>

          {/* Live Map */}
          <div className="adm-card">
            <CardHeader title="Live Trip Monitoring" subtitle="Real-time tanker positions" />
            <div className="adm-card-pad" style={{ padding: '12px 16px' }}>
              <MapPlaceholder activeTrips={34} />
            </div>
          </div>
        </div>

        {/* ── Recent Requests + Complaints ── */}
        <div className="adm-grid-2">
          {/* Water Requests */}
          <div className="adm-card">
            <CardHeader title="Recent Water Requests" subtitle="Latest 5 requests" action={<button className="adm-btn adm-btn-ghost adm-btn-sm">View All</button>} />
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>ID</th><th>Village</th><th>Qty</th><th>Priority</th><th>Status</th></tr></thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0369a1', fontWeight: 600 }}>{r.id}</span></td>
                      <td><div className="td-main">{r.village}</div><div className="td-sub">{r.district}</div></td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.qty}</td>
                      <td><span className={`adm-badge ${r.priority.toLowerCase() === 'critical' ? 'emergency' : r.priority.toLowerCase()}`}>{r.priority}</span></td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complaint Stats */}
          <div className="adm-card">
            <CardHeader title="Complaint Overview" subtitle="Current period" />
            <div className="adm-card-pad">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <DonutChart
                  data={complaints.chartData}
                  size={130}
                  centerLabel="Total"
                  centerValue={complaints.total}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {complaints.chartData.map((c) => (
                  <ProgressBar key={c.label} label={c.label} value={c.value} max={complaints.total} color={c.color} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Activity + Quick Actions ── */}
        <div className="adm-grid-2">
          <div className="adm-card">
            <CardHeader title="Recent Activity" subtitle="System-wide events" />
            <div className="adm-card-pad" style={{ padding: '0 16px 16px' }}>
              <ActivityTimeline items={activity} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="adm-card">
              <CardHeader title="Quick Actions" subtitle="Common operations" />
              <div className="adm-card-pad"><QuickActions /></div>
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
