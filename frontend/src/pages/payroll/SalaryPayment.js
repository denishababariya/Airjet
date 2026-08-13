import React, { useState } from 'react';
import { MdPayment, MdSave, MdCancel } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';

export default function SalaryPayment({ salaryId, netSalary, onComplete, onCancel }) {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const { toasts, toast, removeToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      await payrollApi.pay(salaryId, {
        paymentDate,
        paymentMode,
        transactionReference,
        paymentNotes
      });
      
      toast.success('Payment processed successfully');
      if (onComplete) onComplete();
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Amount to Pay: <span style={{ color: 'var(--d-success)' }}>₹{netSalary?.toLocaleString('en-IN') || 0}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="d_form_group mb-3">
          <label className="d_form_label">Payment Date <span className="d_req">*</span></label>
          <input 
            type="date" 
            className="d_form_control" 
            value={paymentDate}
            onChange={e => setPaymentDate(e.target.value)}
            required
          />
        </div>

        <div className="d_form_group mb-3">
          <label className="d_form_label">Payment Mode <span className="d_req">*</span></label>
          <select 
            className="d_form_control" 
            value={paymentMode}
            onChange={e => setPaymentMode(e.target.value)}
            required
          >
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Cheque">Cheque</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="d_form_group mb-3">
          <label className="d_form_label">Transaction/Reference Number</label>
          <input 
            className="d_form_control" 
            placeholder="Enter transaction ID or reference number"
            value={transactionReference}
            onChange={e => setTransactionReference(e.target.value)}
          />
        </div>

        <div className="d_form_group mb-3">
          <label className="d_form_label">Payment Notes</label>
          <textarea 
            className="d_form_control" 
            rows={3}
            placeholder="Add any notes about this payment"
            value={paymentNotes}
            onChange={e => setPaymentNotes(e.target.value)}
          />
        </div>

        <div className="d_form_actions">
          <button 
            type="button" 
            className="d_btn d_btn_outline" 
            onClick={onCancel}
            disabled={processing}
          >
            <MdCancel /> Cancel
          </button>
          <button 
            type="submit" 
            className="d_btn d_btn_success" 
            disabled={processing}
          >
            {processing ? 'Processing...' : <><MdPayment /> Process Payment</>}
          </button>
        </div>
      </form>
    </div>
  );
}
