import React from 'react';
import { MdPayments, MdAdd, MdEdit, MdVisibility } from 'react-icons/md';

const data = [
  { id: 'EMP001', name: 'Rajesh Kumar',  basic: 35000, hra: 14000, da: 3500, allowances: 5000, deductions: 4500, net: 53000 },
  { id: 'EMP002', name: 'Priya Sharma',  basic: 32000, hra: 12800, da: 3200, allowances: 4500, deductions: 4000, net: 48500 },
  { id: 'EMP003', name: 'Amit Patel',    basic: 38000, hra: 15200, da: 3800, allowances: 6000, deductions: 5200, net: 57800 },
  { id: 'EMP004', name: 'Sneha Joshi',   basic: 28000, hra: 11200, da: 2800, allowances: 3500, deductions: 3600, net: 41900 },
  { id: 'EMP005', name: 'Karan Mehta',   basic: 30000, hra: 12000, da: 3000, allowances: 4000, deductions: 3900, net: 45100 },
  { id: 'EMP006', name: 'Divya Verma',   basic: 27000, hra: 10800, da: 2700, allowances: 3200, deductions: 3300, net: 40400 },
];

const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;

const SalaryInformation = () => (
  <div>
    <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <h1 className="d_page_title">Salary Information</h1>
        <p className="d_page_subtitle">Employee salary structure details</p>
      </div>
      <button className="d_btn d_btn_primary"><MdAdd /> Add Salary</button>
    </div>
    <div className="d_card">
      <div className="d_card_header">
        <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Salary Structure</h2>
      </div>
      <div className="d_card_body p-0">
        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr><th>Emp ID</th><th>Employee Name</th><th>Basic</th><th>HRA</th><th>DA</th><th>Allowances</th><th>Deductions</th><th>Net Salary</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.map(e => (
                <tr key={e.id}>
                  <td><code>{e.id}</code></td>
                  <td><strong>{e.name}</strong></td>
                  <td>{fmt(e.basic)}</td>
                  <td>{fmt(e.hra)}</td>
                  <td>{fmt(e.da)}</td>
                  <td>{fmt(e.allowances)}</td>
                  <td className="text-danger">{fmt(e.deductions)}</td>
                  <td><strong className="text-success">{fmt(e.net)}</strong></td>
                  <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_view"><MdVisibility /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
export default SalaryInformation;
