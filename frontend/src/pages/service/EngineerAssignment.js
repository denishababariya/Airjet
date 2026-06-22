import React from 'react';
import { MdEdit, MdVisibility, MdEngineeringOutlined, MdEngineering } from 'react-icons/md';

const assignments = [
  { id: 'ASN-2026-018', engineer: 'Vikram Chauhan', ticket: 'TKT-2026-041', customer: 'Arvind Limited', location: 'Ahmedabad, GJ', assigned: '21 Jun 2026', scheduled: '23 Jun 2026', skills: 'Picanol, Air Systems', status: 'Active' },
  { id: 'ASN-2026-017', engineer: 'Deepak Rao', ticket: 'TKT-2026-040', customer: 'Vardhman Textiles Ltd', location: 'Ludhiana, PB', assigned: '20 Jun 2026', scheduled: '22 Jun 2026', skills: 'Toyota, Shedding', status: 'Active' },
  { id: 'ASN-2026-016', engineer: 'Ramesh Kulkarni', ticket: 'TKT-2026-039', customer: 'Welspun India Ltd', location: 'Anjar, GJ', assigned: '19 Jun 2026', scheduled: '21 Jun 2026', skills: 'Tsudakoma, Reed Systems', status: 'Active' },
  { id: 'ASN-2026-015', engineer: 'Nilesh Gaikwad', ticket: 'TKT-2026-038', customer: 'Bhilwara Spinners', location: 'Bhilwara, RJ', assigned: '17 Jun 2026', scheduled: '19 Jun 2026', skills: 'Dornier, Electrical', status: 'Completed' },
  { id: 'ASN-2026-014', engineer: 'Alka Bhosale', ticket: 'TKT-2026-037', customer: 'Sri Ramakrishna Mills', location: 'Coimbatore, TN', assigned: '15 Jun 2026', scheduled: '17 Jun 2026', skills: 'Picanol, Bearings', status: 'Completed' },
];

const statusBadge = s => {
  if (s === 'Completed') return 'd_success';
  if (s === 'Active') return 'd_info';
  return 'd_warning';
};

export default function EngineerAssignment() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Engineer Assignment</div>
          <div className="d_page_subtitle">Assign and manage service engineer field assignments</div>
        </div>
        <button className="d_btn d_btn_primary"><MdEngineering /> New Assignment</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdEngineering /></span>Assignment List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Assignment ID</th>
                  <th>Engineer Name</th>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Assigned Date</th>
                  <th>Scheduled Date</th>
                  <th>Skills</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.id}</strong></td>
                    <td>{a.engineer}</td>
                    <td>{a.ticket}</td>
                    <td>{a.customer}</td>
                    <td>{a.location}</td>
                    <td>{a.assigned}</td>
                    <td>{a.scheduled}</td>
                    <td style={{ fontSize: '0.85rem' }}>{a.skills}</td>
                    <td><span className={`d_badge ${statusBadge(a.status)}`}>{a.status}</span></td>
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
