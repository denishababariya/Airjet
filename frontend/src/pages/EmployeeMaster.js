import React, { useState } from 'react';
import { MdPeople, MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Modal from '../components/Modal';

const initData = [
  { id: 'EMP001', name: 'Rajesh Kumar',  dept: 'Sales',     desig: 'Sales Manager',    phone: '9876543210', email: 'rajesh@airjet.in',  status: 'Active' },
  { id: 'EMP002', name: 'Priya Sharma',  dept: 'HR',        desig: 'HR Manager',        phone: '9876543211', email: 'priya@airjet.in',   status: 'Active' },
  { id: 'EMP003', name: 'Amit Patel',    dept: 'Purchase',  desig: 'Purchase Manager',  phone: '9876543212', email: 'amit@airjet.in',    status: 'Active' },
  { id: 'EMP004', name: 'Sneha Joshi',   dept: 'Accounts',  desig: 'Accountant',        phone: '9876543213', email: 'sneha@airjet.in',   status: 'Inactive' },
  { id: 'EMP005', name: 'Karan Mehta',   dept: 'Inventory', desig: 'Inventory Manager', phone: '9876543214', email: 'karan@airjet.in',   status: 'Active' },
  { id: 'EMP006', name: 'Divya Verma',   dept: 'Service',   desig: 'Service Engineer',  phone: '9876543215', email: 'divya@airjet.in',   status: 'Active' },
  { id: 'EMP007', name: 'Gaurav Sharma',   dept: 'Manager',   desig: 'Service Engineer',  phone: '9876543205', email: 'gaurav@airjet.in',   status: 'Active' },
];

const blank = { name: '', dept: '', desig: '', phone: '', email: '', joiningDate: '', status: 'Active' };
const statusClass = { Active: 'd_success', Inactive: 'd_danger', 'On Leave': 'd_warning' };

const EmployeeMaster = () => {
  const [data, setData]     = useState(initData);
  const [search, setSearch] = useState('');
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = data.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase())
  );
  

  const openAdd = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (emp) => {
    setForm({ name: emp.name, dept: emp.dept, desig: emp.desig, phone: emp.phone, email: emp.email, joiningDate: emp.joiningDate || '', status: emp.status });
    setEditId(emp.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Employee name is required';
    if (!form.dept.trim())  e.dept  = 'Department is required';
    if (!form.desig.trim()) e.desig = 'Designation is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.email.trim()) e.email = 'Email is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setData(d => d.map(emp => emp.id === editId ? { ...emp, ...form } : emp));
    } else {
      const newId = `EMP${String(data.length + 1).padStart(3, '0')}`;
      setData(d => [...d, { id: newId, ...form }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Delete this employee?')) setData(d => d.filter(e => e.id !== id)); };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Employee Master</h1>
          <p className="d_page_subtitle">Manage all employee records</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Employee</button>
      </div>

      <div className="d_card">
        <div className="d_card_header flex-wrap gap-2">
          <h2 className="d_card_title"><MdPeople className="d_card_icon" /> All Employees ({filtered.length})</h2>
          <div className="d_search_box">
            <MdSearch className="d_search_icon" />
            <input className="d_search_input" placeholder="Search name, ID, dept…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Emp ID</th><th>Name</th><th>Department</th><th>Designation</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr className="d_empty"><td colSpan={8}>No employees found.</td></tr>}
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td><code>{e.id}</code></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.dept}</td>
                    <td>{e.desig}</td>
                    <td>{e.phone}</td>
                    <td>{e.email}</td>
                    <td><span className={`d_badge ${statusClass[e.status] || 'd_info'}`}>{e.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(e)} title="Edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(e.id)} title="Delete"><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Full Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Rajesh Kumar" {...f('name')} />
            {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
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
            <label className="d_form_label">Designation <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales Manager" {...f('desig')} />
            {errors.desig && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.desig}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Joining Date</label>
            <input type="date" className="d_form_control" {...f('joiningDate')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Phone <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="10-digit mobile number" maxLength={10} {...f('phone')} />
            {errors.phone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.phone}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Email <span className="d_req">*</span></label>
            <input type="email" className="d_form_control" placeholder="email@airjet.in" {...f('email')} />
            {errors.email && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.email}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Active</option>
              <option>Inactive</option>
              <option>On Leave</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Employee' : 'Save Employee'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeMaster;
