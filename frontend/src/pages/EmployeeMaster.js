import React, { useState, useEffect } from 'react';
import { MdPeople, MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Modal from '../components/Modal';
import { employeesApi, departmentsApi, designationsApi, hrApi } from '../utils/api';

const blank = {
  name: '', email: '', phone: '', address: '', gender: '', salary: '',
  workShift: 'Day', cast: '', bod: '', age: '', joiningDate: '',
  department: '', designation: '', status: 'Active',
  password: '', confirmPassword: '',
};

const ADMIN_DESIGNATIONS = ['HR', 'Admin', 'Manager', 'Head'];

const statusClass = { Active: 'd_success', Inactive: 'd_danger', 'On Leave': 'd_warning' };

const EmployeeMaster = ({ currentUser }) => {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const canManage = ['Admin', 'HR', 'Manager'].includes(currentUser?.role);

  const isAdminDesignation = (designationId) => {
    const designation = designations.find(d => d._id === designationId);
    return designation && ADMIN_DESIGNATIONS.some(admin => 
      designation.title?.toLowerCase().includes(admin.toLowerCase())
    );
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [empRes, deptRes, desRes] = await Promise.all([
        employeesApi.getAll(),
        departmentsApi.getAll(),
        designationsApi.getAll(),
      ]);
      setData(empRes.data);
      setDepartments(deptRes.data);
      setDesignations(desRes.data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredDesigs = form.department
    ? designations.filter(d => (d.department?._id || d.department) === form.department)
    : designations;

  const filtered = data.filter(e =>
    (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };

  const openEdit = (emp) => {
    setForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: String(emp.phoneNo || ''),
      address: emp.address || '',
      gender: emp.gender || '',
      salary: emp.salary || '',
      workShift: emp.workShift || 'Day',
      cast: emp.cast || '',
      bod: emp.bod ? emp.bod.split('T')[0] : '',
      age: emp.age || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      department: emp.department?._id || emp.department || '',
      designation: emp.designation?._id || emp.designation || '',
      status: emp.status || 'Active',
    });
    setEditId(emp._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Employee name is required';
    if (!form.department) e.department = 'Department is required';
    if (!form.designation) e.designation = 'Designation is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    
    // Password required for admin designations
    if (!editId && isAdminDesignation(form.designation)) {
      if (!form.password.trim()) {
        e.password = 'Password is required for admin role employees';
      } else if (form.password.length < 6) {
        e.password = 'Password must be at least 6 characters';
      } else if (form.password !== form.confirmPassword) {
        e.confirmPassword = 'Passwords do not match';
      }
    }
    
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phoneNo: form.phone,
        address: form.address,
        gender: form.gender,
        salary: form.salary ? Number(form.salary) : undefined,
        workShift: form.workShift,
        cast: form.cast,
        bod: form.bod || undefined,
        age: form.age ? Number(form.age) : undefined,
        joiningDate: form.joiningDate || undefined,
        department: form.department,
        designation: form.designation,
        status: form.status,
      };
      
      if (editId) {
        await employeesApi.update(editId, payload);
      } else {
        const employee = await employeesApi.create(payload);
        
        // Create user account with password for admin designations
        if (isAdminDesignation(form.designation) && form.password) {
          const designation = designations.find(d => d._id === form.designation);
          const role = designation?.title || 'User';
          await hrApi.createUserWithRole(employee.data._id, role, form.password);
        }
      }
      setModal(false);
      fetchAll();
    } catch (err) {
      setError(err.displayMessage || 'Failed to save employee');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await employeesApi.remove(id);
      fetchAll();
    } catch (err) {
      setError(err.displayMessage || 'Failed to delete employee');
    }
  };

  const calculateAge = (bod) => {
    if (!bod) return '';
    const birthDate = new Date(bod);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => {
      const val = e.target.value;
      setForm(p => {
        const next = { ...p, [field]: val };
        if (field === 'department') next.designation = '';
        if (field === 'bod') next.age = calculateAge(val);
        return next;
      });
      setErrors(p => ({ ...p, [field]: '' }));
    },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Employee Master</h1>
          <p className="d_page_subtitle">Manage all employee records and worker logins</p>
        </div>
        {canManage && (
          <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Employee</button>
        )}
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
          {error && <div className="alert alert-danger m-3">{error}</div>}
          {loading ? (
            <div className="text-center py-4">Loading employees…</div>
          ) : (
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Emp ID</th><th>Name</th><th>Department</th><th>Designation</th>
                  <th>Phone</th><th>Email</th><th>Salary</th><th>Shift</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr className="d_empty"><td colSpan={10}>No employees found.</td></tr>}
                {filtered.map(e => (
                  <tr key={e._id}>
                    <td><code>{e.id}</code></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.department?.title || '-'}</td>
                    <td>{e.designation?.title || '-'}</td>
                    <td>{e.phoneNo || '-'}</td>
                    <td>{e.email}</td>
                    <td>{e.salary ? `₹${e.salary.toLocaleString()}` : '-'}</td>
                    <td>{e.workShift || '-'}</td>
                    <td><span className={`d_badge ${statusClass[e.status] || 'd_info'}`}>{e.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        {canManage && (
                          <>
                            <button className="d_icon_btn d_edit" onClick={() => openEdit(e)} title="Edit"><MdEdit /></button>
                            <button className="d_icon_btn d_del" onClick={() => handleDelete(e._id)} title="Delete"><MdDelete /></button>
                          </>
                        )}
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Employee' : 'Add New Employee'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Full Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Rajesh Kumar" {...f('name')} />
            {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Email <span className="d_req">*</span></label>
            <input type="email" className="d_form_control" placeholder="email@airjet.in" {...f('email')} />
            {errors.email && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.email}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Department <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('department')}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
            </select>
            {errors.department && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.department}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Designation <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('designation')}>
              <option value="">Select Designation</option>
              {filteredDesigs.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
            </select>
            {errors.designation && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.designation}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Phone <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="10-digit mobile" maxLength={10} {...f('phone')} />
            {errors.phone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.phone}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Gender</label>
            <select className="d_form_control" {...f('gender')}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Salary (₹)</label>
            <input type="number" className="d_form_control" placeholder="e.g. 25000" {...f('salary')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Work Shift</label>
            <select className="d_form_control" {...f('workShift')}>
              <option>Day</option><option>Night</option><option>Rotational</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Date of Birth</label>
            <input type="date" className="d_form_control" {...f('bod')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Age</label>
            <input type="number" className="d_form_control" placeholder="Age" {...f('age')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Joining Date</label>
            <input type="date" className="d_form_control" {...f('joiningDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Active</option><option>Inactive</option><option>On Leave</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Address</label>
            <input className="d_form_control" placeholder="Full address" {...f('address')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Category</label>
            <input className="d_form_control" placeholder="e.g. General" {...f('cast')} />
          </div>
        </div>
        {!editId && isAdminDesignation(form.designation) && (
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Password <span className="d_req">*</span></label>
              <input type="password" className="d_form_control" placeholder="Enter password" {...f('password')} />
              {errors.password && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.password}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Confirm Password</label>
              <input type="password" className="d_form_control" placeholder="Confirm password" {...f('confirmPassword')} />
              {errors.confirmPassword && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.confirmPassword}</span>}
            </div>
          </div>
        )}
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Employee' : 'Save Employee'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeMaster;
