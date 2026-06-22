import React from 'react';
import { MdInventory, MdWarning, MdCheckCircle, MdCancel } from 'react-icons/md';

const inventory = [
  { no: 'AJ-NZ-001', name: 'Main Nozzle Assembly', category: 'Nozzle', opening: 45, received: 20, issued: 32, closing: 33, status: 'In Stock' },
  { no: 'AJ-SN-002', name: 'Sub Nozzle Set (10 pcs)', category: 'Nozzle', opening: 60, received: 30, issued: 52, closing: 38, status: 'In Stock' },
  { no: 'AJ-RP-003', name: 'Reed Profile 44" 600 Dents', category: 'Reed', opening: 12, received: 5, issued: 14, closing: 3, status: 'Low Stock' },
  { no: 'AJ-HB-004', name: 'Heald Frame Complete', category: 'Shedding', opening: 8, received: 0, issued: 8, closing: 0, status: 'Out of Stock' },
  { no: 'AJ-WB-005', name: 'Warp Beam Bearing Set', category: 'Bearing', opening: 30, received: 10, issued: 18, closing: 22, status: 'In Stock' },
  { no: 'AJ-TC-006', name: 'Tension Controller Spring', category: 'Tension', opening: 50, received: 0, issued: 6, closing: 44, status: 'In Stock' },
];

const statusBadge = s => {
  if (s === 'In Stock') return 'd_success';
  if (s === 'Low Stock') return 'd_warning';
  return 'd_danger';
};

const statusIcon = s => {
  if (s === 'In Stock') return <MdCheckCircle />;
  if (s === 'Low Stock') return <MdWarning />;
  return <MdCancel />;
};

const summaryCards = [
  { label: 'Total Parts', value: inventory.length, color: 'var(--d-accent)' },
  { label: 'In Stock', value: inventory.filter(i => i.status === 'In Stock').length, color: 'var(--d-success)' },
  { label: 'Low Stock', value: inventory.filter(i => i.status === 'Low Stock').length, color: 'var(--d-warning)' },
  { label: 'Out of Stock', value: inventory.filter(i => i.status === 'Out of Stock').length, color: 'var(--d-danger)' },
];

export default function InventoryReport() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Inventory Report</div>
          <div className="d_page_subtitle">Current stock levels and movement summary — June 2026</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(c => (
          <div className="d_card" key={c.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdInventory /></span>{c.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdInventory /></span>Stock Movement Report</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Part No.</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>Opening Stock</th>
                  <th>Received</th>
                  <th>Issued</th>
                  <th>Closing Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(i => (
                  <tr key={i.no}>
                    <td><strong>{i.no}</strong></td>
                    <td>{i.name}</td>
                    <td>{i.category}</td>
                    <td>{i.opening}</td>
                    <td style={{ color: 'var(--d-success)' }}>+{i.received}</td>
                    <td style={{ color: 'var(--d-danger)' }}>-{i.issued}</td>
                    <td><strong>{i.closing}</strong></td>
                    <td>
                      <span className={`d_badge ${statusBadge(i.status)}`}>
                        {statusIcon(i.status)} {i.status}
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
