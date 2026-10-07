// components/StatusBadge.jsx
// A consistent pill for the four link statuses, used everywhere:
// lists, detail page, dashboard, history.

import { STATUS_META } from '../utils/format';

export default function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.never_checked;
  return (
    <span className={`badge badge-${status || 'never_checked'}`} title={meta.hint}>
      <span className="dot" />
      {meta.label}
    </span>
  );
}
