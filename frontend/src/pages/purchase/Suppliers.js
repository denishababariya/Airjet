import React, { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdLocalShipping } from 'react-icons/md';

const suppliers = [
  { id: 'SUP001', name: 'Picanol Spare Parts India Pvt Ltd', contact: 'Rajiv Mehta', phone: '+91 98201 34567', city: 'Surat', gst: '24AABCP1234A1Z5', terms: 'Net 30', status: 'Active' },
  { id: 'SUP002', name: 'Tsudakoma Components Hub', contact: 'Hiroshi Tanaka', phone: '+91 99004 56789', city: 'Ahmedabad', gst: '24AATCT5678B2Z8', terms: 'Net 45', status: 'Active' },
  { id: 'SUP003', name: 'Toyota Industries Parts Centre', contact: 'Amit Shah', phone: '+91 97123 78901', city: 'Mumbai', gst: '27AACCT9012C3Z2', terms: 'Net 30', status: 'Active' },
  { id: 'SUP004', name: 'Dornier Loom Parts Distributor', contact: 'Klaus Werner', phone: '+91 91234 11223', city: 'Coimbatore', gst: '33AABPD3456D4Z7', terms: 'Net 60', status: 'Active' },
  { id: 'SUP005', name: 'Sulzer Rüti Spare Parts Co', contact: 'Priya Nair', phone: '+91 94567 44556', city: 'Tiruppur', gst: '33AABCS7890E5Z1', terms: 'Net 30', status: 'Inactive' },
];

export default function Suppliers() {
  const [search, setSearch] = useState('');

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Suppliers</div>
          <div className="d_page_subtitle">Manage airjet loom spare parts suppliers</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Supplier</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdLocalShipping /></span>Supplier List</div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input className="d_search_input" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Supplier ID</th>
                  <th>Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>GST No.</th>
                  <th>Payment Terms</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.name}</td>
                    <td>{s.contact}</td>
                    <td>{s.phone}</td>
                    <td>{s.city}</td>
                    <td><code>{s.gst}</code></td>
                    <td>{s.terms}</td>
                    <td><span className={`d_badge ${s.status === 'Active' ? 'd_success' : 'd_danger'}`}>{s.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del"><MdDelete /></button>
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
