import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard — KPI metric card
 * Props: icon, label, value, sub, trend (up|down|warn|neu), trendText, accentColor, iconBg, iconColor
 */
export default function StatCard({ icon: Icon, label, value, sub, trend, trendText, accentColor, iconBg, iconColor }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-card-top">
        <div className="adm-stat-icon-box" style={{ background: iconBg || '#e0f2fe' }}>
          {Icon && <Icon size={22} color={iconColor || '#0ea5e9'} />}
        </div>
        {trend && trendText && (
          <div className={`adm-stat-trend ${trend}`}>
            <TrendIcon size={11} />
            <span>{trendText}</span>
          </div>
        )}
      </div>
      <div>
        <div className="adm-stat-value">{value}</div>
        <div className="adm-stat-label">{label}</div>
        {sub && <div className="adm-stat-sub">{sub}</div>}
      </div>
      {accentColor && (
        <div className="adm-stat-card-accent" style={{ background: accentColor }} />
      )}
    </div>
  );
}
