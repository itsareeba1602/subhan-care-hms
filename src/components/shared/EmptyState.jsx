import { Inbox } from 'lucide-react';
import './EmptyState.css';

// Generic "nothing here" state. A bare "No records found." string in a
// table cell reads as unfinished; a real product shows an icon + a message
// that tells the user *why* (empty vs. filtered) and, optionally, what to
// do next (actionLabel/onAction — e.g. "Add Patient").
function EmptyState({ icon: Icon = Inbox, title = 'Nothing here yet', message, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>
      <p className="empty-state-title">{title}</p>
      {message && <p className="empty-state-message">{message}</p>}
      {actionLabel && onAction && (
        <button className="empty-state-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
