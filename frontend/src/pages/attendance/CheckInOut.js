import React, { useState } from 'react';
import { MdSearch, MdEdit, MdAccessTime, MdPeople, MdEventBusy, MdBeachAccess } from 'react-icons/md';

const attendance = [
  { id: 'E001', name: 'Ramesh Kulkarni', dept: 'Purchase', checkIn: '09:02 AM', checkOut: '06:05 PM', hours: '9h 03m', status: 'Present', late: false },
  { id: 'E002', name: 'Deepak Rao', dept: 'Sales', checkIn: '09:38 AM', checkOut: '06:30 PM', hours: '8h 52m', status: 'Present', late: true },
  { id: 'E003', name: 'Nilesh Gaikwad', dept: 'Inventory', checkIn: '08:55 AM', checkOut: '05:58 PM', hours: '9h 03m', status: 'Present', late: false },
  { id: 'E004', name: 'Snehal Jain', dept: 'Accounts', checkIn: '—', checkOut: '—', hours: '—', status: 'Absent', late: false },
  { id: 'E005', name: 'Alka Bhosale', dept: 'HR', checkIn: '09:10 AM', checkOut: '06:15 PM', hours: '9h 05m', status: 'Present', late: false },
  { id: 'E006', name: 'Kavita Singh', dept: 'Sales', checkIn: '—', checkOut: '—', hours: '—', status: 'On Leave', late: false },
  { id: 'E007', name: 'Mahesh Pandey', dept: 'Accounts', checkIn: '09:52 AM', checkOut: '06:45 PM', hours: '8h 53m', status: 'Present', late: true },
  { id: 'E008', name: 'Vikram Chauhan', dept: 'HR', checkIn: '08:50 AM', checkOut: '05:50 PM', hours: '9h 00m', status: 'Present', late: false },
];

const statusBadge = (status) => {
  if (status === 'Present') return 'd_success';
  if (status === 'Absent') return 'd_danger';
  return 'd_warning';
};

export default function CheckInOut() {
  const [search, setSearch] = useState('');

  const filtered = attendance.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.dept.toLowerCase().includes(search.toLowerCase())
  );

  const present = attendance.filter(a => a.status === 'Present').length;
  const absent = attendance.filter(a => a.status === 'Absent').length;
  const onLeave = attendance.filter(a => a.status === 'On Leave').length;

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Check In / Out</div>
          <div className="d_page_subtitle">Today: Monday, 22 June 2026</div>
        </div>
      </div>

      <div className="d_summary_pills">
        <span className="d_badge d_success"><MdPeople /> Present: {present}</span>
        <span className="d_badge d_danger"><MdEventBusy /> Absent: {absent}</span>
        <span className="d_badge d_warning"><MdBeachAccess /> On Leave: {onLeave}</span>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Attendance Log
          </div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input
              className="d_search_input"
              placeholder="Search employee or department..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
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
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Late</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.name}</td>
                    <td>{a.dept}</td>
                    <td>{a.checkIn}</td>
                    <td>{a.checkOut}</td>
                    <td>{a.hours}</td>
                    <td><span className={`d_badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                    <td>
                      {a.late
                        ? <span className="d_badge d_warning">Late</span>
                        : <span className="d_badge d_info">—</span>}
                    </td>
                    <td>
                      <div className="d_action_btns">
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
