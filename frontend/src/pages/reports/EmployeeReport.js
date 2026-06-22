import React from 'react';
import { MdPeople, MdCheckCircle, MdCancel, MdBeachAccess, MdVisibility, MdEdit } from 'react-icons/md';

const employees = [
  { id: 'E001', name: 'Ramesh Kulkarni', dept: 'Purchase', designation: 'Purchase Manager', join: '12 Mar 2019', status: 'Active' },
  { id: 'E002', name: 'Deepak Rao', dept: 'Sales', designation: 'Sales Manager', join: '04 Aug 2020', status: 'Active' },
  { id: 'E003', name: 'Nilesh Gaikwad', dept: 'Inventory', designation: 'Inventory Manager', join: '22 Jan 2021', status: 'Active' },
  { id: 'E005', name: 'Alka Bhosale', dept: 'HR', designation: 'HR Manager', join: '15 Sep 2018', status: 'Active' },
  { id: 'E007', name: 'Mahesh Pandey', dept: 'Accounts', designation: 'Senior Accountant', join: '01 Jun 2022', status: 'Active' },
  { id: 'E014', name: 'Harish Bhat', dept: 'Sales', designation: 'Sales Executive', join: '10 Feb 2023', status: 'Inactive' },
];

const statusBadge = s => s === 'Active' ? 'd_success' : 'd_danger';

const summaryCards = [
  { label: 'Total Employees', value: 42, color: 'var(--d-accent)', icon: <MdPeople /> },
  { label: 'Active', value: 38, color: 'var(--d-success)', icon: <MdCheckCircle /> },
  { label: 'Inactive', value: 4, color: 'var(--d-danger)', icon: <MdCancel /> },
  { label: 'On Leave', value: 3, color: 'var(--d-warning)', icon: <MdBeachAccess /> },
];

export default function EmployeeReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Employee Report</div>
          <div className="d_page_subtitle">Employee master summary and status</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon">{c.icon}</span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Employee List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Join Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>{e.name}</td>
                    <td>{e.dept}</td>
                    <td>{e.designation}</td>
                    <td>{e.join}</td>
                    <td>
                      <span className={`d_badge ${statusBadge(e.status)}`}>
                        {e.status === 'Active' ? <MdCheckCircle /> : <MdCancel />} {e.status}
                      </span>
                    </td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdEdit /></button>
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
}
