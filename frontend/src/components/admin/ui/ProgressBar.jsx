import React from 'react';

export default function ProgressBar({ label, value, max = 100, color = '#0ea5e9', showPct = true }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="adm-progress-bar-wrap">
      <div className="adm-progress-label">
        <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>{label}</span>
        {showPct && <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{pct}%</span>}
      </div>
      <div className="adm-progress-track">
        <div className="adm-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
