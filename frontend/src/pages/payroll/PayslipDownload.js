import React, { useState } from 'react';
import { MdVisibility, MdDownload, MdDescription } from 'react-icons/md';

const payslips = [
  { id: 'E001', name: 'Ramesh Kulkarni', dept: 'Purchase', month: 'June 2026', net: 43500, generated: '01 Jul 2026', status: 'Generated' },
  { id: 'E002', name: 'Deepak Rao', dept: 'Sales', month: 'June 2026', net: 49700, generated: '01 Jul 2026', status: 'Generated' },
  { id: 'E003', name: 'Nilesh Gaikwad', dept: 'Inventory', month: 'June 2026', net: 38800, generated: '—', status: 'Pending' },
  { id: 'E005', name: 'Alka Bhosale', dept: 'HR', month: 'June 2026', net: 46600, generated: '01 Jul 2026', status: 'Generated' },
  { id: 'E007', name: 'Mahesh Pandey', dept: 'Accounts', month: 'June 2026', net: 54400, generated: '—', status: 'Pending' },
  { id: 'E008', name: 'Vikram Chauhan', dept: 'HR', month: 'June 2026', net: 45000, generated: '01 Jul 2026', status: 'Generated' },
];

export default function PayslipDownload() {
  const [month, setMonth] = useState('June 2026');

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Payslip Download</div>
          <div className="d_page_subtitle">View and download employee payslips</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="d_btn d_btn_outline" value={month} onChange={e => setMonth(e.target.value)}>
            <option>June 2026</option>
            <option>May 2026</option>
            <option>April 2026</option>
          </select>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdDescription /></span>Payslips — {month}</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th>Net Salary (₹)</th>
                  <th>Generated Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.dept}</td>
                    <td>{p.month}</td>
                    <td><strong>₹{p.net.toLocaleString('en-IN')}</strong></td>
                    <td>{p.generated}</td>
                    <td><span className={`d_badge ${p.status === 'Generated' ? 'd_success' : 'd_warning'}`}>{p.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view" disabled={p.status === 'Pending'}><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" disabled={p.status === 'Pending'}><MdDownload /></button>
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
