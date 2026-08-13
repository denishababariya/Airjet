import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdReceipt, MdDownload, MdAttachMoney, MdCheck, MdClose } from 'react-icons/md';
import Modal from '../../components/Modal';
import api from '../../utils/api';

const blankInvoice = {
    customer: '',
    salesOrder: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    billingAddress: '',
    shippingAddress: '',
    paymentTerms: '30 Days',
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
    paidAmount: 0,
    balanceAmount: 0,
    status: 'Draft',
    notes: '',
    terms: ''
};

const blankItem = {
    sparePart: '',
    quantity: 1,
    rate: 0,
    discount: 0,
    gstRate: 18,
    unit: 'Nos'
};

const statusBadge = s => {
    if (s === 'Paid') return 'd_success';
    if (s === 'Overdue') return 'd_danger';
    if (s === 'Partially Paid') return 'd_info';
    if (s === 'Issued') return 'd_primary';
    return 'd_warning';
};

const tabs = ['All', 'Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled'];

export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [paymentModal, setPaymentModal] = useState(false);
    const [form, setForm] = useState(blankInvoice);
    const [paymentForm, setPaymentForm] = useState({ amount: 0, paymentMethod: 'Cash', reference: '', notes: '' });
    const [editId, setEditId] = useState(null);
    const [paymentInvoiceId, setPaymentInvoiceId] = useState(null);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [invoicesRes, customersRes, salesOrdersRes, sparePartsRes] = await Promise.all([
                api.get('/invoices'),
                api.get('/customers'),
                api.get('/sales-orders'),
                api.get('/spare-parts')
            ]);
            setInvoices(invoicesRes.data || []);
            setCustomers(customersRes.data || []);
            setSalesOrders(salesOrdersRes.data?.filter(so => so.status === 'Completed' && !so.invoiced) || []);
            setSpareParts(sparePartsRes.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = invoices.filter(i => activeTab === 'All' || i.status === activeTab);

    const openAdd = () => {
        setForm({ ...blankInvoice });
        setEditId(null);
        setErrors({});
        setModal(true);
    };

    const openEdit = (invoice) => {
        setForm({
            customer: invoice.customer?._id || invoice.customer,
            salesOrder: invoice.salesOrder?._id || invoice.salesOrder || '',
            invoiceDate: invoice.invoiceDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            dueDate: invoice.dueDate?.split('T')[0] || '',
            billingAddress: invoice.billingAddress || '',
            shippingAddress: invoice.shippingAddress || '',
            paymentTerms: invoice.paymentTerms || '30 Days',
            items: invoice.items || [],
            subtotal: invoice.subtotal || 0,
            totalDiscount: invoice.totalDiscount || 0,
            taxableAmount: invoice.taxableAmount || 0,
            cgst: invoice.cgst || 0,
            sgst: invoice.sgst || 0,
            igst: invoice.igst || 0,
            grandTotal: invoice.grandTotal || 0,
            paidAmount: invoice.paidAmount || 0,
            balanceAmount: invoice.balanceAmount || 0,
            status: invoice.status || 'Draft',
            notes: invoice.notes || '',
            terms: invoice.terms || ''
        });
        setEditId(invoice._id);
        setErrors({});
        setModal(true);
    };

    const handleSalesOrderSelect = (salesOrderId) => {
        const salesOrder = salesOrders.find(so => so._id === salesOrderId);
        if (salesOrder) {
            const customer = customers.find(c => c._id === salesOrder.customer._id);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (customer?.creditDays || 30));

            setForm(p => ({
                ...p,
                customer: salesOrder.customer._id,
                salesOrder: salesOrderId,
                billingAddress: salesOrder.billingAddress || customer?.billingAddress || '',
                shippingAddress: salesOrder.shippingAddress || customer?.shippingAddress || '',
                paymentTerms: salesOrder.paymentTerms || customer?.paymentTerms || '30 Days',
                dueDate: dueDate.toISOString().split('T')[0],
                items: salesOrder.items.map(item => ({
                    sparePart: item.sparePart,
                    quantity: item.quantity,
                    rate: item.rate,
                    discount: item.discount,
                    gstRate: item.gstRate,
                    unit: item.unit || 'Nos'
                })),
                notes: salesOrder.notes || '',
                terms: salesOrder.terms || ''
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
            }
        }

        setForm(p => ({ ...p, items: updatedItems }));
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let taxableAmount = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;

        const customer = customers.find(c => c._id === form.customer);
        const isInterState = customer?.state !== 'Gujarat';

        form.items.forEach(item => {
            const part = spareParts.find(s => s._id === item.sparePart);
            const rate = item.rate || (part?.sellingPrice) || 0;
            const grossAmount = item.quantity * rate;
            const discount = item.discount || 0;
            const itemTaxableAmount = grossAmount - discount;
            
            const totalGST = (itemTaxableAmount * item.gstRate) / 100;
            let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

            if (isInterState) {
                igstAmount = totalGST;
            } else {
                cgstAmount = totalGST / 2;
                sgstAmount = totalGST / 2;
            }

            const itemTotal = itemTaxableAmount + cgstAmount + sgstAmount + igstAmount;

            subtotal += grossAmount;
            totalDiscount += discount;
            taxableAmount += itemTaxableAmount;
            totalCGST += cgstAmount;
            totalSGST += sgstAmount;
            totalIGST += igstAmount;
        });

        const grandTotal = taxableAmount + totalCGST + totalSGST + totalIGST;

        return { subtotal, totalDiscount, taxableAmount, totalCGST, totalSGST, totalIGST, grandTotal };
    };

    const { subtotal, totalDiscount, taxableAmount, totalCGST, totalSGST, totalIGST, grandTotal } = calculateTotals();

    const validate = () => {
        const e = {};
        if (!form.customer) e.customer = 'Customer is required';
        if (!form.invoiceDate) e.invoiceDate = 'Invoice date is required';
        if (!form.dueDate) e.dueDate = 'Due date is required';
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
            const customer = customers.find(c => c._id === form.customer);
            const isInterState = customer?.state !== 'Gujarat';

            const itemsWithCalculations = form.items.map(item => {
                const part = spareParts.find(s => s._id === item.sparePart);
                const rate = item.rate || part?.sellingPrice || 0;
                const grossAmount = item.quantity * rate;
                const discount = item.discount || 0;
                const itemTaxableAmount = grossAmount - discount;
                
                const totalGST = (itemTaxableAmount * item.gstRate) / 100;
                let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

                if (isInterState) {
                    igstAmount = totalGST;
                } else {
                    cgstAmount = totalGST / 2;
                    sgstAmount = totalGST / 2;
                }

                const itemTotal = itemTaxableAmount + cgstAmount + sgstAmount + igstAmount;

                return {
                    ...item,
                    description: part?.partName || '',
                    taxableAmount: itemTaxableAmount,
                    cgstAmount,
                    sgstAmount,
                    igstAmount,
                    total: itemTotal
                };
            });

            const payload = {
                ...form,
                items: itemsWithCalculations,
                subtotal,
                totalDiscount,
                taxableAmount,
                cgst: totalCGST,
                sgst: totalSGST,
                igst: totalIGST,
                grandTotal,
                balanceAmount: grandTotal - (form.paidAmount || 0)
            };

            if (editId) {
                await api.put(`/invoices/${editId}`, payload);
            } else {
                await api.post('/invoices', payload);
            }
            setModal(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save invoice');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await api.delete(`/invoices/${id}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete invoice');
        }
    };

    const handleStatusChange = async (id, action) => {
        try {
            await api.post(`/invoices/${id}/${action}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${action} invoice`);
        }
    };

    const openPaymentModal = (invoice) => {
        setPaymentInvoiceId(invoice._id);
        setPaymentForm({
            amount: invoice.balanceAmount || 0,
            paymentMethod: 'Cash',
            reference: '',
            notes: ''
        });
        setPaymentModal(true);
    };

    const handleAddPayment = async () => {
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            alert('Please enter a valid payment amount');
            return;
        }

        try {
            await api.post(`/invoices/${paymentInvoiceId}/payment`, paymentForm);
            setPaymentModal(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add payment');
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

    const pf = (field) => ({
        value: paymentForm[field] ?? '',
        onChange: (e) => setPaymentForm(p => ({ ...p, [field]: e.target.value }))
    });

    if (loading) {
        return (
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Invoices</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Invoices</div>
                    <div className="d_page_subtitle">Manage customer invoices and payments</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Invoice</button>
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
                        <table className="d_table" style={{ minWidth: 1100 }}>
                            <thead>
                                <tr>
                                    <th>Inv No.</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Due Date</th>
                                    <th>Items</th>
                                    <th>Total (₹)</th>
                                    <th>Paid (₹)</th>
                                    <th>Balance (₹)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={10}>No invoices found.</td>
                                    </tr>
                                )}
                                {filtered.map(i => (
                                    <tr key={i._id}>
                                        <td><strong>{i.invoiceNumber}</strong></td>
                                        <td>{i.customer?.name || i.customer}</td>
                                        <td>{new Date(i.invoiceDate).toLocaleDateString('en-IN')}</td>
                                        <td>{new Date(i.dueDate).toLocaleDateString('en-IN')}</td>
                                        <td>{i.items?.length || 0}</td>
                                        <td>{formatCurrency(i.grandTotal)}</td>
                                        <td style={{ color: 'var(--d-success)' }}>{formatCurrency(i.paidAmount)}</td>
                                        <td style={{ color: i.balanceAmount > 0 ? 'var(--d-danger)' : 'inherit' }}>
                                            {formatCurrency(i.balanceAmount)}
                                        </td>
                                        <td><span className={`d_badge ${statusBadge(i.status)}`}>{i.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => openEdit(i)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(i)}><MdEdit /></button>
                                                {i.status === 'Draft' && (
                                                    <button className="d_icon_btn d_primary" onClick={() => handleStatusChange(i._id, 'issue')} title="Issue"><MdCheck /></button>
                                                )}
                                                {i.status === 'Issued' && (
                                                    <button className="d_icon_btn d_success" onClick={() => openPaymentModal(i)} title="Add Payment"><MdAttachMoney /></button>
                                                )}
                                                {i.balanceAmount > 0 && i.status !== 'Draft' && i.status !== 'Cancelled' && (
                                                    <button className="d_icon_btn d_info" onClick={() => openPaymentModal(i)} title="Add Payment"><MdAttachMoney /></button>
                                                )}
                                                {i.status === 'Issued' && (
                                                    <button className="d_icon_btn d_danger" onClick={() => handleStatusChange(i._id, 'cancel')} title="Cancel"><MdClose /></button>
                                                )}
                                                <button className="d_icon_btn d_del" onClick={() => handleDelete(i._id)}><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Invoice' : 'New Invoice'} size="xl">
                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Sales Order (Optional)</label>
                        <select className="d_form_control" {...f('salesOrder')} onChange={(e) => {
                            f('salesOrder').onChange(e);
                            if (e.target.value) handleSalesOrderSelect(e.target.value);
                        }}>
                            <option value="">Select Sales Order</option>
                            {salesOrders.map(so => (
                                <option key={so._id} value={so._id}>{so.salesOrderNumber} - {so.customer?.name}</option>
                            ))}
                        </select>
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
                        <label className="d_form_label">Invoice Date <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('invoiceDate')} />
                        {errors.invoiceDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.invoiceDate}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Due Date <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('dueDate')} />
                        {errors.dueDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.dueDate}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Terms</label>
                        <select className="d_form_control" {...f('paymentTerms')}>
                            <option value="Cash">Cash</option>
                            <option value="Immediate">Immediate</option>
                            <option value="7 Days">7 Days</option>
                            <option value="15 Days">15 Days</option>
                            <option value="30 Days">30 Days</option>
                            <option value="45 Days">45 Days</option>
                            <option value="60 Days">60 Days</option>
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Status</label>
                        <select className="d_form_control" {...f('status')}>
                            <option value="Draft">Draft</option>
                            <option value="Issued">Issued</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Cancelled">Cancelled</option>
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
                        <table className="d_table" style={{ minWidth: 800 }}>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th>Qty</th>
                                    <th>Rate (₹)</th>
                                    <th>Discount (₹)</th>
                                    <th>GST %</th>
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
                                            <input
                                                type="number"
                                                className="d_form_control"
                                                value={item.discount}
                                                onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                style={{ width: '80px' }}
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
                                        <td>{formatCurrency(
                                            ((item.quantity * item.rate - item.discount) * (1 + item.gstRate / 100))
                                        )}</td>
                                        <td>
                                            <button className="d_icon_btn d_delete" onClick={() => removeItem(index)}><MdDelete /></button>
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
                        <span>Discount:</span>
                        <strong>{formatCurrency(totalDiscount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Taxable Amount:</span>
                        <strong>{formatCurrency(taxableAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>CGST:</span>
                        <strong>{formatCurrency(totalCGST)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>SGST:</span>
                        <strong>{formatCurrency(totalSGST)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>IGST:</span>
                        <strong>{formatCurrency(totalIGST)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                        <span>Grand Total:</span>
                        <strong style={{ color: 'var(--d-primary)' }}>{formatCurrency(grandTotal)}</strong>
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Notes</label>
                        <textarea className="d_form_control" rows="2" {...f('notes')} />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Terms & Conditions</label>
                        <textarea className="d_form_control" rows="2" {...f('terms')} />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Invoice' : 'Create Invoice'}</button>
                </div>
            </Modal>

            <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Add Payment" size="md">
                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Amount (₹)</label>
                        <input type="number" className="d_form_control" {...pf('amount')} min="0" />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Method</label>
                        <select className="d_form_control" {...pf('paymentMethod')}>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                            <option value="Card">Card</option>
                        </select>
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Reference No.</label>
                        <input className="d_form_control" {...pf('reference')} placeholder="Transaction/Reference number" />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Notes</label>
                        <textarea className="d_form_control" rows="2" {...pf('notes')} />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setPaymentModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleAddPayment}><MdAttachMoney /> Add Payment</button>
                </div>
            </Modal>
        </div>
    );
}
