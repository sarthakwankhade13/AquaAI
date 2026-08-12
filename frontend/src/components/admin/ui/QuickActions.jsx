import React from 'react';
import {
  UserPlus, Truck, FileBarChart, Droplets, BrainCircuit,
  AlertTriangle, UserCog, Zap,
} from 'lucide-react';

const ACTIONS = [
  { icon: UserPlus,      label: 'Add District Admin',    bg: '#dbeafe', color: '#2563eb' },
  { icon: UserCog,       label: 'Add Village Officer',   bg: '#dcfce7', color: '#16a34a' },
  { icon: UserPlus,      label: 'Add Driver',            bg: '#ede9fe', color: '#7c3aed' },
  { icon: Truck,         label: 'Add Tanker',            bg: '#fef3c7', color: '#d97706' },
  { icon: Droplets,      label: 'Create Water Request',  bg: '#e0f2fe', color: '#0369a1' },
  { icon: BrainCircuit,  label: 'Generate AI Prediction',bg: '#f3e8ff', color: '#9333ea' },
  { icon: FileBarChart,  label: 'Generate Report',       bg: '#dcfce7', color: '#15803d' },
  { icon: AlertTriangle, label: 'Send Emergency Alert',  bg: '#fee2e2', color: '#dc2626' },
];

export default function QuickActions() {
  return (
    <div className="adm-quick-actions">
      {ACTIONS.map(({ icon: Icon, label, bg, color }) => (
        <button key={label} className="adm-quick-btn" title={label}>
          <div className="adm-quick-btn-icon" style={{ background: bg }}>
            <Icon size={15} color={color} />
          </div>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
