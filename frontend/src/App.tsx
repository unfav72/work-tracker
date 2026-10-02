import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Calendar, Settings, ListTodo, LogOut, Sparkles } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Placeholder Pages
import WorksPage from './pages/WorksPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

function NavItem({ to, icon: Icon, label, isActive }: { to: string; icon: any; label: string; isActive: boolean }) {
  return (
    <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ to, icon: Icon, label, isActive }: { to: string; icon: any; label: string; isActive: boolean }) {
  return (
    <Link to={to} className={`mobile-nav-link ${isActive ? 'active' : ''}`}>
      <Icon size={22} />
      <span>{label}</span>
    </Link>
  );
}

function AppLayout() {
  const location = useLocation();
  const { logout } = useAuth();
  const path = location.pathname;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Sparkles size={18} />
          </div>
          <h2>Daily Toing</h2>
        </div>

        <div className="sidebar-nav">
          <NavItem to="/" icon={Home} label="Today" isActive={path === '/'} />
          <NavItem to="/works" icon={ListTodo} label="Works" isActive={path === '/works'} />
          <NavItem to="/calendar" icon={Calendar} label="Calendar" isActive={path === '/calendar'} />
        </div>

        <div className="sidebar-footer">
          <NavItem to="/settings" icon={Settings} label="Settings" isActive={path === '/settings'} />
          <button className="nav-link" onClick={logout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <MobileNavItem to="/" icon={Home} label="Today" isActive={path === '/'} />
        <MobileNavItem to="/works" icon={ListTodo} label="Works" isActive={path === '/works'} />
        <MobileNavItem to="/calendar" icon={Calendar} label="Calendar" isActive={path === '/calendar'} />
        <MobileNavItem to="/settings" icon={Settings} label="Settings" isActive={path === '/settings'} />
      </nav>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-pulse">
          <Sparkles size={32} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="dashboard-loading" style={{ minHeight: '100vh' }}>
        <div className="loading-pulse">
          <Sparkles size={32} />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
