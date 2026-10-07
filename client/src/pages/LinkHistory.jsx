// pages/LinkHistory.jsx
// A flat, newest-first feed of every health check across all of the user's
// links. Each row links to the link's detail page, where the per-link
// timeline lives.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, ChevronLeft, ChevronRight } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/format';

const DOT_COLORS = {
  healthy: '#22C55E',
  redirected: '#F59E0B',
  broken: '#EF4444',
  never_checked: '#9AA4B2',
};

export default function LinkHistory() {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/links/history/recent', { params: { page, limit: 25 } });
        setHistory(data.history);
        setPagination(data.pagination);
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load check history.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  return (
    <>
      <h1 className="page-title">Link History</h1>
      <p className="page-subtitle">Every health check ever recorded, newest first.</p>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="page-loader">
          <span className="spinner dark" /> Loading history…
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History size={26} />}
          title="No checks recorded yet."
          message="Check a link to start building its history."
          action={
            <Link to="/links" className="btn btn-primary">
              Go to My Links
            </Link>
          }
        />
      ) : (
        <>
          <div className="card">
            <div className="timeline">
              {history.map((entry) => (
                <div className="timeline-item" key={entry._id}>
                  <div className="dot-col">
                    <span className="dot" style={{ background: DOT_COLORS[entry.status] || '#9AA4B2' }} />
                  </div>
                  <div className="body">
                    <div className="flex items-center gap-8 flex-wrap">
                      <StatusBadge status={entry.status} />
                      {entry.link ? (
                        <Link to={`/links/${entry.link._id}`}>
                          <strong>{entry.link.title}</strong>
                        </Link>
                      ) : (
                        <strong className="muted">Deleted link</strong>
                      )}
                      <span className="time">{formatDate(entry.checkedAt)}</span>
                    </div>
                    <div className="detail" style={{ marginTop: 4 }}>
                      {entry.httpStatus ? `HTTP ${entry.httpStatus}` : 'No HTTP response'}
                      {entry.responseTime != null && ` · ${entry.responseTime} ms`}
                      {entry.errorMessage && ` · ${entry.errorMessage}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
