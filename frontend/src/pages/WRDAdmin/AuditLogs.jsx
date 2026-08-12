import React, { useState } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import { ScrollText, Filter } from 'lucide-react';

const LOGS = [
  { id:'LOG-1021', action:'User Login',            user:'Admin Sharma',   role:'District Admin', ip:'192.168.1.14', module:'Auth',         time:'2026-08-11 10:32:14', result:'Success' },
  { id:'LOG-1020', action:'Water Request Approved',user:'WRD Admin',      role:'Super Admin',    ip:'192.168.1.1',  module:'Water Requests',time:'2026-08-11 10:15:40', result:'Success' },
  { id:'LOG-1019', action:'Tanker Assigned',        user:'WRD Admin',      role:'Super Admin',    ip:'192.168.1.1',  module:'Tankers',       time:'2026-08-11 09:58:22', result:'Success' },
  { id:'LOG-1018', action:'Failed Login Attempt',   user:'unknown',        role:'—',              ip:'203.0.113.45', module:'Auth',          time:'2026-08-11 09:44:11', result:'Failed'  },
  { id:'LOG-1017', action:'Complaint Status Updated',user:'Admin Patil',   role:'District Admin', ip:'192.168.1.22', module:'Complaints',    time:'2026-08-11 09:30:05', result:'Success' },
  { id:'LOG-1016', action:'Report Generated',       user:'WRD Admin',      role:'Super Admin',    ip:'192.168.1.1',  module:'Reports',       time:'2026-08-11 08:55:00', result:'Success' },
  { id:'LOG-1015', action:'User Created',            user:'WRD Admin',      role:'Super Admin',    ip:'192.168.1.1',  module:'User Mgmt',     time:'2026-08-11 08:30:18', result:'Success' },
  { id:'LOG-1014', action:'AI Prediction Run',       user:'AI Engine',      role:'System',         ip:'127.0.0.1',    module:'AI/ML',         time:'2026-08-11 06:00:00', result:'Success' },
  { id:'LOG-1013', action:'Emergency Alert Sent',    user:'Auto Alert',     role:'System',         ip:'127.0.0.1',    module:'Alerts',        time:'2026-08-10 23:45:32', result:'Success' },
  { id:'LOG-1012', action:'Settings Updated',        user:'WRD Admin',      role:'Super Admin',    ip:'192.168.1.1',  module:'Settings',      time:'2026-08-10 17:20:44', result:'Success' },
];

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const filtered = LOGS.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Audit Logs" breadcrumb="Audit Logs">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Audit Logs</div>
            <div className="adm-page-desc">Complete system activity trail for compliance and security</div>
          </div>
          <button className="adm-btn adm-btn-ghost"><Filter size={14} /> Export Logs</button>
        </div>

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
          {[
            { label:'Total Events Today', value:'128', color:'#0ea5e9', bg:'#e0f2fe' },
            { label:'Login Events',        value:'34',  color:'#22c55e', bg:'#dcfce7' },
            { label:'Failed Attempts',     value:'2',   color:'#ef4444', bg:'#fee2e2' },
            { label:'System Actions',      value:'22',  color:'#8b5cf6', bg:'#ede9fe' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="adm-card adm-card-pad" style={{ textAlign:'center' }}>
              <div style={{ fontSize:28, fontWeight:800, color }}>{value}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="adm-card">
          <CardHeader
            title="System Activity Logs"
            subtitle={`${filtered.length} entries`}
            action={
              <div className="adm-header-search" style={{ width:220 }}>
                <ScrollText size={13} color="#94a3b8" />
                <input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border:'none', background:'transparent', outline:'none', fontSize:12, width:'100%', color:'#334155' }}
                />
              </div>
            }
          />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Log ID</th><th>Action</th><th>User</th><th>Role</th><th>IP Address</th><th>Module</th><th>Timestamp</th><th>Result</th></tr></thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#94a3b8' }}>{log.id}</span></td>
                    <td className="td-main" style={{ fontSize:12 }}>{log.action}</td>
                    <td style={{ fontSize:12 }}>{log.user}</td>
                    <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#f1f5f9', color:'#475569', fontWeight:600 }}>{log.role}</span></td>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{log.ip}</span></td>
                    <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'#e0f2fe', color:'#0369a1', fontWeight:600 }}>{log.module}</span></td>
                    <td style={{ fontSize:11, color:'#94a3b8', whiteSpace:'nowrap' }}>{log.time}</td>
                    <td>
                      <span className={`adm-badge ${log.result === 'Success' ? 'completed' : 'rejected'}`}>{log.result}</span>
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
