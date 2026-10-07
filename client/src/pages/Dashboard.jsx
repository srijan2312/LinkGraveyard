// pages/Dashboard.jsx
// The home screen after login: stat cards, a health-overview chart,
// recently broken links, recent activity, and quick actions.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, RefreshCw, AlertTriangle, Skull } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { timeAgo, domainOf } from '../utils/format';

const CHART_SEGMENTS = [
  { key: 'healthy', color: 'var(--success)', label: 'Healthy' },
  { key: 'redirected', color: 'var(--info)', label: 'Redirected' },
  { key: 'broken', color: 'var(--danger)', label: 'Broken' },
  { key: 'never_checked', color: 'var(--text-2)', label: 'Never checked' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentBroken, setRecentBroken] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, activityRes] = await Promise.all([
          api.get('/links/stats'),
          api.get('/links', { params: { limit: 5, sort: 'recent' } }),
        ]);
        setStats(statsRes.data.stats);
        setRecentBroken(statsRes.data.recentBroken);
        setRecentActivity(activityRes.data.links);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load the dashboard.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner dark" /> Loading your dashboard…
      </div>
    );
  }

  if (error) {
    return (
      <>
        <h1 className="page-title">Dashboard</h1>
        <div className="form-error mt-16">{error}</div>
      </>
    );
  }

  const maxBar = Math.max(1, ...CHART_SEGMENTS.map((s) => stats[s.key]));

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">A quick look at the health of your saved web resources.</p>

      {stats.total === 0 ? (
        <EmptyState
          icon={<Skull size={26} />}
          title="Your link graveyard is empty."
          message="Save your first resource before it disappears — then watch its health over time."
          action={
            <Link to="/add" className="btn btn-primary">
              <PlusCircle size={16} /> Save your first link
            </Link>
          }
        />
      ) : (
        <>
          {/* Summary cards — ledger style: serif numerals, status-colored top rule */}
          <div className="grid-4" style={{ marginBottom: 14 }}>
            <div className="stat-card accent-top">
              <div className="value">{stats.total}</div>
              <div className="label">Total links</div>
            </div>
            <div className="stat-card success-top">
              <div className="value">{stats.healthy}</div>
              <div className="label">Healthy</div>
            </div>
            <div className="stat-card info-top">
              <div className="value">{stats.redirected}</div>
              <div className="label">Redirected</div>
            </div>
            <div className="stat-card danger-top">
              <div className="value">{stats.broken}</div>
              <div className="label">Broken</div>
            </div>
          </div>

          <div className="grid-2 section-gap">
            {/* Health overview chart */}
            <div className="card">
              <h3 className="card-title">Link health overview</h3>
              <div className="health-chart" role="img" aria-label={`Health overview: ${stats.healthy} healthy, ${stats.redirected} redirected, ${stats.broken} broken, ${stats.never_checked} never checked`}>
                {CHART_SEGMENTS.map((seg) => (
                  <div className="health-bar" key={seg.key}>
                    <div className="count">{stats[seg.key]}</div>
                    <div
                      className="bar"
                      style={{
                        height: `${Math.max(6, (stats[seg.key] / maxBar) * 110)}px`,
                        background: seg.color,
                      }}
                    />
                    <div className="label">{seg.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently broken */}
            <div className="card">
              <h3 className="card-title">Recently broken</h3>
              {recentBroken.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>
                  All clear. None of your saved resources are currently marked as broken.
                </p>
              ) : (
                <div className="link-list">
                  {recentBroken.map((link) => (
                    <div className={`link-row status-${link.status}`} key={link._id} style={{ padding: '12px 14px' }}>
                      <div className="content">
                        <p className="title">
                          <Link to={`/links/${link._id}`}>{link.title}</Link>
                        </p>
                        <p className="url">{domainOf(link.url)}</p>
                      </div>
                      <StatusBadge status={link.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent activity + quick actions */}
          <div className="grid-2 section-gap">
            <div className="card">
              <h3 className="card-title">Recent activity</h3>
              {recentActivity.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>
                  Nothing yet — links you add or check will appear here.
                </p>
              ) : (
                <div className="link-list">
                  {recentActivity.map((link) => (
                    <div className={`link-row status-${link.status}`} key={link._id} style={{ padding: '12px 14px' }}>
                      <div className="content">
                        <p className="title">
                          <Link to={`/links/${link._id}`}>{link.title}</Link>
                        </p>
                        <p className="url">
                          Added {timeAgo(link.createdAt)}
                          {link.lastChecked ? ` · Checked ${timeAgo(link.lastChecked)}` : ' · Never checked'}
                        </p>
                      </div>
                      <StatusBadge status={link.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="card-title">Quick actions</h3>
              <div className="flex flex-wrap gap-12">
                <Link to="/add" className="btn btn-primary">
                  <PlusCircle size={16} /> Add link
                </Link>
                <Link to="/links" className="btn btn-secondary">
                  <RefreshCw size={16} /> Check all links
                </Link>
                <Link to="/links?status=broken" className="btn btn-secondary">
                  <AlertTriangle size={16} /> View broken links
                </Link>
              </div>
              <p className="muted small" style={{ margin: '16px 0 0' }}>
                Tip: "Check all links" re-checks your whole collection a few at a time, so it
                stays fast even with many links.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
