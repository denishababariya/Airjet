import React from 'react';
import { MdDownload, MdBarChart, MdCheckCircle, MdAccessTime, MdStar } from 'react-icons/md';

const reports = [
  { id: 'SR-2026-Q2', month: 'Apr–Jun 2026', total: 24, resolved: 18, pending: 6, avgDays: 2.4, topIssue: 'Nozzle Pressure Failure' },
  { id: 'SR-2026-Q1', month: 'Jan–Mar 2026', total: 31, resolved: 28, pending: 3, avgDays: 2.1, topIssue: 'Heald Frame Misalignment' },
  { id: 'SR-2025-Q4', month: 'Oct–Dec 2025', total: 19, resolved: 17, pending: 2, avgDays: 2.8, topIssue: 'Reed Hitting / Shedding' },
  { id: 'SR-2025-Q3', month: 'Jul–Sep 2025', total: 27, resolved: 25, pending: 2, avgDays: 1.9, topIssue: 'Weft Sensor Malfunction' },
];

const summaryCards = [
  { label: 'Total Tickets', value: 24, icon: <MdBarChart />, color: 'var(--d-accent)' },
  { label: 'Resolved', value: 18, icon: <MdCheckCircle />, color: 'var(--d-success)' },
  { label: 'Avg Resolution Time', value: '2.4 days', icon: <MdAccessTime />, color: 'var(--d-info)' },
  { label: 'Customer Satisfaction', value: '4.2 / 5', icon: <MdStar />, color: 'var(--d-warning)' },
];

export default function ServiceReports() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Service Reports</div>
          <div className="d_page_subtitle">Quarterly service performance summary and analytics</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon">{c.icon}</span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '1.8rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBarChart /></span>Quarterly Reports</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Period</th>
                  <th>Total Tickets</th>
                  <th>Resolved</th>
                  <th>Pending</th>
                  <th>Avg Resolution (Days)</th>
                  <th>Top Issue</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.month}</td>
                    <td>{r.total}</td>
                    <td><span className="d_badge d_success">{r.resolved}</span></td>
                    <td><span className={`d_badge ${r.pending > 0 ? 'd_warning' : 'd_success'}`}>{r.pending}</span></td>
                    <td>{r.avgDays}</td>
                    <td style={{ fontSize: '0.88rem' }}>{r.topIssue}</td>
                    <td>
                      <button className="d_btn d_btn_sm d_btn_outline"><MdDownload /> Download</button>
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
