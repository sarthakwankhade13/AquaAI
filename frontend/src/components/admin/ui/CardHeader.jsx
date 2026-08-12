import React from 'react';

/**
 * CardHeader — reusable card header with title, subtitle, and optional action
 */
export default function CardHeader({ title, subtitle, action }) {
  return (
    <div className="adm-card-header">
      <div>
        <div className="adm-card-title">{title}</div>
        {subtitle && <div className="adm-card-subtitle">{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
