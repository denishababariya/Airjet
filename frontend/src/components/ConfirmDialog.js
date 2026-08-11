import React, { useEffect } from 'react';
import { MdWarning, MdClose } from 'react-icons/md';

/**
 * Reusable confirm dialog — replaces window.confirm().
 *
 * Props:
 *   open      : bool
 *   title     : string  (default 'Confirm')
 *   message   : string  (default 'Are you sure?')
 *   confirmLabel  : string  (default 'Confirm')
 *   cancelLabel   : string  (default 'Cancel')
 *   variant   : 'danger' | 'warning' | 'primary'  (default 'danger')
 *   onConfirm : () => void
 *   onCancel  : () => void
 */
const ConfirmDialog = ({
  open,
  title    = 'Confirm',
  message  = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant  = 'danger',
  onConfirm,
  onCancel,
}) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  const variantBtn = {
    danger:  'd_btn_danger',
    warning: 'd_btn_accent',
    primary: 'd_btn_primary',
  }[variant] || 'd_btn_danger';

  return (
    <div
      className="d_modal_backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm_title"
    >
      <div
        className="d_confirm_box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d_confirm_header">
          <div className="d_confirm_icon_wrap">
            <MdWarning className="d_confirm_icon" />
          </div>
          <button className="d_modal_close" onClick={onCancel} aria-label="Close">
            <MdClose />
          </button>
        </div>

        {/* Body */}
        <div className="d_confirm_body">
          <h4 id="confirm_title" className="d_confirm_title">{title}</h4>
          <p className="d_confirm_msg">{message}</p>
        </div>

        {/* Actions */}
        <div className="d_confirm_actions">
          <button className="d_btn d_btn_outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`d_btn ${variantBtn}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
