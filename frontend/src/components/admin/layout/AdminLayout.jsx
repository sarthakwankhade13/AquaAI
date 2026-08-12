import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../../../admin.css';

export default function AdminLayout({ children, title, breadcrumb }) {
  const [collapsed, setCollapsed]     = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth > 768) setMobileOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Show hamburger on mobile via JS (CSS can't target non-existent props)
  useEffect(() => {
    const btn = document.getElementById('adm-hamburger');
    if (btn) btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
  });

  return (
    <div className="adm-root adm-shell">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="adm-main-area">
        <Header
          title={title}
          breadcrumb={breadcrumb}
          onMobileMenuOpen={() => setMobileOpen(true)}
        />
        <main className="adm-content-scroll">
          {children}
        </main>
      </div>
    </div>
  );
}
