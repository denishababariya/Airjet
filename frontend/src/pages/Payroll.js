import React, { useState } from 'react';
import { MdPayments, MdAdd, MdDownload, MdVisibility } from 'react-icons/md';

const data = [
  { id: 'EMP001', name: 'Rajesh Kumar',  month: 'Jun 2026', basic: 35000, allowances: 19500, deductions: 4500, net: 50000, status: 'Paid' },
  { id: 'EMP002', name: 'Priya Sharma',  month: 'Jun 2026', basic: 32000, allowances: 17300, deductions: 4000, net: 45300, status: 'Paid' },
  { id: 'EMP003', name: 'Amit Patel',    month: 'Jun 2026', basic: 38000, allowances: 21000, deductions: 5200, net: 53800, status: 'Pending' },
  { id: 'EMP004', name: 'Sneha Joshi',   month: 'Jun 2026', basic: 28000, allowances: 14500, deductions: 3600, net: 38900, status: 'Paid' },
  { id: 'EMP005', name: 'Karan Mehta',   month: 'Jun 2026', basic: 30000, allowances: 16000, deductions: 3900, net: 42100, status: 'Pending' },
  { id: 'EMP006', name: 'Divya Verma',   month: 'Jun 2026', basic: 27000, allowances: 13700, deductions: 3300, net: 37400, status: 'Paid' },
];
const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
const statusClass = { Paid: 'd_success', Pending: 'd_warning', Failed: 'd_danger' };

const Payroll = () => {
  const [tab, setTab] = useState('salary');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Payroll Management</h1>
          <p className="d_page_subtitle">Monthly salary processing — June 2026</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Generate Payroll</button>
      </div>

      <div className="d_tabs mb-3">
        {[['salary','Salary Generation'],['allowances','Allowances'],['deductions','Deductions'],['payslip','Payslip Download']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab === k ? 'd_active' : ''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Payroll — June 2026</h2>
          <div className="d_summary_pills">
            <span className="d_badge d_success">Paid: 4</span>
            <span className="d_badge d_warning">Pending: 2</span>
          </div>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Emp ID</th><th>Employee</th><th>Month</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.map(e => (
                  <tr key={e.id}>
                    <td><code>{e.id}</code></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.month}</td>
                    <td>{fmt(e.basic)}</td>
                    <td>{fmt(e.allowances)}</td>
                    <td className="text-danger">{fmt(e.deductions)}</td>
                    <td><strong className="text-success">{fmt(e.net)}</strong></td>
                    <td><span className={`d_badge ${statusClass[e.status]}`}>{e.status}</span></td>
                    <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button><button className="d_icon_btn d_edit"><MdDownload /></button></div></td>
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
export default Payroll;
