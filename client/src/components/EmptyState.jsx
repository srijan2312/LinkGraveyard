// components/EmptyState.jsx
// Every page gets a useful empty state — never a blank screen.

export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="empty">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}
