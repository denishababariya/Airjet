import React, { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdBuild } from 'react-icons/md';

const parts = [
  { no: 'AJ-NZ-001', name: 'Main Nozzle Assembly', category: 'Nozzle', brand: 'Picanol', uom: 'Pcs', price: 4850, hsn: '84483200', status: 'Active' },
  { no: 'AJ-SN-002', name: 'Sub Nozzle Set (10 pcs)', category: 'Nozzle', brand: 'Tsudakoma', uom: 'Set', price: 2200, hsn: '84483200', status: 'Active' },
  { no: 'AJ-RP-003', name: 'Reed Profile 44" 600 Dents', category: 'Reed', brand: 'Grob Horgen', uom: 'Pcs', price: 8900, hsn: '84483100', status: 'Active' },
  { no: 'AJ-HB-004', name: 'Heald Frame Complete', category: 'Shedding', brand: 'Staubli', uom: 'Set', price: 15500, hsn: '84483300', status: 'Active' },
  { no: 'AJ-WB-005', name: 'Warp Beam Bearing Set', category: 'Bearing', brand: 'SKF', uom: 'Set', price: 3400, hsn: '84821010', status: 'Active' },
  { no: 'AJ-TC-006', name: 'Tension Controller Spring', category: 'Tension System', brand: 'Dornier', uom: 'Pcs', price: 780, hsn: '73209090', status: 'Inactive' },
];

export default function PartNumber() {
  const [search, setSearch] = useState('');

  const filtered = parts.filter(p =>
    p.no.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Part Number Master</div>
          <div className="d_page_subtitle">Manage airjet loom spare part numbers and details</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Part</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBuild /></span>Parts List</div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input className="d_search_input" placeholder="Search part no., name, category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Part No.</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>UOM</th>
                  <th>Unit Price (₹)</th>
                  <th>HSN Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.no}>
                    <td><strong>{p.no}</strong></td>
                    <td>{p.name}</td>
                    <td><span className="d_badge d_info">{p.category}</span></td>
                    <td>{p.brand}</td>
                    <td>{p.uom}</td>
                    <td>₹{p.price.toLocaleString('en-IN')}</td>
                    <td><code>{p.hsn}</code></td>
                    <td><span className={`d_badge ${p.status === 'Active' ? 'd_success' : 'd_danger'}`}>{p.status}</span></td>
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
