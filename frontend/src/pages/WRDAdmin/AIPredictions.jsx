import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import StatCard from '../../components/admin/ui/StatCard';
import CardHeader from '../../components/admin/ui/CardHeader';
import DonutChart from '../../components/admin/ui/DonutChart';
import BarChart from '../../components/admin/ui/BarChart';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { BrainCircuit, AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import { getDroughtSummary, getDistrictRiskData } from '../../services/predictionService';

export default function AIPredictions() {
  const [drought, setDrought] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDroughtSummary(), getDistrictRiskData()]).then(([d, dist]) => {
      setDrought(d); setDistricts(dist); setLoading(false);
    });
  }, []);

  if (loading) return <AdminLayout title="AI Predictions" breadcrumb="AI Predictions"><LoadingState /></AdminLayout>;

  const highRiskData = districts.map((d) => ({ label: d.district.substring(0, 6), value: d.highRisk, color: '#ef4444' }));

  return (
    <AdminLayout title="AI Predictions" breadcrumb="AI Predictions">
      <div className="adm-page">

        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">AI Drought Predictions</div>
            <div className="adm-page-desc">Machine learning powered drought risk assessment for Vidarbha region</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ padding: '6px 14px', background: '#ede9fe', color: '#7c3aed', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              🤖 AI Confidence: {drought.confidence}%
            </div>
            <button className="adm-btn adm-btn-primary"><BrainCircuit size={14} /> Run Prediction</button>
          </div>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={BrainCircuit}  label="Overall Drought Risk"     value={drought.overallRisk}          sub={`Confidence ${drought.confidence}%`} trend="warn" trendText="AI" iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={AlertTriangle} label="High Risk Villages"        value={drought.highRiskVillages}     trend="warn" trendText="Needs action" iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
          <StatCard icon={TrendingDown}  label="Water Stress Index"        value={drought.waterStressIndex}     sub="0 = none · 1 = extreme"  trend="warn" trendText="High" iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={Activity}      label="Severe Drought Villages"   value={drought.severeVillages}       trend="down" trendText="Critical" iconBg="#fee2e2" iconColor="#b91c1c" accentColor="#dc2626" />
        </div>

        <div className="adm-grid-2">
          <div className="adm-card">
            <CardHeader title="Risk Distribution — All Villages" subtitle={`Total: ${drought.distribution.reduce((s,d)=>s+d.value,0)} villages assessed`} />
            <div className="adm-card-pad">
              <DonutChart data={drought.distribution} size={160} centerLabel="Risk" centerValue={drought.overallRisk} />
            </div>
          </div>
          <div className="adm-card">
            <CardHeader title="High Risk Villages by District" subtitle="Count of high-risk villages" />
            <div className="adm-card-pad"><BarChart data={highRiskData} height={200} /></div>
          </div>
        </div>

        {/* Risk levels per district */}
        <div className="adm-card">
          <CardHeader title="District-wise Risk Breakdown" subtitle="AI-assessed drought risk levels" />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>District</th><th>Severe</th><th>High Risk</th><th>Moderate</th><th>Low</th><th>Total Villages</th><th>Priority Action</th></tr></thead>
              <tbody>
                {districts.map((d) => (
                  <tr key={d.district}>
                    <td className="td-main">{d.district}</td>
                    <td><span className="adm-badge severe">{Math.floor(d.highRisk * 0.25)}</span></td>
                    <td><span className="adm-badge high">{d.highRisk}</span></td>
                    <td><span className="adm-badge moderate">{d.moderate}</span></td>
                    <td><span className="adm-badge low">{d.low}</span></td>
                    <td style={{ fontWeight: 600 }}>{d.highRisk + d.moderate + d.low}</td>
                    <td>
                      {d.highRisk > 12
                        ? <button className="adm-btn adm-btn-danger adm-btn-sm">Emergency Tanker</button>
                        : <button className="adm-btn adm-btn-ghost adm-btn-sm">Schedule Tanker</button>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* High risk villages table */}
        <div className="adm-card">
          <CardHeader title="High Risk Villages — Immediate Attention" subtitle="Sorted by drought severity" action={<button className="adm-btn adm-btn-primary adm-btn-sm"><BrainCircuit size={12}/> Re-Run AI</button>} />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Village</th><th>District</th><th>Drought Risk</th><th>Water Stress</th><th>Available Water</th><th>Population</th><th>Rec. Tankers</th><th>Priority</th><th>Action</th></tr></thead>
              <tbody>
                {[
                  { v:'Nandgaon',    d:'Amravati',  dr:'Severe',   ws:'0.92', aw:'1,200 L', pop:'2,400', rec:3, pri:'Critical' },
                  { v:'Bori',        d:'Yavatmal',  dr:'Severe',   ws:'0.89', aw:'2,000 L', pop:'1,800', rec:2, pri:'Critical' },
                  { v:'Warud',       d:'Amravati',  dr:'High',     ws:'0.76', aw:'4,500 L', pop:'3,100', rec:2, pri:'High'     },
                  { v:'Patur',       d:'Akola',     dr:'High',     ws:'0.74', aw:'5,000 L', pop:'2,700', rec:2, pri:'High'     },
                  { v:'Karanja',     d:'Washim',    dr:'High',     ws:'0.71', aw:'6,200 L', pop:'4,200', rec:3, pri:'High'     },
                  { v:'Daryapur',    d:'Amravati',  dr:'Moderate', ws:'0.58', aw:'9,000 L', pop:'5,600', rec:2, pri:'Medium'   },
                ].map((row) => (
                  <tr key={row.v}>
                    <td className="td-main">{row.v}</td>
                    <td>{row.d}</td>
                    <td><span className={`adm-badge ${row.dr.toLowerCase()}`}>{row.dr}</span></td>
                    <td style={{ fontWeight: 700, color: parseFloat(row.ws) > 0.8 ? '#ef4444' : '#f97316' }}>{row.ws}</td>
                    <td>{row.aw}</td>
                    <td>{row.pop}</td>
                    <td style={{ fontWeight: 700 }}>{row.rec}</td>
                    <td><span className={`adm-badge ${row.pri.toLowerCase() === 'critical' ? 'emergency' : row.pri.toLowerCase()}`}>{row.pri}</span></td>
                    <td><button className="adm-btn adm-btn-ghost adm-btn-sm">Assign Tanker</button></td>
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
