import React from 'react';
import { MdAdd, MdEdit, MdVisibility, MdFactCheck } from 'react-icons/md';

const audits = [
  { id: 'AUD-2026-004', warehouse: 'Main Warehouse — Surat', date: '20 Jun 2026', auditor: 'Nilesh Gaikwad', total: 211, matched: 205, discrepancy: 6, status: 'Completed' },
  { id: 'AUD-2026-003', warehouse: 'Secondary Store — Ahmedabad', date: '15 Jun 2026', auditor: 'Pooja Tiwari', total: 178, matched: 178, discrepancy: 0, status: 'Completed' },
  { id: 'AUD-2026-002', warehouse: 'Transit Hub — Mumbai', date: '22 Jun 2026', auditor: 'Ramesh Kulkarni', total: 94, matched: 62, discrepancy: 0, status: 'In Progress' },
  { id: 'AUD-2026-001', warehouse: 'Main Warehouse — Surat', date: '30 Jun 2026', auditor: 'Nilesh Gaikwad', total: 0, matched: 0, discrepancy: 0, status: 'Scheduled' },
];

const statusBadge = s => {
  if (s === 'Completed') return 'd_success';
  if (s === 'In Progress') return 'd_info';
  return 'd_warning';
};

export default function StockAudits() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Stock Audits</div>
          <div className="d_page_subtitle">Schedule and track physical stock verification audits</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Schedule Audit</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdFactCheck /></span>Audit List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Warehouse</th>
                  <th>Audit Date</th>
                  <th>Auditor</th>
                  <th>Total Items</th>
                  <th>Matched</th>
                  <th>Discrepancy</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {audits.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.id}</strong></td>
                    <td>{a.warehouse}</td>
                    <td>{a.date}</td>
                    <td>{a.auditor}</td>
                    <td>{a.total || '—'}</td>
                    <td>{a.matched || '—'}</td>
                    <td>
                      {a.status === 'Scheduled' ? '—' : a.discrepancy > 0
                        ? <span className="d_badge d_danger">{a.discrepancy}</span>
                        : <span className="d_badge d_success">0</span>}
                    </td>
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
