import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdReceipt, MdSearch, MdFilterList } from 'react-icons/md';
import Modal from '../../components/Modal';
import api from '../../utils/api';

const blankPayment = {
    invoice: '',
    customer: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'Cash',
    reference: '',
    bankName: '',
    accountNumber: '',
    chequeNumber: '',
    chequeDate: '',
    notes: '',
    status: 'Received'
};

const statusBadge = s => {
    if (s === 'Received') return 'd_success';
    if (s === 'Pending') return 'd_warning';
    if (s === 'Bounced') return 'd_danger';
    if (s === 'Cancelled') return 'd_danger';
    return 'd_info';
};

const tabs = ['All', 'Received', 'Pending', 'Bounced', 'Cancelled'];

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(blankPayment);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterMethod, setFilterMethod] = useState('');

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
            setError('Failed to load data');
            console.error(err);
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
        const matchesMethod = filterMethod === '' || p.paymentMethod === filterMethod;
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
            paymentMethod: payment.paymentMethod || 'Cash',
            reference: payment.reference || '',
            bankName: payment.bankName || '',
            accountNumber: payment.accountNumber || '',
            chequeNumber: payment.chequeNumber || '',
            chequeDate: payment.chequeDate?.split('T')[0] || '',
            notes: payment.notes || '',
            status: payment.status || 'Received'
        });
        setEditId(payment._id);
        setErrors({});
        setModal(true);
    };

    const handleInvoiceSelect = (invoiceId) => {
        const invoice = invoices.find(i => i._id === invoiceId);
        if (invoice) {
            setForm(p => ({
                ...p,
                customer: invoice.customer?._id || invoice.customer,
                amount: invoice.balanceAmount || 0,
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
        if (!form.paymentMethod) e.paymentMethod = 'Payment method is required';
        
        if (form.paymentMethod === 'Cheque' && !form.chequeNumber) {
            e.chequeNumber = 'Cheque number is required for cheque payments';
        }
        if (form.paymentMethod === 'Cheque' && !form.chequeDate) {
            e.chequeDate = 'Cheque date is required for cheque payments';
        }
        if (form.paymentMethod === 'Bank Transfer' && !form.reference) {
            e.reference = 'Reference number is required for bank transfer';
        }
        
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
            setError(err.response?.data?.error || 'Failed to save payment');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment?')) return;
        try {
            await api.delete(`/payments/${id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete payment');
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.put(`/payments/${id}`, { status });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update payment status');
        }
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
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
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
                                        <td>{p.paymentMethod}</td>
                                        <td style={{ color: 'var(--d-success)', fontWeight: 'bold' }}>{formatCurrency(p.amount)}</td>
                                        <td>{p.reference || p.chequeNumber || '-'}</td>
                                        <td><span className={`d_badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => openEdit(p)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
                                                {p.status === 'Received' && (
                                                    <button className="d_icon_btn d_danger" onClick={() => handleStatusChange(p._id, 'Bounced')} title="Mark as Bounced">B</button>
                                                )}
                                                {p.status === 'Bounced' && (
                                                    <button className="d_icon_btn d_success" onClick={() => handleStatusChange(p._id, 'Received')} title="Mark as Received">R</button>
                                                )}
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
                            {invoices.filter(i => i.balanceAmount > 0).map(i => (
                                <option key={i._id} value={i._id}>{i.invoiceNumber} - Balance: {formatCurrency(i.balanceAmount)}</option>
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
                        <select className="d_form_control" {...f('paymentMethod')}>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                        {errors.paymentMethod && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.paymentMethod}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Status</label>
                        <select className="d_form_control" {...f('status')}>
                            <option value="Received">Received</option>
                            <option value="Pending">Pending</option>
                            <option value="Bounced">Bounced</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {form.paymentMethod === 'Bank Transfer' && (
                    <div className="d_form_row cols-2">
                        <div className="d_form_group">
                            <label className="d_form_label">Bank Name</label>
                            <input className="d_form_control" {...f('bankName')} />
                        </div>
                        <div className="d_form_group">
                            <label className="d_form_label">Account Number</label>
                            <input className="d_form_control" {...f('accountNumber')} />
                        </div>
                    </div>
                )}

                {form.paymentMethod === 'Bank Transfer' && (
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">Reference/Transaction No. <span className="d_req">*</span></label>
                            <input className="d_form_control" {...f('reference')} placeholder="Enter transaction reference" />
                            {errors.reference && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.reference}</span>}
                        </div>
                    </div>
                )}

                {form.paymentMethod === 'Cheque' && (
                    <div className="d_form_row cols-2">
                        <div className="d_form_group">
                            <label className="d_form_label">Cheque Number <span className="d_req">*</span></label>
                            <input className="d_form_control" {...f('chequeNumber')} />
                            {errors.chequeNumber && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.chequeNumber}</span>}
                        </div>
                        <div className="d_form_group">
                            <label className="d_form_label">Cheque Date <span className="d_req">*</span></label>
                            <input type="date" className="d_form_control" {...f('chequeDate')} />
                            {errors.chequeDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.chequeDate}</span>}
                        </div>
                    </div>
                )}

                {form.paymentMethod === 'Cheque' && (
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">Bank Name</label>
                            <input className="d_form_control" {...f('bankName')} />
                        </div>
                    </div>
                )}

                {form.paymentMethod === 'UPI' && (
                    <div className="d_form_row cols-1">
                        <div className="d_form_group">
                            <label className="d_form_label">UPI Transaction ID</label>
                            <input className="d_form_control" {...f('reference')} placeholder="Enter UPI transaction ID" />
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
        </div>
    );
}
