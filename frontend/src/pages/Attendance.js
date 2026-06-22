import React, { useState } from 'react';
import { MdAccessTime, MdAdd, MdEdit } from 'react-icons/md';

const data = [
  { id: 'EMP001', name: 'Rajesh Kumar',  date: '22-Jun-2026', checkIn: '09:02', checkOut: '18:15', hrs: '9h 13m', status: 'Present', late: false },
  { id: 'EMP002', name: 'Priya Sharma',  date: '22-Jun-2026', checkIn: '09:18', checkOut: '18:00', hrs: '8h 42m', status: 'Present', late: true  },
  { id: 'EMP003', name: 'Amit Patel',    date: '22-Jun-2026', checkIn: '09:01', checkOut: '19:00', hrs: '9h 59m', status: 'Present', late: false },
  { id: 'EMP004', name: 'Sneha Joshi',   date: '22-Jun-2026', checkIn: '--',    checkOut: '--',    hrs: '--',     status: 'On Leave', late: false },
  { id: 'EMP005', name: 'Karan Mehta',   date: '22-Jun-2026', checkIn: '09:45', checkOut: '18:30', hrs: '8h 45m', status: 'Present', late: true  },
  { id: 'EMP006', name: 'Divya Verma',   date: '22-Jun-2026', checkIn: '--',    checkOut: '--',    hrs: '--',     status: 'Absent',   late: false },
  { id: 'EMP007', name: 'Nikhil Rao',    date: '22-Jun-2026', checkIn: '09:00', checkOut: '18:00', hrs: '9h 00m', status: 'Present', late: false },
  { id: 'EMP008', name: 'Pooja Desai',   date: '22-Jun-2026', checkIn: '--',    checkOut: '--',    hrs: '--',     status: 'On Leave', late: false },
];

const statusClass = { Present: 'd_success', Absent: 'd_danger', 'On Leave': 'd_warning' };

const Attendance = () => {
  const [tab, setTab] = useState('checkinout');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Attendance Management</h1>
          <p className="d_page_subtitle">Track employee attendance and leaves</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Mark Attendance</button>
      </div>

      <div className="d_tabs mb-3">
        {[['checkinout','Check In/Out'],['leave','Leave Tracking'],['late','Late Entry'],['ot','Overtime']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab === k ? 'd_active' : ''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Today's Attendance — 22 June 2026</h2>
          <div className="d_summary_pills">
            <span className="d_badge d_success">Present: 5</span>
            <span className="d_badge d_danger">Absent: 1</span>
            <span className="d_badge d_warning">On Leave: 2</span>
          </div>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Emp ID</th><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Late</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.map(e => (
                  <tr key={e.id}>
                    <td><code>{e.id}</code></td>
                    <td><strong>{e.name}</strong></td>
                    <td>{e.date}</td>
                    <td>{e.checkIn}</td>
                    <td>{e.checkOut}</td>
                    <td>{e.hrs}</td>
                    <td><span className={`d_badge ${statusClass[e.status]}`}>{e.status}</span></td>
                    <td>{e.late ? <span className="d_badge d_warning">Late</span> : <span className="d_badge d_success">On Time</span>}</td>
                    <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Attendance;
