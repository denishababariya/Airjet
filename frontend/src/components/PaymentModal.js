import React from 'react';
import Modal from './Modal';
import { MdAttachMoney, MdCreditCard, MdAccountBalance, MdReceipt, MdPhoneAndroid } from 'react-icons/md';

const PaymentModal = ({ open, onClose, invoice, onSubmit }) => {
    const [amount, setAmount] = React.useState(invoice?.balanceAmount || 0);
    const [paymentMethod, setPaymentMethod] = React.useState('Cash');
    const [reference, setReference] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [errors, setErrors] = React.useState({});

    React.useEffect(() => {
        if (invoice) {
            setAmount(invoice.balanceAmount || 0);
        }
    }, [invoice]);

    const handleSubmit = () => {
        const e = {};
        if (!amount || amount <= 0) e.amount = 'Amount is required';
        if (!paymentMethod) e.paymentMethod = 'Payment method is required';
        
        if (paymentMethod === 'Cheque' && !reference) {
            e.reference = 'Cheque number is required';
        }
        if (paymentMethod === 'Bank Transfer' && !reference) {
            e.reference = 'Transaction reference is required';
        }

        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        onSubmit({
            amount: parseFloat(amount),
            paymentMethod,
            reference,
            notes
        });
    };

    const getPaymentIcon = (method) => {
        switch (method) {
            case 'Cash': return <MdAttachMoney />;
            case 'Card': return <MdCreditCard />;
            case 'Bank Transfer': return <MdAccountBalance />;
            case 'Cheque': return <MdReceipt />;
            case 'UPI': return <MdPhoneAndroid />;
            default: return <MdAttachMoney />;
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <Modal open={open} onClose={onClose} title="Add Payment" size="md">
            {invoice && (
                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Invoice:</span>
                        <strong>{invoice.invoiceNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Total Amount:</span>
                        <strong>{formatCurrency(invoice.grandTotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Already Paid:</span>
                        <strong style={{ color: 'var(--d-success)' }}>{formatCurrency(invoice.paidAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                        <span>Balance Due:</span>
                        <strong style={{ color: 'var(--d-danger)' }}>{formatCurrency(invoice.balanceAmount)}</strong>
                    </div>
                </div>
            )}

            <div className="d_form_row cols-1">
                <div className="d_form_group">
                    <label className="d_form_label">Payment Amount (₹) <span className="d_req">*</span></label>
                    <input 
                        type="number" 
                        className="d_form_control" 
                        value={amount} 
                        onChange={(e) => {
                            setAmount(e.target.value);
                            setErrors(p => ({ ...p, amount: '' }));
                        }}
                        min="0"
                        max={invoice?.balanceAmount}
                        step="0.01"
                    />
                    {errors.amount && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.amount}</span>}
                    {invoice && (
                        <button 
                            type="button" 
                            className="d_btn d_btn_outline" 
                            onClick={() => setAmount(invoice.balanceAmount)}
                            style={{ marginTop: '5px', fontSize: '0.85em', padding: '4px 8px' }}
                        >
                            Pay Full Balance
                        </button>
                    )}
                </div>
            </div>

            <div className="d_form_row cols-1">
                <div className="d_form_group">
                    <label className="d_form_label">Payment Method <span className="d_req">*</span></label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '5px' }}>
                        {['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Card'].map(method => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => {
                                    setPaymentMethod(method);
                                    setErrors(p => ({ ...p, paymentMethod: '' }));
                                }}
                                style={{
                                    padding: '10px',
                                    border: `2px solid ${paymentMethod === method ? 'var(--d-primary)' : '#ddd'}`,
                                    borderRadius: '8px',
                                    background: paymentMethod === method ? 'var(--d-primary-light)' : '#fff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.85em'
                                }}
                            >
                                {getPaymentIcon(method)}
                                <span>{method}</span>
                            </button>
                        ))}
                    </div>
                    {errors.paymentMethod && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.paymentMethod}</span>}
                </div>
            </div>

            {(paymentMethod === 'Bank Transfer' || paymentMethod === 'UPI') && (
                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">
                            {paymentMethod === 'Bank Transfer' ? 'Transaction Reference' : 'UPI Transaction ID'} <span className="d_req">*</span>
                        </label>
                        <input 
                            className="d_form_control" 
                            value={reference}
                            onChange={(e) => {
                                setReference(e.target.value);
                                setErrors(p => ({ ...p, reference: '' }));
                            }}
                            placeholder={paymentMethod === 'Bank Transfer' ? 'Enter bank transaction reference' : 'Enter UPI transaction ID'}
                        />
                        {errors.reference && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.reference}</span>}
                    </div>
                </div>
            )}

            {paymentMethod === 'Cheque' && (
                <>
                    <div className="d_form_row cols-2">
                        <div className="d_form_group">
                            <label className="d_form_label">Cheque Number <span className="d_req">*</span></label>
                            <input 
                                className="d_form_control" 
                                value={reference}
                                onChange={(e) => {
                                    setReference(e.target.value);
                                    setErrors(p => ({ ...p, reference: '' }));
                                }}
                                placeholder="Enter cheque number"
                            />
                            {errors.reference && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.reference}</span>}
                        </div>
                        <div className="d_form_group">
                            <label className="d_form_label">Cheque Date</label>
                            <input 
                                type="date" 
                                className="d_form_control" 
                            />
                        </div>
                    </div>
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">Bank Name</label>
                            <input 
                                className="d_form_control" 
                                placeholder="Enter bank name"
                            />
                        </div>
                    </div>
                </>
            )}

            <div className="d_form_row cols-1">
                <div className="d_form_group">
                    <label className="d_form_label">Notes</label>
                    <textarea 
                        className="d_form_control" 
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes about this payment..."
                    />
                </div>
            </div>

            <div className="d_form_actions">
                <button className="d_btn d_btn_outline" onClick={onClose}>Cancel</button>
                <button className="d_btn d_btn_primary" onClick={handleSubmit}>
                    <MdAttachMoney style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    Record Payment
                </button>
            </div>
        </Modal>
    );
};

export default PaymentModal;
