// pages/Landing.jsx
// The public marketing page: hero, problem, how it works, features,
// status explanation, FAQ, CTA, footer. No fake dashboards — the hero visual
// shows exactly what the app tracks (link names + statuses).

import { Link, useLocation } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import {
  Search,
  BellRing,
  History,
  Tags,
  MousePointerClick,
  GitBranch,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import Logo from '../components/Logo';
import StatusBadge from '../components/StatusBadge';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const HERO_ROWS = [
  { callNo: 'LG-001', name: 'React Documentation', host: 'react.dev', status: 'healthy' },
  { callNo: 'LG-002', name: 'Old tutorial mirror', host: 'archive-blog.io', status: 'redirected' },
  { callNo: 'LG-003', name: 'Vanished CSS guide', host: 'css-tricks-archive.net', status: 'broken' },
  { callNo: 'LG-004', name: 'New bookmark', host: 'dev.to', status: 'never_checked' },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Save & organize',
    text: 'Store important URLs with titles, notes, categories and tags so you can find them again in seconds.',
  },
  {
    icon: MousePointerClick,
    title: 'Health checks',
    text: 'Check whether a saved link still works with one click — or re-check your whole collection at once.',
  },
  {
    icon: GitBranch,
    title: 'Redirect detection',
    text: 'See when a page moved and where it points now. Your original URL is always preserved.',
  },
  {
    icon: AlertTriangle,
    title: 'Broken link alerts',
    text: 'Get a clear list of dead resources so you can replace them before they matter.',
  },
  {
    icon: History,
    title: 'Status history',
    text: 'Every check is recorded. See how a link changed over time: healthy in June, broken in September.',
  },
  {
    icon: Tags,
    title: 'Search & filters',
    text: 'Filter by status, category, or search across titles, URLs, tags and notes.',
  },
];

const STATUSES = [
  { status: 'healthy', title: 'Healthy', text: 'The URL responds successfully. Everything is fine.' },
  { status: 'redirected', title: 'Redirected', text: 'The URL moved. We show you the original and the final URL.' },
  { status: 'broken', title: 'Broken', text: 'The URL cannot be reached — a 404, a dead server, or similar.' },
  { status: 'never_checked', title: 'Never checked', text: 'We could not determine the status yet, or it was never checked.' },
];

const FAQS = [
  {
    q: 'Is LinkGraveyard just a bookmark manager?',
    a: 'Bookmarks store links; LinkGraveyard watches them. The difference is health monitoring: it tells you when a saved resource moved or disappeared, and keeps a history of those changes.',
  },
  {
    q: 'What happens when a link redirects?',
    a: 'The link is marked as Redirected and we store the final URL separately. Your original URL is never overwritten — that is part of the preservation idea.',
  },
  {
    q: 'Does a failed check mean the link is dead forever?',
    a: 'Not necessarily. A timeout or a temporary server error is marked as Unknown, not Broken. Only real responses like 404s or dead servers count as broken.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Every link belongs to your account only. Other users can never see, edit, or check your saved links.',
  },
  {
    q: 'Is this free?',
    a: 'LinkGraveyard is an open-source portfolio project. Self-host it with Node.js and MongoDB and it is free to run.',
  },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Shown after account deletion: Settings navigates here with
  // location.state.accountDeleted = true.
  const [showDeletedNotice, setShowDeletedNotice] = useState(
    () => !!location.state?.accountDeleted
  );

  // useLayoutEffect (not useEffect) so the scroll happens BEFORE the
  // browser paints — the user never sees a mid-page flash.
  useLayoutEffect(() => {
    if (location.state?.accountDeleted) {
      window.scrollTo(0, 0);
      // Clear the flag so a refresh or back-navigation doesn't re-show it.
      window.history.replaceState({}, '');
    }
  }, []);

  return (
    <div>
      {showDeletedNotice && (
        <div className="notice-banner" role="status">
          <span className="msg">
            <CheckCircle2 size={18} />
            Your account was successfully deleted. Sorry to see you go — you can create a new
            account anytime.
          </span>
          <button
            className="dismiss"
            onClick={() => setShowDeletedNotice(false)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <nav className="landing-nav">
        <span className="brand">
          <Logo />
          LinkGraveyard
        </span>
        <div className="links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-8">
          <ThemeToggle />
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="hero">
        <span className="eyebrow">A personal web archive</span>
        <h1>
          Save the web <span className="accent">before it disappears.</span>
        </h1>
        <p>
          LinkGraveyard helps you save, organize, and monitor the web resources you don't want
          to lose.
        </p>
        <div className="ctas">
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
          <a href="#features" className="btn btn-secondary">
            Explore Features
          </a>
        </div>

        {/* Catalog-card visual: each saved link is an archive entry */}
        <div className="hero-visual" aria-label="Example of archived links with their health statuses">
          {HERO_ROWS.map((row) => (
            <div className="catalog-card" key={row.callNo}>
              <span className="call-no">{row.callNo}</span>
              <span className="name">{row.name}</span>
              <span className="host">{row.host}</span>
              <StatusBadge status={row.status} />
            </div>
          ))}
        </div>
      </header>

      {/* Problem */}
      <section className="section">
        <span className="eyebrow">The problem</span>
        <h2>The problem with bookmarks</h2>
        <p className="lead">
          You bookmark a useful tutorial today. Six months later, the page is gone — moved,
          deleted, or abandoned. Your bookmark still sits there, pointing at nothing.
          LinkGraveyard helps you notice before an important resource disappears from your
          collection.
        </p>
      </section>

      {/* How it works */}
      <section className="section" id="how">
        <span className="eyebrow">Process</span>
        <h2>How LinkGraveyard works</h2>
        <p className="lead">Three simple steps. No setup beyond signing up.</p>
        <div className="steps">
          <div className="step">
            <div className="num">Step 1</div>
            <h3>Save your links</h3>
            <p>Add URLs with titles, notes, categories and tags — tutorials, docs, articles, repos, tools.</p>
          </div>
          <div className="step">
            <div className="num">Step 2</div>
            <h3>Check their health</h3>
            <p>LinkGraveyard visits each URL and reports whether it is healthy, redirected, or broken.</p>
          </div>
          <div className="step">
            <div className="num">Step 3</div>
            <h3>Watch over time</h3>
            <p>Every check is logged. See exactly when a resource changed — and catch it before it matters.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <span className="eyebrow">Features</span>
        <h2>Everything you need, nothing you don't</h2>
        <p className="lead">A focused tool for preserving the web resources that matter to you.</p>
        <div className="feature-grid">
          {FEATURES.map((f) => (
            <div className="feature" key={f.title}>
              <div className="icon">
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Status explanation */}
      <section className="section">
        <span className="eyebrow">Health monitoring</span>
        <h2>Four simple statuses</h2>
        <p className="lead">No complicated analytics. Every saved link is in one of these states.</p>
        <div className="status-cards">
          {STATUSES.map((s) => (
            <div className="status-card" key={s.status}>
              <div className="emoji">
                {s.status === 'healthy' && '🟢'}
                {s.status === 'redirected' && '🟡'}
                {s.status === 'broken' && '🔴'}
                {s.status === 'never_checked' && '⚪'}
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why useful */}
      <section className="section">
        <span className="eyebrow">Why it matters</span>
        <h2>Why it is useful</h2>
        <p className="lead">
          Developers, students, and researchers collect hundreds of links. Link rot is real —
          studies regularly find that a large share of links go dead within a few years.
          LinkGraveyard turns a silent decay into something you can see and act on:
          replace a dead tutorial, follow a redirect, or archive what matters before it is gone.
        </p>
        <div className="feature-grid">
          <div className="feature">
            <div className="icon">
              <BellRing size={20} />
            </div>
            <h3>Catch decay early</h3>
            <p>See broken resources in one place instead of discovering them mid-project.</p>
          </div>
          <div className="feature">
            <div className="icon">
              <GitBranch size={20} />
            </div>
            <h3>Follow the moves</h3>
            <p>Redirects show you the new location while preserving the URL you originally saved.</p>
          </div>
          <div className="feature">
            <div className="icon">
              <History size={20} />
            </div>
            <h3>Prove it over time</h3>
            <p>A recorded history shows when each resource changed — useful for research and references.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq">
        <span className="eyebrow">FAQ</span>
        <h2>Frequently asked questions</h2>
        <p className="lead">The short version of everything above.</p>
        <div className="faq">
          {FAQS.map((f) => (
            <div className="faq-item" key={f.q}>
              <h3>{f.q}</h3>
              <p>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="cta-band">
          <h2>Stop losing the web.</h2>
          <p>Save your first link in under a minute — and know the moment it breaks.</p>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary">
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="footer">
        <span className="brand" style={{ padding: 0 }}>
          <Logo size={26} />
          LinkGraveyard
        </span>
        <span>Save the web before it disappears.</span>
      </footer>
    </div>
  );
}
