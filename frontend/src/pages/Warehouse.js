import React, { useState, useEffect } from 'react';
import { MdWarehouse, MdAdd, MdEdit, MdDelete, MdSwapHoriz, MdFactCheck } from 'react-icons/md';
import Modal from '../components/Modal';
import { stockApi, erpApi } from '../utils/api';

const statusClass = { Active:'d_success', Completed:'d_success', 'In Transit':'d_info', Pending:'d_warning', Inactive:'d_danger' };
const blankWH  = { name: '', location: '', capacity: '', manager: '', status: 'Active' };
const blankTRF = { from: '', to: '', part: '', qty: '', date: '', status: 'Pending' };
const blankAUD = { location: '', date: '', items: '', status: 'Pending', notes: '' };

const Warehouse = ({ defaultTab = 'warehouses' }) => {
  const [tab, setTab]                   = useState(defaultTab);
  const [warehouses, setWarehouses]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [transfers, setTransfers]       = useState([]);
  const [audits, setAudits]             = useState([]);
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(blankWH);
  const [editId, setEditId]             = useState(null);
  const [errors, setErrors]             = useState({});

  const isWH = tab === 'warehouses';
  const isTRF = tab === 'transfers';
  const isAUD = tab === 'audits';

  const fetchStock = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await stockApi.getAll();
      setWarehouses(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const { data } = await erpApi.getAll('warehouse', 'transfer');
      setTransfers(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load transfers');
    }
  };

  const fetchAudits = async () => {
    try {
      const { data } = await erpApi.getAll('warehouse', 'audit');
      setAudits(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load audits');
    }
  };

  useEffect(() => {
    fetchStock();
    fetchTransfers();
    fetchAudits();
  }, []);

  const openAdd = () => {
    const blank = isWH ? blankWH : isAUD ? blankAUD : blankTRF;
    setForm(blank); setEditId(null); setErrors({}); setModal(true);
  };
  const openEdit = (row) => {
    if (isWH) setForm({ name: row.itemName, location: row.location || '', capacity: row.quantity || 0, manager: row.supplier || '', status: 'Active' });
    else if (isAUD) setForm({ location: row.location, date: row.date, items: row.items, status: row.status, notes: row.notes || '' });
    else setForm({ from: row.from, to: row.to, part: row.part, qty: row.qty, date: row.date, status: row.status });
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isWH) {
      if (!form.name?.trim())     e.name     = 'Item name is required';
      if (!form.location?.trim()) e.location = 'Location is required';
      if (!form.manager?.trim())  e.manager  = 'Supplier is required';
    } else {
      if (!form.from?.trim()) e.from = 'From warehouse is required';
      if (!form.to?.trim())   e.to   = 'To warehouse is required';
      if (!form.part?.trim()) e.part = 'Part name is required';
      if (!form.qty)          e.qty  = 'Quantity is required';
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isWH) {
      const capacity = parseInt(form.capacity) || 0;
      const payload = {
        id: `STK${String(Date.now()).slice(-6)}`,
        itemName: form.name,
        itemCode: `IC-${String(Date.now()).slice(-4)}`,
        category: 'General',
        quantity: capacity,
        unit: 'pieces',
        unitPrice: 0,
        location: form.location,
        supplier: form.manager,
        minimumStock: 0,
        description: '',
      };
      try {
        if (editId) await stockApi.update(editId, payload);
        else await stockApi.create(payload);
        setModal(false);
        fetchStock();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save stock item');
      }
    } else if (isTRF) {
      try {
        const payload = { module: 'warehouse', recordType: 'transfer', ...form, qty: Number(form.qty) || 0 };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchTransfers();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save transfer');
      }
    } else if (isAUD) {
      try {
        const payload = { module: 'warehouse', recordType: 'audit', ...form, items: Number(form.items) || 0 };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchAudits();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save audit');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isWH) {
      try { await stockApi.remove(id); fetchStock(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete stock item'); }
    } else if (isTRF) {
      try { await erpApi.remove(id); fetchTransfers(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete transfer'); }
    } else if (isAUD) {
      try { await erpApi.remove(id); fetchAudits(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete audit'); }
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
          <h1 className="d_page_title">Warehouse Management</h1>
          <p className="d_page_subtitle">Manage warehouses, stock transfers and audits</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'warehouses' ? 'Add Warehouse' : tab === 'transfers' ? 'New Transfer' : 'Schedule Audit'}
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[['warehouses','Warehouses'],['transfers','Stock Transfers'],['audits','Stock Audits']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'warehouses' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdWarehouse className="d_card_icon" /> Warehouses ({warehouses.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {loading ? (
              <div className="text-center py-4">Loading stock…</div>
            ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Stock ID</th><th>Item Name</th><th>Location</th><th>Quantity</th><th>Unit Price</th><th>Supplier</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {warehouses.length === 0 && <tr className="d_empty"><td colSpan={8}>No stock items found.</td></tr>}
                  {warehouses.map(w => (
                    <tr key={w._id}>
                      <td><code>{w.id}</code></td><td><strong>{w.itemName}</strong></td><td>{w.location || '-'}</td>
                      <td>{w.quantity}</td><td>₹{(w.unitPrice || 0).toLocaleString()}</td><td>{w.supplier || '-'}</td>
                      <td><span className={`d_badge ${statusClass[w.status] || 'd_info'}`}>{w.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(w)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(w._id)}><MdDelete /></button>
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

      {tab === 'transfers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdSwapHoriz className="d_card_icon" /> Stock Transfers</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Transfer ID</th><th>From</th><th>To</th><th>Part</th><th>Qty</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {transfers.map(t => (
                    <tr key={t._id}>
                      <td><code>{t.id}</code></td><td>{t.from}</td><td>{t.to}</td><td><strong>{t.part}</strong></td>
                      <td>{t.qty}</td><td>{t.date}</td>
                      <td><span className={`d_badge ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(t._id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audits' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdFactCheck className="d_card_icon" /> Stock Audits ({audits.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {audits.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color: 'var(--d-text-muted)' }}>No stock audits scheduled.</p>
                <button className="d_btn d_btn_primary mt-2" onClick={openAdd}><MdAdd /> Schedule Audit</button>
              </div>
            ) : (
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead><tr><th>Audit ID</th><th>Location</th><th>Date</th><th>Items</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
                  <tbody>
                    {audits.map(a => (
                      <tr key={a._id}>
                        <td><code>{a.id}</code></td><td>{a.location}</td><td>{a.date}</td><td>{a.items}</td>
                        <td><span className={`d_badge ${statusClass[a.status]}`}>{a.status}</span></td><td>{a.notes}</td>
                        <td><div className="d_action_btns">
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(a)}><MdEdit /></button>
                          <button className="d_icon_btn d_del" onClick={() => handleDelete(a._id)}><MdDelete /></button>
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

      {/* Warehouse Modal */}
      {isWH && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Warehouse' : 'Add Warehouse'} size="md">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Warehouse Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Main Warehouse" {...f('name')} />
              {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Location <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Surat - Unit 1" {...f('location')} />
              {errors.location && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.location}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Total Capacity</label>
              <input type="number" className="d_form_control" placeholder="e.g. 5000" {...f('capacity')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Manager <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Manager name" {...f('manager')} />
              {errors.manager && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.manager}</span>}
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Warehouse'}</button>
          </div>
        </Modal>
      )}

      {/* Transfer Modal */}
      {!isWH && tab === 'transfers' && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Transfer' : 'New Stock Transfer'} size="md">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">From Warehouse <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('from')}>
                <option value="">Select</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.id} – {w.name}</option>)}
              </select>
              {errors.from && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.from}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">To Warehouse <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('to')}>
                <option value="">Select</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.id} – {w.name}</option>)}
              </select>
              {errors.to && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.to}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Part Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Part name" {...f('part')} />
              {errors.part && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.part}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Quantity <span className="d_req">*</span></label>
              <input type="number" className="d_form_control" placeholder="e.g. 50" {...f('qty')} />
              {errors.qty && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.qty}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Transfer Date</label>
              <input type="date" className="d_form_control" {...f('date')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>In Transit</option><option>Completed</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Transfer' : 'Create Transfer'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Warehouse;
