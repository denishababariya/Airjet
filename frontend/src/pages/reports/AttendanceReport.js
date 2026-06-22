import React from 'react';
import { MdCalendarToday, MdPeople, MdEventBusy, MdAccessTime } from 'react-icons/md';

const attendanceData = [
  { emp: 'Ramesh Kulkarni', dept: 'Purchase', present: 20, absent: 2, late: 1, leave: 0, ot: 14, pct: 91 },
  { emp: 'Deepak Rao', dept: 'Sales', present: 18, absent: 1, late: 3, leave: 3, ot: 8, pct: 82 },
  { emp: 'Nilesh Gaikwad', dept: 'Inventory', present: 21, absent: 1, late: 0, leave: 0, ot: 20, pct: 95 },
  { emp: 'Alka Bhosale', dept: 'HR', present: 22, absent: 0, late: 2, leave: 0, ot: 6, pct: 100 },
  { emp: 'Mahesh Pandey', dept: 'Accounts', present: 19, absent: 2, late: 4, leave: 1, ot: 10, pct: 86 },
  { emp: 'Vikram Chauhan', dept: 'HR', present: 20, absent: 0, late: 2, leave: 2, ot: 4, pct: 91 },
];

const summaryCards = [
  { label: 'Working Days', value: 22, icon: <MdCalendarToday />, color: 'var(--d-accent)' },
  { label: 'Avg Present', value: 38, icon: <MdPeople />, color: 'var(--d-success)' },
  { label: 'Avg Absent', value: 4, icon: <MdEventBusy />, color: 'var(--d-danger)' },
  { label: 'Late Entries', value: 12, icon: <MdAccessTime />, color: 'var(--d-warning)' },
];

export default function AttendanceReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Attendance Report</div>
          <div className="d_page_subtitle">Monthly attendance summary — June 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon">{c.icon}</span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdCalendarToday /></span>Employee-wise Attendance</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Present Days</th>
                  <th>Absent</th>
                  <th>Late Entries</th>
                  <th>Leave</th>
                  <th>OT Hours</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map(r => (
                  <tr key={r.emp}>
                    <td>{r.emp}</td>
                    <td>{r.dept}</td>
                    <td>{r.present}</td>
                    <td style={{ color: r.absent > 0 ? 'var(--d-danger)' : 'inherit' }}>{r.absent}</td>
                    <td style={{ color: r.late > 2 ? 'var(--d-warning)' : 'inherit' }}>{r.late}</td>
                    <td>{r.leave}</td>
                    <td>{r.ot} hrs</td>
                    <td>
                      <span className={`d_badge ${r.pct >= 90 ? 'd_success' : r.pct >= 75 ? 'd_warning' : 'd_danger'}`}>
                        {r.pct}%
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
