import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import { LoadingState } from '../../components/admin/ui/LoadingState';
import { Bell, AlertTriangle, Info, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { getNotifications } from '../../services/reportService';

const ICON_MAP = {
  emergency: { icon: AlertTriangle, bg:'#fee2e2', color:'#dc2626' },
  alert:     { icon: AlertCircle,   bg:'#ffedd5', color:'#ea580c' },
  warning:   { icon: AlertCircle,   bg:'#fef3c7', color:'#d97706' },
  info:      { icon: Info,          bg:'#dbeafe', color:'#2563eb' },
  success:   { icon: CheckCircle,   bg:'#dcfce7', color:'#16a34a' },
};

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications().then((n) => { setNotifs(n); setLoading(false); });
  }, []);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const unread = notifs.filter((n) => !n.read).length;

  if (loading) return <AdminLayout title="Notifications" breadcrumb="Notifications"><LoadingState /></AdminLayout>;

  return (
    <AdminLayout title="Notifications" breadcrumb="Notifications">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">Notifications</div>
            <div className="adm-page-desc">{unread} unread notifications</div>
          </div>
          {unread > 0 && (
            <button className="adm-btn adm-btn-ghost" onClick={markAllRead}>
              <Check size={14} /> Mark all as read
            </button>
          )}
        </div>

        <div className="adm-card">
          <CardHeader title="All Notifications" subtitle={`${notifs.length} total`} />
          <div style={{ display:'flex', flexDirection:'column' }}>
            {notifs.map((n, i) => {
              const cfg = ICON_MAP[n.type] || ICON_MAP.info;
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  style={{
                    display:'flex', alignItems:'flex-start', gap:14,
                    padding:'16px 20px',
                    borderBottom: i < notifs.length - 1 ? '1px solid #e2e8f0' : 'none',
                    background: n.read ? 'transparent' : '#f8faff',
                    transition:'background 0.2s',
                  }}
                >
                  <div style={{ width:40, height:40, borderRadius:10, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={18} color={cfg.color} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{n.title}</span>
                      {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'#0ea5e9', display:'inline-block' }} />}
                    </div>
                    <div style={{ fontSize:12, color:'#64748b' }}>{n.desc}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{n.time}</div>
                  </div>
                  <button
                    className="adm-btn adm-btn-ghost adm-btn-sm"
                    onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    {n.read ? 'Read' : 'Mark Read'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
