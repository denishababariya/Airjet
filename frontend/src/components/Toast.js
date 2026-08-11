import React, { useEffect, useRef } from 'react';
import {
  MdCheckCircle, MdError, MdWarning, MdInfo, MdClose,
} from 'react-icons/md';

/**
 * Single toast item — auto-dismisses after `duration` ms.
 * Props:
 *   toast   : { id, type, message }   type = 'success' | 'error' | 'warning' | 'info'
 *   onRemove: (id) => void
 *   duration: ms (default 3500)
 */
export const ToastItem = ({ toast, onRemove, duration = 3500 }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove, duration]);

  const icons = {
    success: <MdCheckCircle />,
    error:   <MdError />,
    warning: <MdWarning />,
    info:    <MdInfo />,
  };

  return (
    <div className={`d_toast d_toast_${toast.type}`} role="alert" aria-live="polite">
      <span className="d_toast_icon">{icons[toast.type] || icons.info}</span>
      <span className="d_toast_msg">{toast.message}</span>
      <button
        className="d_toast_close"
        onClick={() => onRemove(toast.id)}
        aria-label="Dismiss"
      >
        <MdClose />
      </button>
    </div>
  );
};

/**
 * Toast container — renders all active toasts in the top-right corner.
 * Props:
 *   toasts  : array of { id, type, message }
 *   onRemove: (id) => void
 */
const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts.length) return null;
  return (
    <div className="d_toast_container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastContainer;
