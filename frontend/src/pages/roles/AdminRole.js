import React from 'react';
import { MdSecurity, MdEdit, MdPerson, MdCheckCircle, MdCancel, MdBlock } from 'react-icons/md';

const permissions = [
  'Dashboard – Full Access',
  'User & Role Management – View/Edit',
  'Employee Master – Full Access',
  'Purchase Management – Full Access',
  'Sales Management – Full Access',
  'Inventory & Spare Parts – Full Access',
  'Warehouse Management – Full Access',
  'Service & Complaints – Full Access',
  'Accounts & GST – Full Access',
  'Payroll & HR – Full Access',
  'Reports & Analytics – Full Access',
  'Document Storage – Full Access',
];

const restricted = [
  'System Settings – No Access',
];

const users = [
  { id: 'U004', name: 'Anita Desai', email: 'anita.desai@airjet.in', lastLogin: '22 Jun 2026, 08:55 AM', status: 'Active' },
  { id: 'U005', name: 'Suresh Nair', email: 'suresh.nair@airjet.in', lastLogin: '21 Jun 2026, 05:30 PM', status: 'Active' },
  { id: 'U006', name: 'Meena Joshi', email: 'meena.joshi@airjet.in', lastLogin: '18 Jun 2026, 10:00 AM', status: 'Inactive' },
];

export default function AdminRole() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Admin Role</div>
          <div className="d_page_subtitle">Full access excluding system settings</div>
        </div>
        <button className="d_btn d_btn_primary">
          <MdEdit /> Edit Permissions
        </button>
      </div>

      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdSecurity /></span>
            Permissions — Admin
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
