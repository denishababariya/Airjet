import React from 'react';
import { MdDownload, MdBarChart, MdLocalShipping, MdMonetizationOn, MdCheckCircle, MdAssignmentReturn } from 'react-icons/md';

const purchaseData = [
  { month: 'Jan 2026', pos: 12, amount: 1450000, received: 1380000, grnValue: 1340000, returns: 42000 },
  { month: 'Feb 2026', pos: 15, amount: 1820000, received: 1780000, grnValue: 1750000, returns: 68000 },
  { month: 'Mar 2026', pos: 21, amount: 2410000, received: 2350000, grnValue: 2300000, returns: 110000 },
  { month: 'Apr 2026', pos: 14, amount: 1690000, received: 1640000, grnValue: 1600000, returns: 55000 },
  { month: 'May 2026', pos: 18, amount: 2180000, received: 2100000, grnValue: 2060000, returns: 88000 },
  { month: 'Jun 2026', pos: 11, amount: 1380000, received: 1250000, grnValue: 1210000, returns: 143600 },
];

const summaryCards = [
  { label: 'Total POs', value: purchaseData.reduce((s, r) => s + r.pos, 0), icon: <MdLocalShipping />, color: 'var(--d-accent)' },
  { label: 'Total Amount', value: `₹${purchaseData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}`, icon: <MdMonetizationOn />, color: 'var(--d-info)' },
  { label: 'GRN Value', value: `₹${purchaseData.reduce((s, r) => s + r.grnValue, 0).toLocaleString('en-IN')}`, icon: <MdCheckCircle />, color: 'var(--d-success)' },
  { label: 'Total Returns', value: `₹${purchaseData.reduce((s, r) => s + r.returns, 0).toLocaleString('en-IN')}`, icon: <MdAssignmentReturn />, color: 'var(--d-danger)' },
];

export default function PurchaseReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Purchase Report</div>
          <div className="d_page_subtitle">Monthly purchase performance — Jan to Jun 2026</div>
        </div>
        <button className="d_btn d_btn_accent"><MdDownload /> Export</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon">{c.icon}</span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBarChart /></span>Monthly Purchase Breakdown</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>POs</th>
                  <th>Amount (₹)</th>
                  <th>Received (₹)</th>
                  <th>GRN Value (₹)</th>
                  <th>Returns (₹)</th>
                </tr>
              </thead>
              <tbody>
                {purchaseData.map(r => (
                  <tr key={r.month}>
                    <td><strong>{r.month}</strong></td>
                    <td>{r.pos}</td>
                    <td>{r.amount.toLocaleString('en-IN')}</td>
                    <td>{r.received.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-success)' }}>{r.grnValue.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-danger)' }}>{r.returns.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{purchaseData.reduce((s, r) => s + r.pos, 0)}</strong></td>
                  <td><strong>{purchaseData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{purchaseData.reduce((s, r) => s + r.received, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{purchaseData.reduce((s, r) => s + r.grnValue, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{purchaseData.reduce((s, r) => s + r.returns, 0).toLocaleString('en-IN')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
