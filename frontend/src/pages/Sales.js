import React, { useState, useEffect } from 'react';
import { MdPointOfSale, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { customersApi, erpApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = {
  Active:'d_success', Inactive:'d_danger', Paid:'d_success', Unpaid:'d_warning',
  Overdue:'d_danger', Sent:'d_info', Accepted:'d_success', Expired:'d_danger',
  Confirmed:'d_info', Processing:'d_warning', Delivered:'d_success',
};
const blankCus = { name: '', contact: '', phone: '', email: '', city: '', gst: '', status: 'Active' };
const blankDoc = { customer: '', date: '', items: '', amount: '', due: '', delivery: '', validTill: '', status: 'Unpaid' };
const TAB_TYPE  = { quotations: 'quotation', orders: 'order', invoices: 'invoice' };

const strField   = (v) => (v && typeof v === 'object') ? (v.name || v.title || '') : (v || '');
const itemsCount = (v) => Array.isArray(v) ? v.length : (v ?? '-');

const Sales = ({ defaultTab = 'customers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [customers, setCustomers] = useState([]);
  const [salesDocs, setSalesDocs] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankCus);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const isCus = tab === 'customers';
  const isDoc = ['quotations', 'orders', 'invoices'].includes(tab);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data: list } = await customersApi.getAll();
      setCustomers(list);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load customers');
    } finally { setLoading(false); }
  };

  const fetchSalesDocs = async () => {
    try {
      const { data } = await erpApi.getAll('sales', TAB_TYPE[tab]);
      setSalesDocs(data);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load sales data');
    }
  };

  useEffect(() => { fetchCustomers(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isDoc) fetchSalesDocs(); }, [tab]);

  const openAdd = () => {
    setForm(isCus ? blankCus : blankDoc);
    setEditId(null); setErrors({}); setModal(true);
  };
  const openEdit = (row) => {
    if (isCus) setForm({
      name: row.name || '', contact: row.contactPerson || row.contact || '',
      phone: row.phone || '', email: row.email || '',
      city: row.city || '', gst: row.gstNumber || row.gst || '', status: row.status || 'Active',
    });
    else setForm({
      customer: strField(row.customer), date: row.date || '',
      items: Array.isArray(row.items) ? row.items.length : (row.items || ''),
      amount: row.amount || '', due: row.due || '',
      delivery: row.delivery || '', validTill: row.validTill || '', status: row.status || 'Unpaid',
    });
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => {
    if (isCus) return validate({
      name:    V.companyName(form.name, 'Customer name'),
      contact: V.name(form.contact, 'Contact person'),
      phone:   V.phone(form.phone),
      email:   V.email(form.email, 'Email', false),
      gst:     V.gst(form.gst),
    });
    return validate({
      customer: V.required(form.customer, 'Customer'),
      date:     V.date(form.date, 'Date'),
      items:    form.items ? V.positiveInt(form.items, 'Items count') : '',
      amount:   V.optionalAmount(form.amount, 'Amount'),
    });
  };

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (isCus) {
        const payload = {
          name: form.name.trim(), contactPerson: form.contact.trim(),
          phone: form.phone.trim(), email: form.email?.trim() || '',
          city: form.city?.trim() || '', gstNumber: form.gst?.trim().toUpperCase() || '',
          status: form.status,
        };
        if (editId) await customersApi.update(editId, payload);
        else        await customersApi.create(payload);
        toast.success(editId ? 'Customer updated!' : 'Customer added!');
        fetchCustomers();
      } else {
        const payload = {
          module: 'sales', recordType: TAB_TYPE[tab],
          customer: form.customer, date: form.date,
          items: Number(form.items) || 0,
          amount: Number(String(form.amount).replace(/[^\d.]/g, '')) || 0,
          due: form.due, delivery: form.delivery, validTill: form.validTill, status: form.status,
        };
        if (editId) await erpApi.update(editId, payload);
        else        await erpApi.create(payload);
        toast.success(editId ? 'Record updated!' : 'Record created!');
        fetchSalesDocs();
      }
      setModal(false);
    } catch (err) {
      toast.error(err.displayMessage || err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, label) => {
    confirm({
      title: 'Delete Record', message: `Delete ${label}? This cannot be undone.`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          if (isCus) { await customersApi.remove(id); fetchCustomers(); }
          else       { await erpApi.remove(id); fetchSalesDocs(); }
          toast.success('Record deleted.');
        } catch (err) { toast.error(err.displayMessage || 'Failed to delete'); }
      },
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Sales Management</h1>
          <p className="d_page_subtitle">Manage customers, quotations, orders and invoices</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'customers' ? 'Add Customer' : tab === 'invoices' ? 'New Invoice' : tab === 'orders' ? 'New Order' : 'New Quotation'}
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
            {loading ? <div className="text-center py-4">Loading customers…</div> : (
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Phone</th><th>City</th><th>GST No.</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {customers.length === 0 && <tr className="d_empty"><td colSpan={9}>No customers found.</td></tr>}
                {customers.map(c => (
                  <tr key={c._id}>
                    <td><code>{String(c.id)}</code></td><td><strong>{String(c.name)}</strong></td>
                    <td>{String(c.contactPerson || c.contact || '-')}</td><td>{String(c.phone || '-')}</td>
                    <td>{String(c.city || '-')}</td><td><code>{String(c.gstNumber || c.gst || '-')}</code></td>
                    <td><strong>₹{(c.currentBalance||0).toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${statusClass[c.status]||'d_info'}`}>{String(c.status)}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" title="Edit" onClick={() => openEdit(c)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  title="Delete" onClick={() => handleDelete(c._id, `customer "${c.name}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            )}
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Invoices ({salesDocs.length})</h2></div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Invoice No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {salesDocs.length === 0 && <tr className="d_empty"><td colSpan={8}>No invoices found.</td></tr>}
                {salesDocs.map(i => (
                  <tr key={i._id}>
                    <td><code>{String(i.id)}</code></td><td><strong>{strField(i.customer)}</strong></td><td>{String(i.date)}</td>
                    <td>{itemsCount(i.items)}</td><td><strong>₹{(i.amount||0).toLocaleString('en-IN')}</strong></td><td>{String(i.due||'-')}</td>
                    <td><span className={`d_badge ${statusClass[i.status]||'d_info'}`}>{String(i.status)}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(i)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(i._id, `invoice "${i.id}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {tab === 'quotations' && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Quotations ({salesDocs.length})</h2></div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Quote No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Valid Till</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {salesDocs.length === 0 && <tr className="d_empty"><td colSpan={8}>No quotations found.</td></tr>}
                {salesDocs.map(q => (
                  <tr key={q._id}>
                    <td><code>{String(q.id)}</code></td><td><strong>{strField(q.customer)}</strong></td><td>{String(q.date)}</td>
                    <td>{itemsCount(q.items)}</td><td><strong>₹{(q.amount||0).toLocaleString('en-IN')}</strong></td><td>{String(q.validTill||'-')}</td>
                    <td><span className={`d_badge ${statusClass[q.status]||'d_info'}`}>{String(q.status)}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(q)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(q._id, `quotation "${q.id}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdPointOfSale className="d_card_icon" /> Sales Orders ({salesDocs.length})</h2></div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Order No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {salesDocs.length === 0 && <tr className="d_empty"><td colSpan={8}>No orders found.</td></tr>}
                {salesDocs.map(o => (
                  <tr key={o._id}>
                    <td><code>{o.id}</code></td><td><strong>{strField(o.customer)}</strong></td><td>{o.date}</td>
                    <td>{itemsCount(o.items)}</td><td><strong>₹{(o.amount||0).toLocaleString('en-IN')}</strong></td><td>{o.delivery||'-'}</td>
                    <td><span className={`d_badge ${statusClass[o.status]||'d_info'}`}>{o.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(o._id, `order "${o.id}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
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
              <Err field="name" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Contact Person <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Ramesh Patel" {...f('contact')} />
              <Err field="contact" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Phone <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="10-digit mobile" maxLength={10} inputMode="numeric" {...f('phone')} />
              <Err field="phone" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Email</label>
              <input type="email" className="d_form_control" placeholder="customer@email.com" {...f('email')} />
              <Err field="email" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">City</label>
              <input className="d_form_control" placeholder="e.g. Surat" {...f('city')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">GST Number</label>
              <input className="d_form_control" placeholder="e.g. 24ABCDE1234F1Z5" maxLength={15}
                {...f('gst')}
                onChange={e => { setForm(p => ({ ...p, gst: e.target.value.toUpperCase() })); setErrors(p => ({ ...p, gst: '' })); }} />
              <Err field="gst" />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}><option>Active</option><option>Inactive</option></select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Customer' : 'Save Customer'}</button>
          </div>
        </Modal>
      )}

      {/* Sales Document Modal */}
      {!isCus && isDoc && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? `Edit ${tab === 'invoices' ? 'Invoice' : tab === 'orders' ? 'Order' : 'Quotation'}` : `New ${tab === 'invoices' ? 'Invoice' : tab === 'orders' ? 'Order' : 'Quotation'}`}
          size="md">
          <div className="d_form_group mb-3">
            <label className="d_form_label">Customer <span className="d_req">*</span></label>
            <select className="d_form_control" value={form.customer} onChange={e => { setForm(p => ({ ...p, customer: e.target.value })); setErrors(p => ({ ...p, customer: '' })); }}>
              <option value="">Select Customer</option>
              {customers.map(c => <option key={c._id} value={c.name}>{String(c.name)}</option>)}
            </select>
            <Err field="customer" />
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              <Err field="date" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">No. of Items</label>
              <input type="number" className="d_form_control" min={1} placeholder="e.g. 5" {...f('items')} />
              <Err field="items" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input type="number" className="d_form_control" min={0} placeholder="e.g. 50000" {...f('amount')} />
              <Err field="amount" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                {tab === 'invoices' && <><option>Unpaid</option><option>Paid</option><option>Overdue</option></>}
                {tab === 'orders'   && <><option>Confirmed</option><option>Processing</option><option>Delivered</option></>}
                {tab === 'quotations' && <><option>Sent</option><option>Accepted</option><option>Expired</option></>}
              </select>
            </div>
          </div>
          {tab === 'invoices'   && <div className="d_form_group mb-3"><label className="d_form_label">Due Date</label><input type="date" className="d_form_control" {...f('due')} /></div>}
          {tab === 'orders'     && <div className="d_form_group mb-3"><label className="d_form_label">Delivery Date</label><input type="date" className="d_form_control" {...f('delivery')} /></div>}
          {tab === 'quotations' && <div className="d_form_group mb-3"><label className="d_form_label">Valid Till</label><input type="date" className="d_form_control" {...f('validTill')} /></div>}
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Save'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Sales;
