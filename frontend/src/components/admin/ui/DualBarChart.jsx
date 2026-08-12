import React from 'react';

/**
 * DualBarChart — two-series bar chart (e.g. supply vs demand)
 * Props: data [{day, supply, demand}], color1, color2, label1, label2, height
 */
export default function DualBarChart({
  data = [], color1 = '#0ea5e9', color2 = '#f97316',
  label1 = 'Supply', label2 = 'Demand', height = 160,
}) {
  const max = Math.max(...data.flatMap((d) => [d[Object.keys(d)[1]], d[Object.keys(d)[2]]]), 1);
  const k1 = Object.keys(data[0] || {})[1];
  const k2 = Object.keys(data[0] || {})[2];

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, paddingLeft: 4 }}>
        {[{ c: color1, l: label1 }, { c: color2, l: label2 }].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b' }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
            {l}
          </div>
        ))}
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
        {data.map((d, i) => {
          const v1 = d[k1]; const v2 = d[k2];
          const p1 = (v1 / max) * 100; const p2 = (v2 / max) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 2, width: '100%' }}>
                <div style={{ flex: 1, height: `${p1}%`, background: color1, borderRadius: '3px 3px 0 0', minHeight: 3 }} title={`${label1}: ${v1}`} />
                <div style={{ flex: 1, height: `${p2}%`, background: color2, borderRadius: '3px 3px 0 0', minHeight: 3 }} title={`${label2}: ${v2}`} />
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{d[Object.keys(d)[0]]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
