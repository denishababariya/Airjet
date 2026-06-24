import React, { useState } from 'react';
import { MdBadge, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';

const initData = [
  { id: 'DES001', title: 'Sales Manager',      dept: 'Sales',     level: 'Manager',   status: 'Active' },
  { id: 'DES002', title: 'Purchase Manager',   dept: 'Purchase',  level: 'Manager',   status: 'Active' },
  { id: 'DES003', title: 'HR Manager',         dept: 'HR',        level: 'Manager',   status: 'Active' },
  { id: 'DES004', title: 'Accountant',         dept: 'Accounts',  level: 'Executive', status: 'Active' },
  { id: 'DES005', title: 'Inventory Manager',  dept: 'Inventory', level: 'Manager',   status: 'Active' },
  { id: 'DES006', title: 'Service Engineer',   dept: 'Service',   level: 'Engineer',  status: 'Active' },
  { id: 'DES007', title: 'Sales Executive',    dept: 'Sales',     level: 'Executive', status: 'Active' },
];

const blank = { title: '', dept: '', level: 'Executive', status: 'Active' };

const Designation = () => {
  const [data, setData]     = useState(initData);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (des) => {
    setForm({ title: des.title, dept: des.dept, level: des.level, status: des.status });
    setEditId(des.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Designation title is required';
    if (!form.dept.trim())  e.dept  = 'Department is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setData(d => d.map(des => des.id === editId ? { ...des, ...form } : des));
    } else {
      const newId = `DES${String(data.length + 1).padStart(3, '0')}`;
      setData(d => [...d, { id: newId, ...form }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Delete this designation?')) setData(d => d.filter(des => des.id !== id)); };

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
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Des. ID</th><th>Designation Title</th><th>Department</th><th>Level</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.dept}</td>
                    <td><span className="d_badge d_primary">{d.level}</span></td>
                    <td><span className="d_badge d_success">{d.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(d)} title="Edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(d.id)} title="Delete"><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
              {['Sales', 'Purchase', 'HR', 'Accounts', 'Inventory', 'Service', 'Administration'].map(d => <option key={d}>{d}</option>)}
            </select>
            {errors.dept && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.dept}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Level</label>
            <select className="d_form_control" {...f('level')}>
              {['Executive', 'Senior Executive', 'Manager', 'Senior Manager', 'Engineer', 'Director'].map(l => <option key={l}>{l}</option>)}
            </select>
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
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Designation'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Designation;
