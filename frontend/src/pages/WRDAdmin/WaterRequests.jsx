import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatusBadge from '../../components/admin/ui/StatusBadge';
import StatCard from '../../components/admin/ui/StatCard';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Droplets, Clock, CheckCircle, XCircle, Plus, Filter } from 'lucide-react';
import { getWaterRequests } from '../../services/waterRequestService';
import { getDistricts } from '../../services/geographyApi';

export default function WaterRequests() {
  const [requests,       setRequests]       = useState([]);
  const [districts,      setDistricts]      = useState([]);
  
  // Read logged-in user for scope filtering
  const userObj = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const userRole = userObj.role_name || userObj.roleName || 'SUPER_ADMIN';
  const userDistrict = userObj.district_name || '';

  const [selectedDist,   setSelectedDist]   = useState(() => {
    return (userRole === 'DISTRICT_ADMIN' || userRole === 'VILLAGE_OFFICER') && userDistrict
      ? userDistrict
      : 'all';
  });
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState('all');

  useEffect(() => {
    Promise.all([getWaterRequests(), getDistricts()])
      .then(([reqs, geoRes]) => {
        setRequests(reqs);
        if (geoRes?.success && Array.isArray(geoRes.data)) {
          setDistricts(geoRes.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout title="Water Requests" breadcrumb="Water Requests"><LoadingState /></AdminLayout>;

  const counts = requests.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const filtered = requests.filter((r) => {
    const matchesStatus = filter === 'all' || r.status === filter;
    const matchesDistrict = selectedDist === 'all' || r.district.toLowerCase() === selectedDist.toLowerCase();
    return matchesStatus && matchesDistrict;
  });

  return (
    <AdminLayout title="Water Requests" breadcrumb="Water Requests">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Water Requests</div>
            <div className="adm-page-desc">Manage and track all village water supply requests</div>
          </div>
          <button className="adm-btn adm-btn-primary"><Plus size={14} /> New Request</button>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={Droplets}     label="Total Requests"   value={requests.length}             iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Clock}        label="Pending"          value={counts.pending || 0}          trend="warn" trendText="Needs review" iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={CheckCircle}  label="Approved"         value={(counts.approved || 0) + (counts.completed || 0)} trend="up" trendText="Fulfilled" iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={XCircle}      label="Rejected"         value={counts.rejected || 0}         trend="neu" trendText="This week"  iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
        </div>

        <div className="adm-card">
          <CardHeader
            title="All Water Requests"
            subtitle={`${filtered.length} requests`}
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  value={selectedDist}
                  onChange={(e) => setSelectedDist(e.target.value)}
                  disabled={userRole === 'DISTRICT_ADMIN' || userRole === 'VILLAGE_OFFICER'}
                  style={{ cursor: userRole === 'DISTRICT_ADMIN' || userRole === 'VILLAGE_OFFICER' ? 'not-allowed' : 'pointer' }}
                >
                  {userRole !== 'DISTRICT_ADMIN' && userRole !== 'VILLAGE_OFFICER' && (
                    <option value="all">All Districts (Vidarbha)</option>
                  )}
                  {districts.map((d) => (
                    <option key={d.id} value={d.district_name}>{d.district_name}</option>
                  ))}
                </select>
                <select
                  className="adm-btn adm-btn-ghost adm-btn-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            }
          />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Request ID</th><th>Village</th><th>District</th>
                  <th>Requested Qty</th><th>Priority</th><th>Date</th>
                  <th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#0369a1', fontWeight:600 }}>{r.id}</span></td>
                    <td className="td-main">{r.village}</td>
                    <td>{r.district}</td>
                    <td style={{ fontWeight:600, color:'#0f172a' }}>{r.qty}</td>
                    <td>
                      <span className={`adm-badge ${r.priority.toLowerCase() === 'critical' ? 'emergency' : r.priority.toLowerCase()}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{r.date}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm">View</button>
                        {r.status === 'pending' && <button className="adm-btn adm-btn-primary adm-btn-sm">Approve</button>}
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
