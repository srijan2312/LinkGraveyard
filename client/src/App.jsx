// App.jsx
// Route map. Public pages (landing, login, register) stand alone;
// every app page is protected by <ProtectedRoute> and rendered inside
// the <Layout> sidebar shell.

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyLinks from './pages/MyLinks';
import AddLink from './pages/AddLink';
import Categories from './pages/Categories';
import LinkDetail from './pages/LinkDetail';
import LinkHistory from './pages/LinkHistory';
import Settings from './pages/Settings';

// Logged-in users hitting /login or /register go straight to the dashboard.
function PublicOnly({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
      <Route path="/links" element={<PrivatePage><MyLinks /></PrivatePage>} />
      <Route path="/links/:id" element={<PrivatePage><LinkDetail /></PrivatePage>} />
      <Route path="/add" element={<PrivatePage><AddLink /></PrivatePage>} />
      <Route path="/categories" element={<PrivatePage><Categories /></PrivatePage>} />
      <Route path="/history" element={<PrivatePage><LinkHistory /></PrivatePage>} />
      <Route path="/settings" element={<PrivatePage><Settings /></PrivatePage>} />

      {/* Unknown URLs fall back to the landing page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
