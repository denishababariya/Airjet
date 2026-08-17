import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdAssignmentReturn, MdCheck, MdClose, MdWarning } from 'react-icons/md';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../utils/api';

const blankReturn = {
    customer: '',
    invoice: '',
    returnDate: new Date().toISOString().split('T')[0],
    returnMethod: 'Refund',
    items: [],
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0,
    status: 'Pending',
    notes: ''
};

const blankItem = {
    sparePart: '',
    quantity: 1,
    rate: 0,
    gstRate: 18,
    returnReason: 'Damaged Part',
    condition: 'Damaged'
};

const statusBadge = s => {
    if (s === 'Approved') return 'd_success';
    if (s === 'Rejected') return 'd_danger';
    if (s === 'Processed') return 'd_primary';
    if (s === 'Pending') return 'd_warning';
    return 'd_info';
};

const tabs = ['All', 'Pending', 'Approved', 'Rejected', 'Processed'];

export default function SalesReturns() {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(blankReturn);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [returnsRes, customersRes, invoicesRes, sparePartsRes] = await Promise.all([
                api.get('/sales-returns'),
                api.get('/customers'),
                api.get('/invoices'),
                api.get('/spare-parts')
            ]);
            setReturns(returnsRes.data || []);
            setCustomers(customersRes.data || []);
            setInvoices(invoicesRes.data || []);
            setSpareParts(sparePartsRes.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = returns.filter(r => activeTab === 'All' || r.status === activeTab);

    const openAdd = () => {
        setForm({ ...blankReturn });
        setEditId(null);
        setErrors({});
        setModal(true);
    };

    const openEdit = (returnItem) => {
        setForm({
            customer: returnItem.customer?._id || returnItem.customer,
            invoice: returnItem.invoice?._id || returnItem.invoice || '',
            returnDate: returnItem.returnDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            returnMethod: returnItem.returnMethod || 'Refund',
            items: returnItem.items || [],
            subtotal: returnItem.subtotal || 0,
            totalTax: returnItem.totalTax || 0,
            totalAmount: returnItem.totalAmount || 0,
            status: returnItem.status || 'Pending',
            notes: returnItem.notes || ''
        });
        setEditId(returnItem._id);
        setErrors({});
        setModal(true);
    };

    const handleInvoiceSelect = (invoiceId) => {
        const invoice = invoices.find(i => i._id === invoiceId);
        if (invoice) {
            setForm(p => ({
                ...p,
                customer: invoice.customer?._id || invoice.customer,
                salesOrder: invoice.salesOrder?._id || invoice.salesOrder || '',
                items: invoice.items?.map(item => ({
                    sparePart: item.sparePart,
                    quantity: item.quantity,
                    rate: item.rate,
                    gstRate: item.gstRate,
                    returnReason: 'Damaged Part',
                    condition: 'Damaged'
                })) || []
            }));
        }
    };

    const addItem = () => {
        if (spareParts.length === 0) {
            alert('No spare parts available. Please add spare parts first.');
            return;
        }
        setForm(p => ({
            ...p,
            items: [...p.items, { ...blankItem, sparePart: spareParts[0]._id, rate: spareParts[0].sellingPrice }]
        }));
    };

    const removeItem = (index) => {
        setForm(p => ({
            ...p,
            items: p.items.filter((_, i) => i !== index)
        }));
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...form.items];
        updatedItems[index][field] = value;

        if (field === 'sparePart') {
            const selectedPart = spareParts.find(s => s._id === value);
            if (selectedPart) {
                updatedItems[index].rate = selectedPart.sellingPrice;
                updatedItems[index].gstRate = selectedPart.gstRate || 18;
            }
        }

        setForm(p => ({ ...p, items: updatedItems }));
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        form.items.forEach(item => {
            const part = spareParts.find(s => s._id === item.sparePart);
            const rate = item.rate || (part?.sellingPrice) || 0;
            const itemSubtotal = item.quantity * rate;
            const itemTax = (itemSubtotal * item.gstRate) / 100;

            subtotal += itemSubtotal;
            totalTax += itemTax;
        });

        const totalAmount = subtotal + totalTax;

        return { subtotal, totalTax, totalAmount };
    };

    const { subtotal, totalTax, totalAmount } = calculateTotals();

    const validate = () => {
        const e = {};
        if (!form.invoice) e.invoice = 'Invoice is required';
        if (!form.customer) e.customer = 'Customer is required';
        if (!form.returnDate) e.returnDate = 'Return date is required';
        if (!form.items || form.items.length === 0) e.items = 'At least one item is required';
        return e;
    };

    const handleSave = async () => {
        const e = validate();
        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }

        try {
            const itemsWithCalculations = form.items.map(item => {
                const part = spareParts.find(s => s._id === item.sparePart);
                const rate = item.rate || part?.sellingPrice || 0;
                const itemSubtotal = item.quantity * rate;
                const itemTax = (itemSubtotal * item.gstRate) / 100;
                const itemTotal = itemSubtotal + itemTax;

                return {
                    ...item,
                    description: part?.partName || '',
                    taxableAmount: itemSubtotal,
                    taxAmount: itemTax,
                    total: itemTotal
                };
            });

            const payload = {
                ...form,
                items: itemsWithCalculations,
                subtotal,
                totalTax,
                totalAmount
            };

            if (editId) {
                await api.put(`/sales-returns/${editId}`, payload);
            } else {
                await api.post('/sales-returns', payload);
            }
            setModal(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save sales return');
        }
    };

    const handleDelete = async (id) => {
        const returnItem = returns.find(r => r._id === id);
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/sales-returns/${id}`);
                    fetchData();
                    setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
                } catch (err) {
                    setError(err.response?.data?.error || 'Failed to delete sales return');
                }
            },
            title: 'Delete Sales Return',
            message: `Are you sure you want to delete sales return ${returnItem?.returnNumber || 'this return'}? This action cannot be undone.`
        });
    };

    const handleStatusChange = async (id, action) => {
        try {
            await api.post(`/sales-returns/${id}/${action}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${action} sales return`);
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
                    <div className="d_page_title">Sales Returns</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Sales Returns</div>
                    <div className="d_page_subtitle">Manage customer returns and refunds</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Return</button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            <div className="d_card">
                <div className="d_card_header">
                    <div className="d_tabs">
                        {tabs.map(t => (
                            <button key={t} className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>
                </div>
                <div className="d_card_body">
                    <div className="d_table_wrap">
                        <table className="d_table" style={{ minWidth: 1000 }}>
                            <thead>
                                <tr>
                                    <th>Return No.</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Invoice/SO</th>
                                    <th>Items</th>
                                    <th>Amount (₹)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={8}>No sales returns found.</td>
                                    </tr>
                                )}
                                {filtered.map(r => (
                                    <tr key={r._id}>
                                        <td><strong>{r.returnNumber}</strong></td>
                                        <td>{r.customer?.name || r.customer}</td>
                                        <td>{new Date(r.returnDate).toLocaleDateString('en-IN')}</td>
                                        <td>
                                            {r.invoice?.invoiceNumber || r.salesOrder?.salesOrderNumber || '-'}
                                        </td>
                                        <td>{r.items?.length || 0}</td>
                                        <td style={{ color: 'var(--d-danger)', fontWeight: 'bold' }}>{formatCurrency(r.totalAmount)}</td>
                                        <td><span className={`d_badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => openEdit(r)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
                                                {r.status === 'Pending' && (
                                                    <>
                                                        <button className="d_icon_btn d_success" onClick={() => handleStatusChange(r._id, 'approve')} title="Approve"><MdCheck /></button>
                                                        <button className="d_icon_btn d_danger" onClick={() => handleStatusChange(r._id, 'reject')} title="Reject"><MdClose /></button>
                                                    </>
                                                )}
                                                {r.status === 'Approved' && (
                                                    <button className="d_icon_btn d_primary" onClick={() => handleStatusChange(r._id, 'process')} title="Process"><MdAssignmentReturn /></button>
                                                )}
                                                <button className="d_icon_btn d_del" onClick={() => handleDelete(r._id)}><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Sales Return' : 'New Sales Return'} size="xl">
                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Invoice <span className="d_req">*</span></label>
                        <select className="d_form_control" {...f('invoice')} onChange={(e) => {
                            f('invoice').onChange(e);
                            if (e.target.value) handleInvoiceSelect(e.target.value);
                        }}>
                            <option value="">Select Invoice</option>
                            {invoices.map(i => (
                                <option key={i._id} value={i._id}>{i.invoiceNumber} - {i.customer?.name}</option>
                            ))}
                        </select>
                        {errors.invoice && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.invoice}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
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
                    <div className="d_form_group">
                        <label className="d_form_label">Return Date <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('returnDate')} />
                        {errors.returnDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.returnDate}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Return Method</label>
                        <select className="d_form_control" {...f('returnMethod')}>
                            <option value="Refund">Refund</option>
                            <option value="Credit Note">Credit Note</option>
                            <option value="Replacement">Replacement</option>
                        </select>
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Items <span className="d_req">*</span></label>
                        {errors.items && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.items}</span>}
                    </div>
                </div>

                {form.items.length > 0 && (
                    <div className="d_table_wrap" style={{ marginBottom: '15px' }}>
                        <table className="d_table" style={{ minWidth: 900 }}>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th>Qty</th>
                                    <th>Rate (₹)</th>
                                    <th>GST %</th>
                                    <th>Reason</th>
                                    <th>Condition</th>
                                    <th>Total (₹)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            <select
                                                className="d_form_control"
                                                value={item.sparePart}
                                                onChange={(e) => updateItem(index, 'sparePart', e.target.value)}
                                            >
                                                {spareParts.map(s => (
                                                    <option key={s._id} value={s._id}>{s.partNumber} - {s.partName}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="d_form_control"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                min="1"
                                                style={{ width: '80px' }}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                className="d_form_control"
                                                value={item.rate}
                                                onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                style={{ width: '100px' }}
                                            />
                                        </td>
                                        <td>
                                            <select
                                                className="d_form_control"
                                                value={item.gstRate}
                                                onChange={(e) => updateItem(index, 'gstRate', parseFloat(e.target.value))}
                                                style={{ width: '80px' }}
                                            >
                                                <option value="0">0%</option>
                                                <option value="5">5%</option>
                                                <option value="12">12%</option>
                                                <option value="18">18%</option>
                                                <option value="28">28%</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="d_form_control"
                                                value={item.returnReason}
                                                onChange={(e) => updateItem(index, 'returnReason', e.target.value)}
                                                style={{ width: '120px' }}
                                            >
                                                <option value="Damaged Part">Damaged Part</option>
                                                <option value="Wrong Part">Wrong Part</option>
                                                <option value="Defective Part">Defective Part</option>
                                                <option value="Customer Rejection">Customer Rejection</option>
                                                <option value="Excess Quantity">Excess Quantity</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="d_form_control"
                                                value={item.condition}
                                                onChange={(e) => updateItem(index, 'condition', e.target.value)}
                                                style={{ width: '100px' }}
                                            >
                                                <option value="Good">Good</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Defective">Defective</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button className="d_btn d_btn_outline" onClick={addItem} style={{ marginBottom: '15px' }}><MdAdd /> Add Item</button>

                <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Subtotal:</span>
                        <strong>{formatCurrency(subtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Tax:</span>
                        <strong>{formatCurrency(totalTax)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                        <span>Total Refund Amount:</span>
                        <strong style={{ color: 'var(--d-danger)' }}>{formatCurrency(totalAmount)}</strong>
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Notes</label>
                        <textarea className="d_form_control" rows="2" {...f('notes')} placeholder="Additional details about the return..." />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Return' : 'Create Return'}</button>
                </div>
            </Modal>

            <ConfirmModal
                open={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, onConfirm: null, title: '', message: '' })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />
        </div>
    );
}
