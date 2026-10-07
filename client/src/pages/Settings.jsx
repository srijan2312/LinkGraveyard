// pages/Settings.jsx
// Redesigned as a logical vertical flow:
//   1. Profile    — name, email, save
//   2. Appearance — dark / light theme with an explanation
//   3. Security   — change password
//   4. Account    — logout
//   5. Danger Zone — permanently delete the account (visually separated,
//      requires typing your email to confirm)

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Palette, ShieldCheck, LogOut, Trash2, Moon, Sun } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

function SectionHead({ icon: Icon, title, description }) {
  return (
    <div className="settings-section-head">
      <div className="icon">
        <Icon size={17} />
      </div>
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
    </div>
  );
}

// The delete-account confirmation dialog. The user must type their email
// address to enable the delete button — this prevents accidental clicks
// from destroying an account.
function DeleteAccountModal({ email, onCancel, onConfirm }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const matches = typed.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete() {
    if (!matches || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await onConfirm();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete your account. Please try again.'));
      setDeleting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal danger" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Delete your account?</h3>
        <p>
          This will <strong>permanently</strong> delete your account, all saved links, and all
          link-check history. This cannot be undone.
        </p>
        {error && <div className="form-error">{error}</div>}
        <div className="field">
          <label htmlFor="confirm-email">
            Type <span className="mono">{email}</span> to confirm
          </label>
          <input
            id="confirm-email"
            className="input"
            placeholder={email}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={deleting}>
            Keep my account
          </button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={!matches || deleting}>
            {deleting ? (
              <>
                <span className="spinner" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 size={16} /> Delete everything
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, logout, updateProfileName } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // Theme comes from the shared useTheme hook, so the toggle in the
  // sidebar and these cards always stay in sync.
  const [theme, setTheme] = useTheme();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    if (!name.trim()) {
      setProfileErr('Name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateProfileName(name.trim());
      setProfileMsg('Name updated.');
    } catch (err) {
      setProfileErr(apiErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwErr('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPwErr('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwErr('New passwords do not match.');
      return;
    }
    setSavingPw(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setPwMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwErr(apiErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  }

  function handleLogout() {
    logout();
    // Straight to the public landing page — no login flash, no dashboard flash.
    navigate('/', { replace: true });
  }

  async function handleDeleteAccount() {
    await api.delete('/auth/account');
    logout(); // clear the token: the account it belonged to is gone
    // Land on the top of the public landing page with a confirmation notice.
    navigate('/', { replace: true, state: { accountDeleted: true } });
  }

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage your profile, appearance, security, and account.</p>

      {/* Two-column grid on desktop (each pair is thematically related),
          single column on mobile. The danger zone spans the full width. */}
      <div className="settings-grid">
        {/* 1. Profile */}
        <div>
          <SectionHead icon={User} title="Profile" description="How your name appears across the app." />
          <div className="card">
            {profileErr && <div className="form-error">{profileErr}</div>}
            {profileMsg && <div className="form-success">{profileMsg}</div>}
            <form onSubmit={handleProfileSave}>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" className="input" value={user?.email || ''} disabled aria-label="Email (cannot be changed)" />
                <div className="hint">Your email is your login identity and cannot be changed.</div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>

        {/* 2. Appearance */}
        <div>
          <SectionHead
            icon={Palette}
            title="Appearance"
            description="Two designed themes. Your choice is saved on this device."
          />
          <div className="card">
            <div className="theme-options" role="radiogroup" aria-label="Theme">
              <button
                className={`theme-option ${theme === 'dark' ? 'selected' : ''}`}
                onClick={() => setTheme('dark')}
                role="radio"
                aria-checked={theme === 'dark'}
              >
                <div className="theme-swatch" style={{ background: '#14110d', borderColor: '#38301f' }} />
                <div className="name">
                  <Moon size={15} /> Midnight Archive
                </div>
                <p className="desc">Warm near-black with brass accents. The default archival look.</p>
              </button>
              <button
                className={`theme-option ${theme === 'light' ? 'selected' : ''}`}
                onClick={() => setTheme('light')}
                role="radio"
                aria-checked={theme === 'light'}
              >
                <div className="theme-swatch" style={{ background: '#f6f1e7', borderColor: '#d9cdb4' }} />
                <div className="name">
                  <Sun size={15} /> Paper Archive
                </div>
                <p className="desc">Warm paper background with a controlled plum accent.</p>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Security */}
        <div>
          <SectionHead icon={ShieldCheck} title="Security" description="Change the password you use to log in." />
          <div className="card">
            {pwErr && <div className="form-error">{pwErr}</div>}
            {pwMsg && <div className="form-success">{pwMsg}</div>}
            <form onSubmit={handlePasswordChange}>
              <div className="field">
                <label htmlFor="current-pw">Current password</label>
                <input
                  id="current-pw"
                  type="password"
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="field">
                <label htmlFor="new-pw">New password</label>
                <input
                  id="new-pw"
                  type="password"
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label htmlFor="confirm-pw">Confirm new password</label>
                <input
                  id="confirm-pw"
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={savingPw}>
                {savingPw ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </div>
        </div>

        {/* 4. Account */}
        <div>
          <SectionHead icon={LogOut} title="Account" description="End your session on this device." />
          <div className="card">
            <p className="muted small" style={{ marginTop: 0 }}>
              Logged in as <strong>{user?.email}</strong>. Logging out clears your session and takes
              you back to the landing page.
            </p>
            <button className="btn btn-secondary" onClick={handleLogout}>
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>

        {/* 5. Danger zone — full width, visually separated */}
        <div className="span-2">
          <SectionHead
            icon={Trash2}
            title="Danger Zone"
            description="Irreversible actions. Please proceed carefully."
          />
          <div className="card danger-zone">
            <h3 className="card-title">Delete account</h3>
            <p className="muted small" style={{ marginTop: 0 }}>
              Permanently delete your account, <strong>all saved links</strong>, and{' '}
              <strong>all link-check history</strong>. This cannot be undone — there is no recovery.
            </p>
            <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={16} /> Delete my account…
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          email={user?.email || ''}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </>
  );
}
