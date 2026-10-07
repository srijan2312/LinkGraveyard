// pages/Categories.jsx
// A simple overview of every category the user has (defaults + their own),
// with a count of links and a breakdown by status. Clicking a category
// jumps to My Links pre-filtered.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import EmptyState from '../components/EmptyState';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Counts per category with one tiny request each (limit=1 keeps
        // the responses small — we only need pagination.total).
        const { data: cats } = await api.get('/links/categories');

        const withCounts = await Promise.all(
          cats.categories.map(async (category) => {
            const res = await api.get('/links', { params: { category, limit: 1 } });
            return { category, count: res.data.pagination.total };
          })
        );

        setCategories(withCounts);
        setTotalLinks(withCounts.reduce((sum, c) => sum + c.count, 0));
      } catch (err) {
        setError(apiErrorMessage(err, 'Could not load categories.'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <span className="spinner dark" /> Loading categories…
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title">Categories</h1>
      <p className="page-subtitle">Organize your collection. Type a new category name when adding a link to create one.</p>

      {error && <div className="form-error">{error}</div>}

      {totalLinks === 0 ? (
        <EmptyState
          icon={<FolderOpen size={26} />}
          title="No categories yet."
          message="Categories appear here once you start saving links."
          action={
            <Link to="/add" className="btn btn-primary">
              Save your first link
            </Link>
          }
        />
      ) : (
        <div className="feature-grid">
          {categories
            .filter((c) => c.count > 0)
            .map(({ category, count }) => (
              <Link
                key={category}
                to={`/links?category=${encodeURIComponent(category)}`}
                className="feature"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="icon">
                  <FolderOpen size={20} />
                </div>
                <h3>{category}</h3>
                <p>
                  {count} link{count === 1 ? '' : 's'}
                </p>
              </Link>
            ))}
        </div>
      )}
    </>
  );
}
