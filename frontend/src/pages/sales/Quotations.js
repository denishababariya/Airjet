import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdDescription, MdDelete, MdSend, MdCheck, MdClose, MdRefresh } from 'react-icons/md';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';

const blankQuotation = {
    customer: '',
    quotationDate: new Date().toISOString().split('T')[0],
    validUntil: '',
    salesPerson: '',
    billingAddress: '',
    shippingAddress: '',
    paymentTerms: '30 Days',
    deliveryTerms: '',
    items: [],
    notes: '',
    terms: '',
    status: 'Draft'
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
    if (s === 'Accepted') return 'd_success';
    if (s === 'Rejected') return 'd_danger';
    if (s === 'Sent') return 'd_info';
    if (s === 'Converted') return 'd_primary';
    return 'd_warning';
};

const tabs = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'];

export default function Quotations() {
    const [quotations, setQuotations] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(blankQuotation);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [viewModal, setViewModal] = useState(false);
    const [viewQuotation, setViewQuotation] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [quotationsRes, customersRes, sparePartsRes] = await Promise.all([
                api.get('/quotations'),
                api.get('/customers'),
                api.get('/spare-parts')
            ]);
            setQuotations(quotationsRes.data || []);
            setCustomers(customersRes.data || []);
            setSpareParts(sparePartsRes.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = quotations.filter(q => activeTab === 'All' || q.status === activeTab);

    const openAdd = () => {
        setForm({ ...blankQuotation, validUntil: calculateValidUntil(30) });
        setEditId(null);
        setErrors({});
        setModal(true);
    };

    const openEdit = (quotation) => {
        setForm({
            customer: quotation.customer?._id || quotation.customer,
            quotationDate: quotation.quotationDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            validUntil: quotation.validUntil?.split('T')[0] || '',
            salesPerson: quotation.salesPerson || '',
            billingAddress: quotation.billingAddress || '',
            shippingAddress: quotation.shippingAddress || '',
            paymentTerms: quotation.paymentTerms || '30 Days',
            deliveryTerms: quotation.deliveryTerms || '',
            items: quotation.items || [],
            notes: quotation.notes || '',
            terms: quotation.terms || '',
            status: quotation.status || 'Draft'
        });
        setEditId(quotation._id);
        setErrors({});
        setModal(true);
    };

    const calculateValidUntil = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
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

        // Auto-update rate when spare part changes
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
        const isInterState = customer?.state !== 'Gujarat'; // Assuming company is in Gujarat

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
        if (!form.quotationDate) e.quotationDate = 'Quotation date is required';
        if (!form.validUntil) e.validUntil = 'Valid until date is required';
        if (!form.salesPerson) e.salesPerson = 'Sales person is required';
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
                grandTotal
            };

            if (editId) {
                await api.put(`/quotations/${editId}`, payload);
            } else {
                await api.post('/quotations', payload);
            }
            setModal(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save quotation');
        }
    };

    const handleDelete = async (id) => {
        const quotation = quotations.find(q => q._id === id);
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/quotations/${id}`);
                    fetchData();
                    setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
                } catch (err) {
                    setError(err.response?.data?.error || 'Failed to delete quotation');
                }
            },
            title: 'Delete Quotation',
            message: `Are you sure you want to delete quotation ${quotation?.quotationNumber || 'this quotation'}? This action cannot be undone.`
        });
    };

    const handleStatusChange = async (id, action) => {
        try {
            await api.post(`/quotations/${id}/${action}`);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.error || `Failed to ${action} quotation`);
        }
    };

    const handleView = (quotation) => {
        setViewQuotation(quotation);
        setViewModal(true);
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
                    <div className="d_page_title">Quotations</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Quotations</div>
                    <div className="d_page_subtitle">Manage quotations sent to customers</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Quotation</button>
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
                        <table className="d_table" style={{ minWidth: 900 }}>
                            <thead>
                                <tr>
                                    <th>Quot No.</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Valid Until</th>
                                    <th>Items</th>
                                    <th>Amount (₹)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={8}>No quotations found.</td>
                                    </tr>
                                )}
                                {filtered.map(q => (
                                    <tr key={q._id}>
                                        <td><strong>{q.quotationNumber}</strong></td>
                                        <td>{q.customer?.name || q.customer}</td>
                                        <td>{new Date(q.quotationDate).toLocaleDateString('en-IN')}</td>
                                        <td>{new Date(q.validUntil).toLocaleDateString('en-IN')}</td>
                                        <td>{q.items?.length || 0}</td>
                                        <td>{formatCurrency(q.grandTotal)}</td>
                                        <td><span className={`d_badge ${statusBadge(q.status)}`}>{q.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => handleView(q)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(q)}><MdEdit /></button>
                                                {q.status === 'Draft' && (
                                                    <button className="d_icon_btn d_info" onClick={() => handleStatusChange(q._id, 'send')} title="Send"><MdSend /></button>
                                                )}
                                                {q.status === 'Sent' && (
                                                    <>
                                                        <button className="d_icon_btn d_success" onClick={() => handleStatusChange(q._id, 'accept')} title="Accept"><MdCheck /></button>
                                                        <button className="d_icon_btn d_danger" onClick={() => handleStatusChange(q._id, 'reject')} title="Reject"><MdClose /></button>
                                                    </>
                                                )}
                                                {q.status === 'Accepted' && !q.convertedToSalesOrder && (
                                                    <button className="d_icon_btn d_primary" onClick={() => handleStatusChange(q._id, 'convert')} title="Convert to Order"><MdRefresh /></button>
                                                )}
                                                <button className="d_icon_btn d_del" onClick={() => handleDelete(q._id)}><MdDelete /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Quotation' : 'New Quotation'} size="xl">
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
                        <label className="d_form_label">Quotation Date</label>
                        <input type="date" className="d_form_control" {...f('quotationDate')} />
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Valid Until <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('validUntil')} />
                        {errors.validUntil && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.validUntil}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Sales Person <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('salesPerson')} placeholder="Enter sales person name" />
                        {errors.salesPerson && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.salesPerson}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Terms</label>
                        <select className="d_form_control" {...f('paymentTerms')}>
                            <option value="Cash">Cash</option>
                            <option value="30 Days">30 Days</option>
                            <option value="45 Days">45 Days</option>
                            <option value="60 Days">60 Days</option>
                            <option value="90 Days">90 Days</option>
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Status</label>
                        <select className="d_form_control" {...f('status')}>
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Converted">Converted</option>
                        </select>
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Delivery Terms</label>
                        <select className="d_form_control" {...f('deliveryTerms')}>
                            <option value="Immediate">Immediate</option>
                            <option value="7 Days">7 Days</option>
                            <option value="15 Days">15 Days</option>
                            <option value="30 Days">30 Days</option>
                            <option value="45 Days">45 Days</option>
                            <option value="60 Days">60 Days</option>
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
                    <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Quotation' : 'Create Quotation'}</button>
                </div>
            </Modal>

            {/* View Quotation Modal */}
            <Modal open={viewModal} onClose={() => setViewModal(false)} title="Quotation Details" size="xl">
                {viewQuotation && (
                    <div>
                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Quotation Number</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewQuotation.quotationNumber}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Status</label>
                                <span className={`d_badge ${viewQuotation.status === 'Accepted' ? 'd_success' : viewQuotation.status === 'Rejected' ? 'd_danger' : viewQuotation.status === 'Sent' ? 'd_info' : 'd_warning'}`}>
                                    {viewQuotation.status}
                                </span>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Customer</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewQuotation.customer?.name}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Company</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewQuotation.customer?.companyName || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Quotation Date</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{new Date(viewQuotation.quotationDate).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Valid Until</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', color: new Date(viewQuotation.validUntil) < new Date() ? 'var(--d-danger)' : 'var(--d-success)' }}>
                                    {new Date(viewQuotation.validUntil).toLocaleDateString('en-IN')}
                                </div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Sales Person</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewQuotation.salesPerson}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Payment Terms</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewQuotation.paymentTerms}</div>
                            </div>
                        </div>

                        {viewQuotation.billingAddress && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Billing Address</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewQuotation.billingAddress}</div>
                                </div>
                            </div>
                        )}

                        {viewQuotation.shippingAddress && viewQuotation.shippingAddress !== viewQuotation.billingAddress && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Shipping Address</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewQuotation.shippingAddress}</div>
                                </div>
                            </div>
                        )}

                        <div className="d_form_row cols-1">
                            <div className="d_form_group">
                                <label className="d_form_label">Items</label>
                                <div className="d_table_wrap" style={{ maxWidth: '100%' }}>
                                    <table className="d_table" style={{ minWidth: 720 }}>
                                        <thead>
                                            <tr>
                                                <th>Part Number</th>
                                                <th>Description</th>
                                                <th>Qty</th>
                                                <th>Rate</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewQuotation.items?.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.partNumber}</td>
                                                    <td>{item.description}</td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.rate)}</td>
                                                    <td>{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Subtotal:</span>
                                <strong>{formatCurrency(viewQuotation.subtotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Discount:</span>
                                <strong>{formatCurrency(viewQuotation.totalDiscount)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>CGST:</span>
                                <strong>{formatCurrency(viewQuotation.cgst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>SGST:</span>
                                <strong>{formatCurrency(viewQuotation.sgst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>IGST:</span>
                                <strong>{formatCurrency(viewQuotation.igst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                                <span>Grand Total:</span>
                                <strong style={{ color: 'var(--d-primary)' }}>{formatCurrency(viewQuotation.grandTotal)}</strong>
                            </div>
                        </div>

                        {viewQuotation.notes && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Notes</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewQuotation.notes}</div>
                                </div>
                            </div>
                        )}

                        {viewQuotation.terms && ( 
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Terms & Conditions</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewQuotation.terms}</div>
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
