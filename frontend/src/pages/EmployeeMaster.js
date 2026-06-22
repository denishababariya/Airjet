import React, { useState } from 'react';
import { MdPeople, MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList } from 'react-icons/md';

const data = [
  { id: 'EMP001', name: 'Rajesh Kumar',    dept: 'Sales',     desig: 'Sales Manager',      phone: '9876543210', email: 'rajesh@airjet.in',  status: 'Active' },
  { id: 'EMP002', name: 'Priya Sharma',    dept: 'HR',        desig: 'HR Manager',          phone: '9876543211', email: 'priya@airjet.in',   status: 'Active' },
  { id: 'EMP003', name: 'Amit Patel',      dept: 'Purchase',  desig: 'Purchase Manager',    phone: '9876543212', email: 'amit@airjet.in',    status: 'Active' },
  { id: 'EMP004', name: 'Sneha Joshi',     dept: 'Accounts',  desig: 'Accountant',          phone: '9876543213', email: 'sneha@airjet.in',   status: 'Inactive' },
  { id: 'EMP005', name: 'Karan Mehta',     dept: 'Inventory', desig: 'Inventory Manager',   phone: '9876543214', email: 'karan@airjet.in',   status: 'Active' },
  { id: 'EMP006', name: 'Divya Verma',     dept: 'Service',   desig: 'Service Engineer',    phone: '9876543215', email: 'divya@airjet.in',   status: 'Active' },
  { id: 'EMP007', name: 'Nikhil Rao',      dept: 'Sales',     desig: 'Sales Executive',     phone: '9876543216', email: 'nikhil@airjet.in',  status: 'Active' },
  { id: 'EMP008', name: 'Pooja Desai',     dept: 'HR',        desig: 'HR Executive',        phone: '9876543217', email: 'pooja@airjet.in',   status: 'On Leave' },
];

const EmployeeMaster = () => {
  const [search, setSearch] = useState('');
  const filtered = data.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase())
  );
  const statusClass = { Active: 'd_success', Inactive: 'd_danger', 'On Leave': 'd_warning' };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Employee Master</h1>
          <p className="d_page_subtitle">Manage all employee records</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Employee</button>
      </div>

      <div className="d_card">
        <div className="d_card_header flex-wrap gap-2">
          <h2 className="d_card_title"><MdPeople className="d_card_icon" /> All Employees ({filtered.length})</h2>
          <div className="d_search_box">
            <MdSearch className="d_search_icon" />
            <input className="d_search_input" placeholder="Search by name, ID, dept..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Emp ID</th><th>Name</th><th>Department</th><th>Designation</th>
                  <th>Phone</th><th>Email</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td><code>{e.id}</code></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.dept}</td>
                    <td>{e.desig}</td>
                    <td>{e.phone}</td>
                    <td>{e.email}</td>
                    <td><span className={`d_badge ${statusClass[e.status]}`}>{e.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del"><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default EmployeeMaster;
