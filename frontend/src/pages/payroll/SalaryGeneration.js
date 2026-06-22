import React, { useState } from 'react';
import { MdVisibility, MdDownload, MdPeople, MdMonetizationOn, MdCheckCircle, MdPendingActions } from 'react-icons/md';

const salaries = [
  { id: 'E001', name: 'Ramesh Kulkarni', basic: 28000, hra: 11200, da: 5600, allow: 3500, deduct: 4800, net: 43500, status: 'Paid' },
  { id: 'E002', name: 'Deepak Rao', basic: 32000, hra: 12800, da: 6400, allow: 4000, deduct: 5500, net: 49700, status: 'Paid' },
  { id: 'E003', name: 'Nilesh Gaikwad', basic: 25000, hra: 10000, da: 5000, allow: 3000, deduct: 4200, net: 38800, status: 'Pending' },
  { id: 'E005', name: 'Alka Bhosale', basic: 30000, hra: 12000, da: 6000, allow: 3800, deduct: 5200, net: 46600, status: 'Paid' },
  { id: 'E007', name: 'Mahesh Pandey', basic: 35000, hra: 14000, da: 7000, allow: 4500, deduct: 6100, net: 54400, status: 'Pending' },
  { id: 'E008', name: 'Vikram Chauhan', basic: 29000, hra: 11600, da: 5800, allow: 3600, deduct: 5000, net: 45000, status: 'Paid' },
];

export default function SalaryGeneration() {
  const [month, setMonth] = useState('June 2026');

  const totalPayable = salaries.reduce((s, r) => s + r.net, 0);
  const paid = salaries.filter(r => r.status === 'Paid').reduce((s, r) => s + r.net, 0);
  const pending = salaries.filter(r => r.status === 'Pending').reduce((s, r) => s + r.net, 0);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Salary Generation</div>
          <div className="d_page_subtitle">Generate and manage monthly salary for all employees</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="d_btn d_btn_outline" value={month} onChange={e => setMonth(e.target.value)}>
            <option>June 2026</option>
            <option>May 2026</option>
            <option>April 2026</option>
          </select>
          <button className="d_btn d_btn_primary"><MdCheckCircle /> Generate Salaries</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Total Employees</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700 }}>{salaries.length}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Total Payable</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalPayable.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdCheckCircle /></span>Paid</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{paid.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdPendingActions /></span>Pending</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-warning)' }}>₹{pending.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Salary Sheet — {month}</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Basic (₹)</th>
                  <th>HRA (₹)</th>
                  <th>DA (₹)</th>
                  <th>Allowances (₹)</th>
                  <th>Deductions (₹)</th>
                  <th>Net Salary (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.basic.toLocaleString('en-IN')}</td>
                    <td>{r.hra.toLocaleString('en-IN')}</td>
                    <td>{r.da.toLocaleString('en-IN')}</td>
                    <td>{r.allow.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-danger)' }}>{r.deduct.toLocaleString('en-IN')}</td>
                    <td><strong>₹{r.net.toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${r.status === 'Paid' ? 'd_success' : 'd_warning'}`}>{r.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdDownload /></button>
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
