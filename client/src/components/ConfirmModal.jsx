// components/ConfirmModal.jsx
// A small "are you sure?" dialog used for destructive actions like delete.
// Keeps the destructive choice deliberate instead of one misclick away.
// `busy` disables both buttons while the confirmed action runs — this
// prevents double-clicks from firing the action twice.

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy = false,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <>
                <span className="spinner" /> Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
