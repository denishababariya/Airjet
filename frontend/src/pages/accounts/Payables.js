import React from 'react';
import { MdVisibility, MdEdit, MdAccountBalance, MdMonetizationOn, MdWarning } from 'react-icons/md';

const payables = [
  { id: 'PAY-2026-009', supplier: 'Picanol Spare Parts India', po: 'PO-2026-0041', amount: 124500, poDate: '18 Jun 2026', due: '18 Jul 2026', days: '+26', status: 'Due' },
  { id: 'PAY-2026-008', supplier: 'Tsudakoma Components Hub', po: 'PO-2026-0040', amount: 87200, poDate: '15 Jun 2026', due: '30 Jun 2026', days: '+8', status: 'Due' },
  { id: 'PAY-2026-007', supplier: 'Toyota Industries Parts', po: 'PO-2026-0039', amount: 215000, poDate: '12 Jun 2026', due: '12 Jul 2026', days: '+20', status: 'Paid' },
  { id: 'PAY-2026-006', supplier: 'Dornier Loom Parts', po: 'PO-2026-0038', amount: 45600, poDate: '10 Jun 2026', due: '10 Jun 2026', days: '-12', status: 'Overdue' },
  { id: 'PAY-2026-005', supplier: 'Sulzer Rüti Spare Parts', po: 'PO-2026-0035', amount: 98000, poDate: '05 Jun 2026', due: '05 Jun 2026', days: '-17', status: 'Overdue' },
];

const statusBadge = s => {
  if (s === 'Paid') return 'd_success';
  if (s === 'Overdue') return 'd_danger';
  return 'd_warning';
};

const totalPayable = payables.filter(p => p.status !== 'Paid').reduce((s, r) => s + r.amount, 0);
const overdueAmt = payables.filter(p => p.status === 'Overdue').reduce((s, r) => s + r.amount, 0);
const paidAmt = payables.filter(p => p.status === 'Paid').reduce((s, r) => s + r.amount, 0);

export default function Payables() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Payables</div>
          <div className="d_page_subtitle">Track supplier outstanding payments and dues</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Total Payable</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalPayable.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdWarning /></span>Overdue</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-danger)' }}>₹{overdueAmt.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Paid This Month</div></div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{paidAmt.toLocaleString('en-IN')}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Payables List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Supplier</th>
                  <th>PO No.</th>
                  <th>Amount (₹)</th>
                  <th>PO Date</th>
                  <th>Due Date</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payables.map(p => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.supplier}</td>
                    <td>{p.po}</td>
                    <td>₹{p.amount.toLocaleString('en-IN')}</td>
                    <td>{p.poDate}</td>
                    <td>{p.due}</td>
                    <td style={{ color: p.days.startsWith('-') ? 'var(--d-danger)' : 'inherit' }}>{p.days} days</td>
                    <td><span className={`d_badge ${statusBadge(p.status)}`}>{p.status}</span></td>
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
