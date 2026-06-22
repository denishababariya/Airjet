import React from 'react';
import { MdDownload, MdBarChart, MdShoppingBag, MdMonetizationOn, MdCheckCircle, MdPendingActions } from 'react-icons/md';

const salesData = [
  { month: 'Jan 2026', orders: 18, amount: 1890000, invoiced: 1820000, collected: 1780000, pending: 110000 },
  { month: 'Feb 2026', orders: 22, amount: 2340000, invoiced: 2290000, collected: 2250000, pending: 90000 },
  { month: 'Mar 2026', orders: 31, amount: 3210000, invoiced: 3150000, collected: 3100000, pending: 110000 },
  { month: 'Apr 2026', orders: 24, amount: 2480000, invoiced: 2400000, collected: 2350000, pending: 130000 },
  { month: 'May 2026', orders: 28, amount: 2890000, invoiced: 2820000, collected: 2760000, pending: 130000 },
  { month: 'Jun 2026', orders: 19, amount: 1952000, invoiced: 1890000, collected: 1620000, pending: 332000 },
];

const summaryCards = [
  { label: 'Total Orders', value: salesData.reduce((s, r) => s + r.orders, 0), icon: <MdShoppingBag />, color: 'var(--d-accent)' },
  { label: 'Total Sales Amount', value: `₹${salesData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}`, icon: <MdBarChart />, color: 'var(--d-info)' },
  { label: 'Total Collected', value: `₹${salesData.reduce((s, r) => s + r.collected, 0).toLocaleString('en-IN')}`, icon: <MdCheckCircle />, color: 'var(--d-success)' },
  { label: 'Total Pending', value: `₹${salesData.reduce((s, r) => s + r.pending, 0).toLocaleString('en-IN')}`, icon: <MdPendingActions />, color: 'var(--d-warning)' },
];

export default function SalesReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Sales Report</div>
          <div className="d_page_subtitle">Monthly sales performance — Jan to Jun 2026</div>
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
          <div className="d_card_title"><span className="d_card_icon"><MdBarChart /></span>Monthly Sales Breakdown</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders</th>
                  <th>Amount (₹)</th>
                  <th>Invoiced (₹)</th>
                  <th>Collected (₹)</th>
                  <th>Pending (₹)</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map(r => (
                  <tr key={r.month}>
                    <td><strong>{r.month}</strong></td>
                    <td>{r.orders}</td>
                    <td>{r.amount.toLocaleString('en-IN')}</td>
                    <td>{r.invoiced.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-success)' }}>{r.collected.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-warning)' }}>{r.pending.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total</strong></td>
                  <td><strong>{salesData.reduce((s, r) => s + r.orders, 0)}</strong></td>
                  <td><strong>{salesData.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{salesData.reduce((s, r) => s + r.invoiced, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{salesData.reduce((s, r) => s + r.collected, 0).toLocaleString('en-IN')}</strong></td>
                  <td><strong>{salesData.reduce((s, r) => s + r.pending, 0).toLocaleString('en-IN')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
