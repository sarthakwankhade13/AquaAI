import React, { useState } from 'react';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import CardHeader from '../../components/admin/ui/CardHeader';
import { Save, Bell, Shield, Database, Globe, Palette } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    systemName:    'AquaAI WRD Portal',
    region:        'Vidarbha, Maharashtra',
    timezone:      'Asia/Kolkata (IST)',
    language:      'English',
    emailAlerts:   true,
    smsAlerts:     true,
    aiAutoRun:     true,
    aiInterval:    '6',
    sessionTimeout:'30',
    twoFactor:     false,
    maintenanceMode: false,
  });

  const handle = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  const Section = ({ icon: Icon, title, children }) => (
    <div className="adm-card">
      <CardHeader
        title={<div style={{ display:'flex', alignItems:'center', gap:8 }}><Icon size={16} color="#0ea5e9" />{title}</div>}
      />
      <div className="adm-card-pad" style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, desc, children }) => (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'center', paddingBottom:12, borderBottom:'1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{label}</div>
        {desc && <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={() => onChange(!value)}
      style={{
        width:44, height:24, borderRadius:12, border:'none', cursor:'pointer',
        background: value ? '#0ea5e9' : '#e2e8f0', position:'relative', transition:'background 0.2s',
      }}
    >
      <div style={{
        width:18, height:18, borderRadius:'50%', background:'#fff',
        position:'absolute', top:3,
        left: value ? 23 : 3,
        transition:'left 0.2s',
        boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );

  const Input = ({ value, onChange, type='text' }) => (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      style={{ height:36, padding:'0 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:13, color:'#334155', outline:'none', background:'#f8fafc', width:'100%' }}
    />
  );

  return (
    <AdminLayout title="Settings" breadcrumb="Settings">
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <div className="adm-page-title">System Settings</div>
            <div className="adm-page-desc">Configure portal behaviour and preferences</div>
          </div>
          <button className="adm-btn adm-btn-primary"><Save size={14} /> Save Changes</button>
        </div>

        <Section icon={Globe} title="General Settings">
          <Field label="System Name"   desc="Displayed in the portal header"><Input value={settings.systemName}  onChange={(v) => handle('systemName', v)} /></Field>
          <Field label="Region"        desc="Primary operational region">     <Input value={settings.region}      onChange={(v) => handle('region', v)} /></Field>
          <Field label="Timezone"      desc="Server and display timezone">    <Input value={settings.timezone}    onChange={(v) => handle('timezone', v)} /></Field>
          <Field label="Language"      desc="Portal display language">        <Input value={settings.language}    onChange={(v) => handle('language', v)} /></Field>
        </Section>

        <Section icon={Bell} title="Alert & Notification Settings">
          <Field label="Email Alerts"    desc="Send critical alerts via email"><Toggle value={settings.emailAlerts} onChange={(v) => handle('emailAlerts', v)} /></Field>
          <Field label="SMS Alerts"      desc="Send SMS for emergency events"> <Toggle value={settings.smsAlerts}   onChange={(v) => handle('smsAlerts', v)} /></Field>
          <Field label="AI Auto-Run"     desc="Run AI predictions on schedule"><Toggle value={settings.aiAutoRun}   onChange={(v) => handle('aiAutoRun', v)} /></Field>
          <Field label="AI Interval (hrs)" desc="How often AI model runs">    <Input  value={settings.aiInterval}  onChange={(v) => handle('aiInterval', v)} type="number" /></Field>
        </Section>

        <Section icon={Shield} title="Security Settings">
          <Field label="Session Timeout (min)" desc="Auto-logout after inactivity"><Input value={settings.sessionTimeout} onChange={(v) => handle('sessionTimeout', v)} type="number" /></Field>
          <Field label="Two-Factor Auth"       desc="Require OTP for login">       <Toggle value={settings.twoFactor}     onChange={(v) => handle('twoFactor', v)} /></Field>
        </Section>

        <Section icon={Database} title="System Maintenance">
          <Field label="Maintenance Mode" desc="Take portal offline for maintenance">
            <Toggle value={settings.maintenanceMode} onChange={(v) => handle('maintenanceMode', v)} />
          </Field>
          <div style={{ padding:'12px 14px', background:'#fef3c7', borderRadius:8, border:'1px solid rgba(245,158,11,0.3)', fontSize:12, color:'#78350f' }}>
            ⚠ Enabling maintenance mode will lock out all users except Super Admin. Use with caution.
          </div>
        </Section>
      </div>
    </AdminLayout>
  );
}
