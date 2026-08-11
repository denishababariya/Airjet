import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdShoppingBag, MdDelete } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';
import api from '../../utils/api';

const blank = {
  so: '',
  customer: '',
  orderDate: new Date().toISOString().split('T')[0],
  delivery: '',
  items: [],
  payment: 'Pending',
  deliveryStatus: 'Processing',
  warrantyMonths: 3,
  warrantyExpiryDate: '',
  warrantyStatus: 'Active',
  invoiceNo: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  gstRate: 18,
  totalAmount: 0,
  grandTotal: 0
};

const checkWarrantyStatus = (warrantyExpiryDate) => {
  if (!warrantyExpiryDate) return { status: 'Active', isValid: true };
  const today = new Date();
  const expiry = new Date(warrantyExpiryDate);
  const isValid = today <= expiry;
  return { status: isValid ? 'Active' : 'Expired', isValid };
};

export default function SalesOrders() {
  const { data, loading, error, setError, save, remove } = useErpRecords('sales', 'order');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [stockItems, setStockItems] = useState([]);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const response = await api.get('/stock');
        setStockItems(response.data || []);
      } catch (err) {
        console.error('Failed to fetch stock items:', err);
      }
    };
    fetchStockItems();
  }, []);

  const addItem = () => {
    if (stockItems.length === 0) {
      alert('No stock items available. Please add stock items first.');
      return;
    }
    setForm(p => ({
      ...p,
      items: [...p.items, {
        itemCode: stockItems[0].itemCode,
        itemName: stockItems[0].itemName,
        quantity: 1,
        unitPrice: stockItems[0].unitPrice,
        totalPrice: stockItems[0].unitPrice,
        stockId: stockItems[0]._id
      }]
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

    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    if (field === 'itemCode') {
      const selectedItem = stockItems.find(s => s.itemCode === value);
      if (selectedItem) {
        updatedItems[index].itemName = selectedItem.itemName;
        updatedItems[index].unitPrice = selectedItem.unitPrice;
        updatedItems[index].totalPrice = updatedItems[index].quantity * selectedItem.unitPrice;
        updatedItems[index].stockId = selectedItem._id;
      }
    }

    setForm(p => ({ ...p, items: updatedItems }));
  };

  const calculateTotals = () => {
    const totalAmount = form.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const gstAmount = totalAmount * (form.gstRate / 100);
    const grandTotal = totalAmount + gstAmount;
    return { totalAmount, gstAmount, grandTotal };
  };

  const { totalAmount, gstAmount, grandTotal } = calculateTotals();

  const openAdd = () => {
    setForm({ ...blank });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (o) => {
    const { status: warrantyStatus } = checkWarrantyStatus(o.warrantyExpiryDate);
    setForm({
      so: o.so || '',
      customer: o.customer || '',
      orderDate: o.orderDate || new Date().toISOString().split('T')[0],
      delivery: o.delivery || '',
      items: o.items || [],
      payment: o.payment || 'Pending',
      deliveryStatus: o.deliveryStatus || 'Processing',
      warrantyMonths: o.warrantyMonths || 3,
      warrantyExpiryDate: o.warrantyExpiryDate || '',
      warrantyStatus: warrantyStatus,
      invoiceNo: o.invoiceNo || '',
      invoiceDate: o.invoiceDate || new Date().toISOString().split('T')[0],
      gstRate: o.gstRate || 18,
      totalAmount: o.totalAmount || 0,
      grandTotal: o.grandTotal || 0
    });
    setEditId(o._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = 'Customer is required';
    if (!form.delivery) e.delivery = 'Delivery date is required';
    if (!form.items || form.items.length === 0) e.items = 'At least one item is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const { totalAmount, gstAmount, grandTotal } = calculateTotals();
      const payload = {
        ...form,
        totalAmount,
        gstAmount,
        grandTotal,
        cgstAmount: gstAmount / 2,
        sgstAmount: gstAmount / 2
      };
      await save(payload, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save order');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const payBadge = s => {
    if (s === 'Paid') return 'd_success';
    if (s === 'Pending') return 'd_danger';
    return 'd_warning';
  };

  const delivBadge = s => {
    if (s === 'Delivered') return 'd_success';
    if (s === 'Dispatched') return 'd_info';
    return 'd_warning';
  };

  const warrantyBadge = s => {
    if (s === 'Active') return 'd_success';
    if (s === 'Expired') return 'd_danger';
    return 'd_warning';
  };

  const generateSO = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `SO-${year}${month}-${random}`;
  };

  const calculateWarrantyExpiry = (deliveryDate, months) => {
    if (!deliveryDate || !months) return '';
    const date = new Date(deliveryDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().split('T')[0];
  };

  const handleDeliveryDateChange = (value) => {
    const expiryDate = calculateWarrantyExpiry(value, form.warrantyMonths);
    const { status: warrantyStatus } = checkWarrantyStatus(expiryDate);
    setForm(p => ({
      ...p,
      delivery: value,
      warrantyExpiryDate: expiryDate,
      warrantyStatus
    }));
  };

  const handleWarrantyMonthsChange = (value) => {
    const expiryDate = calculateWarrantyExpiry(form.delivery, value);
    const { status: warrantyStatus } = checkWarrantyStatus(expiryDate);
    setForm(p => ({
      ...p,
      warrantyMonths: value,
      warrantyExpiryDate: expiryDate,
      warrantyStatus
    }));
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Sales Orders</h1>
          <p className="d_page_subtitle">Track all customer sales orders with warranty</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Sales Order</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdShoppingBag /></span>Sales Orders List ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading orders…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1100 }}>
                <thead>
                  <tr>
                    <th>SO Number</th>
                    <th>Customer</th>
                    <th>Order Date</th>
                    <th>Delivery Date</th>
                    <th>Items</th>
                    <th>Total Amount (₹)</th>
                    <th>Payment</th>
                    <th>Delivery Status</th>
                    <th>Warranty</th>
                    <th>Warranty Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={11}>No sales orders found.</td></tr>}
                  {data.map(o => (
                    <tr key={o._id}>
                      <td><strong>{o.so}</strong></td>
                      <td>{o.customer}</td>
                      <td>{o.orderDate}</td>
                      <td>{o.delivery}</td>
                      <td>{Array.isArray(o.items) ? o.items.length : 0}</td>
                      <td>₹{(o.grandTotal || 0).toLocaleString('en-IN')}</td>
                      <td><span className={`d_badge ${payBadge(o.payment)}`}>{o.payment}</span></td>
                      <td><span className={`d_badge ${delivBadge(o.deliveryStatus)}`}>{o.deliveryStatus}</span></td>
                      <td><span className={`d_badge ${warrantyBadge(o.warrantyStatus)}`}>{o.warrantyStatus}</span></td>
                      <td>{o.warrantyExpiryDate || '-'}</td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Sales Order' : 'New Sales Order'} size="xl">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">SO Number</label>
            <input className="d_form_control" value={form.so || generateSO()} disabled style={{ background: '#f5f5f5' }} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Customer <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Customer name" {...f('customer')} />
            {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Order Date</label>
            <input type="date" className="d_form_control" {...f('orderDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Delivery Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" value={form.delivery} onChange={(e) => { handleDeliveryDateChange(e.target.value); setErrors(p => ({ ...p, delivery: '' })); }} />
            {errors.delivery && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.delivery}</span>}
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
            <table className="d_table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price (₹)</th>
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
                        value={item.itemCode}
                        onChange={(e) => updateItem(index, 'itemCode', e.target.value)}
                      >
                        {stockItems.map(s => (
                          <option key={s._id} value={s.itemCode}>{String(s.itemCode)} - {String(s.itemName)} (Stock: {String(s.quantity)})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="d_form_control"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="d_form_control"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </td>
                    <td>₹{item.totalPrice.toLocaleString('en-IN')}</td>
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
            <strong>₹{totalAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>GST ({form.gstRate}%):</span>
            <strong>₹{gstAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1em' }}>
            <span>Grand Total:</span>
            <strong style={{ color: 'var(--d-primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Payment Status</label>
            <select className="d_form_control" {...f('payment')}>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Delivery Status</label>
            <select className="d_form_control" {...f('deliveryStatus')}>
              <option value="Processing">Processing</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Months</label>
            <input type="number" className="d_form_control" placeholder="3" value={form.warrantyMonths} onChange={(e) => { handleWarrantyMonthsChange(e.target.value); }} />
            <small style={{ color: '#666' }}>Warranty starts from delivery date</small>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty Expiry Date</label>
            <input type="date" className="d_form_control" value={form.warrantyExpiryDate} disabled style={{ background: '#f5f5f5' }} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Order' : 'Create Order'}</button>
        </div>
      </Modal>
    </div>
  );
}
