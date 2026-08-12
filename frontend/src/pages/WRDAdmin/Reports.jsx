import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { FileBarChart, Download, Plus, FileText } from 'lucide-react';
import { getReports } from '../../services/reportService';

const TYPE_COLORS = {
  Drought:      { bg:'#fee2e2', color:'#dc2626' },
  Distribution: { bg:'#e0f2fe', color:'#0369a1' },
  Operations:   { bg:'#ede9fe', color:'#7c3aed' },
  Complaints:   { bg:'#fef3c7', color:'#d97706' },
  Environmental:{ bg:'#dcfce7', color:'#16a34a' },
  'AI/ML':      { bg:'#f3e8ff', color:'#9333ea' },
};

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReports().then((r) => { setReports(r); setLoading(false); });
  }, []);

  if (loading) return <AdminLayout title="Reports" breadcrumb="Reports"><LoadingState /></AdminLayout>;

  return (
    <AdminLayout title="Reports" breadcrumb="Reports">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Reports</div>
            <div className="adm-page-desc">Generated analytical reports for WRD administration</div>
          </div>
          <button className="adm-btn adm-btn-primary"><Plus size={14} /> Generate Report</button>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={FileBarChart} label="Total Reports"       value={reports.length} iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={FileText}     label="Drought Reports"     value={reports.filter(r=>r.type==='Drought').length}      iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
          <StatCard icon={FileText}     label="Operations Reports"  value={reports.filter(r=>r.type==='Operations').length}    iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={FileText}     label="AI/ML Reports"       value={reports.filter(r=>r.type==='AI/ML').length}         iconBg="#f3e8ff" iconColor="#9333ea" accentColor="#a855f7" />
        </div>

        <div className="adm-card">
          <CardHeader title="All Reports" subtitle={`${reports.length} documents available`} />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Report ID</th><th>Title</th><th>Type</th><th>District</th><th>Generated</th><th>Size</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {reports.map((r) => {
                  const tc = TYPE_COLORS[r.type] || { bg:'#f1f5f9', color:'#475569' };
                  return (
                    <tr key={r.id}>
                      <td><span style={{ fontFamily:'monospace', fontSize:12, color:'#0369a1', fontWeight:600 }}>{r.id}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:tc.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <FileText size={14} color={tc.color} />
                          </div>
                          <div>
                            <div className="td-main" style={{ fontSize:12 }}>{r.title}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="adm-badge" style={{ background:tc.bg, color:tc.color }}>{r.type}</span></td>
                      <td style={{ fontSize:12 }}>{r.district}</td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{r.generated}</td>
                      <td style={{ fontSize:12, color:'#64748b' }}>{r.size}</td>
                      <td><span className="adm-badge completed">Completed</span></td>
                      <td>
                        <button className="adm-btn adm-btn-ghost adm-btn-sm">
                          <Download size={12} /> Download
                        </button>
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
