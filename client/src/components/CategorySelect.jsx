// components/CategorySelect.jsx
// A REAL dropdown for picking a category — this replaces the old
// <input list="datalist"> approach, whose suggestion popup does not open
// reliably on all browsers (especially mobile).
//
// Behavior:
//   - A native <select> lists every existing category (always opens).
//   - The last option, "+ New category…", reveals a text field so users
//     can still create their own categories.
//   - The parent reads the final value through onChange(value).

import { useState } from 'react';

export const NEW_CATEGORY = '__new__';

export default function CategorySelect({ categories, value, onChange, id = 'category' }) {
  // Local UI state: are we in "create a new category" mode, and what has
  // the user typed for the new name?
  const [creating, setCreating] = useState(false);
  const [customName, setCustomName] = useState('');

  function handleSelect(e) {
    const selected = e.target.value;
    if (selected === NEW_CATEGORY) {
      setCreating(true);
      setCustomName('');
      onChange(''); // no category chosen yet — parent waits for the text input
    } else {
      setCreating(false);
      onChange(selected);
    }
  }

  function handleCustomInput(e) {
    setCustomName(e.target.value);
    onChange(e.target.value); // live: parent always sees the current text
  }

  return (
    <div>
      <select
        id={id}
        className="select"
        value={creating ? NEW_CATEGORY : value || 'Other'}
        onChange={handleSelect}
        aria-label="Category"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={NEW_CATEGORY}>+ New category…</option>
      </select>

      {creating && (
        <input
          className="input"
          style={{ marginTop: 8 }}
          placeholder="New category name"
          value={customName}
          onChange={handleCustomInput}
          maxLength={60}
          aria-label="New category name"
          autoFocus
        />
      )}
    </div>
  );
}
