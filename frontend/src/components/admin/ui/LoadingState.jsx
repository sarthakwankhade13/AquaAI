import React from 'react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div className="adm-state-box">
      <div className="adm-spinner" />
      <div className="adm-state-desc">{message}</div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'No data found', desc = 'Nothing to display right now.' }) {
  return (
    <div className="adm-state-box">
      <div className="adm-state-icon">{icon}</div>
      <div className="adm-state-title">{title}</div>
      <div className="adm-state-desc">{desc}</div>
    </div>
  );
}

export function ErrorState({ message = 'Failed to load data.' }) {
  return (
    <div className="adm-state-box">
      <div className="adm-state-icon">⚠️</div>
      <div className="adm-state-title">Something went wrong</div>
      <div className="adm-state-desc">{message}</div>
    </div>
  );
}
