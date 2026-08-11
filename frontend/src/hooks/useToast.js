import { useState, useCallback } from 'react';

/**
 * useToast — lightweight toast notification hook.
 *
 * Usage:
 *   const { toasts, toast, removeToast } = useToast();
 *
 *   toast.success('Saved successfully!');
 *   toast.error('Something went wrong');
 *   toast.warning('Check your input');
 *   toast.info('Loading...');
 *
 * Then render:
 *   <ToastContainer toasts={toasts} onRemove={removeToast} />
 */
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error:   (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info:    (msg) => addToast(msg, 'info'),
  };

  return { toasts, toast, removeToast };
};

export default useToast;
