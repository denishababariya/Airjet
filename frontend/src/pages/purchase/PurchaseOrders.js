import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdDelete, MdShoppingCart } from 'react-icons/md';
import Modal from '../../components/Modal';
import { erpApi, suppliersApi } from '../../utils/api';

const statusBadge = s => {
  if (s === 'Received') return 'd_success';
  if (s === 'Cancelled') return 'd_danger';
  if (s === 'In Transit') return 'd_info';
  return 'd_warning';
};

const tabs = ['All', 'Pending', 'In Transit', 'Received', 'Cancelled'];

const blankPO = { supplier: '', date: '', items: '', amount: '', delivery: '', status: 'Pending' };

const toISODate = (d) => {
  if (!d) return '';
  if (d.includes('-') && d.length === 10) return d; // already ISO
  // DD-Mon-YYYY → YYYY-MM-DD
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = d.split('-');
  if (parts.length === 3 && months[parts[1]]) return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;
  return d;
};

export default function PurchaseOrders() {
  const [activeTab, setActiveTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankPO);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await erpApi.getAll('purchase', 'order');
      setOrders(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (err) {
      // suppliers are optional for PO creation
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchSuppliers()]);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeTab === 'All' ? orders : orders.filter(o => o.status === activeTab);

  const openAdd = () => {
    setForm(blankPO);
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (row) => {
    setForm({
      supplier: row.supplier || '',
      date: toISODate(row.date),
      items: row.items || '',
      amount: row.amount || '',
      delivery: toISODate(row.delivery),
      status: row.status || 'Pending',
    });
    setEditId(row._id || row.id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.supplier?.trim()) e.supplier = 'Supplier is required';
    if (!form.date?.trim()) e.date = 'Order date is required';
    if (!form.items && form.items !== 0) e.items = 'Items count is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const payload = {
      module: 'purchase',
      recordType: 'order',
      supplier: form.supplier.trim(),
      date: form.date,
      items: Number(form.items) || 0,
      amount: parseFloat(String(form.amount).replace(/[^\d.]/g, '')) || 0,
      delivery: form.delivery || '',
      status: form.status,
    };

    try {
      if (editId) {
        await erpApi.update(editId, payload);
      } else {
        payload.id = `PO-${String(Date.now()).slice(-6)}`;
        await erpApi.create(payload);
      }
      setModal(false);
      fetchOrders();
    } catch (err) {
      setError(err.displayMessage || 'Failed to save purchase order');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await erpApi.remove(id);
      fetchOrders();
    } catch (err) {
      setError(err.displayMessage || 'Failed to delete purchase order');
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      setErrors(p => ({ ...p, [field]: '' }));
    },
  });

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Purchase Orders</div>
          <div className="d_page_subtitle">Manage purchase orders for airjet loom spare parts</div>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> New PO
        </button>
      </div>

      {error && <div className="alert alert-danger m-3">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_tabs">
            {tabs.map(t => (
              <button
                key={t}
                className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading purchase orders…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 750 }}>
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Supplier</th>
                    <th>Order Date</th>
                    <th>Items Count</th>
                    <th>Total Amount (₹)</th>
                    <th>Expected Delivery</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr className="d_empty"><td colSpan={8}>No purchase orders found.</td></tr>
                  )}
                  {filtered.map(o => (
                    <tr key={o._id || o.id}>
                      <td><strong>{o.id || o.po}</strong></td>
                      <td>{o.supplier || '-'}</td>
                      <td>{o.date || '-'}</td>
                      <td>{o.items ?? '-'}</td>
                      <td>₹{(o.amount || 0).toLocaleString('en-IN')}</td>
                      <td>{o.delivery || '-'}</td>
                      <td>
                        <span className={`d_badge ${statusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                          <button className="d_icon_btn d_del" onClick={() => handleDelete(o._id || o.id)}><MdDelete /></button>
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

      {/* Add / Edit PO Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Purchase Order' : 'New Purchase Order'} size="md">
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Supplier <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('supplier')}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
            {errors.supplier && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.supplier}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Order Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('date')} />
            {errors.date && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.date}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Expected Delivery</label>
            <input type="date" className="d_form_control" {...f('delivery')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">No. of Items <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="e.g. 10" {...f('items')} />
            {errors.items && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.items}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Total Amount (₹)</label>
            <input className="d_form_control" placeholder="e.g. 50000" {...f('amount')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Received</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>
            {editId ? 'Update PO' : 'Create PO'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
