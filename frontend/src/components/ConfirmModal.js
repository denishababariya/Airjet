import React from 'react';
import { MdWarning } from 'react-icons/md';

/**
 * Confirmation Modal
 * Props: open, onClose, onConfirm, title, message, confirmText, cancelText
 */
const ConfirmModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = 'Confirm', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger' // 'danger' or 'warning'
}) => {
  if (!open) return null;

  return (
    <div className="d_modal_backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="d_modal_box d_modal_md"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <div className="d_modal_header">
          <h3 className="d_modal_title">{title}</h3>
        </div>
        <div className="d_modal_body" style={{ textAlign: 'center', padding: '24px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: type === 'danger' ? 'var(--d-danger-bg)' : 'var(--d-warning-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <MdWarning 
              style={{ 
                fontSize: '32px', 
                color: type === 'danger' ? 'var(--d-danger)' : 'var(--d-warning)' 
              }} 
            />
          </div>
          <p style={{ fontSize: '16px', color: 'var(--d-text)', marginBottom: '24px' }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="d_btn d_btn_outline" 
              onClick={onClose}
              style={{ minWidth: '100px' }}
            >
              {cancelText}
            </button>
            <button 
              className={`d_btn d_btn_${type === 'danger' ? 'danger' : 'warning'}`} 
              onClick={onConfirm}
              style={{ minWidth: '100px' }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
