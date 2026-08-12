import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdAssignmentTurnedIn, MdCameraAlt } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';
import { V, validate as validateFields } from '../../utils/validators';

const SERVICE_TYPES = ['Repair', 'Maintenance', 'Installation', 'Inspection', 'Replacement'];
const MACHINE_STATUS = ['Running', 'Not Running', 'Partially Running'];

const blank = {
  ticketNo: '',
  engineer: '',
  arrivalTime: '',
  inspectionNotes: '',
  machineRunning: 'Not Running',
  serviceType: 'Repair',
  beforePhoto: '',
  afterPhoto: '',
  visitDate: new Date().toISOString().split('T')[0]
};

export default function EngineerVisit() {
  const { data, loading, error, setError, save, remove } = useErpRecords('service', 'visit');
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

  const openEdit = (v) => {
    setForm({
      ticketNo: v.ticketNo || '',
      engineer: v.engineer || '',
      arrivalTime: v.arrivalTime || '',
      inspectionNotes: v.inspectionNotes || '',
      machineRunning: v.machineRunning || 'Not Running',
      serviceType: v.serviceType || 'Repair',
      beforePhoto: v.beforePhoto || '',
      afterPhoto: v.afterPhoto || '',
      visitDate: v.visitDate || new Date().toISOString().split('T')[0]
    });
    setEditId(v._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = validateFields({ engineer: V.name(form.engineer, 'Engineer name') });
    if (!form.ticketNo.trim()) e.ticketNo = 'Ticket No is required';
    if (!form.arrivalTime) e.arrivalTime = 'Arrival time is required';
    if (!form.inspectionNotes.trim()) e.inspectionNotes = 'Inspection notes are required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await save(form, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save visit record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this visit record?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Engineer Visit</h1>
          <p className="d_page_subtitle">Record site inspection and service visits</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAssignmentTurnedIn /> New Visit Record</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAssignmentTurnedIn /></span>Visit Records ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading visit records…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Engineer</th>
                    <th>Visit Date</th>
                    <th>Arrival Time</th>
                    <th>Service Type</th>
                    <th>Machine Running</th>
                    <th>Inspection Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={8}>No visit records found.</td></tr>}
                  {data.map(v => (
                    <tr key={v._id}>
                      <td><strong>{String(v.ticketNo)}</strong></td>
                      <td>{String(v.engineer)}</td>
                      <td>{String(v.visitDate)}</td>
                      <td>{String(v.arrivalTime)}</td>
                      <td><span className="d_badge d_info">{String(v.serviceType)}</span></td>
                      <td>
                        <span className={`d_badge ${v.machineRunning === 'Running' ? 'd_success' : v.machineRunning === 'Not Running' ? 'd_danger' : 'd_warning'}`}>
                          {String(v.machineRunning)}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>{String(v.inspectionNotes)}</td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(v)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Visit Record' : 'New Visit Record'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Ticket No <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. ST-202608-1234" {...f('ticketNo')} />
            {errors.ticketNo && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.ticketNo}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Engineer <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Engineer name" {...f('engineer')} />
            {errors.engineer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.engineer}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Visit Date</label>
            <input type="date" className="d_form_control" {...f('visitDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Arrival Time <span className="d_req">*</span></label>
            <input type="time" className="d_form_control" {...f('arrivalTime')} />
            {errors.arrivalTime && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.arrivalTime}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Service Type</label>
            <select className="d_form_control" {...f('serviceType')}>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Machine Running</label>
            <select className="d_form_control" {...f('machineRunning')}>
              {MACHINE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Inspection Notes <span className="d_req">*</span></label>
            <textarea className="d_form_control" placeholder="Detailed inspection findings…" rows={4} {...f('inspectionNotes')} />
            {errors.inspectionNotes && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.inspectionNotes}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Before Photo</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="d_form_control" placeholder="Image URL" {...f('beforePhoto')} />
              <button type="button" className="d_btn d_btn_outline"><MdCameraAlt /> Upload</button>
            </div>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">After Photo</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="d_form_control" placeholder="Image URL" {...f('afterPhoto')} />
              <button type="button" className="d_btn d_btn_outline"><MdCameraAlt /> Upload</button>
            </div>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Visit' : 'Record Visit'}</button>
        </div>
      </Modal>
    </div>
  );
}
