import React, { useState } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdVisibility, MdDelete } from 'react-icons/md';

const suppliers = [
  { id: 'SUP001', name: 'Techno Parts Pvt Ltd',  contact: 'Suresh Shah',    phone: '9876500001', city: 'Surat',    gst: '24AAACT2727Q1ZX', status: 'Active' },
  { id: 'SUP002', name: 'Global Machinery Co.',   contact: 'Rekha Patel',    phone: '9876500002', city: 'Ahmedabad',gst: '24AABCG1234A1Z5', status: 'Active' },
  { id: 'SUP003', name: 'Airjet Components Ltd',  contact: 'Manoj Kumar',    phone: '9876500003', city: 'Mumbai',   gst: '27AABCA5678B1Z2', status: 'Active' },
  { id: 'SUP004', name: 'Precision Parts India',  contact: 'Nita Joshi',     phone: '9876500004', city: 'Pune',     gst: '27AABCP9012C1Z9', status: 'Inactive' },
];

const orders = [
  { id: 'PO-001', supplier: 'Techno Parts Pvt Ltd', date: '20-Jun-2026', items: 12, amount: '₹1,24,500', delivery: '28-Jun-2026', status: 'Pending' },
  { id: 'PO-002', supplier: 'Global Machinery Co.', date: '18-Jun-2026', items: 8,  amount: '₹87,200',  delivery: '25-Jun-2026', status: 'Received' },
  { id: 'PO-003', supplier: 'Airjet Components Ltd',date: '15-Jun-2026', items: 20, amount: '₹2,10,000', delivery: '22-Jun-2026', status: 'In Transit' },
  { id: 'PO-004', supplier: 'Precision Parts India',date: '10-Jun-2026', items: 5,  amount: '₹42,500',  delivery: '18-Jun-2026', status: 'Received' },
];

const statusClass = { Active:'d_success', Inactive:'d_danger', Pending:'d_warning', Received:'d_success', 'In Transit':'d_info', Cancelled:'d_danger' };

const Purchase = () => {
  const [tab, setTab] = useState('suppliers');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Purchase Management</h1>
          <p className="d_page_subtitle">Manage suppliers, orders, GRN and returns</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> {tab === 'suppliers' ? 'Add Supplier' : tab === 'orders' ? 'New PO' : 'New GRN'}</button>
      </div>

      <div className="d_tabs mb-3">
        {[['suppliers','Suppliers'],['orders','Purchase Orders'],['grn','GRN'],['returns','Returns']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'suppliers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Suppliers ({suppliers.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Supplier ID</th><th>Supplier Name</th><th>Contact Person</th><th>Phone</th><th>City</th><th>GST No.</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td><td><strong>{s.name}</strong></td><td>{s.contact}</td>
                      <td>{s.phone}</td><td>{s.city}</td><td><code>{s.gst}</code></td>
                      <td><span className={`d_badge ${statusClass[s.status]}`}>{s.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Orders</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>PO Number</th><th>Supplier</th><th>Order Date</th><th>Items</th><th>Amount</th><th>Expected Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td><td><strong>{o.supplier}</strong></td><td>{o.date}</td>
                      <td>{o.items}</td><td><strong>{o.amount}</strong></td><td>{o.delivery}</td>
                      <td><span className={`d_badge ${statusClass[o.status]}`}>{o.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button><button className="d_icon_btn d_edit"><MdEdit /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(tab === 'grn' || tab === 'returns') && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}>📦</div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>No {tab === 'grn' ? 'GRN' : 'Returns'} records found.</p>
          <button className="d_btn d_btn_primary mt-2"><MdAdd /> Create {tab === 'grn' ? 'GRN' : 'Return'}</button>
        </div></div>
      )}
    </div>
  );
};
export default Purchase;
