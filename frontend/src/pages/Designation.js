import React, { useState, useEffect } from 'react';
import { MdBadge, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { designationsApi, departmentsApi } from '../utils/api';
import { V, validate } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessages';

const blank = { title: '', dept: '', status: 'Active' };

const Designation = () => {
  const [data, setData]           = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blank);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [desRes, deptRes] = await Promise.all([designationsApi.getAll(), departmentsApi.getAll()]);
      setData(desRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to load designations. Please refresh.'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (des) => {
    setForm({ title: des.title, dept: des.department?._id || des.department || '', status: des.isActive ? 'Active' : 'Inactive' });
    setEditId(des._id); setErrors({}); setModal(true);
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => validate({
    title: V.title(form.title, 'Designation title'),
    dept:  V.required(form.dept, 'Department'),
  });

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { title: form.title.trim(), department: form.dept, isActive: form.status === 'Active' };
      if (editId) await designationsApi.update(editId, payload);
      else        await designationsApi.create(payload);
      setModal(false);
      toast.success(editId ? 'Designation updated!' : 'Designation added!');
      fetchAll();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to save designation. Please try again.'));
    } finally { setSaving(false); }
  };

  const handleDelete = (id, title) => {
    confirm({
      title: 'Delete Designation',
      message: `Delete "${title}"? Employees with this designation may be affected.`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try { await designationsApi.remove(id); toast.success('Designation deleted.'); fetchAll(); }
        catch (err) { toast.error(getErrorMessage(err, 'Unable to delete designation. Please try again.')); }
      },
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div><h1 className="d_page_title">Designation</h1><p className="d_page_subtitle">Manage job titles and roles</p></div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Designation</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdBadge className="d_card_icon" /> Designations ({data.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading designations…</div> : (
          <div className="d_table_wrap"><table className="d_table">
            <thead><tr><th>Des. ID</th><th>Designation Title</th><th>Department</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No designations found.</td></tr>}
              {data.map(d => (
                <tr key={d._id}>
                  <td><code>{d.id}</code></td>
                  <td><strong>{d.title}</strong></td>
                  <td>{d.department?.title || '-'}</td>
                  <td><span className={`d_badge ${d.isActive ? 'd_success' : 'd_danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td><div className="d_action_btns">
                    <button className="d_icon_btn d_edit" onClick={() => openEdit(d)}><MdEdit /></button>
                    <button className="d_icon_btn d_del"  onClick={() => handleDelete(d._id, d.title)}><MdDelete /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table></div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Designation' : 'Add Designation'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Designation Title <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales Manager" {...f('title')} />
            <Err field="title" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Department <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('dept')}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{String(d.title)}</option>)}
            </select>
            <Err field="dept" />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}><option>Active</option><option>Inactive</option></select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Designation' : 'Save Designation'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Designation;
