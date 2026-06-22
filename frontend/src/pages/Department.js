import React, { useState } from 'react';
import { MdCorporateFare, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const data = [
  { id: 'DEP001', name: 'Sales',          head: 'Rajesh Kumar',   employees: 8,  status: 'Active' },
  { id: 'DEP002', name: 'Purchase',       head: 'Amit Patel',     employees: 5,  status: 'Active' },
  { id: 'DEP003', name: 'HR',             head: 'Priya Sharma',   employees: 4,  status: 'Active' },
  { id: 'DEP004', name: 'Accounts',       head: 'Sneha Joshi',    employees: 3,  status: 'Active' },
  { id: 'DEP005', name: 'Inventory',      head: 'Karan Mehta',    employees: 6,  status: 'Active' },
  { id: 'DEP006', name: 'Service',        head: 'Divya Verma',    employees: 7,  status: 'Active' },
  { id: 'DEP007', name: 'Administration', head: 'Super Admin',    employees: 2,  status: 'Active' },
];

const Department = () => {
  const [search, setSearch] = useState('');
  const filtered = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Department</h1>
          <p className="d_page_subtitle">Manage company departments</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Department</button>
      </div>
      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdCorporateFare className="d_card_icon" /> Departments</h2>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Dept ID</th><th>Department Name</th><th>Head</th><th>Employees</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.name}</strong></td>
                    <td>{d.head}</td>
                    <td><span className="d_badge d_info">{d.employees}</span></td>
                    <td><span className="d_badge d_success">{d.status}</span></td>
                    <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
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
export default Department;
