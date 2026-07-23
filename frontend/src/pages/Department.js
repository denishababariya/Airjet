import React, { useState, useEffect } from 'react';
import { MdCorporateFare, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import { departmentsApi } from '../utils/api';

const blank = { name: '', head: '', description: '', status: 'Active' };

const Department = () => {
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchDepartments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await departmentsApi.getAll();
      setData(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load departme');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (dep) => {
    setForm({
      name: dep.title || dep.name || '',
      head: dep.head?.name || dep.head || '',
      description: dep.description || '',
      status: dep.isActive ? 'Active' : 'Inactive',
    });
    setEditId(dep._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const payload = { title: form.name, isActive: form.status === 'Active' };
      if (editId) {
        await departmentsApi.update(editId, payload);
      } else {
        await departmentsApi.create(payload);
      }
      setModal(false);
      fetchDepartments();
    } catch (err) {
      setError(err.displayMessage || 'Failed to save department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await departmentsApi.remove(id);
      fetchDepartments();
    } catch (err) {
      setError(err.displayMessage || 'Failed to delete department');
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
          <h1 className="d_page_title">Department</h1>
          <p className="d_page_subtitle">Manage company departments</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Department</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdCorporateFare className="d_card_icon" /> Departments ({data.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {loading ? (
            <div className="text-center py-4">Loading departments…</div>
          ) : (
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Dept ID</th><th>Department Name</th><th>Head</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No departments found.</td></tr>}
                {data.map(d => (
                  <tr key={d._id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.title || d.name}</strong></td>
                    <td>{d.head?.name || d.head?.id || '-'}</td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Department' : 'Add Department'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Department Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales" {...f('name')} />
            {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
          </div>
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
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Department'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Department;
