import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdReceipt, MdSearch, MdFilterList } from 'react-icons/md';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/errorMessages';

const blankPayment = {
    invoice: '',
    customer: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMode: 'Cash',
    transactionReference: '',
    bank: '',
    notes: '',
    status: 'Completed'
};

const statusBadge = s => {
    if (s === 'Completed') return 'd_success';
    if (s === 'Pending') return 'd_warning';
    if (s === 'Failed') return 'd_danger';
    if (s === 'Cancelled') return 'd_danger';
    return 'd_info';
};

const tabs = ['All', 'Completed', 'Pending', 'Failed', 'Cancelled'];

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewPayment, setViewPayment] = useState(null);
    const [form, setForm] = useState(blankPayment);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterMethod, setFilterMethod] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [paymentsRes, invoicesRes, customersRes] = await Promise.all([
                api.get('/payments'),
                api.get('/invoices'),
                api.get('/customers')
            ]);
            setPayments(paymentsRes.data || []);
            setInvoices(invoicesRes.data || []);
            setCustomers(customersRes.data || []);
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load data'));
        } finally {
            setLoading(false);
        }
    };

    const filtered = payments.filter(p => {
        const matchesTab = activeTab === 'All' || p.status === activeTab;
        const matchesSearch = searchTerm === '' || 
            p.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCustomer = filterCustomer === '' || p.customer?._id === filterCustomer;
        const matchesMethod = filterMethod === '' || p.paymentMode === filterMethod;
        return matchesTab && matchesSearch && matchesCustomer && matchesMethod;
    });

    const openAdd = () => {
        setForm({ ...blankPayment });
        setEditId(null);
        setErrors({});
        setModal(true);
    };

    const openEdit = (payment) => {
        setForm({
            invoice: payment.invoice?._id || payment.invoice || '',
            customer: payment.customer?._id || payment.customer || '',
            paymentDate: payment.paymentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            amount: payment.amount || 0,
            paymentMode: payment.paymentMode || 'Cash',
            transactionReference: payment.transactionReference || '',
            bank: payment.bank || '',
            notes: payment.notes || '',
            status: payment.status || 'Completed'
        });
        setEditId(payment._id);
        setErrors({});
        setModal(true);
    };

    const handleView = (payment) => {
        setViewPayment(payment);
        setViewModal(true);
    };

    const handleInvoiceSelect = (invoiceId) => {
        const invoice = invoices.find(i => i._id === invoiceId);
        if (invoice) {
            setForm(p => ({
                ...p,
                customer: invoice.customer?._id || invoice.customer,
                amount: invoice.pendingAmount || invoice.grandTotal || 0,
                invoice: invoiceId
            }));
        }
    };

    const validate = () => {
        const e = {};
        if (!form.invoice) e.invoice = 'Invoice is required';
        if (!form.customer) e.customer = 'Customer is required';
        if (!form.paymentDate) e.paymentDate = 'Payment date is required';
        if (!form.amount || form.amount <= 0) e.amount = 'Amount is required';
        if (!form.paymentMode) e.paymentMode = 'Payment method is required';
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        try {
            const payload = { ...form };
            
            if (editId) {
                await api.put(`/payments/${editId}`, payload);
            } else {
                await api.post('/payments', payload);
            }
            setModal(false);
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save payment'));
        }
    };

    const handleDelete = async (id) => {
        const payment = payments.find(p => p._id === id);
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/payments/${id}`);
                    fetchData();
                    setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
                } catch (err) {
                    setError(getErrorMessage(err, 'Failed to delete payment'));
                }
            },
            title: 'Delete Payment',
            message: `Are you sure you want to delete payment ${payment?.paymentId || 'this payment'}? This action cannot be undone.`
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const f = (field) => ({
        value: form[field] ?? '',
        onChange: (e) => {
            setForm(p => ({ ...p, [field]: e.target.value }));
            setErrors(p => ({ ...p, [field]: '' }));
        }
    });

    if (loading) {
        return (
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Payments</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Payments</div>
                    <div className="d_page_subtitle">Manage customer payments and receipts</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Payment</button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            <div className="d_card">
                <div className="d_card_header">
                    <div className="d_tabs">
                        {tabs.map(t => (
                            <button key={t} className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                            <MdSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '8px 10px 8px 35px', border: '1px solid #ddd', borderRadius: '4px', width: '200px' }}
                            />
                        </div>
                        <select
                            value={filterCustomer}
                            onChange={(e) => setFilterCustomer(e.target.value)}
                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="">All Customers</option>
                            {customers.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <select
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                            <option value="">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                </div>
                <div className="d_card_body">
                    <div className="d_table_wrap">
                        <table className="d_table" style={{ minWidth: 1000 }}>
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Invoice</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Method</th>
                                    <th>Amount (₹)</th>
                                    <th>Reference</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={9}>No payments found.</td>
                                    </tr>
                                )}
                                {filtered.map(p => (
                                    <tr key={p._id}>
                                        <td><strong>{p.paymentId}</strong></td>
                                        <td>{p.invoice?.invoiceNumber || p.invoice}</td>
                                        <td>{p.customer?.name || p.customer}</td>
                                        <td>{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                                        <td>{p.paymentMode}</td>
                                        <td style={{ color: 'var(--d-success)', fontWeight: 'bold' }}>{formatCurrency(p.amount)}</td>
                                        <td>{p.transactionReference || '-'}</td>
                                        <td><span className={`d_badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => handleView(p)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
                                                <button className="d_icon_btn d_del" onClick={() => handleDelete(p._id)}><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Payment' : 'New Payment'} size="lg">
                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Invoice <span className="d_req">*</span></label>
                        <select className="d_form_control" {...f('invoice')} onChange={(e) => {
                            f('invoice').onChange(e);
                            if (e.target.value) handleInvoiceSelect(e.target.value);
                        }}>
                            <option value="">Select Invoice</option>
                            {invoices.filter(i => i.pendingAmount > 0).map(i => (
                                <option key={i._id} value={i._id}>{i.invoiceNumber} - Balance: {formatCurrency(i.pendingAmount)}</option>
                            ))}
                        </select>
                        {errors.invoice && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.invoice}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Customer <span className="d_req">*</span></label>
                        <select className="d_form_control" {...f('customer')}>
                            <option value="">Select Customer</option>
                            {customers.map(c => (
                                <option key={c._id} value={c._id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>
                            ))}
                        </select>
                        {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Date <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('paymentDate')} />
                        {errors.paymentDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.paymentDate}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Amount (₹) <span className="d_req">*</span></label>
                        <input type="number" className="d_form_control" {...f('amount')} min="0" step="0.01" />
                        {errors.amount && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.amount}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Method <span className="d_req">*</span></label>
                        <select className="d_form_control" {...f('paymentMode')}>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Cheque">Cheque</option>
                            <option value="Card">Card</option>
                        </select>
                        {errors.paymentMode && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.paymentMode}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Status</label>
                        <select className="d_form_control" {...f('status')}>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Failed">Failed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {form.paymentMode === 'Bank Transfer' && (
                    <div className="d_form_row cols-2">
                        <div className="d_form_group">
                            <label className="d_form_label">Bank Name</label>
                            <input className="d_form_control" {...f('bank')} />
                        </div>
                        <div className="d_form_group">
                            <label className="d_form_label">Reference/Transaction No.</label>
                            <input className="d_form_control" {...f('transactionReference')} placeholder="Enter transaction reference" />
                        </div>
                    </div>
                )}

                {form.paymentMode === 'UPI' && (
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">UPI Transaction ID</label>
                            <input className="d_form_control" {...f('transactionReference')} placeholder="Enter UPI transaction ID" />
                        </div>
                    </div>
                )}

                {form.paymentMode === 'Cheque' && (
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">Bank Name</label>
                            <input className="d_form_control" {...f('bank')} />
                        </div>
                    </div>
                )}

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Notes</label>
                        <textarea className="d_form_control" rows="2" {...f('notes')} placeholder="Any additional notes..." />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Payment' : 'Record Payment'}</button>
                </div>
            </Modal>

            {/* View Payment Modal */}
            <Modal open={viewModal} onClose={() => setViewModal(false)} title="Payment Details" size="lg">
                {viewPayment && (
                    <div>
                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Payment ID</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewPayment.paymentId}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Status</label>
                                <span className={`d_badge ${statusBadge(viewPayment.status)}`}>{viewPayment.status}</span>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Invoice</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewPayment.invoice?.invoiceNumber || '-'}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Customer</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewPayment.customer?.name || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Payment Date</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{new Date(viewPayment.paymentDate).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Payment Method</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewPayment.paymentMode}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Amount (₹)</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold', color: 'var(--d-success)' }}>
                                    {formatCurrency(viewPayment.amount)}
                                </div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Transaction Reference</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewPayment.transactionReference || '-'}</div>
                            </div>
                        </div>

                        {viewPayment.bank && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Bank Name</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewPayment.bank}</div>
                                </div>
                            </div>
                        )}

                        {viewPayment.notes && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Notes</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewPayment.notes}</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmDialog
                open={confirmModal.open}
                onCancel={() => setConfirmModal({ open: false, onConfirm: null, title: '', message: '' })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
            />
        </div>
    );
}
