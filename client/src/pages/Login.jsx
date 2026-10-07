// pages/Login.jsx
// Email + password login. On success the JWT is stored by the auth context
// and the user lands on the dashboard.

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      {/* Theme control reachable without logging in */}
      <ThemeToggle className="theme-toggle-fab" />
      <div className="auth-card">
        {/* Always goes to the landing page — never relies on browser history,
            so it works even when the user arrived here directly. */}
        <Link to="/" className="back-link">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <span className="brand" style={{ padding: 0, marginTop: 8 }}>
          <Logo />
          LinkGraveyard
        </span>
        <h1>Welcome back</h1>
        <p className="sub">Log in to check on your saved web resources.</p>

        {searchParams.get('expired') && (
          <div className="form-error" role="alert">
            Your session expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" /> Logging in…
              </>
            ) : (
              'Log in'
            )}
          </button>
        </form>

        <p className="switch">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
