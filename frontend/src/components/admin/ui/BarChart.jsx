import React from 'react';

/**
 * BarChart — pure CSS bar chart
 * Props: data [{label, value, color}], height (px), maxValue
 */
export default function BarChart({ data = [], height = 160, maxValue }) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="adm-bar-chart" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.round((d.value / max) * 100);
        return (
          <div className="adm-bar-group" key={i}>
            <div className="adm-bar-val">{d.value}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
              <div
                className="adm-bar"
                style={{ height: `${pct}%`, background: d.color || '#0ea5e9', width: '100%' }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <div className="adm-bar-label">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
