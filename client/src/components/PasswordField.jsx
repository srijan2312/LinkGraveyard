// components/PasswordField.jsx
// A password input with a show/hide toggle. The toggle is a plain button
// (type="button" so it never submits the form) with an accessible label.

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({ id, label, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
