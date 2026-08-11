import { useState, useCallback } from 'react';

/**
 * useConfirm — manages a single ConfirmDialog state.
 *
 * Usage:
 *   const { confirmState, confirm, closeConfirm } = useConfirm();
 *
 *   // trigger
 *   confirm({
 *     title:   'Delete Supplier',
 *     message: 'This action cannot be undone.',
 *     variant: 'danger',
 *     onConfirm: () => handleDelete(id),
 *   });
 *
 *   // render
 *   <ConfirmDialog {...confirmState} onCancel={closeConfirm} />
 */
const useConfirm = () => {
  const [confirmState, setConfirmState] = useState({ open: false });

  const confirm = useCallback((opts) => {
    setConfirmState({ open: true, ...opts });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState({ open: false });
  }, []);

  return { confirmState, confirm, closeConfirm };
};

export default useConfirm;
