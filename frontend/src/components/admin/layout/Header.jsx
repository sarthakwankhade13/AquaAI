import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, AlertTriangle, Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Header({ title, breadcrumb, onMobileMenuOpen }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { localStorage.removeItem('accessToken'); navigate('/login'); };

  return (
    <header className="adm-header">
      {/* Mobile hamburger */}
      <button
        className="adm-icon-btn"
        onClick={onMobileMenuOpen}
        aria-label="Open sidebar"
        style={{ display: 'none', '@media(max-width:768px)': { display: 'flex' } }}
        id="adm-hamburger"
      >
        <Menu size={18} />
      </button>

      {/* Title + Breadcrumb */}
      <div className="adm-header-title-area">
        <div className="adm-header-title">{title || 'Dashboard'}</div>
        {breadcrumb && (
          <div className="adm-breadcrumb">
            <span>AquaAI</span>
            <span style={{ color: '#94a3b8' }}>›</span>
            <span>{breadcrumb}</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="adm-header-search">
        <Search size={14} color="#94a3b8" />
        <input placeholder="Search anything..." aria-label="Global search" />
      </div>

      {/* Actions */}
      <div className="adm-header-actions">
        {/* Emergency indicator */}
        <button className="adm-emergency-btn" aria-label="Emergency alerts">
          <AlertTriangle size={13} />
          <span>6 Alerts</span>
        </button>

        {/* Notifications */}
        <button className="adm-icon-btn" aria-label="Notifications" onClick={() => navigate('/admin/notifications')}>
          <Bell size={17} />
          <span className="adm-badge-dot" />
        </button>

        {/* User pill */}
        <div className="adm-dropdown-wrapper" ref={dropRef}>
          <button
            className="adm-user-pill"
            onClick={() => setDropOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={dropOpen}
          >
            <div className="adm-user-avatar">WA</div>
            <div>
              <div className="adm-user-name">WRD Admin</div>
              <div className="adm-user-role">Super Administrator</div>
            </div>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {dropOpen && (
            <div className="adm-dropdown-menu">
              <button className="adm-dropdown-item" onClick={() => { navigate('/admin/profile'); setDropOpen(false); }}>
                <User size={14} /> Profile
              </button>
              <button className="adm-dropdown-item" onClick={() => { navigate('/admin/settings'); setDropOpen(false); }}>
                <Settings size={14} /> Settings
              </button>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '4px 0' }} />
              <button className="adm-dropdown-item danger" onClick={handleLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
