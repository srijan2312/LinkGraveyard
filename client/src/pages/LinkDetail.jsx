// pages/LinkDetail.jsx
// Everything about one saved link: basic info, current status, HTTP details,
// full check history, and actions (open, check now, edit, delete).

import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ExternalLink, RefreshCw, Pencil, Trash2, History } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import LinkEditModal from '../components/LinkEditModal';
import { timeAgo, formatDate, domainOf } from '../utils/format';
import Favicon from '../components/Favicon';

const DOT_COLORS = {
  healthy: '#22C55E',
  redirected: '#F59E0B',
  broken: '#EF4444',
  never_checked: '#9AA4B2',
};

export default function LinkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [link, setLink] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [linkRes, historyRes] = await Promise.all([
          api.get(`/links/${id}`),
          api.get(`/links/${id}/history`),
        ]);
        setLink(linkRes.data.link);
        setHistory(historyRes.data.history);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load this link.'));
      } finally {
        setLoading(false);
      }
    }
    load();
    api.get('/links/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, [id]);

  async function handleCheckNow() {
    if (checking) return;
    setChecking(true);
    setNotice('');
    try {
      const { data } = await api.post(`/links/${id}/check`);
      setLink(data.link);
      // Refresh the timeline so the new check appears immediately.
      const historyRes = await api.get(`/links/${id}/history`);
      setHistory(historyRes.data.history);
      setNotice('Link checked successfully.');
    } catch (err) {
      setNotice(apiErrorMessage(err, "We couldn't check this URL right now. Try again later."));
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/links/${id}`);
      navigate('/links');
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not delete the link.'));
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner dark" /> Loading link…
      </div>
    );
  }

  if (error || !link) {
    return (
      <>
        <h1 className="page-title">Link not found</h1>
        <div className="form-error mt-16">{error || 'This link does not exist.'}</div>
        <Link to="/links" className="btn btn-secondary mt-16">
          Back to My Links
        </Link>
      </>
    );
  }

  return (
    <>
      <Link to="/links" className="muted small">
        ← Back to My Links
      </Link>
      <div className="flex justify-between items-center flex-wrap gap-12 mt-16 mb-16">
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Favicon url={link.url} size={30} />
          {link.title}
        </h1>
        <StatusBadge status={link.status} />
      </div>

      {notice && <div className="form-success mb-16" role="status">{notice}</div>}

      <div className="grid-2">
        <div className="card">
          <h3 className="card-title">Basic information</h3>
          <dl className="def-list">
            <dt>URL</dt>
            <dd>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="break-all">
                {link.url}
              </a>
            </dd>
            <dt>Domain</dt>
            <dd>{domainOf(link.url)}</dd>
            <dt>Category</dt>
            <dd>{link.category}</dd>
            <dt>Tags</dt>
            <dd>
              {(link.tags || []).length > 0 ? (
                <span className="flex flex-wrap gap-8">
                  {link.tags.map((t) => (
                    <span className="tag" key={t}>
                      #{t}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="muted">No tags</span>
              )}
            </dd>
            <dt>Notes</dt>
            <dd>{link.description || <span className="muted">No notes</span>}</dd>
            <dt>Saved</dt>
            <dd>{formatDate(link.createdAt)}</dd>
          </dl>
        </div>

        <div className="card">
          <h3 className="card-title">Current status</h3>
          <dl className="def-list">
            <dt>Last checked</dt>
            <dd>{link.lastChecked ? `${timeAgo(link.lastChecked)} (${formatDate(link.lastChecked)})` : 'Never'}</dd>
            <dt>HTTP status</dt>
            <dd>{link.httpStatus ?? '—'}</dd>
            <dt>Response time</dt>
            <dd>{link.responseTime != null ? `${link.responseTime} ms` : '—'}</dd>
            {link.status === 'redirected' && link.finalUrl && (
              <>
                <dt>Redirects to</dt>
                <dd>
                  <a href={link.finalUrl} target="_blank" rel="noopener noreferrer" className="break-all">
                    {link.finalUrl}
                  </a>
                  <p className="muted small" style={{ margin: '6px 0 0' }}>
                    Your original URL above is preserved — it was not overwritten.
                  </p>
                </dd>
              </>
            )}
            {/* Why the last check failed (timeout, DNS, SSL, …). The newest
                history entry carries the message — history[0] is the latest
                because the API sorts newest-first. */}
            {history[0]?.errorMessage && (
              <>
                <dt>Note</dt>
                <dd className="muted">{history[0].errorMessage}</dd>
              </>
            )}
          </dl>

          <h3 className="card-title mt-24">Actions</h3>
          <div className="flex flex-wrap gap-8">
            <a className="btn btn-secondary btn-sm" href={link.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={14} /> Open link
            </a>
            <button className="btn btn-primary btn-sm" onClick={handleCheckNow} disabled={checking}>
              {checking ? (
                <>
                  <span className="spinner" /> Checking…
                </>
              ) : (
                <>
                  <RefreshCw size={14} /> Check now
                </>
              )}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
              <Pencil size={14} /> Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <h3 className="card-title">Status history</h3>
        {history.length === 0 ? (
          <EmptyState
            icon={<History size={26} />}
            title="No checks recorded yet."
            message="Use “Check now” to record this link's first health check."
          />
        ) : (
          <div className="timeline">
            {history.map((entry) => (
              <div className="timeline-item" key={entry._id}>
                <div className="dot-col">
                  <span className="dot" style={{ background: DOT_COLORS[entry.status] || '#9AA4B2' }} />
                </div>
                <div className="body">
                  <div className="flex items-center gap-8 flex-wrap">
                    <StatusBadge status={entry.status} />
                    <span className="time">{formatDate(entry.checkedAt)}</span>
                  </div>
                  <div className="detail mt-16" style={{ marginTop: 6 }}>
                    {entry.httpStatus ? `HTTP ${entry.httpStatus}` : 'No HTTP response'}
                    {entry.responseTime != null && ` · ${entry.responseTime} ms`}
                    {entry.finalUrl && (
                      <>
                        {' '}→ redirected to <span className="break-all">{entry.finalUrl}</span>
                      </>
                    )}
                    {entry.errorMessage && (
                      <>
                        <br />
                        {entry.errorMessage}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete this link?"
          message={`"${link.title}" will be permanently deleted, along with its check history. This cannot be undone.`}
          confirmLabel="Delete link"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      {editing && (
        <LinkEditModal
          link={link}
          categories={categories}
          onCancel={() => setEditing(false)}
          onSave={async (fields) => {
            try {
              const { data } = await api.put(`/links/${id}`, fields);
              setLink(data.link);
              setEditing(false);
              setNotice('Link updated.');
            } catch (err) {
              throw new Error(apiErrorMessage(err));
            }
          }}
        />
      )}
    </>
  );
}
