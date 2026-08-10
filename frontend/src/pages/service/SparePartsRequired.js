import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdInventory, MdDelete } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';

const blank = {
  ticketNo: '',
  parts: [],
  issueDate: new Date().toISOString().split('T')[0],
  status: 'Pending'
};

export default function SparePartsRequired() {
  const { data, loading, error, setError, save, remove } = useErpRecords('service', 'parts');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd = () => {
    setForm({ ...blank, parts: [{ partName: '', partNumber: '', quantity: 1, availableStock: 0 }] });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (p) => {
    setForm({
      ticketNo: p.ticketNo || '',
      parts: p.parts || [{ partName: '', partNumber: '', quantity: 1, availableStock: 0 }],
      issueDate: p.issueDate || new Date().toISOString().split('T')[0],
      status: p.status || 'Pending'
    });
    setEditId(p._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.ticketNo.trim()) e.ticketNo = 'Ticket No is required';
    if (!form.parts.length || !form.parts[0].partName.trim()) e.parts = 'At least one part is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await save(form, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save parts request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this parts request?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const addPart = () => {
    setForm(p => ({
      ...p,
      parts: [...p.parts, { partName: '', partNumber: '', quantity: 1, availableStock: 0 }]
    }));
  };

  const removePart = (index) => {
    setForm(p => ({
      ...p,
      parts: p.parts.filter((_, i) => i !== index)
    }));
  };

  const updatePart = (index, field, value) => {
    setForm(p => ({
      ...p,
      parts: p.parts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const statusBadge = s => {
    if (s === 'Issued') return 'd_success';
    if (s === 'Pending') return 'd_warning';
    if (s === 'Cancelled') return 'd_danger';
    return 'd_info';
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Spare Parts Required</h1>
          <p className="d_page_subtitle">Manage spare parts requests for service tickets</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdInventory /> New Parts Request</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdInventory /></span>Parts Requests ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading parts requests…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Parts</th>
                    <th>Total Qty</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={6}>No parts requests found.</td></tr>}
                  {data.map(p => (
                    <tr key={p._id}>
                      <td><strong>{p.ticketNo}</strong></td>
                      <td>
                        {Array.isArray(p.parts) ? p.parts.map((part, i) => (
                          <div key={i} style={{ fontSize: '0.85rem' }}>
                            {part.partName} <code style={{ fontSize: '0.75rem' }}>({part.partNumber || 'N/A'})</code> - Qty: {part.quantity}
                            {part.availableStock !== undefined && (
                              <span style={{ color: part.availableStock >= part.quantity ? 'green' : 'red', fontSize: '0.75rem', marginLeft: '5px' }}>
                                (Stock: {part.availableStock})
                              </span>
                            )}
                          </div>
                        )) : '-'}
                      </td>
                      <td>{Array.isArray(p.parts) ? p.parts.reduce((sum, part) => sum + (part.quantity || 0), 0) : 0}</td>
                      <td>{p.issueDate}</td>
                      <td><span className={`d_badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Parts Request' : 'New Parts Request'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Ticket No <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. ST-202608-1234" {...f('ticketNo')} />
            {errors.ticketNo && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.ticketNo}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Issue Date</label>
            <input type="date" className="d_form_control" {...f('issueDate')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Parts <span className="d_req">*</span></label>
            {form.parts.map((part, index) => (
              <div key={index} className="d_card" style={{ marginBottom: '10px', padding: '15px' }}>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Part Name</label>
                    <input 
                      className="d_form_control" 
                      placeholder="e.g. Motor" 
                      value={part.partName}
                      onChange={(e) => updatePart(index, 'partName', e.target.value)}
                    />
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Part Number</label>
                    <input 
                      className="d_form_control" 
                      placeholder="e.g. MOT-001" 
                      value={part.partNumber}
                      onChange={(e) => updatePart(index, 'partNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Quantity</label>
                    <input 
                      type="number"
                      className="d_form_control" 
                      placeholder="1" 
                      value={part.quantity}
                      onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Available Stock</label>
                    <input 
                      type="number"
                      className="d_form_control" 
                      placeholder="0" 
                      value={part.availableStock}
                      onChange={(e) => updatePart(index, 'availableStock', parseInt(e.target.value) || 0)}
                      style={{ 
                        background: '#f5f5f5',
                        color: part.availableStock >= part.quantity ? 'green' : 'red'
                      }}
                      readOnly
                    />
                  </div>
                </div>
                {form.parts.length > 1 && (
                  <button 
                    type="button" 
                    className="d_btn d_btn_outline d_btn_danger d_btn_sm"
                    onClick={() => removePart(index)}
                    style={{ marginTop: '5px' }}
                  >
                    <MdDelete /> Remove Part
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="d_btn d_btn_outline d_btn_sm"
              onClick={addPart}
              style={{ marginTop: '5px' }}
            >
              <MdAdd /> Add Part
            </button>
            {errors.parts && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.parts}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option value="Pending">Pending</option>
              <option value="Issued">Issued</option>
              <option value="Partially Issued">Partially Issued</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Request' : 'Create Request'}</button>
        </div>
      </Modal>
    </div>
  );
}
