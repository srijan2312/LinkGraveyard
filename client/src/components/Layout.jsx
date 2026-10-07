// components/Layout.jsx
// The shell for all logged-in pages: sidebar navigation on desktop,
// a top bar + slide-in drawer on mobile.

import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Link2,
  PlusCircle,
  FolderOpen,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/links', label: 'My Links', icon: Link2 },
  { to: '/add', label: 'Add Link', icon: PlusCircle },
  { to: '/categories', label: 'Categories', icon: FolderOpen },
  { to: '/history', label: 'Link History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavContent({ onNavigate, collapsed, onToggleCollapse }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    // Land on the public landing page — never flash login or dashboard.
    navigate('/', { replace: true });
    if (onNavigate) onNavigate();
  }

  return (
    <>
      <Link to="/dashboard" className="brand" onClick={onNavigate}>
        <Logo />
        <span className="brand-text">LinkGraveyard</span>
      </Link>

      <div className="nav-section">Collection</div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className="nav-link" onClick={onNavigate} title={collapsed ? label : undefined}>
          <Icon />
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || '?'}</div>
          <div className="meta">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
        </div>
        {/* Theme toggle + sidebar collapse live here so they're reachable
            from every app page. The collapse button is desktop-only: on
            mobile the sidebar is a temporary drawer, so collapsing it
            makes no sense. */}
        <div className="sidebar-actions">
          <ThemeToggle />
          {onToggleCollapse && (
            <button
              type="button"
              className="icon-button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
            </button>
          )}
        </div>
        <button
          className="nav-link btn-ghost"
          onClick={handleLogout}
          style={{ width: '100%', border: 'none', cursor: 'pointer' }}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </>
  );
}

export default function Layout({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Collapsed = icon-only rail. Persisted so the choice survives reloads.
  // This only affects desktop; on mobile the sidebar is a temporary drawer.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('linkgraveyard_sidebar') === 'collapsed'
  );

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('linkgraveyard_sidebar', next ? 'collapsed' : 'expanded');
      return next;
    });
  }

  return (
    <div>
      {/* Mobile top bar */}
      <div className="mobile-bar">
        <Link to="/dashboard" className="brand">
          <Logo size={30} />
          <span className="brand-text">LinkGraveyard</span>
        </Link>
        <div className="flex items-center gap-8">
          <ThemeToggle />
          <button
            className="icon-button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="sidebar open">
            <button
              className="icon-button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close navigation menu"
              style={{ alignSelf: 'flex-end', marginBottom: 8 }}
            >
              <X size={18} />
            </button>
            {/* The drawer never collapses, so no toggle is passed here. */}
            <NavContent onNavigate={() => setDrawerOpen(false)} collapsed={false} onToggleCollapse={null} />
          </aside>
        </>
      )}

      <div className="app-shell">
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
          <NavContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
