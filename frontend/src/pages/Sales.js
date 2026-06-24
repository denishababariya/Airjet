import React, { useState } from 'react';
import { MdPointOfSale, MdAdd, MdEdit, MdVisibility, MdDelete, MdDownload } from 'react-icons/md';
import Modal from '../components/Modal';

const initCustomers = [
  { id: 'CUS001', name: 'Shree Textile Mills',    contact: 'Himesh Patel', phone: '9876511001', city: 'Surat',     gst: '24AAAST2727Q1Z1', balance: '₹18,500', status: 'Active' },
  { id: 'CUS002', name: 'National Weaving Works', contact: 'Arun Mehta',   phone: '9876511002', city: 'Navsari',   gst: '24AAANW1234A1Z5', balance: '₹0',      status: 'Active' },
  { id: 'CUS003', name: 'Modi Fabric Industries', contact: 'Jayesh Modi',  phone: '9876511003', city: 'Vadodara',  gst: '24AAAMO5678B1Z2', balance: '₹42,000', status: 'Active' },
  { id: 'CUS004', name: 'Rajlaxmi Textiles',      contact: 'Nisha Shah',   phone: '9876511004', city: 'Ahmedabad', gst: '24AAART9012C1Z9', balance: '₹5,200',  status: 'Inactive' },
];

const initInvoices = [
  { id: 'INV-001', customer: 'Shree Textile Mills',    date: '20-Jun-2026', items: 6,  amount: '₹24,500', due: '30-Jun-2026', status: 'Unpaid' },
  { id: 'INV-002', customer: 'National Weaving Works', date: '18-Jun-2026', items: 4,  amount: '₹18,000', due: '28-Jun-2026', status: 'Paid' },
  { id: 'INV-003', customer: 'Modi Fabric Industries', date: '15-Jun-2026', items: 10, amount: '₹42,000', due: '25-Jun-2026', status: 'Overdue' },
];

const statusClass = { Active:'d_success', Inactive:'d_danger', Paid:'d_success', Unpaid:'d_warning', Overdue:'d_danger' };
const blankCus = { name: '', contact: '', phone: '', city: '', gst: '', status: 'Active' };
const blankInv = { customer: '', date: '', items: '', amount: '', due: '', status: 'Unpaid' };

const initQuotations = [
  { id:'QT-001', customer:'Shree Textile Mills',    date:'18-Jun-2026', items:8,  amount:'₹38,400', validTill:'28-Jun-2026', status:'Sent' },
  { id:'QT-002', customer:'Modi Fabric Industries', date:'16-Jun-2026', items:5,  amount:'₹22,500', validTill:'26-Jun-2026', status:'Accepted' },
  { id:'QT-003', customer:'Rajlaxmi Textiles',      date:'14-Jun-2026', items:12, amount:'₹54,000', validTill:'24-Jun-2026', status:'Expired' },
];

const initOrders = [
  { id:'SO-001', customer:'Modi Fabric Industries', date:'17-Jun-2026', items:5,  amount:'₹22,500', delivery:'27-Jun-2026', status:'Confirmed' },
  { id:'SO-002', customer:'Shree Textile Mills',    date:'19-Jun-2026', items:8,  amount:'₹38,400', delivery:'29-Jun-2026', status:'Processing' },
  { id:'SO-003', customer:'National Weaving Works', date:'15-Jun-2026', items:10, amount:'₹45,000', delivery:'25-Jun-2026', status:'Delivered' },
];

const Sales = ({ defaultTab = 'customers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [customers, setCustomers] = useState(initCustomers);
  const [invoices, setInvoices]   = useState(initInvoices);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankCus);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});

  const isCus = tab === 'customers';

  const openAdd = () => { setForm(isCus ? blankCus : blankInv); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    if (isCus) setForm({ name: row.name, contact: row.contact, phone: row.phone, city: row.city, gst: row.gst, status: row.status });
    else       setForm({ customer: row.customer, date: row.date, items: row.items, amount: row.amount, due: row.due, status: row.status });
    setEditId(row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isCus) {
      if (!form.name?.trim())    e.name    = 'Customer name is required';
      if (!form.contact?.trim()) e.contact = 'Contact person is required';
      if (!form.phone?.trim())   e.phone   = 'Phone is required';
    } else {
      if (!form.customer?.trim()) e.customer = 'Customer is required';
      if (!form.date?.trim())     e.date     = 'Invoice date is required';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isCus) {
      if (editId) setCustomers(d => d.map(c => c.id === editId ? { ...c, ...form } : c));
      else { const id = `CUS${String(customers.length+1).padStart(3,'0')}`; setCustomers(d => [...d, { id, balance: '₹0', ...form }]); }
    } else {
      if (editId) setInvoices(d => d.map(i => i.id === editId ? { ...i, ...form } : i));
      else { const id = `INV-${String(invoices.length+1).padStart(3,'0')}`; setInvoices(d => [...d, { id, ...form }]); }
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isCus) setCustomers(d => d.filter(c => c.id !== id));
    else       setInvoices(d => d.filter(i => i.id !== id));
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Sales Management</h1>
          <p className="d_page_subtitle">Manage customers, quotations, orders and invoices</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'customers' ? 'Add Customer' : tab === 'invoices' ? 'New Invoice' : 'New Order'}
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[['customers','Customers'],['quotations','Quotations'],['orders','Sales Orders'],['invoices','Invoices']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'customers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Customers ({customers.length})</h2>
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
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(c)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(c.id)}><MdDelete /></button>
                      </div></td>
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
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdDownload /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'quotations' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Quotations ({initQuotations.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> New Quotation</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Quote No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Valid Till</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {initQuotations.map(q => (
                    <tr key={q.id}>
                      <td><code>{q.id}</code></td><td><strong>{q.customer}</strong></td><td>{q.date}</td>
                      <td>{q.items}</td><td><strong>{q.amount}</strong></td><td>{q.validTill}</td>
                      <td><span className={`d_badge ${q.status === 'Accepted' ? 'd_success' : q.status === 'Sent' ? 'd_info' : 'd_danger'}`}>{q.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdEdit /></button>
                      </div></td>
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
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Sales Orders ({initOrders.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> New Order</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Order No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {initOrders.map(o => (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td><td><strong>{o.customer}</strong></td><td>{o.date}</td>
                      <td>{o.items}</td><td><strong>{o.amount}</strong></td><td>{o.delivery}</td>
                      <td><span className={`d_badge ${o.status === 'Delivered' ? 'd_success' : o.status === 'Confirmed' ? 'd_info' : 'd_warning'}`}>{o.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdEdit /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {isCus && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Customer' : 'Add Customer'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Customer / Company Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Shree Textile Mills" {...f('name')} />
              {errors.name && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.name}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Contact Person <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Contact name" {...f('contact')} />
              {errors.contact && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.contact}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Phone <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="10-digit mobile" {...f('phone')} />
              {errors.phone && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.phone}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">City</label>
              <input className="d_form_control" placeholder="e.g. Surat" {...f('city')} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">GST Number</label>
              <input className="d_form_control" placeholder="15-digit GST No." {...f('gst')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Customer'}</button>
          </div>
        </Modal>
      )}

      {/* Invoice Modal */}
      {!isCus && tab === 'invoices' && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Invoice' : 'New Invoice'} size="md">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Customer <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('customer')}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id}>{c.name}</option>)}
              </select>
              {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Invoice Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              {errors.date && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.date}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Due Date</label>
              <input type="date" className="d_form_control" {...f('due')} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">No. of Items</label>
              <input type="number" className="d_form_control" placeholder="e.g. 5" {...f('items')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input className="d_form_control" placeholder="e.g. ₹25,000" {...f('amount')} />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Unpaid</option><option>Paid</option><option>Overdue</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Invoice' : 'Create Invoice'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sales;
