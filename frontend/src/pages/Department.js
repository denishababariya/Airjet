import React, { useState } from 'react';
import { MdCorporateFare, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';

const initData = [
  { id: 'DEP001', name: 'Sales',          head: 'Rajesh Kumar',  employees: 8, status: 'Active' },
  { id: 'DEP002', name: 'Purchase',        head: 'Amit Patel',    employees: 5, status: 'Active' },
  { id: 'DEP003', name: 'HR',             head: 'Priya Sharma',  employees: 4, status: 'Active' },
  { id: 'DEP004', name: 'Accounts',        head: 'Sneha Joshi',   employees: 3, status: 'Active' },
  { id: 'DEP005', name: 'Inventory',       head: 'Karan Mehta',   employees: 6, status: 'Active' },
  { id: 'DEP006', name: 'Service',         head: 'Divya Verma',   employees: 7, status: 'Active' },
  { id: 'DEP007', name: 'Administration',  head: 'Super Admin',   employees: 2, status: 'Active' },
];

const blank = { name: '', head: '', description: '', status: 'Active' };

const Department = () => {
  const [data, setData]   = useState(initData);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (dep) => {
    setForm({ name: dep.name, head: dep.head, description: dep.description || '', status: dep.status });
    setEditId(dep.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Department name is required';
    if (!form.head.trim()) e.head = 'Department head is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setData(d => d.map(dep => dep.id === editId ? { ...dep, ...form } : dep));
    } else {
      const newId = `DEP${String(data.length + 1).padStart(3, '0')}`;
      setData(d => [...d, { id: newId, employees: 0, ...form }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Delete this department?')) setData(d => d.filter(dep => dep.id !== id)); };

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
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Dept ID</th><th>Department Name</th><th>Head</th><th>Employees</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.head}</td>
                    <td><span className="d_badge d_info">{d.employees}</span></td>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Department' : 'Add Department'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Department Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales" {...f('name')} />
            {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Department Head <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Rajesh Kumar" {...f('head')} />
            {errors.head && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.head}</span>}
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
          <div className="d_form_group">
            <label className="d_form_label">Description</label>
            <input className="d_form_control" placeholder="Brief description (optional)" {...f('description')} />
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
