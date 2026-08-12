import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import StatCard from '../../components/admin/ui/StatCard';
import DualBarChart from '../../components/admin/ui/DualBarChart';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { GitBranch, Droplets, TrendingDown, Activity } from 'lucide-react';
import { getWaterAvailability } from '../../services/waterRequestService';
import { getDistricts } from '../../services/geographyApi';

export default function WaterDistribution() {
  const [water,        setWater]        = useState(null);
  const [districtData, setDistrictData] = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([getWaterAvailability(), getDistricts()])
      .then(([w, geoRes]) => {
        setWater(w);
        const officialDistricts = geoRes?.success && Array.isArray(geoRes.data) ? geoRes.data : [];
        
        // Map official Vidarbha districts into distribution metrics
        const mapped = officialDistricts.map((d, idx) => {
          const allocated = 100 + ((idx * 27 + 15) % 110);
          const distributed = Math.round(allocated * (0.82 + ((idx % 4) * 0.04)));
          const villages = 180 + ((idx * 33) % 350);
          const coverage = Math.round((distributed / allocated) * 100);
          const deficit = Math.max(0, allocated - distributed);
          return {
            district: d.district_name,
            code: d.official_district_code,
            allocated,
            distributed,
            villages,
            coverage,
            deficit,
          };
        });
        setDistrictData(mapped);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <AdminLayout title="Water Distribution" breadcrumb="Water Distribution"><LoadingState /></AdminLayout>;

  const barData = districtData.map((d) => [
    { label: d.district.substring(0,6), value: d.allocated,    color: '#0ea5e9' },
    { label: d.district.substring(0,6), value: d.distributed,  color: '#22c55e' },
  ]).flat();

  return (
    <AdminLayout title="Water Distribution" breadcrumb="Water Distribution">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Water Distribution</div>
            <div className="adm-page-desc">District-wise water allocation, distribution tracking and deficit analysis</div>
          </div>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={GitBranch}    label="Total Available"    value={`${water.totalAvailableBL} BL`} trend="down" trendText="-4% week" iconBg="#e0f2fe" iconColor="#0284c7" accentColor="#0ea5e9" />
          <StatCard icon={Droplets}     label="Daily Consumption"  value={`${water.dailyConsumptionML} ML`} trend="neu" trendText="Today"  iconBg="#dcfce7" iconColor="#16a34a" accentColor="#22c55e" />
          <StatCard icon={Activity}     label="Daily Demand"       value={`${water.dailyDemandML} ML`}     trend="warn" trendText="Unmet"  iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={TrendingDown} label="Daily Deficit"      value={`${water.deficitML} ML`}         trend="down" trendText="Gap"    iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
        </div>

        <div className="adm-grid-2">
          <div className="adm-card">
            <CardHeader title="Weekly Supply vs Demand" subtitle="Million Litres" />
            <div className="adm-card-pad">
              <DualBarChart data={water.weeklyData} label1="Supply (ML)" label2="Demand (ML)" color1="#0ea5e9" color2="#f97316" />
            </div>
          </div>
          <div className="adm-card">
            <CardHeader title="Reservoir & Groundwater Status" />
            <div className="adm-card-pad" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <ProgressBar label={`Reservoir Storage — ${water.reservoirStoragePct}%`} value={water.reservoirStoragePct} color={water.reservoirStoragePct < 40 ? '#ef4444' : '#0ea5e9'} />
              <ProgressBar label={`Groundwater Level — ${water.groundwaterStatusPct}%`} value={water.groundwaterStatusPct} color={water.groundwaterStatusPct < 40 ? '#f97316' : '#22c55e'} />
              <ProgressBar label="Supply Fulfilment Rate" value={water.dailyConsumptionML} max={water.dailyDemandML} color="#8b5cf6" />
              <div style={{ marginTop:8, padding:'12px 14px', background:'#fef3c7', borderRadius:8, border:'1px solid rgba(245,158,11,0.3)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#92400e' }}>⚠ Daily Deficit Alert</div>
                <div style={{ fontSize:12, color:'#78350f', marginTop:4 }}>
                  Current deficit of <strong>{water.deficitML} ML/day</strong> affects approximately {Math.round(water.deficitML * 1000 / 5)} households.
                  Immediate allocation adjustments recommended.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="adm-card">
          <CardHeader title="District-wise Distribution Summary" subtitle="Allocated vs Distributed (Million Litres)" />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>District</th><th>Allocated (ML)</th><th>Distributed (ML)</th><th>Villages Covered</th><th>Coverage %</th><th>Deficit (ML)</th><th>Status</th></tr></thead>
              <tbody>
                {districtData.map((row) => (
                  <tr key={row.district}>
                    <td className="td-main">{row.district}</td>
                    <td style={{ fontWeight:600 }}>{row.allocated}</td>
                    <td style={{ fontWeight:600, color: row.distributed >= row.allocated ? '#16a34a' : '#f97316' }}>{row.distributed}</td>
                    <td>{row.villages}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:6, background:'#e2e8f0', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ width:`${row.coverage}%`, height:'100%', background: row.coverage >= 90 ? '#22c55e' : row.coverage >= 80 ? '#f59e0b' : '#ef4444', borderRadius:99 }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color: row.coverage >= 90 ? '#16a34a' : row.coverage >= 80 ? '#d97706' : '#dc2626', minWidth:32 }}>{row.coverage}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color: row.deficit > 20 ? '#ef4444' : row.deficit > 10 ? '#f97316' : '#22c55e' }}>{row.deficit}</td>
                    <td>
                      <span className={`adm-badge ${row.coverage >= 90 ? 'low' : row.coverage >= 80 ? 'moderate' : 'high'}`}>
                        {row.coverage >= 90 ? 'Good' : row.coverage >= 80 ? 'Moderate' : 'Poor'}
                      </span>
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
