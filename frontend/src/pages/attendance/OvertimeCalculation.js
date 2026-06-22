import React from 'react';
import { MdAccessTime, MdMonetizationOn } from 'react-icons/md';

const overtimeData = [
  { id: 'E001', name: 'Ramesh Kulkarni', dept: 'Purchase', month: 'Jun 2026', regular: 176, ot: 14, rate: 120, amount: 1680 },
  { id: 'E002', name: 'Deepak Rao', dept: 'Sales', month: 'Jun 2026', regular: 176, ot: 8, rate: 130, amount: 1040 },
  { id: 'E003', name: 'Nilesh Gaikwad', dept: 'Inventory', month: 'Jun 2026', regular: 176, ot: 20, rate: 110, amount: 2200 },
  { id: 'E005', name: 'Alka Bhosale', dept: 'HR', month: 'Jun 2026', regular: 176, ot: 6, rate: 125, amount: 750 },
  { id: 'E007', name: 'Mahesh Pandey', dept: 'Accounts', month: 'Jun 2026', regular: 176, ot: 10, rate: 140, amount: 1400 },
  { id: 'E008', name: 'Vikram Chauhan', dept: 'HR', month: 'Jun 2026', regular: 176, ot: 4, rate: 125, amount: 500 },
];

const totalOT = overtimeData.reduce((sum, r) => sum + r.amount, 0);

export default function OvertimeCalculation() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Overtime Calculation</div>
          <div className="d_page_subtitle">Monthly overtime summary for June 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Total OT Amount</div>
          </div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-success)' }}>
            ₹{totalOT.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span>Total OT Hours</div>
          </div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-accent)' }}>
            {overtimeData.reduce((sum, r) => sum + r.ot, 0)} hrs
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Overtime Details
          </div>
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
                  <th>Regular Hours</th>
                  <th>OT Hours</th>
                  <th>OT Rate (₹/hr)</th>
                  <th>OT Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {overtimeData.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.name}</td>
                    <td>{r.dept}</td>
                    <td>{r.month}</td>
                    <td>{r.regular}</td>
                    <td>{r.ot}</td>
                    <td>₹{r.rate}</td>
                    <td><strong>₹{r.amount.toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'right', fontWeight: 600 }}>Total OT Amount</td>
                  <td><strong>₹{totalOT.toLocaleString('en-IN')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
