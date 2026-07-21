import React, { useState, useEffect } from 'react';
import { MdBadge, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import { designationsApi, departmentsApi } from '../utils/api';

const blank = { title: '', dept: '', status: 'Active' };

const Designation = () => {
  const [data, setData]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [desRes, deptRes] = await Promise.all([
        designationsApi.getAll(),
        departmentsApi.getAll(),
      ]);
      setData(desRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load designations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (des) => {
    setForm({
      title: des.title,
      dept: des.department?._id || des.department || '',
      status: des.isActive ? 'Active' : 'Inactive',
    });
    setEditId(des._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Designation title is required';
    if (!form.dept) e.dept = 'Department is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const payload = { title: form.title, department: form.dept, isActive: form.status === 'Active' };
      if (editId) {
        await designationsApi.update(editId, payload);
      } else {
        await designationsApi.create(payload);
      }
      setModal(false);
      fetchAll();
    } catch (err) {
      setError(err.displayMessage || 'Failed to save designation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this designation?')) return;
    try {
      await designationsApi.remove(id);
      fetchAll();
    } catch (err) {
      setError(err.displayMessage || 'Failed to delete designation');
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Designation</h1>
          <p className="d_page_subtitle">Manage job titles and roles</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Designation</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdBadge className="d_card_icon" /> Designations ({data.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {loading ? (
            <div className="text-center py-4">Loading designations…</div>
          ) : (
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Des. ID</th><th>Designation Title</th><th>Department</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No designations found.</td></tr>}
                {data.map(d => (
                  <tr key={d._id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.department?.title || '-'}</td>
                    <td><span className={`d_badge ${d.isActive ? 'd_success' : 'd_danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(d)} title="Edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(d._id)} title="Delete"><MdDelete /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Designation' : 'Add Designation'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Designation Title <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales Manager" {...f('title')} />
            {errors.title && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.title}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Department <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('dept')}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
            </select>
            {errors.dept && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.dept}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Designation'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Designation;
