import React from 'react';
import { MdAdd, MdEdit, MdVisibility, MdSwapHoriz } from 'react-icons/md';

const transfers = [
  { id: 'TRF-2026-018', from: 'Main Warehouse — Surat', to: 'Secondary Store — Ahmedabad', part: 'Main Nozzle Assembly', partNo: 'AJ-NZ-001', qty: 20, date: '21 Jun 2026', by: 'Nilesh Gaikwad', status: 'Completed' },
  { id: 'TRF-2026-017', from: 'Transit Hub — Mumbai', to: 'Main Warehouse — Surat', part: 'Reed Profile 44" 600 Dents', partNo: 'AJ-RP-003', qty: 5, date: '20 Jun 2026', by: 'Pooja Tiwari', status: 'Completed' },
  { id: 'TRF-2026-016', from: 'Main Warehouse — Surat', to: 'Transit Hub — Mumbai', part: 'Sub Nozzle Set', partNo: 'AJ-SN-002', qty: 30, date: '19 Jun 2026', by: 'Nilesh Gaikwad', status: 'In Transit' },
  { id: 'TRF-2026-015', from: 'Secondary Store — Ahmedabad', to: 'Main Warehouse — Surat', part: 'Warp Beam Bearing Set', partNo: 'AJ-WB-005', qty: 10, date: '18 Jun 2026', by: 'Pooja Tiwari', status: 'Completed' },
  { id: 'TRF-2026-014', from: 'Main Warehouse — Surat', to: 'Secondary Store — Ahmedabad', part: 'Heald Frame Complete', partNo: 'AJ-HB-004', qty: 4, date: '15 Jun 2026', by: 'Nilesh Gaikwad', status: 'Pending' },
];

const statusBadge = s => {
  if (s === 'Completed') return 'd_success';
  if (s === 'In Transit') return 'd_info';
  return 'd_warning';
};

export default function StockTransfers() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Stock Transfers</div>
          <div className="d_page_subtitle">Move stock between warehouse locations</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Transfer</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdSwapHoriz /></span>Transfer List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Transfer ID</th>
                  <th>From Warehouse</th>
                  <th>To Warehouse</th>
                  <th>Part Name</th>
                  <th>Part No.</th>
                  <th>Qty</th>
                  <th>Transfer Date</th>
                  <th>Initiated By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.id}</strong></td>
                    <td style={{ fontSize: '0.88rem' }}>{t.from}</td>
                    <td style={{ fontSize: '0.88rem' }}>{t.to}</td>
                    <td>{t.part}</td>
                    <td><code>{t.partNo}</code></td>
                    <td>{t.qty}</td>
                    <td>{t.date}</td>
                    <td>{t.by}</td>
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
