import React from 'react';
import { MdAdd, MdVisibility, MdEdit, MdAssignmentReturn } from 'react-icons/md';

const returns = [
  { id: 'RET-2026-008', supplier: 'Tsudakoma Components Hub', po: 'PO-2026-0040', date: '21 Jun 2026', items: 2, amount: 18400, reason: 'Wrong specifications supplied', status: 'Approved' },
  { id: 'RET-2026-007', supplier: 'Toyota Industries Parts Centre', po: 'PO-2026-0039', date: '19 Jun 2026', items: 2, amount: 32000, reason: 'Damage during transit', status: 'Approved' },
  { id: 'RET-2026-006', supplier: 'Picanol Spare Parts India', po: 'PO-2026-0036', date: '12 Jun 2026', items: 3, amount: 45600, reason: 'Quality inspection failure', status: 'Pending' },
  { id: 'RET-2026-005', supplier: 'Dornier Loom Parts Distributor', po: 'PO-2026-0033', date: '08 Jun 2026', items: 1, amount: 8900, reason: 'Defective nozzle assembly', status: 'Pending' },
  { id: 'RET-2026-004', supplier: 'Sulzer Rüti Spare Parts Co', po: 'PO-2026-0030', date: '01 Jun 2026', items: 2, amount: 27500, reason: 'Incompatible with machine model', status: 'Rejected' },
];

const statusBadge = s => {
  if (s === 'Approved') return 'd_success';
  if (s === 'Rejected') return 'd_danger';
  return 'd_warning';
};

export default function Returns() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Purchase Returns</div>
          <div className="d_page_subtitle">Track and manage goods returned to suppliers</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Return</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAssignmentReturn /></span>Returns List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Supplier</th>
                  <th>Original PO</th>
                  <th>Return Date</th>
                  <th>Items</th>
                  <th>Amount (₹)</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong></td>
                    <td>{r.supplier}</td>
                    <td>{r.po}</td>
                    <td>{r.date}</td>
                    <td>{r.items}</td>
                    <td>₹{r.amount.toLocaleString('en-IN')}</td>
                    <td>{r.reason}</td>
                    <td><span className={`d_badge ${statusBadge(r.status)}`}>{r.status}</span></td>
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
