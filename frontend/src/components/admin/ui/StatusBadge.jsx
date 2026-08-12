import React from 'react';

const DOT_COLORS = {
  pending:      '#f59e0b',
  review:       '#3b82f6',
  approved:     '#22c55e',
  rejected:     '#ef4444',
  'in-progress':'#8b5cf6',
  completed:    '#10b981',
  emergency:    '#dc2626',
  low:          '#22c55e',
  moderate:     '#f59e0b',
  high:         '#f97316',
  severe:       '#ef4444',
  available:    '#22c55e',
  assigned:     '#3b82f6',
  'on-trip':    '#8b5cf6',
  maintenance:  '#f59e0b',
  active:       '#22c55e',
  inactive:     '#94a3b8',
  critical:     '#dc2626',
  'on-route':   '#8b5cf6',
  delayed:      '#ef4444',
  delivered:    '#22c55e',
};

const LABELS = {
  'in-progress': 'In Progress',
  'on-trip':     'On Trip',
  'on-route':    'On Route',
};

/**
 * StatusBadge — coloured pill with dot
 * Props: status (string key)
 */
export default function StatusBadge({ status }) {
  const key   = (status || '').toLowerCase().replace(/\s+/g, '-');
  const color = DOT_COLORS[key] || '#94a3b8';
  const label = LABELS[key] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');
  return (
    <span className={`adm-badge ${key}`}>
      <span className="adm-badge-dot-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
