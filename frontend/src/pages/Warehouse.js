import React, { useState } from 'react';
import { MdWarehouse, MdAdd, MdEdit, MdDelete, MdSwapHoriz, MdFactCheck } from 'react-icons/md';
import Modal from '../components/Modal';

const initWarehouses = [
  { id:'WH-001', name:'Main Warehouse',      location:'Surat - Unit 1', capacity:5000, used:3420, manager:'Karan Mehta', status:'Active' },
  { id:'WH-002', name:'Secondary Warehouse', location:'Surat - Unit 2', capacity:3000, used:1840, manager:'Nikhil Rao',  status:'Active' },
  { id:'WH-003', name:'Transit Store',       location:'Navsari',        capacity:1000, used:210,  manager:'Divya Verma', status:'Active' },
];

const initTransfers = [
  { id:'TRF-001', from:'WH-001', to:'WH-002', part:'Reed Valve Assembly', qty:50, date:'20-Jun-2026', status:'Completed' },
  { id:'TRF-002', from:'WH-001', to:'WH-003', part:'Air Jet Nozzle Set',  qty:20, date:'21-Jun-2026', status:'In Transit' },
  { id:'TRF-003', from:'WH-002', to:'WH-001', part:'Main Shaft Bearing',  qty:10, date:'22-Jun-2026', status:'Pending' },
];

const statusClass = { Active:'d_success', Completed:'d_success', 'In Transit':'d_info', Pending:'d_warning', Inactive:'d_danger' };
const blankWH  = { name: '', location: '', capacity: '', manager: '', status: 'Active' };
const blankTRF = { from: '', to: '', part: '', qty: '', date: '', status: 'Pending' };

const Warehouse = ({ defaultTab = 'warehouses' }) => {
  const [tab, setTab]                   = useState(defaultTab);
  const [warehouses, setWarehouses]     = useState(initWarehouses);
  const [transfers, setTransfers]       = useState(initTransfers);
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(blankWH);
  const [editId, setEditId]             = useState(null);
  const [errors, setErrors]             = useState({});

  const isWH = tab === 'warehouses';

  const openAdd = () => { setForm(isWH ? blankWH : blankTRF); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    if (isWH) setForm({ name: row.name, location: row.location, capacity: row.capacity, manager: row.manager, status: row.status });
    else      setForm({ from: row.from, to: row.to, part: row.part, qty: row.qty, date: row.date, status: row.status });
    setEditId(row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isWH) {
      if (!form.name?.trim())     e.name     = 'Warehouse name is required';
      if (!form.location?.trim()) e.location = 'Location is required';
      if (!form.manager?.trim())  e.manager  = 'Manager is required';
    } else {
      if (!form.from?.trim()) e.from = 'From warehouse is required';
      if (!form.to?.trim())   e.to   = 'To warehouse is required';
      if (!form.part?.trim()) e.part = 'Part name is required';
      if (!form.qty)          e.qty  = 'Quantity is required';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isWH) {
      const capacity = parseInt(form.capacity) || 0;
      if (editId) setWarehouses(d => d.map(w => w.id === editId ? { ...w, ...form, capacity } : w));
      else { const id = `WH-${String(warehouses.length+1).padStart(3,'0')}`; setWarehouses(d => [...d, { id, used:0, ...form, capacity }]); }
    } else {
      const qty = parseInt(form.qty) || 0;
      if (editId) setTransfers(d => d.map(t => t.id === editId ? { ...t, ...form, qty } : t));
      else { const id = `TRF-${String(transfers.length+1).padStart(3,'0')}`; setTransfers(d => [...d, { id, ...form, qty }]); }
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isWH) setWarehouses(d => d.filter(w => w.id !== id));
    else      setTransfers(d => d.filter(t => t.id !== id));
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
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>WH ID</th><th>Warehouse Name</th><th>Location</th><th>Capacity</th><th>Used</th><th>Available</th><th>Manager</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {warehouses.map(w => (
                    <tr key={w.id}>
                      <td><code>{w.id}</code></td><td><strong>{w.name}</strong></td><td>{w.location}</td>
                      <td>{w.capacity}</td><td>{w.used}</td><td><strong>{w.capacity - w.used}</strong></td>
                      <td>{w.manager}</td>
                      <td><span className={`d_badge ${statusClass[w.status]}`}>{w.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(w)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(w.id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td><td>{t.from}</td><td>{t.to}</td><td><strong>{t.part}</strong></td>
                      <td>{t.qty}</td><td>{t.date}</td>
                      <td><span className={`d_badge ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(t.id)}><MdDelete /></button>
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
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{ fontSize: 48, color: 'var(--d-light-border)' }}><MdFactCheck /></div>
          <p className="mt-3" style={{ color: 'var(--d-text-muted)' }}>No stock audits scheduled.</p>
          <button className="d_btn d_btn_primary mt-2" onClick={openAdd}><MdAdd /> Schedule Audit</button>
        </div></div>
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
