import React from 'react';
import { MdEdit, MdVisibility, MdWarehouse, MdInventory2 } from 'react-icons/md';

const warehouses = [
  { id: 'WH001', name: 'Main Warehouse — Surat', location: 'Plot 14, GIDC, Sachin, Surat, GJ', capacity: 4000, used: 2850, manager: 'Nilesh Gaikwad', status: 'Active' },
  { id: 'WH002', name: 'Secondary Store — Ahmedabad', location: 'Unit 7, Vatva Industrial Estate, Ahmedabad, GJ', capacity: 3000, used: 1920, manager: 'Pooja Tiwari', status: 'Active' },
  { id: 'WH003', name: 'Transit Hub — Mumbai', location: 'Shed B, Bhiwandi Logistics Park, Mumbai, MH', capacity: 2000, used: 700, manager: 'Mahesh Pandey', status: 'Active' },
];

const summaryCards = [
  { label: 'Total Warehouses', value: 3, color: 'var(--d-accent)' },
  { label: 'Total Capacity', value: '9,000 sq.ft', color: 'var(--d-info)' },
  { label: 'Total Used', value: '5,470 sq.ft', color: 'var(--d-warning)' },
  { label: 'Available', value: '3,530 sq.ft', color: 'var(--d-success)' },
];

export default function MultipleWarehouses() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Warehouses</div>
          <div className="d_page_subtitle">Manage multiple warehouse locations and capacity</div>
        </div>
        <button className="d_btn d_btn_primary"><MdWarehouse /> Add Warehouse</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {summaryCards.map(s => (
          <div className="d_card" key={s.label}>
            <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdInventory2 /></span>{s.label}</div></div>
            <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdWarehouse /></span>Warehouse List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>WH ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Total Capacity</th>
                  <th>Used</th>
                  <th>Available</th>
                  <th>Utilization %</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map(w => {
                  const avail = w.capacity - w.used;
                  const util = Math.round((w.used / w.capacity) * 100);
                  return (
                    <tr key={w.id}>
                      <td>{w.id}</td>
                      <td><strong>{w.name}</strong></td>
                      <td style={{ fontSize: '0.85rem' }}>{w.location}</td>
                      <td>{w.capacity.toLocaleString('en-IN')}</td>
                      <td>{w.used.toLocaleString('en-IN')}</td>
                      <td>{avail.toLocaleString('en-IN')}</td>
                      <td>
                        <span className={`d_badge ${util > 85 ? 'd_danger' : util > 65 ? 'd_warning' : 'd_success'}`}>
                          {util}%
                        </span>
                      </td>
                      <td>{w.manager}</td>
                      <td><span className="d_badge d_success">{w.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit"><MdEdit /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
