// components/ProtectedRoute.jsx
// Wraps every private page. If the user isn't logged in (and we're not still
// checking), they get bounced to /login instead of seeing the dashboard.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner dark" />
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
