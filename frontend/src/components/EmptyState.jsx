import { FiSearch } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiSearch, title, message, action }) {
  return (
    <div className="empty-state" role="status">
      <Icon aria-hidden="true" className="empty-state-icon" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
