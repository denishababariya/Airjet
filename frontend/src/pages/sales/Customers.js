import React, { useState } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdPeople } from 'react-icons/md';

const customers = [
  { id: 'CUST001', name: 'Vardhman Textiles Ltd', contact: 'Sanjay Gupta', phone: '+91 98761 23450', city: 'Ludhiana', gst: '03AABCV2345A1Z8', credit: 500000, outstanding: 125000, status: 'Active' },
  { id: 'CUST002', name: 'Welspun India Ltd', contact: 'Pradeep Mehta', phone: '+91 97654 87654', city: 'Anjar', gst: '24AABCW4567B2Z5', credit: 750000, outstanding: 0, status: 'Active' },
  { id: 'CUST003', name: 'Bhilwara Spinners Pvt Ltd', contact: 'Anita Sharma', phone: '+91 94123 56789', city: 'Bhilwara', gst: '08AABPB1234C3Z2', credit: 300000, outstanding: 87500, status: 'Active' },
  { id: 'CUST004', name: 'Arvind Limited (Weaving Division)', contact: 'Ravi Patel', phone: '+91 99001 34567', city: 'Ahmedabad', gst: '24AAACA5678D4Z9', credit: 1000000, outstanding: 234000, status: 'Active' },
  { id: 'CUST005', name: 'Sri Ramakrishna Mills', contact: 'Murugan K', phone: '+91 91234 67890', city: 'Coimbatore', gst: '33AABCS9012E5Z6', credit: 200000, outstanding: 200000, status: 'Inactive' },
];

export default function Customers() {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Customers</div>
          <div className="d_page_subtitle">Manage textile mills and weaving industry clients</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Customer</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Customer List</div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input className="d_search_input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Cust ID</th>
                  <th>Name</th>
                  <th>Contact Person</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>GST No.</th>
                  <th>Credit Limit (₹)</th>
                  <th>Outstanding (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.name}</td>
                    <td>{c.contact}</td>
                    <td>{c.phone}</td>
                    <td>{c.city}</td>
                    <td><code>{c.gst}</code></td>
                    <td>{c.credit.toLocaleString('en-IN')}</td>
                    <td style={{ color: c.outstanding > 0 ? 'var(--d-danger)' : 'inherit' }}>
                      {c.outstanding.toLocaleString('en-IN')}
                    </td>
                    <td><span className={`d_badge ${c.status === 'Active' ? 'd_success' : 'd_danger'}`}>{c.status}</span></td>
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
