import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Cloud, BrainCircuit, Droplets, Truck, Route,
  MessageSquareWarning, GitBranch, BarChart3, Bell, Users, ScrollText,
  Settings, UserCircle, LogOut, ChevronLeft, ChevronRight, Waves, MapPin,
} from 'lucide-react';

// ─────────────────────────────────────────────
// ROLE-BASED NAVIGATION
// Same Admin Portal, different features per role
// ─────────────────────────────────────────────

const NAV = [
  {
    section: 'MAIN',
    items: [
      {
        to: '/admin/dashboard',
        icon: LayoutDashboard,
        label: 'Dashboard',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
      {
        to: '/admin/environmental',
        icon: Cloud,
        label: 'Environmental Monitoring',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/ai-predictions',
        icon: BrainCircuit,
        label: 'AI Predictions',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/water-requests',
        icon: Droplets,
        label: 'Water Requests',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
      {
        to: '/admin/tanker-management',
        icon: Truck,
        label: 'Tanker Management',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/trip-management',
        icon: Route,
        label: 'Trip Management',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/complaint-management',
        icon: MessageSquareWarning,
        label: 'Complaint Management',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
      {
        to: '/admin/water-distribution',
        icon: GitBranch,
        label: 'Water Distribution',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
      {
        to: '/admin/geography',
        icon: MapPin,
        label: 'Geography Management',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
    ],
  },

  {
    section: 'REPORTING',
    items: [
      {
        to: '/admin/reports',
        icon: BarChart3,
        label: 'Reports',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
      {
        to: '/admin/notifications',
        icon: Bell,
        label: 'Notifications',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
    ],
  },

  {
    section: 'SYSTEM',
    items: [
      {
        to: '/admin/geography',
        icon: MapPin,
        label: 'Geography Master',
        roles: ['SUPER_ADMIN'],
      },
      {
        to: '/admin/user-management',
        icon: Users,
        label: 'User Management',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/audit-logs',
        icon: ScrollText,
        label: 'Audit Logs',
        roles: ['SUPER_ADMIN'],
      },
      {
        to: '/admin/settings',
        icon: Settings,
        label: 'Settings',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN'],
      },
      {
        to: '/admin/profile',
        icon: UserCircle,
        label: 'Profile',
        roles: ['SUPER_ADMIN', 'DISTRICT_ADMIN', 'VILLAGE_OFFICER'],
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) {
  const navigate = useNavigate();

  // Get logged-in user
  const userData = localStorage.getItem('user');

  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  const userRole = user?.role_name || user?.roleName || user?.role;

  // Filter navigation according to logged-in role
  const roleBasedNav = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.roles.includes(userRole)
    ),
  })).filter((section) => section.items.length > 0);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarClass = [
    'adm-sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
              <div className="adm-sidebar-brand-name">
                Aqua<span>AI</span>
              </div>

              <div className="adm-sidebar-brand-sub">
                {userRole === 'SUPER_ADMIN'
                  ? 'WRD Super Admin'
                  : userRole === 'DISTRICT_ADMIN'
                    ? 'District Admin'
                    : userRole === 'VILLAGE_OFFICER'
                      ? 'Village Officer'
                      : 'AquaAI'}
              </div>
            </div>
          )}
        </div>

        {/* Role Based Navigation */}
        <nav className="adm-sidebar-nav">

          {roleBasedNav.map(({ section, items }) => (
            <div className="adm-nav-section" key={section}>

              <div className="adm-nav-section-label">
                {section}
              </div>

              {items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  className={({ isActive }) =>
                    `adm-nav-item${isActive ? ' active' : ''}`
                  }
                  onClick={onMobileClose}
                  data-tooltip={collapsed ? label : undefined}
                  title={collapsed ? label : undefined}
                >
                  <span className="adm-nav-icon">
                    <Icon size={18} />
                  </span>

                  <span className="adm-nav-label">
                    {label}
                  </span>
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
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              data-tooltip={collapsed ? 'Logout' : undefined}
            >
              <span
                className="adm-nav-icon"
                style={{ color: '#ef4444' }}
              >
                <LogOut size={18} />
              </span>

              <span
                className="adm-nav-label"
                style={{ color: '#ef4444' }}
              >
                Logout
              </span>
            </button>
          </div>

        </nav>

        {/* Collapse toggle */}
        <div className="adm-sidebar-footer">
          <button
            className="adm-sidebar-toggle"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            {collapsed
              ? <ChevronRight size={16} />
              : <ChevronLeft size={16} />
            }
          </button>
        </div>

      </aside>
    </>
  );
}