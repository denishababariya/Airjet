import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdShoppingBag, MdCheck, MdClose, MdInventory, MdWarning, MdReceipt } from 'react-icons/md';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/errorMessages';

const blankOrder = {
    customer: '',
    quotation: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    warehouse: '',
    salesPerson: '',
    billingAddress: '',
    shippingAddress: '',
    paymentTerms: '30 Days',
    deliveryTerms: '',
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
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
    unit: 'Nos',
    reservedQuantity: 0
};

const statusBadge = s => {
    if (s === 'Completed') return 'd_success';
    if (s === 'Cancelled') return 'd_danger';
    if (s === 'Confirmed' || s === 'Stock Reserved') return 'd_info';
    if (s === 'Processing' || s === 'Ready for Dispatch' || s === 'Dispatched') return 'd_primary';
    if (s === 'On Hold') return 'd_warning';
    return 'd_warning';
};

const tabs = ['All', 'Draft', 'Confirmed', 'Stock Reserved', 'Processing', 'Ready for Dispatch', 'Dispatched', 'Completed', 'On Hold', 'Cancelled'];

export default function SalesOrders() {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [spareParts, setSpareParts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [modal, setModal] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [form, setForm] = useState(blankOrder);
    const [editId, setEditId] = useState(null);
    const [errors, setErrors] = useState({});
    const [creditCheck, setCreditCheck] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });
    const [stockCheck, setStockCheck] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, customersRes, quotationsRes, sparePartsRes] = await Promise.all([
                api.get('/sales-orders'),
                api.get('/customers'),
                api.get('/quotations'),
                api.get('/spare-parts')
            ]);
            setOrders(ordersRes.data || []);
            setCustomers(customersRes.data || []);
            setQuotations(quotationsRes.data || []);
            setSpareParts(sparePartsRes.data || []);
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load data'));
        } finally {
            setLoading(false);
        }
    };

    const filtered = orders.filter(r =>
        activeTab === 'All' || r.status === activeTab
    ).filter(r =>
        r.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        r.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm({ ...blankOrder });
        setEditId(null);
        setErrors({});
        setStockCheck([]);
        setCreditCheck(null);
        setViewMode(false);
        setModal(true);
    };

    const openView = (order) => {
        setForm({
            customer: order.customer?._id || order.customer,
            quotation: order.quotation?._id || order.quotation || '',
            orderDate: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            expectedDeliveryDate: order.expectedDeliveryDate?.split('T')[0] || '',
            warehouse: order.warehouse || '',
            salesPerson: order.salesPerson || '',
            billingAddress: order.billingAddress || '',
            shippingAddress: order.shippingAddress || '',
            paymentTerms: order.paymentTerms || '30 Days',
            deliveryTerms: order.deliveryTerms || '',
            items: order.items || [],
            subtotal: order.subtotal || 0,
            totalDiscount: order.totalDiscount || 0,
            taxableAmount: order.taxableAmount || 0,
            cgst: order.cgst || 0,
            sgst: order.sgst || 0,
            igst: order.igst || 0,
            grandTotal: order.grandTotal || 0,
            status: order.status || 'Pending',
            notes: order.notes || '',
            terms: order.terms || ''
        });
        setEditId(order._id);
        setErrors({});
        setStockCheck([]);
        setCreditCheck(null);
        setViewMode(true);
        setModal(true);
    };

    const handleViewModal = (order) => {
        setViewOrder(order);
        setViewModal(true);
    };

    const openEdit = (order) => {
        setForm({
            customer: order.customer?._id || order.customer,
            quotation: order.quotation?._id || order.quotation || '',
            orderDate: order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            expectedDeliveryDate: order.expectedDeliveryDate?.split('T')[0] || '',
            warehouse: order.warehouse || '',
            salesPerson: order.salesPerson || '',
            billingAddress: order.billingAddress || '',
            shippingAddress: order.shippingAddress || '',
            paymentTerms: order.paymentTerms || '30 Days',
            deliveryTerms: order.deliveryTerms || '',
            items: order.items || [],
            subtotal: order.subtotal || 0,
            totalDiscount: order.totalDiscount || 0,
            taxableAmount: order.taxableAmount || 0,
            cgst: order.cgst || 0,
            sgst: order.sgst || 0,
            igst: order.igst || 0,
            grandTotal: order.grandTotal || 0,
            status: order.status || 'Pending',
            notes: order.notes || '',
            terms: order.terms || ''
        });
        setEditId(order._id);
        setErrors({});
        setStockCheck([]);
        setCreditCheck(null);
        setViewMode(false);
        setModal(true);
    };

    const handleQuotationSelect = (quotationId) => {
        const quotation = quotations.find(q => q._id === quotationId);
        if (quotation) {
            setForm(p => ({
                ...p,
                customer: quotation.customer._id,
                quotation: quotationId,
                billingAddress: quotation.billingAddress || '',
                shippingAddress: quotation.shippingAddress || '',
                paymentTerms: quotation.paymentTerms || '30 Days',
                deliveryTerms: quotation.deliveryTerms || '',
                items: quotation.items.map(item => ({
                    sparePart: item.sparePart,
                    quantity: item.quantity,
                    rate: item.rate,
                    discount: item.discount,
                    gstRate: item.gstRate,
                    unit: item.unit || 'Nos',
                    reservedQuantity: 0
                })),
                notes: quotation.notes || '',
                terms: quotation.terms || ''
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

    const checkStockAvailability = async () => {
        if (!form.customer || form.items.length === 0) {
            alert('Please add items and select a customer first');
            return;
        }

        const stockCheckData = form.items.map(item => {
            const part = spareParts.find(s => s._id === item.sparePart);
            return {
                sparePartId: item.sparePart,
                partNumber: part?.partNumber,
                partName: part?.partName,
                requiredQty: item.quantity,
                availableQty: part?.quantity || 0,
                isAvailable: (part?.quantity || 0) >= item.quantity
            };
        });
        setStockCheck(stockCheckData);
    };

    const checkCreditLimit = async () => {
        if (!form.customer) {
            alert('Please select a customer first');
            return;
        }

        const customer = customers.find(c => c._id === form.customer);
        if (!customer) {
            alert('Customer not found');
            return;
        }

        const currentBalance = customer.currentBalance || 0;
        const creditLimit = customer.creditLimit || 0;
        const orderAmount = grandTotal;
        const newBalance = currentBalance + orderAmount;
        const exceeded = newBalance > creditLimit;

        const creditCheckData = {
            currentBalance,
            creditLimit,
            orderAmount,
            newBalance,
            exceeded,
            availableCredit: creditLimit - currentBalance
        };

        setCreditCheck(creditCheckData);

        const message = exceeded
            ? `CREDIT LIMIT EXCEEDED!\n\nCurrent Balance: ${formatCurrency(currentBalance)}\nCredit Limit: ${formatCurrency(creditLimit)}\nOrder Amount: ${formatCurrency(orderAmount)}\nNew Balance: ${formatCurrency(newBalance)}\nAvailable Credit: ${formatCurrency(creditLimit - currentBalance)}\n\nThis order may require approval.`
            : `Credit Limit Check: OK\n\nCurrent Balance: ${formatCurrency(currentBalance)}\nCredit Limit: ${formatCurrency(creditLimit)}\nOrder Amount: ${formatCurrency(orderAmount)}\nNew Balance: ${formatCurrency(newBalance)}\nAvailable Credit: ${formatCurrency(creditLimit - currentBalance)}`;

        alert(message);
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
        if (!form.orderDate) e.orderDate = 'Order date is required';
        if (!form.expectedDeliveryDate) e.expectedDeliveryDate = 'Expected delivery date is required';
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

            let response;
            if (editId) {
                response = await api.put(`/sales-orders/${editId}`, payload);
            } else {
                response = await api.post('/sales-orders', payload);
            }
            
            // Handle credit check warning
            if (response.data.creditCheck && response.data.creditCheck.exceeded) {
                setCreditCheck(response.data.creditCheck);
                // Still allow saving but show warning
                alert(`WARNING: Credit limit exceeded!\n\nCurrent Balance: ${formatCurrency(response.data.creditCheck.currentBalance)}\nCredit Limit: ${formatCurrency(response.data.creditCheck.creditLimit)}\nNew Balance: ${formatCurrency(response.data.creditCheck.newBalance)}\n\nOrder saved but may require approval.`);
            } else {
                setCreditCheck(null);
            }
            
            setModal(false);
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to save sales order'));
        }
    };

    const handleDelete = async (id) => {
        const order = orders.find(o => o._id === id);
        setConfirmModal({
            open: true,
            onConfirm: async () => {
                try {
                    await api.delete(`/sales-orders/${id}`);
                    fetchData();
                    setConfirmModal({ open: false, onConfirm: null, title: '', message: '' });
                } catch (err) {
                    setError(getErrorMessage(err, 'Failed to delete sales order'));
                }
            },
            title: 'Delete Sales Order',
            message: `Are you sure you want to delete sales order ${order?.orderNumber || 'this order'}? This action cannot be undone.`
        });
    };

    const handleStatusChange = async (id, action) => {
        try {
            await api.post(`/sales-orders/${id}/${action}`);
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err, `Failed to ${action} sales order`));
        }
    };

    const handleGenerateInvoice = async (salesOrder) => {
        try {
            const customer = customers.find(c => c._id === salesOrder.customer._id);
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (customer?.creditDays || 30));

            const invoicePayload = {
                customer: salesOrder.customer._id,
                salesOrder: salesOrder._id,
                invoiceDate: new Date().toISOString().split('T')[0],
                dueDate: dueDate.toISOString().split('T')[0],
                billingAddress: salesOrder.billingAddress || customer?.billingAddress || '',
                shippingAddress: salesOrder.shippingAddress || customer?.shippingAddress || '',
                paymentTerms: salesOrder.paymentTerms || customer?.paymentTerms || '30 Days',
                items: salesOrder.items.map(item => ({
                    sparePart: item.sparePart._id || item.sparePart,
                    quantity: item.quantity,
                    rate: item.rate,
                    discount: item.discount,
                    gstRate: item.gstRate
                }))
            };

            await api.post('/invoices', invoicePayload);
            alert(`Invoice generated successfully for Sales Order ${salesOrder.orderNumber}`);
            fetchData();
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to generate invoice'));
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
                    <div className="d_page_title">Sales Orders</div>
                    <div className="d_page_subtitle">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                    <div className="d_page_title">Sales Orders</div>
                    <div className="d_page_subtitle">Manage customer sales orders with stock reservation</div>
                </div>
                <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Sales Order</button>
            </div>

            {error && <div style={{ padding: '12px', background: '#fee', color: '#c33', marginBottom: '16px', borderRadius: '4px' }}>{error}</div>}

            <div className="d_card">
                <div className="d_card_header">
                    <div className="d_tabs">
                        {tabs.map(t => (
                            <button key={t} className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
                        ))}
                    </div>
                    <div className="d_search_box">
                        <span className="d_search_icon"><MdSearch /></span>
                        <input className="d_search_input" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="d_card_body">
                    <div className="d_table_wrap">
                        <table className="d_table" style={{ minWidth: 1000 }}>
                            <thead>
                                <tr>
                                    <th>SO No.</th>
                                    <th>Customer</th>
                                    <th>Order Date</th>
                                    <th>Expected Delivery</th>
                                    <th>Items</th>
                                    <th>Total (₹)</th>
                                    <th>Stock Reserved</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 && (
                                    <tr className="d_empty">
                                        <td colSpan={9}>No sales orders found.</td>
                                    </tr>
                                )}
                                {filtered.map(r => (
                                    <tr key={r._id}>
                                        <td><strong>{r.orderNumber}</strong></td>
                                        <td>{r.customer?.name || r.customer}</td>
                                        <td>{new Date(r.orderDate).toLocaleDateString('en-IN')}</td>
                                        <td>{r.expectedDeliveryDate ? new Date(r.expectedDeliveryDate).toLocaleDateString('en-IN') : '-'}</td>
                                        <td>{r.items?.length || 0}</td>
                                        <td>{formatCurrency(r.grandTotal)}</td>
                                        <td>{r.stockReserved ? <span className="d_badge d_success">Yes</span> : <span className="d_badge d_warning">No</span>}</td>
                                        <td><span className={`d_badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                                        <td>
                                            <div className="d_action_btns">
                                                <button className="d_icon_btn d_view" onClick={() => handleViewModal(r)}><MdVisibility /></button>
                                                <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
                                                {r.status === 'Draft' && (
                                                    <>
                                                        <button className="d_icon_btn d_success" onClick={() => handleStatusChange(r._id, 'confirm')} title="Confirm"><MdCheck /></button>
                                                        <button className="d_icon_btn d_danger" onClick={() => handleStatusChange(r._id, 'cancel')} title="Cancel"><MdClose /></button>
                                                    </>
                                                )}
                                                {r.status === 'Confirmed' && !r.stockReserved && (
                                                    <button className="d_icon_btn d_info" onClick={() => handleStatusChange(r._id, 'reserve-stock')} title="Reserve Stock"><MdInventory /></button>
                                                )}
                                                {(r.status === 'Confirmed' || r.status === 'Stock Reserved') && !r.invoiceGenerated && (
                                                    <button className="d_icon_btn d_primary" onClick={() => handleGenerateInvoice(r)} title="Generate Invoice"><MdReceipt /></button>
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

            <Modal open={modal} onClose={() => setModal(false)} title={viewMode ? 'View Sales Order' : (editId ? 'Edit Sales Order' : 'New Sales Order')} size="xl">
                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Quotation (Optional)</label>
                        <select className="d_form_control" {...f('quotation')} disabled={viewMode} onChange={(e) => {
                            f('quotation').onChange(e);
                            if (e.target.value) handleQuotationSelect(e.target.value);
                        }}>
                            <option value="">Select Quotation</option>
                            {quotations.map(q => (
                                <option key={q._id} value={q._id}>{q.quotationNumber} - {q.customer?.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Customer <span className="d_req">*</span></label>
                        <select className="d_form_control" {...f('customer')} disabled={viewMode}>
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
                        <label className="d_form_label">Order Date <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('orderDate')} disabled={viewMode} />
                        {errors.orderDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.orderDate}</span>}
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Expected Delivery <span className="d_req">*</span></label>
                        <input type="date" className="d_form_control" {...f('expectedDeliveryDate')} min={form.orderDate} disabled={viewMode} />
                        {errors.expectedDeliveryDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.expectedDeliveryDate}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Warehouse</label>
                        <select className="d_form_control" {...f('warehouse')} disabled={viewMode}>
                            <option value="">Select Warehouse</option>
                            <option value="Main Warehouse">Main Warehouse</option>
                            <option value="Store A">Store A</option>
                            <option value="Store B">Store B</option>
                        </select>
                    </div>
                    <div className="d_form_group">
                        <label className="d_form_label">Sales Person <span className="d_req">*</span></label>
                        <input className="d_form_control" {...f('salesPerson')} placeholder="Enter sales person name" disabled={viewMode} />
                        {errors.salesPerson && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.salesPerson}</span>}
                    </div>
                </div>

                <div className="d_form_row cols-2">
                    <div className="d_form_group">
                        <label className="d_form_label">Payment Terms</label>
                        <select className="d_form_control" {...f('paymentTerms')} disabled={viewMode}>
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
                        <select className="d_form_control" {...f('status')} disabled={viewMode}>
                            <option value="Draft">Draft</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Stock Reserved">Stock Reserved</option>
                            <option value="Processing">Processing</option>
                            <option value="Ready for Dispatch">Ready for Dispatch</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
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
                        <table className="d_table" style={{ minWidth: 900 }}>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th>Qty</th>
                                    <th>Rate (₹)</th>
                                    <th>Discount (₹)</th>
                                    <th>GST %</th>
                                    <th>Total (₹)</th>
                                    {!viewMode && <th>Action</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {form.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>
                                            {viewMode ? (
                                                <span>{spareParts.find(s => s._id === item.sparePart)?.partNumber || item.sparePart} - {spareParts.find(s => s._id === item.sparePart)?.partName || ''}</span>
                                            ) : (
                                                <select
                                                    className="d_form_control"
                                                    value={item.sparePart}
                                                    onChange={(e) => updateItem(index, 'sparePart', e.target.value)}
                                                >
                                                    {spareParts.map(s => (
                                                        <option key={s._id} value={s._id}>{s.partNumber} - {s.partName} (Stock: {s.quantity})</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td>
                                            {viewMode ? (
                                                <span>{item.quantity}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    className="d_form_control"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    min="1"
                                                    style={{ width: '80px' }}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            {viewMode ? (
                                                <span>{formatCurrency(item.rate)}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    className="d_form_control"
                                                    value={item.rate}
                                                    onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    style={{ width: '100px' }}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            {viewMode ? (
                                                <span>{formatCurrency(item.discount)}</span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    className="d_form_control"
                                                    value={item.discount}
                                                    onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    style={{ width: '80px' }}
                                                />
                                            )}
                                        </td>
                                        <td>
                                            {viewMode ? (
                                                <span>{item.gstRate}%</span>
                                            ) : (
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
                                            )}
                                        </td>
                                        <td>{formatCurrency(
                                            ((item.quantity * item.rate - item.discount) * (1 + item.gstRate / 100))
                                        )}</td>
                                        {!viewMode && (
                                            <td>
                                                <button className="d_icon_btn d_delete" onClick={() => removeItem(index)}><MdDelete /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!viewMode && (
                    <>
                        <button className="d_btn d_btn_outline" onClick={addItem} style={{ marginBottom: '15px' }}><MdAdd /> Add Item</button>
                        <button className="d_btn d_btn_info" onClick={checkStockAvailability} style={{ marginBottom: '15px', marginLeft: '10px' }}><MdInventory /> Check Stock Availability</button>
                        <button className="d_btn d_btn_warning" onClick={checkCreditLimit} style={{ marginBottom: '15px', marginLeft: '10px' }}><MdWarning /> Check Credit Limit</button>
                    </>
                )}

                {stockCheck.length > 0 && (
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <strong>Stock Availability:</strong>
                        <table className="d_table" style={{ marginTop: '10px' }}>
                            <thead>
                                <tr>
                                    <th>Part</th>
                                    <th>Required</th>
                                    <th>Available</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockCheck.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.partNumber} - {item.partName}</td>
                                        <td>{item.requiredQty}</td>
                                        <td>{item.availableQty}</td>
                                        <td>
                                            <span className={`d_badge ${item.isAvailable ? 'd_success' : 'd_danger'}`}>
                                                {item.isAvailable ? 'Available' : 'Shortage'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {creditCheck && (
                    <div style={{ background: creditCheck.exceeded ? '#fff3cd' : '#d4edda', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: `1px solid ${creditCheck.exceeded ? '#ffc107' : '#28a745'}` }}>
                        <strong style={{ color: creditCheck.exceeded ? '#856404' : '#155724' }}>Credit Limit Check:</strong>
                        <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            <div>Current Balance: <strong>{formatCurrency(creditCheck.currentBalance)}</strong></div>
                            <div>Credit Limit: <strong>{formatCurrency(creditCheck.creditLimit)}</strong></div>
                            <div>Order Amount: <strong>{formatCurrency(creditCheck.orderAmount)}</strong></div>
                            <div>New Balance: <strong>{formatCurrency(creditCheck.newBalance)}</strong></div>
                            <div>Available Credit: <strong>{formatCurrency(creditCheck.availableCredit)}</strong></div>
                            <div>
                                Status: <span className={`d_badge ${creditCheck.exceeded ? 'd_danger' : 'd_success'}`}>
                                    {creditCheck.exceeded ? 'EXCEEDED' : 'OK'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

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
                        <textarea className="d_form_control" rows="2" {...f('notes')} disabled={viewMode} />
                    </div>
                </div>

                <div className="d_form_row cols-1">
                    <div className="d_form_group">
                        <label className="d_form_label">Terms & Conditions</label>
                        <textarea className="d_form_control" rows="2" {...f('terms')} disabled={viewMode} />
                    </div>
                </div>

                <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    {!viewMode && <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Sales Order' : 'Create Sales Order'}</button>}
                </div>
            </Modal>

            {/* View Sales Order Modal */}
            <Modal open={viewModal} onClose={() => setViewModal(false)} title="Sales Order Details" size="xl">
                {viewOrder && (
                    <div>
                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Order Number</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewOrder.orderNumber}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Status</label>
                                <span className={`d_badge ${statusBadge(viewOrder.status)}`}>{viewOrder.status}</span>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Customer</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewOrder.customer?.name}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Quotation</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewOrder.quotation?.quotationNumber || '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Order Date</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{new Date(viewOrder.orderDate).toLocaleDateString('en-IN')}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Expected Delivery</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewOrder.expectedDeliveryDate ? new Date(viewOrder.expectedDeliveryDate).toLocaleDateString('en-IN') : '-'}</div>
                            </div>
                        </div>

                        <div className="d_form_row cols-2">
                            <div className="d_form_group">
                                <label className="d_form_label">Sales Person</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewOrder.salesPerson}</div>
                            </div>
                            <div className="d_form_group">
                                <label className="d_form_label">Payment Terms</label>
                                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewOrder.paymentTerms}</div>
                            </div>
                        </div>

                        {viewOrder.billingAddress && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Billing Address</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewOrder.billingAddress}</div>
                                </div>
                            </div>
                        )}

                        {viewOrder.shippingAddress && viewOrder.shippingAddress !== viewOrder.billingAddress && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Shipping Address</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewOrder.shippingAddress}</div>
                                </div>
                            </div>
                        )}

                        <div className="d_form_row cols-1">
                            <div className="d_form_group">
                                <label className="d_form_label">Items</label>
                                <table className="d_table">
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
                                        {viewOrder.items?.map((item, index) => (
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

                        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Subtotal:</span>
                                <strong>{formatCurrency(viewOrder.subtotal)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>Discount:</span>
                                <strong>{formatCurrency(viewOrder.totalDiscount)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>CGST:</span>
                                <strong>{formatCurrency(viewOrder.cgst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>SGST:</span>
                                <strong>{formatCurrency(viewOrder.sgst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span>IGST:</span>
                                <strong>{formatCurrency(viewOrder.igst)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em', borderTop: '1px solid #ddd', paddingTop: '10px', marginTop: '10px' }}>
                                <span>Grand Total:</span>
                                <strong style={{ color: 'var(--d-primary)' }}>{formatCurrency(viewOrder.grandTotal)}</strong>
                            </div>
                        </div>

                        {viewOrder.notes && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Notes</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewOrder.notes}</div>
                                </div>
                            </div>
                        )}

                        {viewOrder.terms && (
                            <div className="d_form_row cols-1">
                                <div className="d_form_group">
                                    <label className="d_form_label">Terms & Conditions</label>
                                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewOrder.terms}</div>
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
