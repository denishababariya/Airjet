import React from 'react';
import { MdVisibility, MdEdit, MdAccountBalance, MdMonetizationOn, MdWarning } from 'react-icons/md';

const receivables = [
  { id: 'RCV-2026-011', customer: 'Arvind Limited', invoice: 'INV-2026-0112', amount: 63956, invoiceDate: '20 Jun 2026', due: '20 Jul 2026', days: '+28', status: 'Due' },
  { id: 'RCV-2026-010', customer: 'Welspun India Ltd', invoice: 'INV-2026-0111', amount: 45902, invoiceDate: '17 Jun 2026', due: '17 Jul 2026', days: '+25', status: 'Due' },
  { id: 'RCV-2026-009', customer: 'Sri Ramakrishna Mills', invoice: 'INV-2026-0110', amount: 85668, invoiceDate: '15 Jun 2026', due: '15 Jul 2026', days: '+23', status: 'Collected' },
  { id: 'RCV-2026-008', customer: 'Vardhman Textiles Ltd', invoice: 'INV-2026-0109', amount: 103250, invoiceDate: '10 Jun 2026', due: '10 Jul 2026', days: '-12', status: 'Overdue' },
  { id: 'RCV-2026-007', customer: 'Bhilwara Spinners', invoice: 'INV-2026-0108', amount: 155760, invoiceDate: '05 Jun 2026', due: '05 Jul 2026', days: '+13', status: 'Collected' },
];

const statusBadge = s => {
  if (s === 'Collected') return 'd_success';
  if (s === 'Overdue') return 'd_danger';
  return 'd_warning';
};

const totalReceivable = receivables.filter(r => r.status !== 'Collected').reduce((s, r) => s + r.amount, 0);
const overdue = receivables.filter(r => r.status === 'Overdue').reduce((s, r) => s + r.amount, 0);
const collected = receivables.filter(r => r.status === 'Collected').reduce((s, r) => s + r.amount, 0);

export default function Receivables() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Receivables</div>
          <div className="d_page_subtitle">Track customer outstanding amounts and collections</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Total Receivable</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalReceivable.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdWarning /></span>Overdue</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-danger)' }}>₹{overdue.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Collected This Month</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{collected.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Receivables List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Customer</th>
                  <th>Invoice No.</th>
                  <th>Amount (₹)</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.customer}</td>
                    <td>{r.invoice}</td>
                    <td>₹{r.amount.toLocaleString('en-IN')}</td>
                    <td>{r.invoiceDate}</td>
                    <td>{r.due}</td>
                    <td style={{ color: r.days.startsWith('-') ? 'var(--d-danger)' : 'inherit' }}>{r.days} days</td>
                    <td><span className={`d_badge ${statusBadge(r.status)}`}>{r.status}</span></td>
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
