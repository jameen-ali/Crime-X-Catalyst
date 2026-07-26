import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/authStore';
import AppShell from './layouts/AppShell';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import FIRManagement from './pages/FIRManagement';
import SmartSearch from './pages/SmartSearch';
import CrimeAnalytics from './pages/CrimeAnalytics';
import CrimeHeatmap from './pages/CrimeHeatmap';
import PatrolTelemetry from './pages/PatrolTelemetry';
import CriminalNetwork from './pages/CriminalNetwork';
import PredictionEngine from './pages/PredictionEngine';
import LiveAlerts from './pages/LiveAlerts';
import EvidenceExplorer from './pages/EvidenceExplorer';
import Reports from './pages/Reports';
import OfficerWorkspace from './pages/OfficerWorkspace';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminOrAnalystRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin' && user?.role !== 'Analyst') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppShell>
            <Routes>
              <Route path="/"             element={<Dashboard />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/fir"          element={<FIRManagement />} />
              <Route path="/search"       element={<SmartSearch />} />
              <Route path="/analytics"    element={<CrimeAnalytics />} />
              <Route path="/heatmap"      element={<CrimeHeatmap />} />
              <Route path="/patrol"       element={<PatrolTelemetry />} />
              <Route path="/network"      element={<CriminalNetwork />} />
              <Route path="/predictions"  element={<PredictionEngine />} />
              <Route path="/alerts"       element={<LiveAlerts />} />
              <Route path="/evidence"     element={<AdminRoute><EvidenceExplorer /></AdminRoute>} />
              <Route path="/reports"      element={<AdminOrAnalystRoute><Reports /></AdminOrAnalystRoute>} />
              <Route path="/workspace"    element={<OfficerWorkspace />} />
              <Route path="/users"        element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="/settings"     element={<Settings />} />
              <Route path="*"             element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
