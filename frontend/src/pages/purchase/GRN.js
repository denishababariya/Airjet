import React from 'react';
import { MdVisibility, MdEdit, MdInventory, MdAdd } from 'react-icons/md';

const grns = [
  { id: 'GRN-2026-021', po: 'PO-2026-0040', supplier: 'Tsudakoma Components Hub', date: '20 Jun 2026', items: 5, received: 5, shortage: 0, quality: 'Passed' },
  { id: 'GRN-2026-020', po: 'PO-2026-0039', supplier: 'Toyota Industries Parts Centre', date: '18 Jun 2026', items: 12, received: 10, shortage: 2, quality: 'Partial' },
  { id: 'GRN-2026-019', po: 'PO-2026-0038', supplier: 'Dornier Loom Parts Distributor', date: '14 Jun 2026', items: 3, received: 3, shortage: 0, quality: 'Passed' },
  { id: 'GRN-2026-018', po: 'PO-2026-0036', supplier: 'Picanol Spare Parts India', date: '10 Jun 2026', items: 7, received: 7, shortage: 0, quality: 'Failed' },
  { id: 'GRN-2026-017', po: 'PO-2026-0035', supplier: 'Sulzer Rüti Spare Parts Co', date: '05 Jun 2026', items: 4, received: 4, shortage: 0, quality: 'Passed' },
];

const qualityBadge = q => {
  if (q === 'Passed') return 'd_success';
  if (q === 'Failed') return 'd_danger';
  return 'd_warning';
};

export default function GRN() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Goods Receipt Note (GRN)</div>
          <div className="d_page_subtitle">Track received goods against purchase orders</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New GRN</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdInventory /></span>GRN List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>GRN ID</th>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Received Date</th>
                  <th>Items (Ordered)</th>
                  <th>Received Qty</th>
                  <th>Shortage</th>
                  <th>Quality Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grns.map(g => (
                  <tr key={g.id}>
                    <td><strong>{g.id}</strong></td>
                    <td>{g.po}</td>
                    <td>{g.supplier}</td>
                    <td>{g.date}</td>
                    <td>{g.items}</td>
                    <td>{g.received}</td>
                    <td>
                      {g.shortage > 0
                        ? <span className="d_badge d_danger">{g.shortage}</span>
                        : <span className="d_badge d_success">0</span>}
                    </td>
                    <td><span className={`d_badge ${qualityBadge(g.quality)}`}>{g.quality}</span></td>
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
