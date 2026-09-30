import React, { useState, useEffect } from 'react';
import { MdPointOfSale, MdAdd, MdEdit, MdDelete, MdLocalShipping, MdInventory } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { customersApi, erpApi, stockApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = {
  Active:'d_success', Inactive:'d_danger', Paid:'d_success', Unpaid:'d_warning',
  Overdue:'d_danger', Sent:'d_info', Accepted:'d_success', Expired:'d_danger',
  Confirmed:'d_info', Processing:'d_warning', Delivered:'d_success',
  'Pending':'d_warning', 'Shipped':'d_info', 'Out for Delivery':'d_primary',
};
const blankCus = { name: '', contact: '', phone: '', email: '', city: '', gst: '', status: 'Active', imageFile: null };
const blankDoc = { customer: '', date: '', items: '', amount: '', due: '', delivery: '', validTill: '', status: 'Unpaid' };
const blankOrder = { customer: '', date: '', items: [], deliveryAddress: '', deliveryDate: '', deliveryStatus: 'Pending', trackingNumber: '', notes: '', status: 'Confirmed' };
const blankOrderItem = { stockId: '', itemCode: '', itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
const TAB_TYPE  = { quotations: 'quotation', orders: 'order', invoices: 'invoice' };

const strField   = (v) => (v && typeof v === 'object') ? (v.name || v.title || '') : (v || '');
const itemsCount = (v) => Array.isArray(v) ? v.length : (v ?? '-');

const Sales = ({ defaultTab = 'customers', setActiveMenu }) => {
  const [tab, setTab]             = useState(defaultTab);

  // Map tab keys to sidebar menu labels
  const tabToMenuMap = {
    'customers': 'Customers',
    'quotations': 'Quotations',
    'orders': 'Sales Orders',
    'invoices': 'Invoices',
  };
  const [customers, setCustomers] = useState([]);
  const [salesDocs, setSalesDocs] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankCus);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [orderStep, setOrderStep] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

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

  const fetchStockItems = async () => {
    try {
      const { data } = await stockApi.getAll();
      setStockItems(data.filter(item => item.quantity > 0));
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load stock items');
    }
  };

  useEffect(() => { fetchCustomers(); fetchStockItems(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (isDoc) fetchSalesDocs(); }, [tab]);

  const openAdd = () => {
    if (tab === 'orders') {
      setOrderStep(1);
      setForm(blankOrder);
      setSelectedCustomer(null);
      setOrderItems([]);
      setEditId(null); setErrors({}); setModal(true);
    } else {
      setForm(isCus ? blankCus : blankDoc);
      setEditId(null); setErrors({}); setImageFile(null); setImagePreview(''); setModal(true);
    }
  };
  const openEdit = (row) => {
    if (isCus) {
      setForm({
        name: row.name || '', contact: row.contactPerson || row.contact || '',
        phone: row.phone || '', email: row.email || '',
        city: row.city || '', gst: row.gstNumber || row.gst || '', status: row.status || 'Active',
        image: row.image || '',
      });
      setImagePreview(row.image || '');
    } else {
      setForm({
        customer: strField(row.customer), date: row.date || '',
        items: Array.isArray(row.items) ? row.items.length : (row.items || ''),
        amount: row.amount || '', due: row.due || '',
        delivery: row.delivery || '', validTill: row.validTill || '', status: row.status || 'Unpaid',
      });
      setImagePreview('');
    }
    setEditId(row._id || row.id); setErrors({}); setImageFile(null); setModal(true);
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
      // Customer.email is required by the backend Customer schema.
      email:   V.email(form.email, 'Email'),
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
          id: editId ? undefined : `CUS-${String(Date.now()).slice(-6)}`,
          name: form.name.trim(), contactPerson: form.contact.trim(),
          phone: form.phone.trim(), email: form.email?.trim() || '',
          city: form.city?.trim() || '', gstNumber: form.gst?.trim().toUpperCase() || '',
          status: form.status,
        };
        if (editId) await customersApi.update(editId, payload, imageFile);
        else        await customersApi.create(payload, imageFile);
        toast.success(editId ? 'Customer updated!' : 'Customer added!');
        fetchCustomers();
      } else if (tab === 'orders' && !editId) {
        // Place Order Flow - multi-step
        if (orderStep === 1) {
          if (!selectedCustomer) {
            setErrors({ customer: 'Please select a customer' });
            setSaving(false);
            return;
          }
          setOrderStep(2);
          setSaving(false);
          return;
        }
        if (orderStep === 2) {
          if (orderItems.length === 0) {
            toast.error('Please add at least one item');
            setSaving(false);
            return;
          }
          setOrderStep(3);
          setSaving(false);
          return;
        }
        if (orderStep === 3) {
          const totalAmount = orderItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
          const payload = {
            module: 'sales', recordType: 'order',
            id: `ORD-${String(Date.now()).slice(-6)}`,
            customer: selectedCustomer.name,
            customerId: selectedCustomer._id,
            date: form.date || new Date().toISOString().split('T')[0],
            items: orderItems.map(item => ({
              itemCode: item.itemCode,
              itemName: item.itemName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              stockId: item.stockId
            })),
            amount: totalAmount,
            deliveryAddress: form.deliveryAddress,
            deliveryDate: form.deliveryDate,
            deliveryStatus: form.deliveryStatus,
            trackingNumber: form.trackingNumber,
            notes: form.notes,
            status: form.status,
          };
          await erpApi.create(payload);
          
          // Deduct stock
          for (const item of orderItems) {
            try {
              const stockItem = stockItems.find(s => s._id === item.stockId);
              if (stockItem) {
                await stockApi.update(item.stockId, {
                  ...stockItem,
                  quantity: Math.max(0, stockItem.quantity - item.quantity)
                });
              }
            } catch (err) {
              console.error('Failed to update stock:', err);
            }
          }
          
          toast.success('Order placed successfully!');
          fetchSalesDocs();
          fetchStockItems();
          setModal(false);
          setOrderStep(1);
        }
      } else {
        const itemCount = Number(form.items) || 0;
        const amount = Number(String(form.amount).replace(/[^\d.]/g, '')) || 0;
        const payload = {
          module: 'sales', recordType: TAB_TYPE[tab],
          customer: form.customer, date: form.date,
          items: itemCount ? [{
            itemCode: 'MANUAL', itemName: 'Manual sales item', quantity: itemCount,
            unitPrice: amount / itemCount, totalPrice: amount,
          }] : [],
          amount,
          due: form.due, delivery: form.delivery, validTill: form.validTill, status: form.status,
        };
        if (editId) await erpApi.update(editId, payload);
        else        await erpApi.create(payload);
        toast.success(editId ? 'Record updated!' : 'Record created!');
        fetchSalesDocs();
        setModal(false);
      }
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
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => {
            setTab(k);
            if (setActiveMenu) {
              setActiveMenu(tabToMenuMap[k]);
            }
          }}>{v}</button>
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
              <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Phone</th><th>City</th><th>GST No.</th><th>Balance</th><th>Status</th><th>Image</th><th>Actions</th></tr></thead>
              <tbody>
                {customers.length === 0 && <tr className="d_empty"><td colSpan={10}>No customers found.</td></tr>}
                {customers.map(c => (
                  <tr key={c._id}>
                    <td><code>{String(c.id)}</code></td><td><strong>{String(c.name)}</strong></td>
                    <td>{String(c.contactPerson || c.contact || '-')}</td><td>{String(c.phone || '-')}</td>
                    <td>{String(c.city || '-')}</td><td><code>{String(c.gstNumber || c.gst || '-')}</code></td>
                    <td><strong>₹{(c.currentBalance||0).toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${statusClass[c.status]||'d_info'}`}>{String(c.status)}</span></td>
                    <td>
                      {c.image ? (
                        <img
                          src={`http://localhost:5000${c.image}`}
                          alt={c.name}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:5000${c.image}`, '_blank')}
                        />
                      ) : (
                        <span style={{ color: '#999', fontSize: 12 }}>No image</span>
                      )}
                    </td>
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
              <thead><tr><th>Order No.</th><th>Customer</th><th>Date</th><th>Items</th><th>Amount</th><th>Delivery Status</th><th>Delivery Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {salesDocs.length === 0 && <tr className="d_empty"><td colSpan={9}>No orders found.</td></tr>}
                {salesDocs.map(o => (
                  <tr key={o._id}>
                    <td><code>{o.id}</code></td><td><strong>{strField(o.customer)}</strong></td><td>{o.date}</td>
                    <td>{itemsCount(o.items)}</td>
                    <td><strong>₹{(o.amount||0).toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${statusClass[o.deliveryStatus]||'d_info'}`}>{o.deliveryStatus||'Pending'}</span></td>
                    <td>{o.deliveryDate||'-'}</td>
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
              <label className="d_form_label">Email <span className="d_req">*</span></label>
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
              <select className="d_form_control" {...f('status')}><option>Active</option><option>Inactive</option><option>Blacklisted</option></select>
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Customer Image</label>
              <input
                type="file"
                className="d_form_control"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              {(imagePreview || form.image) && (
                <div style={{ marginTop: 8 }}>
                  <img
                    src={imagePreview || `http://localhost:5000${form.image}`}
                    alt="Customer"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Customer' : 'Save Customer'}</button>
          </div>
        </Modal>
      )}

      {/* Sales Document Modal */}
      {!isCus && isDoc && tab !== 'orders' && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? `Edit ${tab === 'invoices' ? 'Invoice' : 'Quotation'}` : `New ${tab === 'invoices' ? 'Invoice' : 'Quotation'}`}
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
                {tab === 'quotations' && <><option>Sent</option><option>Accepted</option><option>Expired</option></>}
              </select>
            </div>
          </div>
          {tab === 'invoices'   && <div className="d_form_group mb-3"><label className="d_form_label">Due Date</label><input type="date" className="d_form_control" {...f('due')} /></div>}
          {tab === 'quotations' && <div className="d_form_group mb-3"><label className="d_form_label">Valid Till</label><input type="date" className="d_form_control" {...f('validTill')} /></div>}
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {/* Place Order Modal - Multi-step Flow */}
      {tab === 'orders' && modal && (
        <Modal open={modal} onClose={() => { setModal(false); setOrderStep(1); setSelectedCustomer(null); setOrderItems([]); }}
          title={editId ? 'Edit Order' : 'Place New Order'}
          size="lg">
          {editId ? (
            // Edit mode - simple form
            <>
              <div className="d_form_group mb-3">
                <label className="d_form_label">Customer</label>
                <input className="d_form_control" value={form.customer} disabled />
              </div>
              <div className="d_form_row cols-2">
                <div className="d_form_group">
                  <label className="d_form_label">Status</label>
                  <select className="d_form_control" {...f('status')}>
                    <option>Confirmed</option><option>Processing</option><option>Delivered</option>
                  </select>
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Delivery Status</label>
                  <select className="d_form_control" {...f('deliveryStatus')}>
                    <option>Pending</option><option>Shipped</option><option>Out for Delivery</option><option>Delivered</option>
                  </select>
                </div>
              </div>
              <div className="d_form_actions">
                <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Update'}</button>
              </div>
            </>
          ) : (
            // Create mode - multi-step flow
            <>
              {/* Step Indicator */}
              <div className="d_form_row cols-3 mb-4" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <div style={{ textAlign: 'center', fontWeight: orderStep >= 1 ? 'bold' : 'normal', color: orderStep >= 1 ? 'var(--d-primary)' : '#999' }}>
                  1. Select Customer
                </div>
                <div style={{ textAlign: 'center', fontWeight: orderStep >= 2 ? 'bold' : 'normal', color: orderStep >= 2 ? 'var(--d-primary)' : '#999' }}>
                  2. Add Items
                </div>
                <div style={{ textAlign: 'center', fontWeight: orderStep >= 3 ? 'bold' : 'normal', color: orderStep >= 3 ? 'var(--d-primary)' : '#999' }}>
                  3. Delivery Details
                </div>
              </div>

              {/* Step 1: Customer Selection */}
              {orderStep === 1 && (
                <>
                  <div className="d_form_group mb-3">
                    <label className="d_form_label">Select Customer <span className="d_req">*</span></label>
                    <select className="d_form_control" value={selectedCustomer?._id || ''} onChange={e => {
                      const customer = customers.find(c => c._id === e.target.value);
                      setSelectedCustomer(customer);
                      setErrors(p => ({ ...p, customer: '' }));
                    }}>
                      <option value="">Select Customer</option>
                      {customers.map(c => <option key={c._id} value={c._id}>{String(c.name)} - {String(c.phone)}</option>)}
                    </select>
                    <Err field="customer" />
                  </div>
                  {selectedCustomer && (
                    <div className="d_card" style={{ background: '#f8f9fa', padding: '15px', marginBottom: '15px' }}>
                      <p><strong>Name:</strong> {selectedCustomer.name}</p>
                      <p><strong>Contact:</strong> {selectedCustomer.contactPerson || selectedCustomer.contact}</p>
                      <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                      <p><strong>Email:</strong> {selectedCustomer.email}</p>
                      <p><strong>Address:</strong> {selectedCustomer.city || 'N/A'}</p>
                    </div>
                  )}
                  <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving || !selectedCustomer}>{saving ? 'Processing…' : 'Next: Add Items'}</button>
                  </div>
                </>
              )}

              {/* Step 2: Add Items from Warehouse */}
              {orderStep === 2 && (
                <>
                  <div className="d_form_group mb-3">
                    <label className="d_form_label">Add Items from Warehouse <span className="d_req">*</span></label>
                    <select className="d_form_control" onChange={e => {
                      const stockItem = stockItems.find(s => s._id === e.target.value);
                      if (stockItem && !orderItems.find(i => i.stockId === stockItem._id)) {
                        setOrderItems([...orderItems, {
                          stockId: stockItem._id,
                          itemCode: stockItem.itemCode,
                          itemName: stockItem.itemName,
                          quantity: 1,
                          unitPrice: stockItem.unitPrice,
                          totalPrice: stockItem.unitPrice
                        }]);
                      }
                      e.target.value = '';
                    }}>
                      <option value="">Select Item to Add</option>
                      {stockItems.map(s => (
                        <option key={s._id} value={s._id} disabled={orderItems.find(i => i.stockId === s._id)}>
                          {s.itemName} ({s.itemCode}) - ₹{s.unitPrice} - Stock: {s.quantity}
                        </option>
                      ))}
                    </select>
                  </div>

                  {orderItems.length > 0 && (
                    <div className="d_table_wrap" style={{ marginBottom: '15px' }}>
                      <table className="d_table">
                        <thead><tr><th>Item</th><th>Code</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Action</th></tr></thead>
                        <tbody>
                          {orderItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.itemName}</td>
                              <td><code>{item.itemCode}</code></td>
                              <td>
                                <input type="number" min={1} max={stockItems.find(s => s._id === item.stockId)?.quantity || 1}
                                  className="d_form_control" style={{ width: '70px' }}
                                  value={item.quantity}
                                  onChange={e => {
                                    const newQty = Math.min(Number(e.target.value), stockItems.find(s => s._id === item.stockId)?.quantity || 1);
                                    const updated = [...orderItems];
                                    updated[idx] = { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
                                    setOrderItems(updated);
                                  }}
                                />
                              </td>
                              <td>₹{item.unitPrice}</td>
                              <td><strong>₹{item.totalPrice}</strong></td>
                              <td>
                                <button className="d_icon_btn d_del" onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}><MdDelete /></button>
                              </td>
                            </tr>
                          ))}
                          <tr style={{ background: '#f8f9fa' }}>
                            <td colSpan={4} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
                            <td colSpan={2}><strong>₹{orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('en-IN')}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setOrderStep(1)}>Back</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving || orderItems.length === 0}>{saving ? 'Processing…' : 'Next: Delivery Details'}</button>
                  </div>
                </>
              )}

              {/* Step 3: Delivery Details */}
              {orderStep === 3 && (
                <>
                  <div className="d_form_group mb-3">
                    <label className="d_form_label">Order Date</label>
                    <input type="date" className="d_form_control" {...f('date')} />
                  </div>
                  <div className="d_form_row cols-2">
                    <div className="d_form_group">
                      <label className="d_form_label">Delivery Address</label>
                      <input className="d_form_control" placeholder="Full delivery address" {...f('deliveryAddress')} />
                    </div>
                    <div className="d_form_group">
                      <label className="d_form_label">Expected Delivery Date</label>
                      <input type="date" className="d_form_control" {...f('deliveryDate')} />
                    </div>
                  </div>
                  <div className="d_form_row cols-2">
                    <div className="d_form_group">
                      <label className="d_form_label">Delivery Status</label>
                      <select className="d_form_control" {...f('deliveryStatus')}>
                        <option>Pending</option><option>Shipped</option><option>Out for Delivery</option><option>Delivered</option>
                      </select>
                    </div>
                    <div className="d_form_group">
                      <label className="d_form_label">Tracking Number</label>
                      <input className="d_form_control" placeholder="Tracking number (optional)" {...f('trackingNumber')} />
                    </div>
                  </div>
                  <div className="d_form_group mb-3">
                    <label className="d_form_label">Notes</label>
                    <textarea className="d_form_control" rows={2} placeholder="Any special instructions..." {...f('notes')} />
                  </div>

                  <div className="d_card" style={{ background: '#f8f9fa', padding: '15px', marginBottom: '15px' }}>
                    <h4>Order Summary</h4>
                    <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                    <p><strong>Items:</strong> {orderItems.length}</p>
                    <p><strong>Total Amount:</strong> ₹{orderItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('en-IN')}</p>
                  </div>

                  <div className="d_form_actions">
                    <button className="d_btn d_btn_outline" onClick={() => setOrderStep(2)}>Back</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Placing Order…' : 'Place Order'}</button>
                  </div>
                </>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Sales;
