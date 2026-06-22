import React from 'react';
import { MdMonetizationOn, MdPeople, MdCheckCircle, MdPendingActions } from 'react-icons/md';

const payrollData = [
  { month: 'Jan 2026', employees: 40, basic: 1120000, allowances: 448000, deductions: 182000, net: 1386000, status: 'Processed' },
  { month: 'Feb 2026', employees: 40, basic: 1120000, allowances: 448000, deductions: 184000, net: 1384000, status: 'Processed' },
  { month: 'Mar 2026', employees: 41, basic: 1148000, allowances: 459200, deductions: 187000, net: 1420200, status: 'Processed' },
  { month: 'Apr 2026', employees: 41, basic: 1148000, allowances: 459200, deductions: 186000, net: 1421200, status: 'Processed' },
  { month: 'May 2026', employees: 42, basic: 1176000, allowances: 470400, deductions: 192000, net: 1454400, status: 'Processed' },
  { month: 'Jun 2026', employees: 42, basic: 1176000, allowances: 470400, deductions: 193200, net: 1453200, status: 'Pending' },
];

const totalNet = payrollData.reduce((s, r) => s + r.net, 0);
const paid = payrollData.filter(r => r.status === 'Processed').reduce((s, r) => s + r.net, 0);
const pending = payrollData.filter(r => r.status === 'Pending').reduce((s, r) => s + r.net, 0);
const avgSalary = Math.round(totalNet / payrollData.reduce((s, r) => s + r.employees, 0));

const summaryCards = [
  { label: 'Total Payroll', value: `₹${totalNet.toLocaleString('en-IN')}`, icon: <MdMonetizationOn />, color: 'var(--d-accent)' },
  { label: 'Paid', value: `₹${paid.toLocaleString('en-IN')}`, icon: <MdCheckCircle />, color: 'var(--d-success)' },
  { label: 'Pending', value: `₹${pending.toLocaleString('en-IN')}`, icon: <MdPendingActions />, color: 'var(--d-warning)' },
  { label: 'Avg Salary', value: `₹${avgSalary.toLocaleString('en-IN')}`, icon: <MdPeople />, color: 'var(--d-info)' },
];

export default function PayrollReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Payroll Report</div>
          <div className="d_page_subtitle">Monthly payroll summary — Jan to Jun 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon">{c.icon}</span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '1.4rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Monthly Payroll Breakdown</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Employees</th>
                  <th>Total Basic (₹)</th>
                  <th>Total Allowances (₹)</th>
                  <th>Total Deductions (₹)</th>
                  <th>Net Payroll (₹)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(r => (
                  <tr key={r.month}>
                    <td><strong>{r.month}</strong></td>
                    <td>{r.employees}</td>
                    <td>{r.basic.toLocaleString('en-IN')}</td>
                    <td>{r.allowances.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-danger)' }}>{r.deductions.toLocaleString('en-IN')}</td>
                    <td><strong>₹{r.net.toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${r.status === 'Processed' ? 'd_success' : 'd_warning'}`}>{r.status}</span></td>
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
