import React from 'react';
import { MdSecurity, MdEdit, MdPerson, MdCheckCircle, MdCancel, MdBlock } from 'react-icons/md';

const permissions = [
  'Employee Master – Full Access',
  'Department & Designation – Full Access',
  'Attendance Management – Full Access',
  'Check In / Out – Full Access',
  'Leave Tracking – Full Access',
  'Late Entry Report – Full Access',
  'Overtime Calculation – Full Access',
  'Payroll – Full Access',
  'Salary Generation – Full Access',
  'Allowances & Deductions – Full Access',
  'Payslip Download – Full Access',
  'Reports – HR, Attendance & Payroll Reports',
];

const restricted = [
  'Purchase Management – No Access',
  'Sales Management – No Access',
  'Accounts & GST – No Access',
  'Warehouse Management – No Access',
  'System Settings – No Access',
];

const users = [
  { id: 'U019', name: 'Alka Bhosale', email: 'alka.bhosale@airjet.in', lastLogin: '22 Jun 2026, 09:30 AM', status: 'Active' },
  { id: 'U020', name: 'Vikram Chauhan', email: 'vikram.chauhan@airjet.in', lastLogin: '20 Jun 2026, 05:45 PM', status: 'Active' },
];

export default function HRManagerRole() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">HR Manager Role</div>
          <div className="d_page_subtitle">Access to Employee Management, Attendance, Payroll, and Reports modules</div>
        </div>
        <button className="d_btn d_btn_primary">
          <MdEdit /> Edit Permissions
        </button>
      </div>

      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdSecurity /></span>
            Permissions — HR Manager
          </div>
        </div>
        <div className="d_card_body">
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.6rem' }}>
            {permissions.map((perm, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem' }}>
                <MdCheckCircle style={{ color: '#22c55e', flexShrink: 0 }} /> {perm}
              </li>
            ))}
            {restricted.map((perm, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', opacity: 0.6 }}>
                <MdBlock style={{ color: '#ef4444', flexShrink: 0 }} /> {perm}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdPerson /></span>
            Assigned Users
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.lastLogin}</td>
                    <td>
                      <span className={`d_badge ${u.status === 'Active' ? 'd_success' : 'd_danger'}`}>
                        {u.status === 'Active' ? <MdCheckCircle /> : <MdCancel />} {u.status}
                      </span>
                    </td>
                    <td>
                      <div className="d_action_btns">
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
