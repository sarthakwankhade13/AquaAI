import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cloud, BrainCircuit, Droplets, Truck, Route,
  MessageSquareWarning, GitBranch, BarChart3, Bell, Users, ScrollText,
  Settings, UserCircle, LogOut, ChevronLeft, ChevronRight, Waves, MapPin,
} from 'lucide-react';

const NAV = [
  {
    section: 'MAIN',
    items: [
      { to: '/admin/dashboard',             icon: LayoutDashboard,       label: 'Dashboard' },
      { to: '/admin/environmental',         icon: Cloud,                 label: 'Environmental Monitoring' },
      { to: '/admin/ai-predictions',        icon: BrainCircuit,          label: 'AI Predictions' },
      { to: '/admin/water-requests',        icon: Droplets,              label: 'Water Requests' },
      { to: '/admin/tanker-management',     icon: Truck,                 label: 'Tanker Management' },
      { to: '/admin/trip-management',       icon: Route,                 label: 'Trip Management' },
      { to: '/admin/complaint-management',  icon: MessageSquareWarning,  label: 'Complaint Management' },
      { to: '/admin/water-distribution',    icon: GitBranch,             label: 'Water Distribution' },
    ],
  },
  {
    section: 'REPORTING',
    items: [
      { to: '/admin/reports',       icon: BarChart3, label: 'Reports' },
      { to: '/admin/notifications', icon: Bell,      label: 'Notifications' },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { to: '/admin/geography',       icon: MapPin,      label: 'Geography Master' },
      { to: '/admin/user-management', icon: Users,       label: 'User Management' },
      { to: '/admin/audit-logs',      icon: ScrollText,  label: 'Audit Logs' },
      { to: '/admin/settings',        icon: Settings,    label: 'Settings' },
      { to: '/admin/profile',         icon: UserCircle,  label: 'Profile' },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const sidebarClass = [
    'adm-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`adm-sidebar-overlay ${mobileOpen ? 'visible' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={sidebarClass} aria-label="Sidebar navigation">
        {/* Brand */}
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-logo">
            <Waves size={20} color="#fff" />
          </div>
          {!collapsed && (
            <div className="adm-sidebar-brand-text">
              <div className="adm-sidebar-brand-name">Aqua<span>AI</span></div>
              <div className="adm-sidebar-brand-sub">WRD Super Admin</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="adm-sidebar-nav">
          {NAV.map(({ section, items }) => (
            <div className="adm-nav-section" key={section}>
              <div className="adm-nav-section-label">{section}</div>
              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `adm-nav-item${isActive ? ' active' : ''}`
                  }
                  onClick={onMobileClose}
                  data-tooltip={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                >
                  <span className="adm-nav-icon"><Icon size={18} /></span>
                  <span className="adm-nav-label">{label}</span>
                </NavLink>
              ))}
              <div className="adm-section-sep" />
            </div>
          ))}

          {/* Logout */}
          <div className="adm-nav-section">
            <button
              className="adm-nav-item"
              onClick={handleLogout}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              data-tooltip={collapsed ? 'Logout' : undefined}
            >
              <span className="adm-nav-icon" style={{ color: '#ef4444' }}><LogOut size={18} /></span>
              <span className="adm-nav-label" style={{ color: '#ef4444' }}>Logout</span>
            </button>
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="adm-sidebar-footer">
          <button className="adm-sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
