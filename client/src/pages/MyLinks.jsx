// pages/MyLinks.jsx
// The main application page: search, filters, sorting, bulk actions,
// per-link Check Now / Edit / Delete, and Check All with live progress.

import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  RefreshCw,
  Pencil,
  Trash2,
  ExternalLink,
  Skull,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import Favicon from '../components/Favicon';
import LinkEditModal from '../components/LinkEditModal';
import { useLinks } from '../hooks/useLinks';
import { useCheckAll } from '../hooks/useCheckAll';
import { timeAgo, domainOf } from '../utils/format';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'redirected', label: 'Redirected' },
  { value: 'broken', label: 'Broken' },
  { value: 'never_checked', label: 'Never checked' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'recently-checked', label: 'Recently checked' },
  { value: 'status', label: 'Status' },
];

export default function MyLinks() {
  const [searchParams] = useSearchParams();

  // Honour ?status=broken and ?category= links from dashboard/category cards.
  // Only pass params that are actually in the URL — otherwise the saved
  // filters (restored from sessionStorage inside useLinks) would be
  // overwritten by these 'all' defaults on every visit.
  const initialFilters = {};
  const urlStatus = searchParams.get('status');
  const urlCategory = searchParams.get('category');
  if (urlStatus) initialFilters.status = urlStatus;
  if (urlCategory) initialFilters.category = urlCategory;
  const { links, pagination, loading, error, filters, updateFilters, refresh, setLinks } = useLinks(initialFilters);

  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  // While a delete request is in flight the confirm buttons are disabled,
  // so double-clicking can't fire the same delete twice.
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const [checkingIds, setCheckingIds] = useState(new Set()); // per-link "Check Now" loading state
  const [notice, setNotice] = useState('');

  const { checking, progress, run } = useCheckAll();

  useEffect(() => {
    api.get('/links/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  // Changing selection resets when the page of results changes.
  useEffect(() => {
    setSelected(new Set());
  }, [links]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === links.length) setSelected(new Set());
    else setSelected(new Set(links.map((l) => l._id)));
  }

  // Update one link in the local list without a full refetch.
  function patchLink(id, fields) {
    setLinks((prev) => prev.map((l) => (l._id === id ? { ...l, ...fields } : l)));
  }

  // --- Per-link "Check Now" ---
  async function handleCheckNow(link) {
    if (checkingIds.has(link._id)) return; // prevent double clicks
    setCheckingIds((prev) => new Set(prev).add(link._id));
    setNotice('');
    try {
      const { data } = await api.post(`/links/${link._id}/check`);
      patchLink(link._id, data.link);
      setNotice(`"${data.link.title}" is ${data.link.status}.`);
    } catch (err) {
      setNotice(apiErrorMessage(err, `Could not check "${link.title}".`));
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(link._id);
        return next;
      });
    }
  }

  // --- Delete one link ---
  async function handleDelete() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await api.delete(`/links/${deleting._id}`);
      setLinks((prev) => prev.filter((l) => l._id !== deleting._id));
      setNotice(`"${deleting.title}" was deleted.`);
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not delete the link.'));
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  }

  // --- Bulk delete ---
  async function handleBulkDelete() {
    if (deleteBusy) return;
    setDeleteBusy(true);
    const ids = [...selected];
    try {
      await api.post('/links/bulk-delete', { ids });
      setLinks((prev) => prev.filter((l) => !selected.has(l._id)));
      setSelected(new Set());
      setNotice(`${ids.length} link(s) deleted.`);
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Bulk delete failed.'));
    } finally {
      setDeleteBusy(false);
      setBulkDeleting(false);
    }
  }

  // --- Bulk category change ---
  async function handleBulkCategory() {
    if (!bulkCategory) return;
    const ids = [...selected];
    try {
      await api.post('/links/bulk-category', { ids, category: bulkCategory });
      setLinks((prev) => prev.map((l) => (selected.has(l._id) ? { ...l, category: bulkCategory } : l)));
      setSelected(new Set());
      setBulkCategory('');
      setNotice(`${ids.length} link(s) moved to "${bulkCategory}".`);
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not update the category.'));
    }
  }

  // Collect ALL ids matching the current filters (not just this page)
  // so "Check all" really checks everything the user filtered.
  const collectFilteredIds = useCallback(async () => {
    const params = {
      limit: 100,
      sort: filters.sort === 'recent' ? undefined : filters.sort,
    };
    if (filters.search) params.search = filters.search;
    if (filters.status !== 'all') params.status = filters.status;
    if (filters.category !== 'all') params.category = filters.category;

    const first = await api.get('/links', { params: { ...params, page: 1 } });
    const ids = first.data.links.map((l) => l._id);
    for (let page = 2; page <= first.data.pagination.pages; page++) {
      const res = await api.get('/links', { params: { ...params, page } });
      ids.push(...res.data.links.map((l) => l._id));
    }
    return ids;
  }, [filters]);

  async function handleCheckAll() {
    setNotice('');
    try {
      const ids = await collectFilteredIds();
      if (ids.length === 0) {
        setNotice('Nothing to check — no links match the current filters.');
        return;
      }
      await run(ids);
      await refresh();
      setNotice(`Checked ${ids.length} link(s).`);
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Check-all failed. Some links may not have been checked.'));
    }
  }

  async function handleCheckSelected() {
    const ids = [...selected];
    await run(ids);
    await refresh();
    setSelected(new Set());
    setNotice(`Checked ${ids.length} link(s).`);
  }

  const selectedCount = selected.size;

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-12 mb-16">
        <div>
          <h1 className="page-title">My Links</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {pagination.total} saved resource{pagination.total === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-8 flex-wrap">
          <button className="btn btn-secondary" onClick={handleCheckAll} disabled={checking || loading}>
            {checking ? (
              <>
                <span className="spinner dark" /> Checking…
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Check all links
              </>
            )}
          </button>
          <Link to="/add" className="btn btn-primary">
            <PlusCircle size={16} /> Add link
          </Link>
        </div>
      </div>

      {progress && (
        <div className="card mb-16" role="status">
          <div className="flex justify-between items-center mb-16">
            <strong>
              Checking {progress.done} / {progress.total}
            </strong>
            <span className="muted small">{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div className="progress">
            <div className="bar" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {notice && <div className="form-success" role="status">{notice}</div>}

      {/* Toolbar: search + filters + sort */}
      <div className="toolbar">
        <div className="search">
          <Search />
          <input
            className="input"
            placeholder="Search title, URL, domain, tags, notes…"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            aria-label="Search links"
          />
        </div>
        <select
          className="select"
          value={filters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={filters.category}
          onChange={(e) => updateFilters({ category: e.target.value })}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          aria-label="Sort links"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk action bar */}
      {selectedCount > 0 && (
        <div className="bulk-bar">
          <strong>{selectedCount} selected</strong>
          <button className="btn btn-secondary btn-sm" onClick={handleCheckSelected} disabled={checking}>
            <RefreshCw size={14} /> Check selected
          </button>
          <select
            className="select"
            value={bulkCategory}
            onChange={(e) => setBulkCategory(e.target.value)}
            aria-label="Bulk change category"
            style={{ width: 'auto' }}
          >
            <option value="">Move to category…</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {bulkCategory && (
            <button className="btn btn-secondary btn-sm" onClick={handleBulkCategory}>
              Apply
            </button>
          )}
          <button className="btn btn-danger btn-sm" onClick={() => setBulkDeleting(true)}>
            <Trash2 size={14} /> Delete
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="page-loader">
          <span className="spinner dark" /> Loading your links…
        </div>
      ) : links.length === 0 ? (
        <EmptyState
          icon={filters.search || filters.status !== 'all' || filters.category !== 'all' ? <Search size={26} /> : <Skull size={26} />}
          title={filters.search || filters.status !== 'all' || filters.category !== 'all' ? 'No links matched your search.' : 'Your link graveyard is empty.'}
          message={
            filters.search || filters.status !== 'all' || filters.category !== 'all'
              ? 'Try a different keyword or clear the filters.'
              : 'Save your first resource before it disappears.'
          }
          action={
            filters.search || filters.status !== 'all' || filters.category !== 'all' ? (
              <button className="btn btn-secondary" onClick={() => updateFilters({ search: '', status: 'all', category: 'all' })}>
                Clear filters
              </button>
            ) : (
              <Link to="/add" className="btn btn-primary">
                <PlusCircle size={16} /> Save your first link
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="link-list">
            <div className="flex items-center gap-8" style={{ padding: '0 4px' }}>
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedCount === links.length && links.length > 0}
                onChange={toggleSelectAll}
                aria-label="Select all links on this page"
              />
              <span className="muted small">Select all on this page</span>
            </div>

            {links.map((link) => {
              const isChecking = checkingIds.has(link._id);
              return (
                <div className={`link-row status-${link.status}`} key={link._id}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={selected.has(link._id)}
                    onChange={() => toggleSelect(link._id)}
                    aria-label={`Select ${link.title}`}
                  />
                  <div className="content">
                    <div className="title-row">
                      <Favicon url={link.url} size={20} />
                      <p className="title">
                        <Link to={`/links/${link._id}`}>{link.title}</Link>
                      </p>
                    </div>
                    <p className="url">{domainOf(link.url)}</p>
                    <div className="meta">
                      <StatusBadge status={link.status} />
                      <span className="tag">{link.category}</span>
                      {(link.tags || []).slice(0, 4).map((t) => (
                        <span className="tag" key={t}>
                          #{t}
                        </span>
                      ))}
                      <span className="meta-text">
                        {link.lastChecked ? `Checked ${timeAgo(link.lastChecked)}` : 'Never checked'} · Added{' '}
                        {timeAgo(link.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleCheckNow(link)}
                      disabled={isChecking}
                      title="Re-check this link now"
                    >
                      {isChecking ? <span className="spinner dark" /> : <RefreshCw size={14} />}
                      {isChecking ? 'Checking…' : 'Check'}
                    </button>
                    <a
                      className="btn btn-secondary btn-sm"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open the original URL in a new tab"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditing(link)}
                      title="Edit this link"
                      aria-label={`Edit ${link.title}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleting(link)}
                      title="Delete this link"
                      aria-label={`Delete ${link.title}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                disabled={filters.page <= 1}
                onClick={() => updateFilters({ page: filters.page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={filters.page >= pagination.pages}
                onClick={() => updateFilters({ page: filters.page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {editing && (
        <LinkEditModal
          link={editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSave={async (fields) => {
            try {
              const { data } = await api.put(`/links/${editing._id}`, fields);
              patchLink(editing._id, data.link);
              setEditing(null);
              setNotice(`"${data.link.title}" was updated.`);
            } catch (err) {
              throw new Error(apiErrorMessage(err));
            }
          }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Delete this link?"
          message={`"${deleting.title}" will be permanently deleted, along with its check history. This cannot be undone.`}
          confirmLabel="Delete link"
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
          busy={deleteBusy}
        />
      )}

      {bulkDeleting && (
        <ConfirmModal
          title={`Delete ${selectedCount} link(s)?`}
          message="The selected links and their check history will be permanently deleted. This cannot be undone."
          confirmLabel="Delete all"
          onCancel={() => setBulkDeleting(false)}
          onConfirm={handleBulkDelete}
          busy={deleteBusy}
        />
      )}
    </>
  );
}
