import React, { useState } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdVisibility, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';

const initSuppliers = [
  { id: 'SUP001', name: 'Techno Parts Pvt Ltd', contact: 'Suresh Shah',  phone: '9876500001', city: 'Surat',     gst: '24AAACT2727Q1ZX', status: 'Active' },
  { id: 'SUP002', name: 'Global Machinery Co.',  contact: 'Rekha Patel',  phone: '9876500002', city: 'Ahmedabad', gst: '24AABCG1234A1Z5', status: 'Active' },
  { id: 'SUP003', name: 'Airjet Components Ltd', contact: 'Manoj Kumar',  phone: '9876500003', city: 'Mumbai',    gst: '27AABCA5678B1Z2', status: 'Active' },
  { id: 'SUP004', name: 'Precision Parts India', contact: 'Nita Joshi',   phone: '9876500004', city: 'Pune',      gst: '27AABCP9012C1Z9', status: 'Inactive' },
];

const initOrders = [
  { id: 'PO-001', supplier: 'Techno Parts Pvt Ltd', date: '20-Jun-2026', items: 12, amount: '₹1,24,500', delivery: '28-Jun-2026', status: 'Pending' },
  { id: 'PO-002', supplier: 'Global Machinery Co.',  date: '18-Jun-2026', items: 8,  amount: '₹87,200',   delivery: '25-Jun-2026', status: 'Received' },
  { id: 'PO-003', supplier: 'Airjet Components Ltd', date: '15-Jun-2026', items: 20, amount: '₹2,10,000', delivery: '22-Jun-2026', status: 'In Transit' },
];

const statusClass = { Active:'d_success', Inactive:'d_danger', Pending:'d_warning', Received:'d_success', 'In Transit':'d_info' };
const blankSup = { name: '', contact: '', phone: '', city: '', gst: '', status: 'Active' };
const blankPO  = { supplier: '', date: '', items: '', amount: '', delivery: '', status: 'Pending' };

const initGRN = [
  { id:'GRN-001', po:'PO-002', supplier:'Global Machinery Co.',  date:'25-Jun-2026', items:8,  amount:'₹87,200',   receivedBy:'Karan Mehta', status:'Verified' },
  { id:'GRN-002', po:'PO-003', supplier:'Airjet Components Ltd', date:'22-Jun-2026', items:18, amount:'₹1,98,000', receivedBy:'Nikhil Rao',  status:'Partial' },
  { id:'GRN-003', po:'PO-001', supplier:'Techno Parts Pvt Ltd',  date:'28-Jun-2026', items:12, amount:'₹1,24,500', receivedBy:'Karan Mehta', status:'Pending' },
];

const initReturns = [
  { id:'RET-001', supplier:'Techno Parts Pvt Ltd',  part:'Reed Valve Assembly', qty:5,  date:'21-Jun-2026', reason:'Defective parts',    amount:'₹2,500', status:'Approved' },
  { id:'RET-002', supplier:'Airjet Components Ltd', part:'Air Jet Nozzle Set',  qty:3,  date:'19-Jun-2026', reason:'Wrong specifications', amount:'₹2,550', status:'Pending' },
  { id:'RET-003', supplier:'Global Machinery Co.',  part:'Main Shaft Bearing',  qty:2,  date:'17-Jun-2026', reason:'Quality issue',        amount:'₹5,000', status:'Approved' },
];

const Purchase = ({ defaultTab = 'suppliers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [suppliers, setSuppliers] = useState(initSuppliers);
  const [orders, setOrders]       = useState(initOrders);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankSup);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});

  const isSup = tab === 'suppliers';

  const openAdd = () => { setForm(isSup ? blankSup : blankPO); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    if (isSup) setForm({ name: row.name, contact: row.contact, phone: row.phone, city: row.city, gst: row.gst, status: row.status });
    else       setForm({ supplier: row.supplier, date: row.date, items: row.items, amount: row.amount, delivery: row.delivery, status: row.status });
    setEditId(row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isSup) {
      if (!form.name?.trim())    e.name    = 'Supplier name is required';
      if (!form.contact?.trim()) e.contact = 'Contact person is required';
      if (!form.phone?.trim())   e.phone   = 'Phone is required';
    } else {
      if (!form.supplier?.trim()) e.supplier = 'Supplier is required';
      if (!form.date?.trim())     e.date     = 'Order date is required';
      if (!form.items)            e.items    = 'Item count is required';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isSup) {
      if (editId) setSuppliers(d => d.map(s => s.id === editId ? { ...s, ...form } : s));
      else { const id = `SUP${String(suppliers.length+1).padStart(3,'0')}`; setSuppliers(d => [...d, { id, ...form }]); }
    } else {
      if (editId) setOrders(d => d.map(o => o.id === editId ? { ...o, ...form } : o));
      else { const id = `PO-${String(orders.length+1).padStart(3,'0')}`; setOrders(d => [...d, { id, ...form }]); }
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isSup) setSuppliers(d => d.filter(s => s.id !== id));
    else       setOrders(d => d.filter(o => o.id !== id));
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Purchase Management</h1>
          <p className="d_page_subtitle">Manage suppliers, purchase orders, GRN and returns</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'suppliers' ? 'Add Supplier' : tab === 'orders' ? 'New PO' : 'New GRN'}
        </button>
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
                <thead><tr><th>ID</th><th>Supplier Name</th><th>Contact Person</th><th>Phone</th><th>City</th><th>GST No.</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {suppliers.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td><td><strong>{s.name}</strong></td><td>{s.contact}</td>
                      <td>{s.phone}</td><td>{s.city}</td><td><code>{s.gst}</code></td>
                      <td><span className={`d_badge ${statusClass[s.status]}`}>{s.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(s)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(s.id)}><MdDelete /></button>
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
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Orders</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>PO No.</th><th>Supplier</th><th>Order Date</th><th>Items</th><th>Amount</th><th>Expected Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td><td><strong>{o.supplier}</strong></td><td>{o.date}</td>
                      <td>{o.items}</td><td><strong>{o.amount}</strong></td><td>{o.delivery}</td>
                      <td><span className={`d_badge ${statusClass[o.status]}`}>{o.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'grn' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Goods Receipt Notes ({initGRN.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Create GRN</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>GRN No.</th><th>PO Ref.</th><th>Supplier</th><th>Date</th><th>Items</th><th>Amount</th><th>Received By</th><th>Status</th></tr></thead>
                <tbody>
                  {initGRN.map(g => (
                    <tr key={g.id}>
                      <td><code>{g.id}</code></td><td><code>{g.po}</code></td><td><strong>{g.supplier}</strong></td>
                      <td>{g.date}</td><td>{g.items}</td><td><strong>{g.amount}</strong></td><td>{g.receivedBy}</td>
                      <td><span className={`d_badge ${g.status === 'Verified' ? 'd_success' : g.status === 'Partial' ? 'd_warning' : 'd_info'}`}>{g.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'returns' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Returns ({initReturns.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> New Return</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Return No.</th><th>Supplier</th><th>Part</th><th>Qty</th><th>Date</th><th>Reason</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {initReturns.map(r => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td><td><strong>{r.supplier}</strong></td><td>{r.part}</td>
                      <td>{r.qty}</td><td>{r.date}</td><td>{r.reason}</td><td><strong>{r.amount}</strong></td>
                      <td><span className={`d_badge ${r.status === 'Approved' ? 'd_success' : 'd_warning'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSup && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Supplier' : 'Add Supplier'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Supplier Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Company name" {...f('name')} />
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
              <input className="d_form_control" placeholder="10-digit number" {...f('phone')} />
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
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Supplier'}</button>
          </div>
        </Modal>
      )}

      {/* PO Modal */}
      {!isSup && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Purchase Order' : 'New Purchase Order'} size="md">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id}>{s.name}</option>)}
              </select>
              {errors.supplier && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.supplier}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Order Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              {errors.date && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.date}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Expected Delivery</label>
              <input type="date" className="d_form_control" {...f('delivery')} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">No. of Items <span className="d_req">*</span></label>
              <input type="number" className="d_form_control" placeholder="e.g. 10" {...f('items')} />
              {errors.items && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.items}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Total Amount (₹)</label>
              <input className="d_form_control" placeholder="e.g. ₹50,000" {...f('amount')} />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>In Transit</option><option>Received</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update PO' : 'Create PO'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchase;
