import React, { useState } from 'react';
import { MdSecurity, MdAdd, MdEdit, MdDelete, MdCheck, MdClose } from 'react-icons/md';

const roles = [
  { id: 1, name: 'Super Admin',       users: 1, dashboard: true, employees: true, purchase: true, sales: true, inventory: true, accounts: true, reports: true },
  { id: 2, name: 'Admin',             users: 2, dashboard: true, employees: true, purchase: true, sales: true, inventory: true, accounts: true, reports: true },
  { id: 3, name: 'Purchase Manager',  users: 1, dashboard: true, employees: false, purchase: true, sales: false, inventory: true, accounts: false, reports: true },
  { id: 4, name: 'Sales Manager',     users: 1, dashboard: true, employees: false, purchase: false, sales: true, inventory: true, accounts: false, reports: true },
  { id: 5, name: 'Inventory Manager', users: 1, dashboard: true, employees: false, purchase: false, sales: false, inventory: true, accounts: false, reports: true },
  { id: 6, name: 'Accountant',        users: 1, dashboard: true, employees: false, purchase: true, sales: true, inventory: false, accounts: true, reports: true },
  { id: 7, name: 'HR Manager',        users: 1, dashboard: true, employees: true, purchase: false, sales: false, inventory: false, accounts: false, reports: true },
];

const Tick = ({ v }) => v
  ? <MdCheck style={{ color: 'var(--d-success)', fontSize: 18 }} />
  : <MdClose  style={{ color: 'var(--d-danger)',  fontSize: 18 }} />;

const RolePermissions = () => (
  <div>
    <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <h1 className="d_page_title">Role & Permission Management</h1>
        <p className="d_page_subtitle">Control module access per role</p>
      </div>
      <button className="d_btn d_btn_primary"><MdAdd /> Add Role</button>
    </div>
    <div className="d_card">
      <div className="d_card_header">
        <h2 className="d_card_title"><MdSecurity className="d_card_icon" /> Roles & Access Matrix</h2>
      </div>
      <div className="d_card_body p-0">
        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr><th>Role</th><th>Users</th><th>Dashboard</th><th>Employees</th><th>Purchase</th><th>Sales</th><th>Inventory</th><th>Accounts</th><th>Reports</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td><span className="d_badge d_info">{r.users}</span></td>
                  <td><Tick v={r.dashboard} /></td>
                  <td><Tick v={r.employees} /></td>
                  <td><Tick v={r.purchase} /></td>
                  <td><Tick v={r.sales} /></td>
                  <td><Tick v={r.inventory} /></td>
                  <td><Tick v={r.accounts} /></td>
                  <td><Tick v={r.reports} /></td>
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
export default RolePermissions;
