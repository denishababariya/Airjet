import React from 'react';
import { MdBadge, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const data = [
  { id: 'DES001', name: 'Super Admin',       dept: 'Administration', level: 'L5', status: 'Active' },
  { id: 'DES002', name: 'Admin',             dept: 'Administration', level: 'L4', status: 'Active' },
  { id: 'DES003', name: 'Sales Manager',     dept: 'Sales',          level: 'L3', status: 'Active' },
  { id: 'DES004', name: 'Sales Executive',   dept: 'Sales',          level: 'L2', status: 'Active' },
  { id: 'DES005', name: 'Purchase Manager',  dept: 'Purchase',       level: 'L3', status: 'Active' },
  { id: 'DES006', name: 'HR Manager',        dept: 'HR',             level: 'L3', status: 'Active' },
  { id: 'DES007', name: 'HR Executive',      dept: 'HR',             level: 'L2', status: 'Active' },
  { id: 'DES008', name: 'Accountant',        dept: 'Accounts',       level: 'L2', status: 'Active' },
  { id: 'DES009', name: 'Inventory Manager', dept: 'Inventory',      level: 'L3', status: 'Active' },
  { id: 'DES010', name: 'Service Engineer',  dept: 'Service',        level: 'L2', status: 'Active' },
];

const Designation = () => (
  <div>
    <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <h1 className="d_page_title">Designation</h1>
        <p className="d_page_subtitle">Manage job designations and levels</p>
      </div>
      <button className="d_btn d_btn_primary"><MdAdd /> Add Designation</button>
    </div>
    <div className="d_card">
      <div className="d_card_header">
        <h2 className="d_card_title"><MdBadge className="d_card_icon" /> All Designations</h2>
      </div>
      <div className="d_card_body p-0">
        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr><th>Desig ID</th><th>Designation</th><th>Department</th><th>Level</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td><code>{d.id}</code></td>
                  <td><strong>{d.name}</strong></td>
                  <td>{d.dept}</td>
                  <td><span className="d_badge d_primary">{d.level}</span></td>
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
export default Designation;
