import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/admin/auth/ProtectedRoute';

// WRD Admin Pages
import Dashboard from './pages/WRDAdmin/Dashboard';
import EnvironmentalMonitoring from './pages/WRDAdmin/EnvironmentalMonitoring';
import AIPredictions from './pages/WRDAdmin/AIPredictions';
import WaterRequests from './pages/WRDAdmin/WaterRequests';
import TankerManagement from './pages/WRDAdmin/TankerManagement';
import TripManagement from './pages/WRDAdmin/TripManagement';
import ComplaintManagement from './pages/WRDAdmin/ComplaintManagement';
import WaterDistribution from './pages/WRDAdmin/WaterDistribution';
import Reports from './pages/WRDAdmin/Reports';
import Notifications from './pages/WRDAdmin/Notifications';
import UserManagement from './pages/WRDAdmin/UserManagement';
import AuditLogs from './pages/WRDAdmin/AuditLogs';
import Settings from './pages/WRDAdmin/Settings';
import Profile from './pages/WRDAdmin/Profile';
import GeographyMaster from './pages/WRDAdmin/GeographyMaster';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* WRD Admin Portal — all routes protected */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/environmental" element={<ProtectedRoute><EnvironmentalMonitoring /></ProtectedRoute>} />
        <Route path="/admin/ai-predictions" element={<ProtectedRoute><AIPredictions /></ProtectedRoute>} />
        <Route path="/admin/water-requests" element={<ProtectedRoute><WaterRequests /></ProtectedRoute>} />
        <Route path="/admin/tanker-management" element={<ProtectedRoute><TankerManagement /></ProtectedRoute>} />
        <Route path="/admin/trip-management" element={<ProtectedRoute><TripManagement /></ProtectedRoute>} />
        <Route path="/admin/complaint-management" element={<ProtectedRoute><ComplaintManagement /></ProtectedRoute>} />
        <Route path="/admin/water-distribution" element={<ProtectedRoute><WaterDistribution /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/admin/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/admin/geography" element={<ProtectedRoute><GeographyMaster /></ProtectedRoute>} />
        <Route path="/admin/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
