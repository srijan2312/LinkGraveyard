// pages/Register.jsx
// Name + email + password (+ confirmation). The backend hashes the password
// and returns a JWT, so a new user is logged in immediately.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err, 'Registration failed. Please try again.'));
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
        <h1>Create your account</h1>
        <p className="sub">Start preserving the web resources you care about.</p>

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>
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
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm"
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" /> Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
