import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdAssessment, MdCameraAlt, MdDraw } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useWarranties } from '../../utils/useWarranties';
import { V, validate as validateFields } from '../../utils/validators';

const WARRANTY_STATUS = ['Active', 'Expired', 'Claimed', 'Void'];
const WARRANTY_UNITS = ['Days', 'Months', 'Years'];

const blank = {
  warrantyNumber: '',
  salesOrder: '',
  invoice: '',
  customer: '',
  sparePart: '',
  partNumber: '',
  partName: '',
  quantity: 1,
  warrantyPeriod: 12,
  warrantyUnit: 'Months',
  warrantyStartDate: new Date().toISOString().split('T')[0],
  warrantyEndDate: '',
  warrantyStatus: 'Active',
  machineSerialNumber: '',
  terms: '',
  notes: ''
};

export default function ServiceReports() {
  const { data, loading, error, setError, save, remove } = useWarranties();
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
      warrantyNumber: r.warrantyNumber || '',
      salesOrder: r.salesOrder?._id || r.salesOrder || '',
      invoice: r.invoice?._id || r.invoice || '',
      customer: r.customer?._id || r.customer || '',
      sparePart: r.sparePart?._id || r.sparePart || '',
      partNumber: r.partNumber || '',
      partName: r.partName || '',
      quantity: r.quantity || 1,
      warrantyPeriod: r.warrantyPeriod || 12,
      warrantyUnit: r.warrantyUnit || 'Months',
      warrantyStartDate: r.warrantyStartDate ? new Date(r.warrantyStartDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      warrantyEndDate: r.warrantyEndDate ? new Date(r.warrantyEndDate).toISOString().split('T')[0] : '',
      warrantyStatus: r.warrantyStatus || 'Active',
      machineSerialNumber: r.machineSerialNumber || '',
      terms: r.terms || '',
      notes: r.notes || ''
    });
    setEditId(r._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.warrantyNumber.trim()) e.warrantyNumber = 'Warranty number is required';
    if (!form.partNumber.trim()) e.partNumber = 'Part number is required';
    if (!form.partName.trim()) e.partName = 'Part name is required';
    if (!form.quantity || form.quantity < 1) e.quantity = 'Quantity must be at least 1';
    if (!form.warrantyPeriod || form.warrantyPeriod < 1) e.warrantyPeriod = 'Warranty period is required';
    if (!form.warrantyStartDate) e.warrantyStartDate = 'Warranty start date is required';
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
    if (s === 'Active') return 'd_success';
    if (s === 'Expired') return 'd_danger';
    if (s === 'Claimed') return 'd_warning';
    return 'd_info';
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Warranty Reports</h1>
          <p className="d_page_subtitle">Product warranty information and status</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAssessment /> New Warranty</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAssessment /></span>Warranty Reports ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading warranties…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Warranty No</th>
                    <th>Part Number</th>
                    <th>Part Name</th>
                    <th>Customer</th>
                    <th>Quantity</th>
                    <th>Warranty Period</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={10}>No warranties found.</td></tr>}
                  {data.map(r => (
                    <tr key={r._id}>
                      <td><strong>{String(r.warrantyNumber)}</strong></td>
                      <td>{String(r.partNumber)}</td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 150 }}>{String(r.partName)}</td>
                      <td>{r.customer?.name || r.customer || '-'}</td>
                      <td>{String(r.quantity)}</td>
                      <td>{String(r.warrantyPeriod)} {String(r.warrantyUnit)}</td>
                      <td>{r.warrantyStartDate ? new Date(r.warrantyStartDate).toLocaleDateString() : '-'}</td>
                      <td>{r.warrantyEndDate ? new Date(r.warrantyEndDate).toLocaleDateString() : '-'}</td>
                      <td><span className={`d_badge ${statusBadge(r.warrantyStatus)}`}>{String(r.warrantyStatus)}</span></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Warranty' : 'New Warranty'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Number <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. WRY-202608-0001" {...f('warrantyNumber')} />
            {errors.warrantyNumber && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.warrantyNumber}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Machine Serial Number</label>
            <input className="d_form_control" placeholder="Machine serial number" {...f('machineSerialNumber')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Part Number <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Part number" {...f('partNumber')} />
            {errors.partNumber && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.partNumber}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Part Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Part name" {...f('partName')} />
            {errors.partName && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.partName}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Quantity <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="1" {...f('quantity')} />
            {errors.quantity && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.quantity}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty Period <span className="d_req">*</span></label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="number" className="d_form_control" placeholder="12" {...f('warrantyPeriod')} />
              <select className="d_form_control" {...f('warrantyUnit')}>
                {WARRANTY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {errors.warrantyPeriod && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.warrantyPeriod}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Start Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('warrantyStartDate')} />
            {errors.warrantyStartDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.warrantyStartDate}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty End Date</label>
            <input type="date" className="d_form_control" {...f('warrantyEndDate')} disabled />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Status</label>
            <select className="d_form_control" {...f('warrantyStatus')}>
              {WARRANTY_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Terms</label>
            <textarea className="d_form_control" placeholder="Warranty terms and conditions…" rows={2} {...f('terms')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Notes</label>
            <textarea className="d_form_control" placeholder="Additional notes…" rows={2} {...f('notes')} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Warranty' : 'Create Warranty'}</button>
        </div>
      </Modal>
    </div>
  );
}
