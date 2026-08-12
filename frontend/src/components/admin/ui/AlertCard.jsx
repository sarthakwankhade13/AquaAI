import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const CONFIG = {
  red:    { cls: 'alert-red',    bg: '#fee2e2', icon: AlertTriangle, color: '#dc2626' },
  orange: { cls: 'alert-orange', bg: '#ffedd5', icon: AlertTriangle, color: '#ea580c' },
  yellow: { cls: 'alert-yellow', bg: '#fef3c7', icon: AlertCircle,   color: '#d97706' },
  blue:   { cls: 'alert-blue',   bg: '#dbeafe', icon: Info,          color: '#2563eb' },
};

export default function AlertCard({ type = 'red', title, detail, time, action }) {
  const cfg = CONFIG[type] || CONFIG.red;
  const Icon = cfg.icon;
  return (
    <div className={`adm-alert-card ${cfg.cls}`}>
      <div className="adm-alert-icon" style={{ background: cfg.bg }}>
        <Icon size={18} color={cfg.color} />
      </div>
      <div className="adm-alert-body">
        <div className="adm-alert-title" style={{ color: cfg.color }}>{title}</div>
        {detail && <div className="adm-alert-detail">{detail}</div>}
        {time   && <div className="adm-alert-time">{time}</div>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}
