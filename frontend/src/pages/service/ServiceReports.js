import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdAssessment, MdCameraAlt, MdDraw } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';

const WORKING_STATUS = ['Running', 'Not Running', 'Partially Running'];
const REPORT_STATUS = ['Draft', 'Completed', 'Submitted'];

const blank = {
  ticketNo: '',
  engineer: '',
  workDone: '',
  partsUsed: '',
  workingStatus: 'Running',
  beforePhoto: '',
  afterPhoto: '',
  customerSignature: '',
  engineerSignature: '',
  serviceTime: '',
  completedDate: new Date().toISOString().split('T')[0],
  status: 'Draft'
};

export default function ServiceReports() {
  const { data, loading, error, setError, save, remove } = useErpRecords('service', 'report');
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

  const openEdit = (r) => {
    setForm({
      ticketNo: r.ticketNo || '',
      engineer: r.engineer || '',
      workDone: r.workDone || '',
      partsUsed: r.partsUsed || '',
      workingStatus: r.workingStatus || 'Running',
      beforePhoto: r.beforePhoto || '',
      afterPhoto: r.afterPhoto || '',
      customerSignature: r.customerSignature || '',
      engineerSignature: r.engineerSignature || '',
      serviceTime: r.serviceTime || '',
      completedDate: r.completedDate || new Date().toISOString().split('T')[0],
      status: r.status || 'Draft'
    });
    setEditId(r._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.ticketNo.trim()) e.ticketNo = 'Ticket No is required';
    if (!form.engineer.trim()) e.engineer = 'Engineer name is required';
    if (!form.workDone.trim()) e.workDone = 'Work done description is required';
    if (!form.workingStatus) e.workingStatus = 'Working status is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await save(form, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save report');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const statusBadge = s => {
    if (s === 'Completed' || s === 'Submitted') return 'd_success';
    if (s === 'Draft') return 'd_warning';
    return 'd_info';
  };

  const workingBadge = s => {
    if (s === 'Running') return 'd_success';
    if (s === 'Not Running') return 'd_danger';
    return 'd_warning';
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Reports</h1>
          <p className="d_page_subtitle">Final service completion reports with signatures</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAssessment /> New Report</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAssessment /></span>Service Reports ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading reports…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Engineer</th>
                    <th>Work Done</th>
                    <th>Parts Used</th>
                    <th>Working Status</th>
                    <th>Service Time</th>
                    <th>Completed Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={9}>No service reports found.</td></tr>}
                  {data.map(r => (
                    <tr key={r._id}>
                      <td><strong>{String(r.ticketNo)}</strong></td>
                      <td>{String(r.engineer)}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 150 }}>{String(r.workDone)}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 100 }}>{String(r.partsUsed)}</td>
                      <td><span className={`d_badge ${workingBadge(r.workingStatus)}`}>{String(r.workingStatus)}</span></td>
                      <td>{String(r.serviceTime)}</td>
                      <td>{String(r.completedDate)}</td>
                      <td><span className={`d_badge ${statusBadge(r.status)}`}>{String(r.status)}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Service Report' : 'New Service Report'} size="lg">
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
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Work Done <span className="d_req">*</span></label>
            <textarea className="d_form_control" placeholder="Describe the work completed…" rows={3} {...f('workDone')} />
            {errors.workDone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.workDone}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Parts Used</label>
            <textarea className="d_form_control" placeholder="List of parts used during service…" rows={2} {...f('partsUsed')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Working Status <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('workingStatus')}>
              {WORKING_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.workingStatus && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.workingStatus}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Service Time</label>
            <input className="d_form_control" placeholder="e.g. 3 Hours" {...f('serviceTime')} />
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
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Customer Signature</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="d_form_control" placeholder="Signature URL" {...f('customerSignature')} />
              <button type="button" className="d_btn d_btn_outline"><MdDraw /> Sign</button>
            </div>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Engineer Signature</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="d_form_control" placeholder="Signature URL" {...f('engineerSignature')} />
              <button type="button" className="d_btn d_btn_outline"><MdDraw /> Sign</button>
            </div>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Completed Date</label>
            <input type="date" className="d_form_control" {...f('completedDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Report Status</label>
            <select className="d_form_control" {...f('status')}>
              {REPORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Report' : 'Create Report'}</button>
        </div>
      </Modal>
    </div>
  );
}
