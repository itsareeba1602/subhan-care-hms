import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import './Toast.css';

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

function Toast({ type = 'success', children, onClose }) {
  const Icon = ICON[type] || ICON.success;

  return (
    <div className={`toast toast-${type}`}>
      <Icon size={18} className="toast-icon" />
      <span className="toast-message">{children}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
}

export default Toast;
