import { createContext, useCallback, useState } from 'react';
import Toast from '../components/shared/Toast';

export const ToastContext = createContext(null);

// Single source of truth for toast notifications. Before this, PatientList,
// DoctorList, AppointmentList, and InvoiceList each had their own copy of
// `useState('')` + `setTimeout(..., 2500)` + a per-component CSS class
// (.patient-list-toast, .doctor-list-toast, etc.) — same behavior, four
// times over. That's exactly what the Coding Standards card calls out under
// "No Duplicate Code." This replaces all four with one provider + one hook.
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  // type: 'success' | 'error' | 'info'
  const showToast = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => dismissToast(id), 2800);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} onClose={() => dismissToast(t.id)}>
            {t.message}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
