// hooks/useLinks.js
// Shared data-fetching hook for links: search, status/category filters,
// sorting and pagination. The My Links page is the main consumer; the
// Dashboard uses /stats separately.

import { useCallback, useEffect, useRef, useState } from 'react';
import api, { apiErrorMessage } from '../services/api';

// Search/filter/sort/page are saved to sessionStorage, so when the user
// opens a link's detail page and navigates back, My Links shows exactly
// what they had. sessionStorage (not localStorage) is per-tab: a brand
// new tab still starts with clean filters.
const FILTER_STORAGE_KEY = 'linkgraveyard_link_filters';

function readSavedFilters() {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Corrupted or unavailable storage — just fall back to defaults.
  }
  return null;
}

export function useLinks(initial = {}) {
  const [links, setLinks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => ({
    search: '',
    status: 'all',
    category: 'all',
    sort: 'recent',
    page: 1,
    // Precedence: defaults < saved filters < explicit initial values
    // (e.g. ?status=broken deep-links from the dashboard always win).
    ...readSavedFilters(),
    ...initial,
  }));

  // Persist every filter change so back-navigation restores the view.
  useEffect(() => {
    try {
      sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Storage full or blocked — the app still works, just without restore.
    }
  }, [filters]);

  // Avoid overlapping requests: if the user types fast, only the latest
  // response updates the state (simple request-id guard).
  const requestId = useRef(0);

  const fetchLinks = useCallback(
    async (overrides = {}) => {
      const id = ++requestId.current;
      setLoading(true);
      setError('');
      try {
        const params = { ...filters, ...overrides };
        const query = {
          page: params.page,
          limit: 20,
          sort: params.sort === 'recent' ? undefined : params.sort,
        };
        if (params.search) query.search = params.search;
        if (params.status !== 'all') query.status = params.status;
        if (params.category !== 'all') query.category = params.category;

        const { data } = await api.get('/links', { params: query });
        if (id === requestId.current) {
          setLinks(data.links);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (id === requestId.current) setError(apiErrorMessage(err, 'Could not load your links.'));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [filters]
  );

  // Debounce the search input so we don't fire a request on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => fetchLinks(), 300);
    return () => clearTimeout(timer);
  }, [filters, fetchLinks]);

  function updateFilters(next) {
    setFilters((prev) => ({ ...prev, ...next, page: next.page ?? 1 }));
  }

  return { links, pagination, loading, error, filters, updateFilters, refresh: fetchLinks, setLinks };
}
