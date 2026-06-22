import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdConfirmationNumber } from 'react-icons/md';

const tickets = [
  { id: 'TKT-2026-041', customer: 'Arvind Limited', machine: 'Picanol OptiMax-i', issue: 'Nozzle pressure failure', engineer: 'Vikram Chauhan', opened: '21 Jun 2026', sla: '23 Jun 2026', priority: 'Critical', status: 'Open' },
  { id: 'TKT-2026-040', customer: 'Vardhman Textiles Ltd', machine: 'Toyota JAT810', issue: 'Heald frame alignment', engineer: 'Deepak Rao', opened: '20 Jun 2026', sla: '23 Jun 2026', priority: 'High', status: 'In Progress' },
  { id: 'TKT-2026-039', customer: 'Welspun India Ltd', machine: 'Tsudakoma ZAX9100', issue: 'Shedding timing error', engineer: 'Ramesh Kulkarni', opened: '19 Jun 2026', sla: '22 Jun 2026', priority: 'High', status: 'In Progress' },
  { id: 'TKT-2026-038', customer: 'Bhilwara Spinners', machine: 'Dornier AWS Airjet', issue: 'Weft sensor malfunction', engineer: 'Nilesh Gaikwad', opened: '17 Jun 2026', sla: '20 Jun 2026', priority: 'Medium', status: 'Resolved' },
  { id: 'TKT-2026-037', customer: 'Sri Ramakrishna Mills', machine: 'Picanol Omni Plus 800', issue: 'Drive bearing noise', engineer: 'Alka Bhosale', opened: '15 Jun 2026', sla: '18 Jun 2026', priority: 'Low', status: 'Closed' },
];

const priorityBadge = p => {
  if (p === 'Critical') return 'd_danger';
  if (p === 'High') return 'd_warning';
  if (p === 'Medium') return 'd_info';
  return 'd_primary';
};

const statusBadge = s => {
  if (s === 'Closed' || s === 'Resolved') return 'd_success';
  if (s === 'Open') return 'd_danger';
  return 'd_warning';
};

export default function ServiceTickets() {
  const counts = {
    Open: tickets.filter(t => t.status === 'Open').length,
    'In Progress': tickets.filter(t => t.status === 'In Progress').length,
    Resolved: tickets.filter(t => t.status === 'Resolved').length,
    Closed: tickets.filter(t => t.status === 'Closed').length,
  };

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Service Tickets</div>
          <div className="d_page_subtitle">Manage field service and repair tickets</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Ticket</button>
      </div>

      <div className="d_summary_pills">
        <span className="d_badge d_danger">Open: {counts['Open']}</span>
        <span className="d_badge d_warning">In Progress: {counts['In Progress']}</span>
        <span className="d_badge d_success">Resolved: {counts['Resolved']}</span>
        <span className="d_badge d_info">Closed: {counts['Closed']}</span>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdConfirmationNumber /></span>Tickets List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Machine</th>
                  <th>Issue</th>
                  <th>Engineer</th>
                  <th>Opened</th>
                  <th>SLA Deadline</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.id}</strong></td>
                    <td>{t.customer}</td>
                    <td>{t.machine}</td>
                    <td style={{ fontSize: '0.88rem' }}>{t.issue}</td>
                    <td>{t.engineer}</td>
                    <td>{t.opened}</td>
                    <td>{t.sla}</td>
                    <td><span className={`d_badge ${priorityBadge(t.priority)}`}>{t.priority}</span></td>
                    <td><span className={`d_badge ${statusBadge(t.status)}`}>{t.status}</span></td>
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
