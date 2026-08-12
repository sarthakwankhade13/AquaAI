/**
 * dashboardService.js — Mock data for the WRD Admin Dashboard.
 * Replace the return values with real API calls when the backend is ready.
 */

export const getKpiStats = async () => {
  return {
    totalDistricts:       11,
    totalVillages:        4320,
    activeTankers:        87,
    activeTrips:          34,
    pendingWaterRequests: 218,
    openComplaints:       143,
    highRiskVillages:     62,
    availableWaterML:     '2.4 BL',   // Billion Litres
  };
};

export const getRecentActivity = async () => {
  return [
    { id:1, icon:'👤', color:'#dbeafe', iconColor:'#1d4ed8', title:'District Admin Created',  desc:'New admin assigned to Amravati district',     user:'Super Admin', time:'2 min ago' },
    { id:2, icon:'🚚', color:'#dcfce7', iconColor:'#15803d', title:'Tanker MH-20-AB-1234 Assigned', desc:'Assigned to Wardha — Hinganghat route',  user:'Ops Manager',  time:'8 min ago' },
    { id:3, icon:'💧', color:'#e0f2fe', iconColor:'#0369a1', title:'Water Request Approved',   desc:'Request #WR-0891 approved — 50,000 L',        user:'Admin Sharma', time:'15 min ago' },
    { id:4, icon:'✅', color:'#dcfce7', iconColor:'#15803d', title:'Complaint Resolved',       desc:'Complaint #CP-0321 marked resolved',           user:'Field Officer', time:'22 min ago' },
    { id:5, icon:'🤖', color:'#ede9fe', iconColor:'#6d28d9', title:'AI Prediction Generated', desc:'Drought forecast updated for Vidarbha region', user:'AI Engine',     time:'1 hr ago' },
    { id:6, icon:'🚨', color:'#fee2e2', iconColor:'#dc2626', title:'Emergency Alert Issued',   desc:'Critical water shortage — Nandgaon village',  user:'Auto Alert',    time:'2 hrs ago' },
    { id:7, icon:'📊', color:'#fef3c7', iconColor:'#b45309', title:'Monthly Report Generated','desc':'Amravati division — July 2026',              user:'Admin Patil',   time:'3 hrs ago' },
    { id:8, icon:'🚚', color:'#dcfce7', iconColor:'#15803d', title:'Trip #TR-0445 Completed',  desc:'Tanker MH-22-CD-5678 delivered 40,000 L',    user:'Driver Raut',   time:'4 hrs ago' },
  ];
};
