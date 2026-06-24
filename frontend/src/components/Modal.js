import React, { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

/**
 * Reusable Modal
 * Props: open, onClose, title, children, size ('sm'|'md'|'lg')
 */
const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.classList.add('d_modal_open');
    else document.body.classList.remove('d_modal_open');
    return () => document.body.classList.remove('d_modal_open');
  }, [open]);

  if (!open) return null;

  return (
    <div className="d_modal_backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`d_modal_box d_modal_${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="d_modal_header">
          <h3 className="d_modal_title">{title}</h3>
          <button className="d_modal_close" onClick={onClose} aria-label="Close">
            <MdClose />
          </button>
        </div>
        {/* Body */}
        <div className="d_modal_body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
