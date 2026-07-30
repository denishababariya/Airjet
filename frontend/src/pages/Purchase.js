import React, { useState, useEffect } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdVisibility, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import { suppliersApi, erpApi } from '../utils/api';

const statusClass = { Active:'d_success', Inactive:'d_danger', Pending:'d_warning', Received:'d_success', 'In Transit':'d_info', Verified:'d_success', Partial:'d_warning', Approved:'d_success', Cancelled:'d_danger' };
const blankSup = { name: '', contact: '', phone: '', city: '', gst: '', status: 'Active' };
const blankPO  = { supplier: '', date: '', items: '', amount: '', delivery: '', status: 'Pending' };

const toISODate = (d) => {
  if (!d) return '';
  if (d.includes('-') && d.length === 10) return d;
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = d.split('-');
  if (parts.length === 3 && months[parts[1]]) return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;
  return d;
};
const blankGRN = { po: '', supplier: '', date: '', items: '', amount: '', receivedBy: '', status: 'Pending' };
const blankRet = { supplier: '', part: '', qty: '', date: '', reason: '', amount: '', status: 'Pending' };

const Purchase = ({ defaultTab = 'suppliers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [grnList, setGrnList]     = useState([]);
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankSup);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});

  const isSup = tab === 'suppliers';
  const isGRN = tab === 'grn';
  const isRet = tab === 'returns';

  const fetchSuppliers = async () => {
    try {
      const { data } = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load suppliers');
    }
  };

  const fetchGrn = async () => {
    try {
      const { data } = await erpApi.getAll('purchase', 'grn');
      setGrnList(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load GRN');
    }
  };

  const fetchReturns = async () => {
    try {
      const { data } = await erpApi.getAll('purchase', 'return');
      setReturns(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load returns');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await erpApi.getAll('purchase', 'order');
      setOrders(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchOrders(), fetchGrn(), fetchReturns()]);
      setLoading(false);
    };
    load();
  }, []);

  const openAdd = () => {
    const blank = isSup ? blankSup : isGRN ? blankGRN : isRet ? blankRet : blankPO;
    setForm(blank); setEditId(null); setErrors({}); setModal(true);
  };
  const openEdit = (row) => {
    if (isSup) setForm({ name: row.name, contact: row.contact, phone: row.phone, city: row.city, gst: row.gst, status: row.status });
    else if (isGRN) setForm({ po: row.po, supplier: row.supplier, date: toISODate(row.date), items: row.items, amount: row.amount, receivedBy: row.receivedBy, status: row.status });
    else if (isRet) setForm({ supplier: row.supplier, part: row.part, qty: row.qty, date: toISODate(row.date), reason: row.reason, amount: row.amount, status: row.status });
    else setForm({ supplier: row.supplier || '', date: toISODate(row.date), items: row.items || '', amount: row.amount || '', delivery: toISODate(row.delivery), status: row.status || 'Pending' });
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isSup) {
      if (!form.name?.trim())    e.name    = 'Supplier name is required';
      if (!form.contact?.trim()) e.contact = 'Contact person is required';
      if (!form.phone?.trim())   e.phone   = 'Phone is required';
    } else {
      if (!form.supplier?.trim()) e.supplier = 'Supplier is required';
      if (!form.date?.trim())     e.date     = 'Order date is required';
      if (!form.items)            e.items    = 'Item count is required';
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isSup) {
      try {
        if (editId) await suppliersApi.update(editId, form);
        else await suppliersApi.create(form);
        setModal(false);
        fetchSuppliers();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save supplier');
      }
    } else if (isGRN) {
      try {
        const payload = { module: 'purchase', recordType: 'grn', ...form, items: Number(form.items) || 0, amount: Number(String(form.amount).replace(/[^\d.]/g, '')) || 0 };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchGrn();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save GRN');
      }
    } else if (isRet) {
      try {
        const payload = { module: 'purchase', recordType: 'return', ...form, qty: Number(form.qty) || 0, amount: Number(String(form.amount).replace(/[^\d.]/g, '')) || 0 };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchReturns();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save return');
      }
    } else {
      const payload = {
        module: 'purchase',
        recordType: 'order',
        supplier: form.supplier || '',
        date: form.date || '',
        items: Number(form.items) || 0,
        amount: parseFloat(String(form.amount).replace(/[^\d.]/g, '')) || 0,
        delivery: form.delivery || '',
        status: form.status || 'Pending',
      };
      if (!editId) payload.id = `PO-${String(Date.now()).slice(-6)}`;
      try {
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchOrders();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save purchase order');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isSup) {
      try { await suppliersApi.remove(id); fetchSuppliers(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete supplier'); }
    } else if (isGRN) {
      try { await erpApi.remove(id); fetchGrn(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete GRN'); }
    } else if (isRet) {
      try { await erpApi.remove(id); fetchReturns(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete return'); }
    } else {
      try { await erpApi.remove(id); fetchOrders(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete purchase order'); }
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Purchase Management</h1>
          <p className="d_page_subtitle">Manage suppliers, purchase orders, GRN and returns</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'suppliers' ? 'Add Supplier' : tab === 'orders' ? 'New PO' : 'New GRN'}
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[['suppliers','Suppliers'],['orders','Purchase Orders'],['grn','GRN'],['returns','Returns']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Suppliers ({suppliers.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Supplier Name</th><th>Contact Person</th><th>Phone</th><th>City</th><th>GST No.</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s._id}>
                      <td><code>{s.id}</code></td><td><strong>{s.name}</strong></td><td>{s.contact}</td>
                      <td>{s.phone}</td><td>{s.city}</td><td><code>{s.gst}</code></td>
                      <td><span className={`d_badge ${statusClass[s.status]}`}>{s.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(s)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(s._id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Orders</h2>
          </div>
          <div className="d_card_body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {loading ? (
              <div className="text-center py-4">Loading purchase orders…</div>
            ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>PO No.</th><th>Supplier</th><th>Order Date</th><th>Items</th><th>Amount</th><th>Expected Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.length === 0 && <tr className="d_empty"><td colSpan={8}>No purchase orders found.</td></tr>}
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td><code>{o.id}</code></td><td><strong>{o.supplier || '-'}</strong></td><td>{o.date || '-'}</td>
                      <td>{o.items || '-'}</td><td><strong>₹{(o.amount || 0).toLocaleString()}</strong></td><td>{o.delivery || '-'}</td>
                      <td><span className={`d_badge ${statusClass[o.status] || 'd_info'}`}>{o.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {tab === 'grn' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Goods Receipt Notes ({grnList.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Create GRN</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>GRN No.</th><th>PO Ref.</th><th>Supplier</th><th>Date</th><th>Items</th><th>Amount</th><th>Received By</th><th>Status</th></tr></thead>
                <tbody>
                  {grnList.map(g => (
                    <tr key={g._id}>
                      <td><code>{g.id}</code></td><td><code>{g.po}</code></td><td><strong>{g.supplier}</strong></td>
                      <td>{g.date}</td><td>{g.items}</td><td><strong>₹{(g.amount||0).toLocaleString()}</strong></td><td>{g.receivedBy}</td>
                      <td><span className={`d_badge ${g.status === 'Verified' ? 'd_success' : g.status === 'Partial' ? 'd_warning' : 'd_info'}`}>{g.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'returns' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Returns ({returns.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> New Return</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Return No.</th><th>Supplier</th><th>Part</th><th>Qty</th><th>Date</th><th>Reason</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {returns.map(r => (
                    <tr key={r._id}>
                      <td><code>{r.id}</code></td><td><strong>{r.supplier}</strong></td><td>{r.part}</td>
                      <td>{r.qty}</td><td>{r.date}</td><td>{r.reason}</td><td><strong>₹{(r.amount||0).toLocaleString()}</strong></td>
                      <td><span className={`d_badge ${r.status === 'Approved' ? 'd_success' : 'd_warning'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSup && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Supplier' : 'Add Supplier'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Supplier Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Company name" {...f('name')} />
              {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Contact Person <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Contact name" {...f('contact')} />
              {errors.contact && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.contact}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Phone <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="10-digit number" {...f('phone')} />
              {errors.phone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.phone}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">City</label>
              <input className="d_form_control" placeholder="e.g. Surat" {...f('city')} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">GST Number</label>
              <input className="d_form_control" placeholder="15-digit GST No." {...f('gst')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Supplier'}</button>
          </div>
        </Modal>
      )}

      {/* PO Modal */}
      {!isSup && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Purchase Order' : 'New Purchase Order'} size="md">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
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
              <input className="d_form_control" placeholder="e.g. ₹50,000" {...f('amount')} />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>In Transit</option><option>Received</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update PO' : 'Create PO'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchase;
