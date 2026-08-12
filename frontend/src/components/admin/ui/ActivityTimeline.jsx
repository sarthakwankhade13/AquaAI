import React from 'react';

export default function ActivityTimeline({ items = [] }) {
  return (
    <div className="adm-timeline">
      {items.map((item, i) => (
        <div className="adm-timeline-item" key={item.id || i}>
          <div className="adm-timeline-icon-col">
            <div
              className="adm-timeline-dot"
              style={{ background: item.color || '#e0f2fe', color: item.iconColor || '#0369a1' }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
            </div>
            {i < items.length - 1 && <div className="adm-timeline-line" />}
          </div>
          <div className="adm-timeline-content">
            <div className="adm-timeline-title">{item.title}</div>
            <div className="adm-timeline-desc">{item.desc}</div>
            <div className="adm-timeline-meta">
              <span className="adm-timeline-user">{item.user}</span>
              <span className="adm-timeline-time">· {item.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
