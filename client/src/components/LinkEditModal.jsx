// components/LinkEditModal.jsx
// Shared "edit link" dialog used by both My Links and the Link Detail page.
// The original URL is intentionally NOT editable — preserving it is part of
// the product's concept.

import { useState } from 'react';
import CategorySelect from './CategorySelect';

export default function LinkEditModal({ link, categories, onSave, onCancel }) {
  const [title, setTitle] = useState(link.title);
  const [description, setDescription] = useState(link.description || '');
  const [category, setCategory] = useState(link.category || 'Other');
  const [tags, setTags] = useState((link.tags || []).join(', '));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // onSave performs the API call and throws a friendly message on failure.
      await onSave({ title: title.trim(), description, category, tags });
    } catch (err) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>Edit link</h3>
        <p>The original URL is preserved and cannot be changed.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="edit-title">Title</label>
            <input id="edit-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-desc">Notes</label>
            <textarea id="edit-desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-category">Category</label>
            <CategorySelect
              id="edit-category"
              categories={categories}
              value={category}
              onChange={setCategory}
            />
          </div>
          <div className="field">
            <label htmlFor="edit-tags">Tags</label>
            <input
              id="edit-tags"
              className="input"
              placeholder="react, tutorial, reference"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <div className="hint">Separate tags with commas.</div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
