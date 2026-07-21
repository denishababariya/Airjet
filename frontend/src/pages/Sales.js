import React, { useState, useEffect } from 'react';
import { MdPointOfSale, MdAdd, MdEdit, MdVisibility, MdDelete, MdDownload } from 'react-icons/md';
import Modal from '../components/Modal';
import { customersApi, erpApi } from '../utils/api';

const statusClass = { Active:'d_success', Inactive:'d_danger', Paid:'d_success', Unpaid:'d_warning', Overdue:'d_danger', Sent:'d_info', Accepted:'d_success', Expired:'d_danger', Confirmed:'d_info', Processing:'d_warning', Delivered:'d_success' };
const blankCus = { name: '', contact: '', phone: '', city: '', gst: '', status: 'Active' };
const blankDoc = { customer: '', date: '', items: '', amount: '', due: '', delivery: '', validTill: '', status: 'Unpaid' };

const TAB_TYPE = { quotations: 'quotation', orders: 'order', invoices: 'invoice' };

const Sales = ({ defaultTab = 'customers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [customers, setCustomers] = useState([]);
  const [salesDocs, setSalesDocs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankCus);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});

  const isCus = tab === 'customers';
  const isDoc = ['quotations', 'orders', 'invoices'].includes(tab);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await customersApi.getAll();
      setCustomers(list);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesDocs = async () => {
    try {
      const { data } = await erpApi.getAll('sales', TAB_TYPE[tab]);
      setSalesDocs(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load sales data');
    }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { if (isDoc) fetchSalesDocs(); }, [tab]);

  const openAdd = () => { setForm(isCus ? blankCus : blankDoc); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    if (isCus) setForm({ name: row.name, contact: row.contactPerson || row.contact || '', phone: row.phone, city: row.city, gst: row.gstNumber || row.gst || '', status: row.status });
    else setForm({ customer: row.customer, date: row.date, items: row.items, amount: row.amount, due: row.due || '', delivery: row.delivery || '', validTill: row.validTill || '', status: row.status });
    setEditId(row._id || row.id); setErrors({}); setModal(true);
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

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (isCus) {
      const payload = {
        name: form.name,
        contactPerson: form.contact,
        phone: form.phone,
        city: form.city,
        gstNumber: form.gst,
        status: form.status,
      };
      try {
        if (editId) await customersApi.update(editId, payload);
        else await customersApi.create(payload);
        setModal(false);
        fetchCustomers();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save customer');
      }
    } else {
      try {
        const payload = {
          module: 'sales',
          recordType: TAB_TYPE[tab],
          customer: form.customer,
          date: form.date,
          items: Number(form.items) || 0,
          amount: Number(String(form.amount).replace(/[^\d.]/g, '')) || 0,
          due: form.due,
          delivery: form.delivery,
          validTill: form.validTill,
          status: form.status,
        };
        if (editId) await erpApi.update(editId, payload);
        else await erpApi.create(payload);
        setModal(false);
        fetchSalesDocs();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isCus) {
      try { await customersApi.remove(id); fetchCustomers(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete customer'); }
    } else {
      try { await erpApi.remove(id); fetchSalesDocs(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete'); }
    }
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
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {loading ? (
              <div className="text-center py-4">Loading customers…</div>
            ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Cust ID</th><th>Customer Name</th><th>Contact</th><th>Phone</th><th>City</th><th>GST No.</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {customers.length === 0 && <tr className="d_empty"><td colSpan={9}>No customers found.</td></tr>}
                  {customers.map(c => (
                    <tr key={c._id}>
                      <td><code>{c.id}</code></td><td><strong>{c.name}</strong></td><td>{c.contactPerson || c.contact || '-'}</td>
                      <td>{c.phone}</td><td>{c.city}</td><td><code>{c.gstNumber || c.gst || '-'}</code></td>
                      <td><strong>₹{(c.currentBalance || 0).toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${statusClass[c.status] || 'd_info'}`}>{c.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(c)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(c._id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Invoices ({salesDocs.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Invoice No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {salesDocs.map(i => (
                    <tr key={i._id}>
                      <td><code>{i.id}</code></td><td><strong>{i.customer}</strong></td><td>{i.date}</td>
                      <td>{i.items}</td><td><strong>₹{(i.amount||0).toLocaleString()}</strong></td><td>{i.due}</td>
                      <td><span className={`d_badge ${statusClass[i.status]}`}>{i.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(i)}><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(i._id)}><MdDelete /></button>
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
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Quotations ({salesDocs.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Quote No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Valid Till</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {salesDocs.map(q => (
                    <tr key={q._id}>
                      <td><code>{q.id}</code></td><td><strong>{q.customer}</strong></td><td>{q.date}</td>
                      <td>{q.items}</td><td><strong>₹{(q.amount||0).toLocaleString()}</strong></td><td>{q.validTill}</td>
                      <td><span className={`d_badge ${statusClass[q.status] || 'd_info'}`}>{q.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(q)}><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(q._id)}><MdDelete /></button>
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
            <h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Sales Orders ({salesDocs.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Order No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {salesDocs.map(o => (
                    <tr key={o._id}>
                      <td><code>{o.id}</code></td><td><strong>{o.customer}</strong></td><td>{o.date}</td>
                      <td>{o.items}</td><td><strong>₹{(o.amount||0).toLocaleString()}</strong></td><td>{o.delivery}</td>
                      <td><span className={`d_badge ${statusClass[o.status] || 'd_info'}`}>{o.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(o._id)}><MdDelete /></button>
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

      {/* Sales Document Modal */}
      {!isCus && isDoc && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit' : 'Add'} size="md">
          <div className="d_form_group mb-2">
            <label className="d_form_label">Customer <span className="d_req">*</span></label>
            <select className="d_form_control" value={form.customer} onChange={e => setForm(p => ({ ...p, customer: e.target.value }))}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Date</label><input type="date" className="d_form_control" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="d_form_group"><label className="d_form_label">Items</label><input type="number" className="d_form_control" value={form.items} onChange={e => setForm(p => ({ ...p, items: e.target.value }))} /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Amount (₹)</label><input className="d_form_control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div className="d_form_group"><label className="d_form_label">Status</label>
              <select className="d_form_control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                {tab === 'invoices' ? <><option>Unpaid</option><option>Paid</option><option>Overdue</option></> :
                 tab === 'orders' ? <><option>Confirmed</option><option>Processing</option><option>Delivered</option></> :
                 <><option>Sent</option><option>Accepted</option><option>Expired</option></>}
              </select>
            </div>
          </div>
          {tab === 'invoices' && <div className="d_form_group"><label className="d_form_label">Due Date</label><input type="date" className="d_form_control" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))} /></div>}
          {tab === 'orders' && <div className="d_form_group"><label className="d_form_label">Delivery Date</label><input type="date" className="d_form_control" value={form.delivery} onChange={e => setForm(p => ({ ...p, delivery: e.target.value }))} /></div>}
          {tab === 'quotations' && <div className="d_form_group"><label className="d_form_label">Valid Till</label><input type="date" className="d_form_control" value={form.validTill} onChange={e => setForm(p => ({ ...p, validTill: e.target.value }))} /></div>}
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sales;
