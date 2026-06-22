import React from 'react';
import { MdAdd, MdEdit, MdVisibility, MdReportProblem } from 'react-icons/md';

const complaints = [
  { id: 'CMP-2026-025', customer: 'Arvind Limited', machine: 'Picanol OptiMax-i', complaint: 'Main nozzle pressure drop causing weft breaks', date: '21 Jun 2026', priority: 'Critical', status: 'Open', assigned: 'Vikram Chauhan' },
  { id: 'CMP-2026-024', customer: 'Vardhman Textiles Ltd', machine: 'Toyota JAT810', complaint: 'Heald frame misalignment after servicing', date: '20 Jun 2026', priority: 'High', status: 'In Progress', assigned: 'Deepak Rao' },
  { id: 'CMP-2026-023', customer: 'Welspun India Ltd', machine: 'Tsudakoma ZAX9100', complaint: 'Reed hitting — incorrect shedding timing', date: '19 Jun 2026', priority: 'High', status: 'In Progress', assigned: 'Ramesh Kulkarni' },
  { id: 'CMP-2026-022', customer: 'Bhilwara Spinners Pvt Ltd', machine: 'Dornier AWS Airjet', complaint: 'Intermittent weft feeder sensor malfunction', date: '17 Jun 2026', priority: 'Medium', status: 'Resolved', assigned: 'Nilesh Gaikwad' },
  { id: 'CMP-2026-021', customer: 'Sri Ramakrishna Mills', machine: 'Picanol Omni Plus 800', complaint: 'Abnormal noise from main drive bearing', date: '15 Jun 2026', priority: 'Low', status: 'Closed', assigned: 'Alka Bhosale' },
];

const priorityBadge = p => {
  if (p === 'Critical') return 'd_danger';
  if (p === 'High') return 'd_warning';
  if (p === 'Medium') return 'd_info';
  return 'd_primary';
};

const statusBadge = s => {
  if (s === 'Resolved' || s === 'Closed') return 'd_success';
  if (s === 'Open') return 'd_danger';
  return 'd_warning';
};

export default function Complaints() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Complaints</div>
          <div className="d_page_subtitle">Track and resolve customer machine complaints</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Complaint</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdReportProblem /></span>Complaints List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Customer</th>
                  <th>Machine Model</th>
                  <th>Complaint</th>
                  <th>Registered Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td>{c.customer}</td>
                    <td>{c.machine}</td>
                    <td style={{ maxWidth: 220, fontSize: '0.88rem' }}>{c.complaint}</td>
                    <td>{c.date}</td>
                    <td><span className={`d_badge ${priorityBadge(c.priority)}`}>{c.priority}</span></td>
                    <td><span className={`d_badge ${statusBadge(c.status)}`}>{c.status}</span></td>
                    <td>{c.assigned}</td>
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
