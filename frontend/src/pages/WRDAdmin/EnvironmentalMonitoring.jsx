import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import StatCard from '../../components/admin/ui/StatCard';
import CardHeader from '../../components/admin/ui/CardHeader';
import BarChart from '../../components/admin/ui/BarChart';
import ProgressBar from '../../components/admin/ui/ProgressBar';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Thermometer, Droplets, Wind, Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { getAllDistrictsWeather, syncAllWeather } from '../../services/weatherApi';

// ─── WMO Weather code → human-readable label ─────────────────
const WMO_LABELS = {
  0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Icy fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Heavy drizzle', 61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Showers', 81: 'Rain showers', 82: 'Violent showers',
  85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Thunderstorm w/ heavy hail',
};

// ─── Risk assessment based on weather metrics ─────────────────
const assessRisk = ({ avg_temperature, avg_humidity, avg_rainfall }) => {
  if (avg_temperature == null) return { label: 'Unknown', cls: '' };
  if (avg_temperature >= 42 || avg_humidity < 15) return { label: 'Severe',   cls: 'severe'   };
  if (avg_temperature >= 40 || avg_humidity < 20) return { label: 'High',     cls: 'high'      };
  if (avg_temperature >= 38 || avg_humidity < 25) return { label: 'Moderate', cls: 'moderate'  };
  return { label: 'Low', cls: 'low' };
};

// ─── Compute Vidarbha-wide averages from district rows ────────
const computeRegionAverages = (districts) => {
  const valid = districts.filter(d => d.avg_temperature != null);
  if (!valid.length) return null;
  const avg = (key) =>
    Math.round(valid.reduce((s, d) => s + (d[key] ?? 0), 0) / valid.length * 10) / 10;
  return {
    temperature : avg('avg_temperature'),
    humidity    : avg('avg_humidity'),
    rainfall    : avg('avg_rainfall'),
    windSpeed   : avg('avg_wind_speed'),
  };
};

// ─── Helpers ─────────────────────────────────────────────────
const fmt = (v, suffix = '') => (v != null ? `${v}${suffix}` : '—');
const tempColor  = (t) => t >= 40 ? '#ef4444' : t >= 38 ? '#f97316' : '#334155';
const humColor   = (h) => h < 20  ? '#ef4444' : h < 25  ? '#f97316' : '#334155';
const resColor   = (r) => r < 40  ? '#ef4444' : r < 50  ? '#f97316' : '#22c55e';

export default function EnvironmentalMonitoring() {
  const [districts, setDistricts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [syncing,   setSyncing]   = useState(false);
  const [error,     setError]     = useState(null);
  const [lastSync,  setLastSync]  = useState(null);

  const loadWeather = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await getAllDistrictsWeather();
      setDistricts(Array.isArray(data) ? data : []);
      const maxDate = data.reduce((m, d) => (!d.last_updated ? m : !m ? d.last_updated : d.last_updated > m ? d.last_updated : m), null);
      if (maxDate) setLastSync(new Date(maxDate));
    } catch (err) {
      setError(err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadWeather(); }, [loadWeather]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      await syncAllWeather();
      await loadWeather(); // reload from DB after sync
    } catch (err) {
      setError(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return (
    <AdminLayout title="Environmental Monitoring" breadcrumb="Environmental Monitoring">
      <LoadingState />
    </AdminLayout>
  );

  const region    = computeRegionAverages(districts);
  const noData    = !region;

  // Build 7-day chart data from the districts array (temp + humidity)
  // We show district averages side-by-side as a bar series for the region
  const tempData = districts
    .filter(d => d.avg_temperature != null)
    .map(d => ({ label: d.district_name.slice(0, 5), value: d.avg_temperature, color: '#f97316' }));

  const humData = districts
    .filter(d => d.avg_humidity != null)
    .map(d => ({ label: d.district_name.slice(0, 5), value: d.avg_humidity, color: '#0ea5e9' }));

  return (
    <AdminLayout title="Environmental Monitoring" breadcrumb="Environmental Monitoring">
      <div className="adm-page">

        {/* Header */}
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Environmental Monitoring</div>
            <div className="adm-page-desc">Real-time environmental conditions across the Vidarbha region</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastSync && (
              <div style={{ fontSize: 11, color: '#64748b' }}>
                Updated: {lastSync.toLocaleTimeString()}
              </div>
            )}
            {noData ? (
              <div style={{ fontSize: 12, color: '#f97316', padding: '6px 12px', background: '#fff7ed', borderRadius: 20, fontWeight: 600 }}>
                ⚠ No weather data — sync first
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#16a34a', padding: '6px 12px', background: '#dcfce7', borderRadius: 20, fontWeight: 600 }}>
                🟢 Live Data
              </div>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: syncing ? '#e2e8f0' : '#0ea5e9', color: syncing ? '#94a3b8' : '#fff',
                fontSize: 13, fontWeight: 600, cursor: syncing ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw size={13} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 16,
            color: '#dc2626', fontSize: 13,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* KPI Cards — region-wide averages */}
        <div className="adm-grid-4">
          <StatCard icon={Thermometer} label="Avg Temperature"   value={fmt(region?.temperature, '°C')} sub="Vidarbha region average" trend={region?.temperature >= 40 ? 'down' : 'neu'} trendText={region?.temperature >= 40 ? 'Extreme' : 'Moderate'} iconBg="#ffedd5" iconColor="#ea580c" accentColor="#f97316" />
          <StatCard icon={Droplets}    label="Avg Humidity"      value={fmt(region?.humidity, '%')}     sub="Relative humidity"        trend={region?.humidity < 25 ? 'down' : 'up'}    trendText={region?.humidity < 25 ? 'Low' : 'Normal'}           iconBg="#dbeafe" iconColor="#2563eb" accentColor="#3b82f6" />
          <StatCard icon={Cloud}       label="Avg Rainfall"      value={fmt(region?.rainfall, ' mm')}   sub="Last observation period"   trend="warn" trendText="Observed"                                                                                         iconBg="#e0f2fe" iconColor="#0369a1" accentColor="#0ea5e9" />
          <StatCard icon={Wind}        label="Avg Wind Speed"    value={fmt(region?.windSpeed, ' km/h')} sub="10 m above ground"        trend="neu"  trendText="Regional avg"                                                                                      iconBg="#f3e8ff" iconColor="#9333ea" accentColor="#a855f7" />
        </div>

        {/* District charts */}
        {(tempData.length > 0 || humData.length > 0) && (
          <div className="adm-grid-2">
            <div className="adm-card">
              <CardHeader title="Temperature by District" subtitle="°C — current observation" />
              <div className="adm-card-pad">
                <BarChart data={tempData} height={180} maxValue={50} />
              </div>
            </div>
            <div className="adm-card">
              <CardHeader title="Humidity by District" subtitle="% relative humidity" />
              <div className="adm-card-pad">
                <BarChart data={humData} height={180} maxValue={100} />
              </div>
            </div>
          </div>
        )}

        {/* District Environmental Summary table */}
        <div className="adm-card">
          <CardHeader title="District Environmental Summary" subtitle="Open-Meteo live data · Vidarbha" />
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Temp (°C)</th>
                  <th>Humidity (%)</th>
                  <th>Rainfall (mm)</th>
                  <th>Wind (km/h)</th>
                  <th>Villages</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {districts.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      No data yet — click <strong>Sync Now</strong> to load weather from Open-Meteo.
                    </td>
                  </tr>
                ) : (
                  districts.map((row) => {
                    const risk = assessRisk(row);
                    return (
                      <tr key={row.district_id}>
                        <td className="td-main">{row.district_name}</td>
                        <td style={{ color: row.avg_temperature != null ? tempColor(row.avg_temperature) : '#94a3b8' }}>
                          {fmt(row.avg_temperature)}
                        </td>
                        <td style={{ color: row.avg_humidity != null ? humColor(row.avg_humidity) : '#94a3b8' }}>
                          {fmt(row.avg_humidity)}
                        </td>
                        <td>{fmt(row.avg_rainfall)}</td>
                        <td>{fmt(row.avg_wind_speed)}</td>
                        <td style={{ color: '#64748b' }}>{row.villages_with_data ?? 0}</td>
                        <td>
                          <span className={`adm-badge ${risk.cls}`}>{risk.label}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Water Resource Status — static thresholds (non-weather data) */}
        <div className="adm-card">
          <CardHeader title="Water Resource Status" subtitle="Current levels vs safe thresholds (static reference)" />
          <div className="adm-card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProgressBar label="Amravati Reservoir"  value={41} color={resColor(41)} />
            <ProgressBar label="Wardha Reservoir"    value={38} color={resColor(38)} />
            <ProgressBar label="Akola Reservoir"     value={54} color={resColor(54)} />
            <ProgressBar label="Yavatmal Reservoir"  value={32} color={resColor(32)} />
            <ProgressBar label="Buldhana Reservoir"  value={61} color={resColor(61)} />
            <ProgressBar label="Washim Reservoir"    value={45} color={resColor(45)} />
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
