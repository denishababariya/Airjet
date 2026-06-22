import React from 'react';
import { MdBarChart, MdCheckCircle, MdAccessTime, MdStar } from 'react-icons/md';

const serviceData = [
  { month: 'Jan 2026', opened: 8, closed: 7, pending: 1, avgDays: 2.2, topIssue: 'Nozzle Failure', satisfaction: 4.3 },
  { month: 'Feb 2026', opened: 10, closed: 9, pending: 1, avgDays: 1.8, topIssue: 'Heald Misalignment', satisfaction: 4.5 },
  { month: 'Mar 2026', opened: 14, closed: 12, pending: 2, avgDays: 2.6, topIssue: 'Reed Hitting', satisfaction: 4.1 },
  { month: 'Apr 2026', opened: 9, closed: 9, pending: 0, avgDays: 1.9, topIssue: 'Weft Sensor', satisfaction: 4.6 },
  { month: 'May 2026', opened: 11, closed: 10, pending: 1, avgDays: 2.3, topIssue: 'Drive Bearing', satisfaction: 4.2 },
  { month: 'Jun 2026', opened: 12, closed: 7, pending: 5, avgDays: 2.4, topIssue: 'Nozzle Pressure Drop', satisfaction: 4.0 },
];

const summaryCards = [
  { label: 'Total Tickets', value: serviceData.reduce((s, r) => s + r.opened, 0), icon: <MdBarChart />, color: 'var(--d-accent)' },
  { label: 'Resolved', value: serviceData.reduce((s, r) => s + r.closed, 0), icon: <MdCheckCircle />, color: 'var(--d-success)' },
  { label: 'Avg Resolution', value: '2.2 days', icon: <MdAccessTime />, color: 'var(--d-info)' },
  { label: 'Satisfaction Score', value: '4.3 / 5', icon: <MdStar />, color: 'var(--d-warning)' },
];

export default function ServiceReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Service Report</div>
          <div className="d_page_subtitle">Monthly service ticket summary — Jan to Jun 2026</div>
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
          <div className="d_card_title"><span className="d_card_icon"><MdBarChart /></span>Monthly Service Summary</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Opened</th>
                  <th>Closed</th>
                  <th>Pending</th>
                  <th>Avg Days</th>
                  <th>Top Issue</th>
                  <th>Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {serviceData.map(r => (
                  <tr key={r.month}>
                    <td><strong>{r.month}</strong></td>
                    <td>{r.opened}</td>
                    <td><span className="d_badge d_success">{r.closed}</span></td>
                    <td>
                      <span className={`d_badge ${r.pending > 0 ? 'd_warning' : 'd_success'}`}>{r.pending}</span>
                    </td>
                    <td>{r.avgDays}</td>
                    <td style={{ fontSize: '0.88rem' }}>{r.topIssue}</td>
                    <td>
                      <span className={`d_badge ${r.satisfaction >= 4.4 ? 'd_success' : r.satisfaction >= 4.0 ? 'd_info' : 'd_warning'}`}>
                        ⭐ {r.satisfaction}
                      </span>
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
