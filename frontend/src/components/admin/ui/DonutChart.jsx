import React from 'react';

/**
 * DonutChart — SVG-based donut chart
 * Props: data [{label, value, color, pct}], size, centerLabel, centerValue
 */
export default function DonutChart({ data = [], size = 140, centerLabel, centerValue }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = data.reduce((s, d) => s + (d.pct || d.value), 0);

  return (
    <div className="adm-ring-wrap">
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox="0 0 120 120" className="adm-ring-svg">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="14" />
          {data.map((d, i) => {
            const pct  = ((d.pct || d.value) / total) * 100;
            const dash = (pct / 100) * circ;
            const gap  = circ - dash;
            const seg  = (
              <circle
                key={i}
                cx="60" cy="60" r={r}
                fill="none"
                stroke={d.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
            offset += dash;
            return seg;
          })}
        </svg>
        {(centerLabel || centerValue) && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(90deg)',
          }}>
            <div style={{ transform: 'rotate(-90deg)', textAlign: 'center' }}>
              {centerValue && <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{centerValue}</div>}
              {centerLabel && <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{centerLabel}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="adm-ring-legend">
        {data.map((d, i) => (
          <div className="adm-ring-item" key={i}>
            <div className="adm-ring-dot" style={{ background: d.color }} />
            <div>
              <div className="adm-ring-item-label">{d.label}</div>
              <div className="adm-ring-item-val">{d.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
