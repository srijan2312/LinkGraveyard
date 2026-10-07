// pages/AddLink.jsx
// Save a new URL. Validates client-side, sends to the backend (which
// validates again + rejects duplicates), and optionally checks the link's
// health immediately so the user sees the result right away.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw } from 'lucide-react';
import api, { apiErrorMessage } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import CategorySelect from '../components/CategorySelect';

export default function AddLink() {
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');
  const [checkNow, setCheckNow] = useState(true);
  const [categories, setCategories] = useState([]);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // saved link, shown as confirmation

  useEffect(() => {
    api.get('/links/categories').then((res) => setCategories(res.data.categories)).catch(() => {});
  }, []);

  function validate() {
    if (!url.trim()) return 'Please enter a URL.';
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'Only http(s) URLs are supported.';
      }
    } catch {
      return 'That does not look like a valid URL (try adding https://).';
    }
    if (!title.trim()) return 'Please give the link a title.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.post('/links', {
        url: url.trim(),
        title: title.trim(),
        description,
        category,
        tags,
        checkNow,
      });
      setResult(data.link);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the link.'));
    } finally {
      setSaving(false);
    }
  }

  // After a successful save, show a confirmation with the fresh status.
  if (result) {
    return (
      <>
        <h1 className="page-title">Link saved</h1>
        <p className="page-subtitle">It is now part of your collection.</p>
        <div className="card">
          <div className="flex justify-between items-center flex-wrap gap-12 mb-16">
            <div>
              <h3 style={{ margin: '0 0 4px' }}>{result.title}</h3>
              <p className="muted small break-all" style={{ margin: 0 }}>
                {result.url}
              </p>
            </div>
            <StatusBadge status={result.status} />
          </div>
          {result.status !== 'never_checked' && (
            <p className="muted small">
              Initial check complete{result.httpStatus ? ` — HTTP ${result.httpStatus}` : ''}.
              {result.status === 'redirected' && result.finalUrl && (
                <>
                  {' '}It redirects to <span className="break-all">{result.finalUrl}</span>. Your original URL was kept.
                </>
              )}
            </p>
          )}
          <div className="flex gap-8 flex-wrap mt-16">
            <button className="btn btn-primary" onClick={() => navigate(`/links/${result._id}`)}>
              View link details
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setResult(null);
                setUrl('');
                setTitle('');
                setDescription('');
                setTags('');
              }}
            >
              Save another
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/links')}>
              Back to My Links
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Add Link</h1>
      <p className="page-subtitle">Save a web resource you don't want to lose.</p>

      <div className="card" style={{ maxWidth: 680 }}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="url">URL *</label>
            <input
              id="url"
              className="input"
              placeholder="https://example.com/great-tutorial"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              className="input"
              placeholder="What is this resource?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div className="hint">Enter it yourself — automatic title extraction is unreliable.</div>
          </div>
          <div className="field">
            <label htmlFor="description">Notes</label>
            <textarea
              id="description"
              className="textarea"
              placeholder="Why is this worth keeping? What does it cover?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <CategorySelect categories={categories} value={category} onChange={setCategory} />
            <div className="hint">Choose an existing category or create a new one.</div>
          </div>
          <div className="field">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              className="input"
              placeholder="react, tutorial, interview"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <div className="hint">Separate tags with commas — they make searching much better.</div>
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="checkbox"
                checked={checkNow}
                onChange={(e) => setCheckNow(e.target.checked)}
                style={{ margin: 0 }}
              />
              Check this link's health right after saving
            </label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                {checkNow ? <RefreshCw size={16} /> : <Save size={16} />}
                {checkNow ? 'Saving & checking…' : 'Saving…'}
              </>
            ) : (
              <>
                <Save size={16} /> Save link
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
