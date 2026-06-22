import React, { useState } from 'react';
import { MdPointOfSale, MdAdd, MdEdit, MdVisibility, MdDelete, MdDownload } from 'react-icons/md';

const customers = [
  { id: 'CUS001', name: 'Shree Textile Mills',     contact: 'Himesh Patel',  phone: '9876511001', city: 'Surat',     gst: '24AAAST2727Q1Z1', balance: '₹18,500', status: 'Active' },
  { id: 'CUS002', name: 'National Weaving Works',  contact: 'Arun Mehta',    phone: '9876511002', city: 'Navsari',   gst: '24AAANW1234A1Z5', balance: '₹0',      status: 'Active' },
  { id: 'CUS003', name: 'Modi Fabric Industries',  contact: 'Jayesh Modi',   phone: '9876511003', city: 'Vadodara',  gst: '24AAAMO5678B1Z2', balance: '₹42,000', status: 'Active' },
  { id: 'CUS004', name: 'Rajlaxmi Textiles',       contact: 'Nisha Shah',    phone: '9876511004', city: 'Ahmedabad', gst: '24AAART9012C1Z9', balance: '₹5,200',  status: 'Inactive' },
];

const invoices = [
  { id: 'INV-001', customer: 'Shree Textile Mills',    date: '20-Jun-2026', items: 6,  amount: '₹24,500', due: '30-Jun-2026', status: 'Unpaid' },
  { id: 'INV-002', customer: 'National Weaving Works', date: '18-Jun-2026', items: 4,  amount: '₹18,000', due: '28-Jun-2026', status: 'Paid' },
  { id: 'INV-003', customer: 'Modi Fabric Industries', date: '15-Jun-2026', items: 10, amount: '₹42,000', due: '25-Jun-2026', status: 'Overdue' },
  { id: 'INV-004', customer: 'Rajlaxmi Textiles',      date: '12-Jun-2026', items: 3,  amount: '₹12,800', due: '22-Jun-2026', status: 'Paid' },
];

const statusClass = { Active:'d_success', Inactive:'d_danger', Paid:'d_success', Unpaid:'d_warning', Overdue:'d_danger' };

const Sales = () => {
  const [tab, setTab] = useState('customers');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Sales Management</h1>
          <p className="d_page_subtitle">Manage customers, quotations, orders and invoices</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> {tab === 'customers' ? 'Add Customer' : tab === 'invoices' ? 'New Invoice' : 'New Order'}</button>
      </div>

      <div className="d_tabs mb-3">
        {[['customers','Customers'],['quotations','Quotations'],['orders','Sales Orders'],['invoices','Invoices']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'customers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Customers</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Cust ID</th><th>Customer Name</th><th>Contact</th><th>Phone</th><th>City</th><th>GST No.</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td><code>{c.id}</code></td><td><strong>{c.name}</strong></td><td>{c.contact}</td>
                      <td>{c.phone}</td><td>{c.city}</td><td><code>{c.gst}</code></td>
                      <td><strong>{c.balance}</strong></td>
                      <td><span className={`d_badge ${statusClass[c.status]}`}>{c.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Invoices</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Invoice No.</th><th>Customer</th><th>Invoice Date</th><th>Items</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {invoices.map(i => (
                    <tr key={i.id}>
                      <td><code>{i.id}</code></td><td><strong>{i.customer}</strong></td><td>{i.date}</td>
                      <td>{i.items}</td><td><strong>{i.amount}</strong></td><td>{i.due}</td>
                      <td><span className={`d_badge ${statusClass[i.status]}`}>{i.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button><button className="d_icon_btn d_edit"><MdDownload /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(tab === 'quotations' || tab === 'orders') && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}>📄</div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>No {tab === 'quotations' ? 'Quotations' : 'Sales Orders'} found.</p>
          <button className="d_btn d_btn_primary mt-2"><MdAdd /> Create {tab === 'quotations' ? 'Quotation' : 'Sales Order'}</button>
        </div></div>
      )}
    </div>
  );
};
export default Sales;
