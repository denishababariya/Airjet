import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdEngineering } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';

const STATUS_OPTIONS = ['Assigned', 'In Progress', 'Completed', 'Cancelled'];

const statusBadge = s => {
  if (s === 'Completed') return 'd_success';
  if (s === 'Cancelled') return 'd_danger';
  if (s === 'In Progress') return 'd_warning';
  return 'd_info';
};

const blank = {
  ticketNo: '',
  engineers: [],
  assignDate: new Date().toISOString().split('T')[0],
  visitDate: '',
  eta: '',
  status: 'Assigned'
};

export default function EngineerAssignment() {
  const { data, loading, error, setError, save, remove } = useErpRecords('service', 'assignment');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd = () => {
    setForm({ ...blank });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (a) => {
    setForm({
      ticketNo: a.ticketNo || '',
      engineers: a.engineers || [],
      assignDate: a.assignDate || new Date().toISOString().split('T')[0],
      visitDate: a.visitDate || '',
      eta: a.eta || '',
      status: a.status || 'Assigned'
    });
    setEditId(a._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.ticketNo.trim()) e.ticketNo = 'Ticket No is required';
    if (!form.engineers.length) e.engineers = 'At least one engineer is required';
    if (!form.visitDate) e.visitDate = 'Visit date is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await save(form, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save assignment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const addEngineer = () => {
    setForm(p => ({
      ...p,
      engineers: [...p.engineers, { name: '', empId: '' }]
    }));
  };

  const removeEngineer = (index) => {
    setForm(p => ({
      ...p,
      engineers: p.engineers.filter((_, i) => i !== index)
    }));
  };

  const updateEngineer = (index, field, value) => {
    setForm(p => ({
      ...p,
      engineers: p.engineers.map((eng, i) => 
        i === index ? { ...eng, [field]: value } : eng
      )
    }));
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Engineer Assignment</h1>
          <p className="d_page_subtitle">Assign engineers to service tickets</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdEngineering /> New Assignment</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdEngineering /></span>Assignment List ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading assignments…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 800 }}>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Engineer(s)</th>
                    <th>Assign Date</th>
                    <th>Visit Date</th>
                    <th>ETA</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={7}>No assignments found.</td></tr>}
                  {data.map(a => (
                    <tr key={a._id}>
                      <td><strong>{a.ticketNo}</strong></td>
                      <td>
                        {Array.isArray(a.engineers)
                          ? a.engineers.map((e, i) => (
                              <div key={i} style={{ fontSize: '0.85rem' }}>
                                {e.name} <code style={{ fontSize: '0.75rem' }}>({e.empId})</code>
                              </div>
                            ))
                          : (a.engineers && typeof a.engineers === 'object'
                              ? (a.engineers.name || '-')
                              : (a.engineers || '-')
                            )
                        }
                      </td>
                      <td>{a.assignDate}</td>
                      <td>{a.visitDate}</td>
                      <td>{a.eta}</td>
                      <td><span className={`d_badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(a)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Assignment' : 'New Assignment'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Ticket No <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. ST-202608-1234" {...f('ticketNo')} />
            {errors.ticketNo && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.ticketNo}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Assign Date</label>
            <input type="date" className="d_form_control" {...f('assignDate')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Visit Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('visitDate')} />
            {errors.visitDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.visitDate}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">ETA</label>
            <input type="time" className="d_form_control" {...f('eta')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Engineers <span className="d_req">*</span></label>
            {form.engineers.map((eng, index) => (
              <div key={index} className="d_form_row cols-2" style={{ marginBottom: '10px' }}>
                <div className="d_form_group">
                  <input 
                    className="d_form_control" 
                    placeholder="Engineer Name" 
                    value={eng.name}
                    onChange={(e) => updateEngineer(index, 'name', e.target.value)}
                  />
                </div>
                <div className="d_form_group" style={{ display: 'flex', gap: '5px' }}>
                  <input 
                    className="d_form_control" 
                    placeholder="Emp ID" 
                    value={eng.empId}
                    onChange={(e) => updateEngineer(index, 'empId', e.target.value)}
                  />
                  {form.engineers.length > 1 && (
                    <button 
                      type="button" 
                      className="d_btn d_btn_outline d_btn_danger"
                      onClick={() => removeEngineer(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button 
              type="button" 
              className="d_btn d_btn_outline d_btn_sm"
              onClick={addEngineer}
              style={{ marginTop: '5px' }}
            >
              <MdAdd /> Add Engineer
            </button>
            {errors.engineers && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.engineers}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Assignment' : 'Create Assignment'}</button>
        </div>
      </Modal>
    </div>
  );
}
