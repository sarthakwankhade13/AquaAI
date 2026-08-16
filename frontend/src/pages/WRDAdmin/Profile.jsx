import React, { useState } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import { Save, Shield, Key, Waves } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(() => {
    let u = {};
    try {
      u = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      u = {};
    }
    return {
      fullName:     u.full_name || u.fullName || 'WRD Administrator',
      email:        u.email || 'user@aqua.gov.in',
      mobile:       u.mobile || '9876543210',
      roleName:     u.role_name || u.roleName || 'ADMIN',
      districtName: u.district_name || 'All Vidarbha',
      talukaName:   u.taluka_name || '',
      villageName:  u.village_name || '',
      designation:  u.role_name === 'DISTRICT_ADMIN' 
                      ? `${u.district_name || 'District'} Water Resource Officer` 
                      : u.role_name === 'VILLAGE_OFFICER'
                        ? `${u.village_name || 'Village'} Officer`
                        : 'Water Resource Department — Super Administrator',
      organization: 'Government of Maharashtra, WRD',
      address:      u.address || `${u.village_name ? u.village_name + ', ' : ''}${u.district_name ? u.district_name + ', ' : ''}Maharashtra`,
    };
  });

  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });

  const handle = (key, val) => setProfile((p) => ({ ...p, [key]: val }));

  const InputRow = ({ label, value, onChange, type = 'text', readOnly = false }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <label style={{ fontSize:12, fontWeight:600, color:'#334155' }}>{label}</label>
      <input
        type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} readOnly={readOnly}
        style={{ height:40, padding:'0 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#334155', outline:'none', background: readOnly ? '#f1f5f9' : '#f8fafc' }}
      />
    </div>
  );

  const getInitials = (name = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
  };

  return (
    <AdminLayout title="Profile" breadcrumb="Profile">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">My Profile</div>
            <div className="adm-page-desc">Manage your account information and scope details</div>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="adm-card adm-card-pad">
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{
              width:80, height:80, borderRadius:'50%',
              background:'linear-gradient(135deg,#0ea5e9,#0284c7)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:28, fontWeight:800, color:'#fff', flexShrink:0,
            }}>
              {getInitials(profile.fullName)}
            </div>
            <div>
              <div style={{ fontSize:20, fontWeight:700, color:'#0f172a' }}>{profile.fullName}</div>
              <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>{profile.designation}</div>
              <div style={{ display:'flex', gap:8, marginTop:8, flexWrap: 'wrap' }}>
                <span style={{ padding:'3px 10px', background:'#e0f2fe', color:'#0369a1', borderRadius:20, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                  <Shield size={11} /> {profile.roleName}
                </span>
                {profile.districtName && (
                  <span style={{ padding:'3px 10px', background:'#dcfce7', color:'#15803d', borderRadius:20, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                    <Waves size={11} /> District: {profile.districtName}
                  </span>
                )}
                {profile.villageName && (
                  <span style={{ padding:'3px 10px', background:'#fef3c7', color:'#b45309', borderRadius:20, fontSize:11, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                    <Waves size={11} /> Village: {profile.villageName}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="adm-card">
          <CardHeader title="Personal Information" subtitle="Update your profile details" />
          <div className="adm-card-pad" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <InputRow label="Full Name"       value={profile.fullName}     onChange={(v) => handle('fullName', v)} />
            <InputRow label="Email Address"   value={profile.email}        onChange={(v) => handle('email', v)} type="email" readOnly />
            <InputRow label="Mobile Number"   value={profile.mobile}       onChange={(v) => handle('mobile', v)} type="tel" />
            <InputRow label="User Role"       value={profile.roleName}     onChange={() => {}} readOnly />
            <InputRow label="District Scope"  value={profile.districtName} onChange={() => {}} readOnly />
            {profile.villageName && (
              <InputRow label="Village Scope" value={profile.villageName}  onChange={() => {}} readOnly />
            )}
            <InputRow label="Designation"     value={profile.designation}  onChange={(v) => handle('designation', v)} />
            <InputRow label="Address"         value={profile.address}      onChange={(v) => handle('address', v)} />
          </div>
          <div style={{ padding:'0 20px 20px' }}>
            <button className="adm-btn adm-btn-primary"><Save size={14} /> Save Profile</button>
          </div>
        </div>

        {/* Change Password */}
        <div className="adm-card">
          <CardHeader title={<div style={{ display:'flex', alignItems:'center', gap:8 }}><Key size={15} color="#0ea5e9" />Change Password</div>} subtitle="Use a strong password" />
          <div className="adm-card-pad" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
            <InputRow label="Current Password" value={passwords.current} onChange={(v) => setPasswords((p) => ({ ...p, current: v }))} type="password" />
            <InputRow label="New Password"      value={passwords.newPwd} onChange={(v) => setPasswords((p) => ({ ...p, newPwd: v }))}  type="password" />
            <InputRow label="Confirm Password"  value={passwords.confirm}onChange={(v) => setPasswords((p) => ({ ...p, confirm: v }))} type="password" />
          </div>
          <div style={{ padding:'0 20px 20px' }}>
            <button className="adm-btn adm-btn-primary"><Key size={14} /> Update Password</button>
          </div>
        </div>

        {/* Session Info */}
        <div className="adm-card adm-card-pad">
          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a', marginBottom:12 }}>Active Session Info</div>
          {[
            { label:'Last Login',     val:'2026-08-11 09:12:04' },
            { label:'Login IP',       val:'192.168.1.1' },
            { label:'Browser',        val:'Chrome 128 / Windows' },
            { label:'Session Started',val:'2026-08-11 09:12:04' },
          ].map(({ label, val }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f1f5f9' }}>
              <span style={{ fontSize:12, color:'#64748b' }}>{label}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'#334155', fontFamily:'monospace' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
