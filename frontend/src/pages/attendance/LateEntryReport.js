import React from 'react';
import { MdAccessTime, MdWarning, MdPeople, MdBusiness } from 'react-icons/md';

const lateEntries = [
  { id: 'E002', name: 'Deepak Rao', dept: 'Sales', date: '22 Jun 2026', scheduled: '09:00 AM', actual: '09:38 AM', delay: 38, reason: 'Traffic delay' },
  { id: 'E007', name: 'Mahesh Pandey', dept: 'Accounts', date: '22 Jun 2026', scheduled: '09:00 AM', actual: '09:52 AM', delay: 52, reason: 'Bus missed' },
  { id: 'E011', name: 'Sunita Verma', dept: 'Purchase', date: '21 Jun 2026', scheduled: '09:00 AM', actual: '09:12 AM', delay: 12, reason: 'Personal reason' },
  { id: 'E014', name: 'Harish Bhat', dept: 'Sales', date: '20 Jun 2026', scheduled: '09:00 AM', actual: '09:22 AM', delay: 22, reason: 'Overslept' },
  { id: 'E018', name: 'Vikram Chauhan', dept: 'HR', date: '19 Jun 2026', scheduled: '09:00 AM', actual: '09:08 AM', delay: 8, reason: 'Vehicle breakdown' },
  { id: 'E020', name: 'Pooja Tiwari', dept: 'Inventory', date: '18 Jun 2026', scheduled: '09:00 AM', actual: '09:14 AM', delay: 14, reason: 'Medical appointment' },
];

export default function LateEntryReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Late Entry Report</div>
          <div className="d_page_subtitle">Employees with late check-in entries — June 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Total Late Entries</div>
          </div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-accent)' }}>12</div>
        </div>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span>Avg Delay</div>
          </div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-warning)' }}>18 min</div>
        </div>
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdBusiness /></span>Most Late Dept</div>
          </div>
          <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-danger)' }}>Sales</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdWarning /></span>
            Late Entry Details
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
                  <th>Date</th>
                  <th>Scheduled</th>
                  <th>Actual In</th>
                  <th>Delay (min)</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {lateEntries.map(e => (
                  <tr key={e.id + e.date}>
                    <td>{e.id}</td>
                    <td>{e.name}</td>
                    <td>{e.dept}</td>
                    <td>{e.date}</td>
                    <td>{e.scheduled}</td>
                    <td>{e.actual}</td>
                    <td>
                      <span className={`d_badge ${e.delay > 30 ? 'd_danger' : e.delay > 15 ? 'd_warning' : 'd_info'}`}>
                        {e.delay} min
                      </span>
                    </td>
                    <td>{e.reason}</td>
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
