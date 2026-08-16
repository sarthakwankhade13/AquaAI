import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import StatCard from '../../components/admin/ui/StatCard';
import CardHeader from '../../components/admin/ui/CardHeader';
import DonutChart from '../../components/admin/ui/DonutChart';
import BarChart from '../../components/admin/ui/BarChart';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import {
  BrainCircuit, AlertTriangle, TrendingDown, Activity,
  CloudRain, Thermometer, Wind, Droplets, ChevronDown,
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Gauge,
  Loader2,
} from 'lucide-react';
import { getDroughtSummary, getDistrictRiskData } from '../../services/predictionService';

// ─── API base URL ──────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pctColor(p) {
  if (p >= 0.6) return '#ef4444';
  if (p >= 0.4) return '#f97316';
  return '#22c55e';
}
function confColor(c) {
  if (c === 'HIGH')   return { bg: '#f0fdf4', color: '#16a34a' };
  if (c === 'MEDIUM') return { bg: '#fef9c3', color: '#ca8a04' };
  return                       { bg: '#fef2f2', color: '#dc2626' };
}
function predColor(p) {
  return p === 'DROUGHT'
    ? { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' }
    : { bg: '#f0fdf4', color: '#15803d', border: '#86efac' };
}

// ─── Drought Predictor Panel ──────────────────────────────────────────────────
function DroughtPredictorPanel() {
  const [districts, setDistricts]   = useState([]);
  const [tehsils,   setTehsils]     = useState([]);
  const [district,  setDistrict]    = useState('');
  const [tehsil,    setTehsil]      = useState('');
  const [loading,   setLoading]     = useState(false);
  const [distLoading, setDistLoading] = useState(true);
  const [result,    setResult]      = useState(null);
  const [error,     setError]       = useState(null);

  // Load districts on mount
  useEffect(() => {
    fetch(`${API_BASE}/drought/districts`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setDistricts(res.data.districts);
      })
      .catch(() => {})
      .finally(() => setDistLoading(false));
  }, []);

  // Load tehsils when district changes
  useEffect(() => {
    if (!district) { setTehsils([]); setTehsil(''); return; }
    fetch(`${API_BASE}/drought/tehsils/${encodeURIComponent(district)}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) { setTehsils(res.data.tehsils); setTehsil(''); }
      })
      .catch(() => {});
  }, [district]);

  const handlePredict = async () => {
    if (!district || !tehsil) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/drought/predict`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ district, tehsil }),
      });
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
      } else {
        setError(json.message || 'Prediction failed.');
      }
    } catch (e) {
      setError('Network error — could not reach the prediction server.');
    } finally {
      setLoading(false);
    }
  };

  const isDrought   = result?.prediction === 'DROUGHT';
  const pcStyle     = result ? predColor(result.prediction) : {};
  const confStyle   = result ? confColor(result.confidence) : {};
  const probPct     = result ? Math.round(result.probability * 100) : 0;

  return (
    <div className="adm-card" style={{ marginBottom: 24 }}>
      <CardHeader
        title="Real-Time Drought Predictor"
        subtitle="ML-powered prediction using 3 models + ensemble consensus"
        action={
          <span style={{ padding: '4px 12px', background: '#ede9fe', color: '#7c3aed',
                         borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
            🤖 Random Forest · XGBoost · HGB
          </span>
        }
      />

      {/* ── Input Row ── */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* District */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
                          color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
            District
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="drought-district-select"
              value={district}
              onChange={e => setDistrict(e.target.value)}
              disabled={distLoading}
              style={{ width: '100%', padding: '9px 32px 9px 12px', borderRadius: 8,
                       border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 13,
                       appearance: 'none', cursor: 'pointer', color: district ? '#0f172a' : '#94a3b8' }}
            >
              <option value="">-- Select District --</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%',
                                            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Tehsil */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600,
                          color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>
            Tehsil
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="drought-tehsil-select"
              value={tehsil}
              onChange={e => setTehsil(e.target.value)}
              disabled={!district}
              style={{ width: '100%', padding: '9px 32px 9px 12px', borderRadius: 8,
                       border: '1.5px solid #e2e8f0', background: district ? '#fff' : '#f8fafc',
                       fontSize: 13, appearance: 'none',
                       cursor: district ? 'pointer' : 'not-allowed',
                       color: tehsil ? '#0f172a' : '#94a3b8' }}
            >
              <option value="">-- Select Tehsil --</option>
              {tehsils.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%',
                                            transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Button */}
        <button
          id="drought-predict-btn"
          onClick={handlePredict}
          disabled={!district || !tehsil || loading}
          style={{
            padding: '9px 24px', borderRadius: 8, border: 'none', cursor: (!district || !tehsil || loading) ? 'not-allowed' : 'pointer',
            background: (!district || !tehsil || loading) ? '#e2e8f0' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: (!district || !tehsil || loading) ? '#94a3b8' : '#fff',
            fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
        >
          {loading
            ? <><Loader2 size={14} className="spin-icon" /> Predicting…</>
            : <><BrainCircuit size={14} /> Predict Drought</>
          }
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ margin: '16px 20px', padding: '12px 16px', background: '#fef2f2',
                      border: '1px solid #fca5a5', borderRadius: 8, color: '#dc2626',
                      display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <XCircle size={16} /> {error}
        </div>
      )}

      {/* ── Result ── */}
      {result && (
        <div style={{ padding: '20px' }}>

          {/* Main Result Banner */}
          <div style={{
            padding: '20px 24px', borderRadius: 12,
            border: `2px solid ${pcStyle.border}`,
            background: pcStyle.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 16, marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {isDrought
                ? <AlertTriangle size={40} color="#dc2626" />
                : <CheckCircle2 size={40} color="#16a34a" />
              }
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b',
                               textTransform: 'uppercase', letterSpacing: 1 }}>
                  Drought Prediction — {result.district} / {result.tehsil}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: pcStyle.color, lineHeight: 1.2 }}>
                  {isDrought ? '⚠ DROUGHT' : '✓ NO DROUGHT'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {new Date(result.prediction_date).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {/* Probability */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b',
                               textTransform: 'uppercase', marginBottom: 4 }}>Probability</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: pctColor(result.probability), lineHeight: 1 }}>
                  {probPct}%
                </div>
              </div>
              {/* Confidence */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b',
                               textTransform: 'uppercase', marginBottom: 4 }}>Confidence</div>
                <div style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: confStyle.bg, color: confStyle.color,
                  fontWeight: 800, fontSize: 16,
                }}>
                  {result.confidence}
                </div>
              </div>
            </div>
          </div>

          {/* Three columns: Model Comparison | Key Factors | Feature Values */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>

            {/* Model Comparison */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155',
                             marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Model Comparison
              </div>
              {Object.entries(result.models).map(([name, m]) => {
                const isD = m.prediction === 'DROUGHT';
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                           padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: 12, color: '#475569', textTransform: 'capitalize',
                                   fontWeight: 600 }}>
                      {name.replace(/_/g, ' ')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700,
                                     color: isD ? '#dc2626' : '#16a34a' }}>
                        {m.prediction}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {Math.round(m.probability * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                             paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>
                  Ensemble
                </span>
                <span style={{ fontSize: 12, fontWeight: 800,
                                color: isDrought ? '#dc2626' : '#16a34a' }}>
                  {result.prediction} {probPct}%
                </span>
              </div>
            </div>

            {/* Important Factors */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155',
                             marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Key Factors
              </div>
              {(result.important_factors || []).slice(0, 6).map(f => {
                const impColor = f.impact === 'high' ? '#dc2626' : f.impact === 'medium' ? '#f97316' : '#64748b';
                const w = Math.min(100, Math.round(f.importance * 100 / 0.8));
                return (
                  <div key={f.feature} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#475569', fontWeight: 600,
                                     textTransform: 'capitalize' }}>
                        {f.feature.replace(/_/g, ' ')}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: impColor,
                                     textTransform: 'uppercase' }}>
                        {f.impact}
                      </span>
                    </div>
                    <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${w}%`, background: impColor,
                                     borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Values + Data Source */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155',
                             marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Drought Indicators
              </div>
              {[
                { label: 'SPI-3 Index',    value: result.feature_values?.spi_3?.toFixed(2) ?? 'N/A', icon: <Gauge size={13}/> },
                { label: '30-Day Rainfall', value: `${result.feature_values?.rain_30d ?? 0} mm`, icon: <CloudRain size={13}/> },
                { label: '7-Day Rainfall',  value: `${result.feature_values?.rain_7d ?? 0} mm`, icon: <Droplets size={13}/> },
                { label: 'Coordinates',    value: `${result.coordinates?.latitude?.toFixed(3)}, ${result.coordinates?.longitude?.toFixed(3)}`, icon: null },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between',
                                               padding: '7px 0', borderBottom: '1px solid #e2e8f0',
                                               alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {item.icon} {item.label}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                </div>
              ))}

              {/* Data source */}
              <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8,
                             background: '#ede9fe', fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                📊 Data: {[
                  result.data_source?.historical && 'Historical Gov. Dataset',
                  result.data_source?.open_meteo && 'Open-Meteo',
                ].filter(Boolean).join(' + ') || 'Historical Gov. Dataset'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spinner CSS */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function AIPredictions() {
  const [drought,   setDrought]   = useState(null);
  const [districts, setDistricts] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getDroughtSummary(), getDistrictRiskData()]).then(([d, dist]) => {
      setDrought(d); setDistricts(dist); setLoading(false);
    });
  }, []);

  if (loading) return <AdminLayout title="AI Predictions" breadcrumb="AI Predictions"><LoadingState /></AdminLayout>;

  const highRiskData = districts.map(d => ({ label: d.district.substring(0, 6), value: d.highRisk, color: '#ef4444' }));

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
          </div>
        </div>

        <div className="adm-grid-4">
          <StatCard icon={BrainCircuit}  label="Overall Drought Risk"     value={drought.overallRisk}          sub={`Confidence ${drought.confidence}%`} trend="warn" trendText="AI" iconBg="#ede9fe" iconColor="#7c3aed" accentColor="#8b5cf6" />
          <StatCard icon={AlertTriangle} label="High Risk Villages"        value={drought.highRiskVillages}     trend="warn" trendText="Needs action" iconBg="#fee2e2" iconColor="#dc2626" accentColor="#ef4444" />
          <StatCard icon={TrendingDown}  label="Water Stress Index"        value={drought.waterStressIndex}     sub="0 = none · 1 = extreme"  trend="warn" trendText="High" iconBg="#fef3c7" iconColor="#d97706" accentColor="#f59e0b" />
          <StatCard icon={Activity}      label="Severe Drought Villages"   value={drought.severeVillages}       trend="down" trendText="Critical" iconBg="#fee2e2" iconColor="#b91c1c" accentColor="#dc2626" />
        </div>

        {/* ─── REAL ML PREDICTOR ─── */}
        <DroughtPredictorPanel />

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

      </div>
    </AdminLayout>
  );
}
