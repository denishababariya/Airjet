import React, { useState, useEffect } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdVisibility, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
// import { suppliersApi, erpApi } from '../utils/api';
import { V, validate as validateFields } from '../utils/validators';
import { erpApi, suppliersApi, purchaseOrdersApi, purchaseReturnsApi, grnApi } from '../utils/api';

/* ─── Status colour map ────────────────────────────────────── */
const statusClass = {
  Active: 'd_success', Inactive: 'd_danger', Pending: 'd_warning',
  Received: 'd_success', 'In Transit': 'd_info', Verified: 'd_success',
  Partial: 'd_warning', Approved: 'd_success', Cancelled: 'd_danger',
};

/* ─── Blank form state per tab ─────────────────────────────── */
const blankSup = { name: '', contact: '', phone: '', email: '', city: '', gst: '', status: 'Active' };
const blankPO  = { supplier: '', date: '', delivery: '', status: 'Pending', notes: '', items: [{ itemCode: '', itemName: '', quantity: '', unitPrice: '', totalPrice: '' }] };
const blankGRN = { po: '', supplier: '', date: '', receivedBy: '', status: 'Pending', notes: '', items: [{ itemCode: '', itemName: '', quantity: '', unitPrice: '', totalPrice: '' }] };
const blankRet = { po: '', supplier: '', part: '', qty: '', unitPrice: '', amount: '', date: '', reason: '', status: 'Pending', items: [{ itemCode: '', itemName: '', quantity: '', unitPrice: '', totalPrice: '' }] };

/* ─── Date helper ──────────────────────────────────────────── */
const toISODate = (d) => {
  if (!d) return '';
  if (d.includes('-') && d.length === 10) return d;
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
                   Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = d.split('-');
  if (parts.length === 3 && months[parts[1]])
    return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;
  return d;
};

/* ─── GST regex ────────────────────────────────────────────── */
const GST_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const Purchase = ({ defaultTab = 'suppliers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders]       = useState([]);
  const [grnList, setGrnList]     = useState([]);
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankSup);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const isSup = tab === 'suppliers';
  const isGRN = tab === 'grn';
  const isRet = tab === 'returns';

  /* toast + confirm hooks */
  const { toasts, toast, removeToast }       = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  /* ── Fetchers ──────────────────────────────────────────── */
  const fetchSuppliers = async () => {
    try { const { data } = await suppliersApi.getAll(); setSuppliers(data); }
    catch (err) { toast.error(err.displayMessage || 'Failed to load suppliers'); }
  };
  const fetchOrders = async () => {
    try { const { data } = await purchaseOrdersApi.getAll(); setOrders(data); }
    catch (err) { toast.error(err.displayMessage || 'Failed to load purchase orders'); }
  };
  const fetchGrn = async () => {
    try { const { data } = await erpApi.getAll('purchase', 'grn'); setGrnList(data); }
    catch (err) { toast.error(err.displayMessage || 'Failed to load GRN'); }
  };
  const fetchReturns = async () => {
    try { const { data } = await purchaseReturnsApi.getAll(); setReturns(data); }
    catch (err) { toast.error(err.displayMessage || 'Failed to load returns'); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchOrders(), fetchGrn(), fetchReturns()]);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Safely extract primitives from possibly-populated fields ── */
  const strField   = (v) => (v && typeof v === 'object') ? (v.name || v.title || '') : (v || '');
  const itemsCount = (v) => Array.isArray(v) ? v.length : (v || '');

  const normalizeItems = (items) => {
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item) => ({
        itemCode: item.itemCode || '',
        itemName: item.itemName || '',
        quantity: item.quantity != null ? String(item.quantity) : '',
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        totalPrice: item.totalPrice != null ? Number(item.totalPrice) : 0,
      }));
    }
    if (typeof items === 'number' || typeof items === 'string') {
      const amount = Number(items);
      return [{ itemCode: '', itemName: '', quantity: items ? String(items) : '', unitPrice: '', totalPrice: amount || '' }];
    }
    return [{ itemCode: '', itemName: '', quantity: '', unitPrice: '', totalPrice: '' }];
  };

  const computeLineTotal = (item) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return qty * unitPrice;
  };

  const computeAmountFromItems = (items = []) => {
    return items.reduce((sum, item) => sum + (Number(item.totalPrice) || computeLineTotal(item)), 0);
  };

  const updateItemField = (index, field, value) => {
    setForm((prev) => {
      const nextItems = [...(prev.items || [])];
      nextItems[index] = { ...nextItems[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        nextItems[index].totalPrice = computeLineTotal(nextItems[index]);
      }
      return { ...prev, items: nextItems };
    });
    setErrors((p) => ({ ...p, items: '' }));
  };

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        { itemCode: '', itemName: '', quantity: '', unitPrice: '', totalPrice: '' },
      ],
    }));
  };

  const removeItemRow = (index) => {
    setForm((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, idx) => idx !== index),
    }));
  };

  const findSupplierByName = (name) => suppliers.find((s) => String(s.name) === String(name));

  /* ── Open modals ─────────────────────────────────────────── */
  const openAdd = () => {
    const blank = isSup ? blankSup : isGRN ? blankGRN : isRet ? blankRet : blankPO;
    setForm(blank); setEditId(null); setErrors({}); setImageFile(null); setImagePreview(''); setModal(true);
  };

  const openEdit = (row) => {
    if (isSup) {
      setForm({
        name: row.name || '', contact: row.contact || '',
        phone: row.phone || '', email: row.email || '',
        city: row.city || '', gst: row.gst || '', status: row.status || 'Active',
        image: row.image || '',
      });
      setImagePreview(row.image || '');
    } else if (isGRN) {
      setForm({
        po: row.po || '',
        poId: row.poId || '',
        supplier: strField(row.supplier),
        supplierId: row.supplierId || '',
        date: toISODate(row.date),
        receivedBy: row.receivedBy || '',
        status: row.status || 'Pending',
        items: normalizeItems(row.items),
        notes: row.notes || '',
      });
    } else if (isRet) {
      const items = normalizeItems(row.items);
      setForm({
        po: row.po || '',
        poId: row.poId || '',
        supplier: strField(row.supplier),
        supplierId: row.supplierId || '',
        date: toISODate(row.date),
        reason: row.reason || '',
        status: row.status || 'Pending',
        items,
        amount: row.amount || row.totalAmount || '',
      });
    } else {
      setForm({
        supplier: strField(row.supplier),
        supplierId: row.supplierId || '',
        date: toISODate(row.date),
        delivery: toISODate(row.delivery),
        status: row.status || 'Pending',
        items: normalizeItems(row.items),
        notes: row.notes || '',
      });
    }
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  /* ── Validation ──────────────────────────────────────────── */
  const validate = () => {
    const e = {};

    if (isSup) {
      /* Supplier */
      if (!form.name?.trim())
        e.name = 'Supplier name is required';
      else if (form.name.trim().length < 3)
        e.name = 'Supplier name must be at least 3 characters';

      Object.assign(e, validateFields({
        contact: V.name(form.contact, 'Contact person name'),
        phone: V.phone(form.phone),
        email: V.email(form.email, 'Email', false),
      }));

      if (form.gst?.trim() && !GST_RE.test(form.gst.trim().toUpperCase()))
        e.gst = 'Invalid GST number format (e.g. 24ABCDE1234F1Z5)';

    } else if (isGRN) {
      /* GRN */
      if (!form.supplier?.trim()) e.supplier = 'Supplier name is required';
      if (!form.date?.trim())     e.date     = 'Date is required';
      if (!Array.isArray(form.items) || form.items.length === 0)
        e.items = 'At least one received item is required';
      else {
        form.items.forEach((item, index) => {
          if (!item.itemName?.trim()) e[`items_${index}_itemName`] = 'Item name is required';
          if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)
            e[`items_${index}_quantity`] = 'Quantity must be a positive number';
          if (item.unitPrice && isNaN(Number(String(item.unitPrice).replace(/[^\d.]/g, ''))))
            e[`items_${index}_unitPrice`] = 'Unit price must be a valid number';
        });
      }
      if (!form.receivedBy?.trim()) e.receivedBy = 'Received by is required';

    } else if (isRet) {
      /* Return */
      if (!form.supplier?.trim()) e.supplier = 'Supplier name is required';
      if (!form.date?.trim())     e.date     = 'Return date is required';
      if (!form.reason?.trim())   e.reason   = 'Reason is required';
      if (!Array.isArray(form.items) || form.items.length === 0)
        e.items = 'At least one returned item is required';
      else {
        form.items.forEach((item, index) => {
          if (!item.itemName?.trim()) e[`items_${index}_itemName`] = 'Item name is required';
          if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)
            e[`items_${index}_quantity`] = 'Quantity must be a positive number';
          if (item.unitPrice && isNaN(Number(String(item.unitPrice).replace(/[^\d.]/g, ''))))
            e[`items_${index}_unitPrice`] = 'Unit price must be a valid number';
        });
      }

    } else {
      /* Purchase Order */
      if (!form.supplier?.trim()) e.supplier = 'Supplier is required';
      if (!form.date?.trim())     e.date     = 'Order date is required';
      if (!Array.isArray(form.items) || form.items.length === 0)
        e.items = 'At least one order item is required';
      else {
        form.items.forEach((item, index) => {
          if (!item.itemName?.trim()) e[`items_${index}_itemName`] = 'Item name is required';
          if (!item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0)
            e[`items_${index}_quantity`] = 'Quantity must be a positive number';
          if (item.unitPrice && isNaN(Number(String(item.unitPrice).replace(/[^\d.]/g, ''))))
            e[`items_${index}_unitPrice`] = 'Unit price must be a valid number';
        });
      }
      if (form.delivery && form.date && form.delivery < form.date)
        e.delivery = 'Expected delivery cannot be before order date';
    }

    return e;
  };

  /* ── Save ────────────────────────────────────────────────── */
  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (isSup) {
        const payload = {
          name: form.name.trim(), contact: form.contact.trim(),
          phone: form.phone.trim(), email: form.email?.trim() || '',
          city: form.city?.trim() || '', gst: form.gst?.trim().toUpperCase() || '',
          status: form.status,
        };
        if (editId) await suppliersApi.update(editId, payload, imageFile);
        else await suppliersApi.create(payload, imageFile);
        toast.success(editId ? 'Supplier updated successfully!' : 'Supplier added successfully!');
        fetchSuppliers();

      } else if (isGRN) {
        const supplierData = findSupplierByName(form.supplier.trim());
        const items = (form.items || []).map((item) => ({
          itemCode: item.itemCode?.trim() || '',
          itemName: item.itemName?.trim() || '',
          category: item.category?.trim() || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(String(item.unitPrice).replace(/[^\d.]/g, '')) || 0,
          totalPrice: Number(item.totalPrice) || computeLineTotal(item),
          stockId: item.stockId || undefined,
          sparePartId: item.sparePartId || undefined,
        }));
        const payload = {
          po: form.po?.trim() || '',
          poId: form.poId || null,
          supplier: form.supplier.trim(),
          supplierId: supplierData?._id || form.supplierId || null,
          date: form.date,
          receivedBy: form.receivedBy.trim(),
          status: form.status,
          items,
          amount: computeAmountFromItems(items),
          notes: form.notes?.trim() || '',
        };
        if (editId) await grnApi.update(editId, payload);
        else await grnApi.create(payload);
        toast.success(editId ? 'GRN updated!' : 'GRN created!');
        fetchGrn();

      } else if (isRet) {
        const supplierData = findSupplierByName(form.supplier.trim());
        const items = (form.items || []).map((item) => ({
          itemCode: item.itemCode?.trim() || '',
          itemName: item.itemName?.trim() || '',
          category: item.category?.trim() || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(String(item.unitPrice).replace(/[^\d.]/g, '')) || 0,
          totalPrice: Number(item.totalPrice) || computeLineTotal(item),
          stockId: item.stockId || undefined,
          sparePartId: item.sparePartId || undefined,
        }));
        const totalAmount = computeAmountFromItems(items);
        const payload = {
          po: form.po?.trim() || '',
          poId: form.poId || null,
          supplier: form.supplier.trim(),
          supplierId: supplierData?._id || form.supplierId || null,
          date: form.date,
          reason: form.reason.trim(),
          status: form.status,
          items,
          amount: totalAmount,
          totalAmount,
          notes: form.notes?.trim() || '',
        };
        if (editId) await purchaseReturnsApi.update(editId, payload);
        else await purchaseReturnsApi.create(payload);
        toast.success(editId ? 'Return updated!' : 'Return recorded!');
        fetchReturns();

      } else {
        const supplierData = findSupplierByName(form.supplier.trim());
        const items = (form.items || []).map((item) => ({
          itemCode: item.itemCode?.trim() || '',
          itemName: item.itemName?.trim() || '',
          category: item.category?.trim() || '',
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(String(item.unitPrice).replace(/[^\d.]/g, '')) || 0,
          totalPrice: Number(item.totalPrice) || computeLineTotal(item),
          stockId: item.stockId || undefined,
          sparePartId: item.sparePartId || undefined,
        }));
        const totalAmount = computeAmountFromItems(items);
        const payload = {
          supplier: form.supplier.trim(),
          supplierId: supplierData?._id || form.supplierId || null,
          date: form.date,
          delivery: form.delivery || '',
          status: form.status || 'Pending',
          items,
          totalAmount,
          grandTotal: Math.round(totalAmount * 1.18),
          notes: form.notes?.trim() || '',
        };
        if (editId) await purchaseOrdersApi.update(editId, payload);
        else await purchaseOrdersApi.create(payload);
        toast.success(editId ? 'Purchase order updated!' : 'Purchase order created!');
        fetchOrders();
      }
      setModal(false);
    } catch (err) {
      toast.error(err.displayMessage || err.response?.data?.error || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete (with ConfirmDialog) ─────────────────────────── */
  const handleDelete = (id, label = 'this record') => {
    confirm({
      title:        'Delete Record',
      message:      `Are you sure you want to delete ${label}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant:      'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          if (isSup)       { await suppliersApi.remove(id); fetchSuppliers(); }
          else if (isGRN)  { await erpApi.remove(id); fetchGrn(); }
          else if (isRet)  { await purchaseReturnsApi.remove(id); fetchReturns(); }
          else             { await purchaseOrdersApi.remove(id); fetchOrders(); }
          toast.success('Record deleted successfully.');
        } catch (err) {
          toast.error(err.displayMessage || 'Failed to delete.');
        }
      },
    });
  };

  /* ── Field helper ────────────────────────────────────────── */
  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      setErrors(p => ({ ...p, [field]: '' }));
    },
  });

  /* ── Error helper (inline field error) ──────────────────── */
  const Err = ({ field }) =>
    errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  /* ═══════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════ */
  return (
    <div>
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Confirm dialog */}
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      {/* Page header */}
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Purchase Management</h1>
          <p className="d_page_subtitle">Manage suppliers, purchase orders, GRN and returns</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd />
          {tab === 'suppliers' ? 'Add Supplier' : tab === 'orders' ? 'New PO' : tab === 'grn' ? 'New GRN' : 'New Return'}
        </button>
      </div>

      {/* Tabs */}
      <div className="d_tabs mb-3">
        {[['suppliers','Suppliers'],['orders','Purchase Orders'],['grn','GRN'],['returns','Returns']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {/* ── Suppliers tab ─────────────────────────────────── */}
      {tab === 'suppliers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Suppliers ({suppliers.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr>
                  <th>ID</th><th>Supplier Name</th><th>Contact Person</th>
                  <th>Phone</th><th>City</th><th>GST No.</th><th>Status</th><th>Image</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {suppliers.length === 0 && <tr className="d_empty"><td colSpan={9}>No suppliers found.</td></tr>}
                  {suppliers.map(s => (
                    <tr key={s._id}>
                      <td><code>{String(s.id || s._id)}</code></td>
                      <td><strong>{String(s.name)}</strong></td>
                      <td>{String(s.contact || '-')}</td>
                      <td>{String(s.phone || '-')}</td>
                      <td>{String(s.city || '-')}</td>
                      <td><code>{String(s.gst || '-')}</code></td>
                      <td><span className={`d_badge ${statusClass[s.status] || 'd_info'}`}>{String(s.status)}</span></td>
                      <td>
                        {s.image ? (
                          <img
                            src={`http://localhost:5000${s.image}`}
                            alt={s.name}
                            style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                            onClick={() => window.open(`http://localhost:5000${s.image}`, '_blank')}
                          />
                        ) : (
                          <span style={{ color: '#999', fontSize: 12 }}>No image</span>
                        )}
                      </td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" title="Edit" onClick={() => openEdit(s)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  title="Delete" onClick={() => handleDelete(s._id, `supplier "${s.name}"`)}><MdDelete /></button>
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

      {/* ── Purchase Orders tab ───────────────────────────── */}
      {tab === 'orders' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Orders ({orders.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading purchase orders…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr>
                  <th>PO No.</th><th>Supplier</th><th>Order Date</th><th>Items</th>
                  <th>Amount</th><th>Exp. Delivery</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {orders.length === 0 && <tr className="d_empty"><td colSpan={8}>No purchase orders found.</td></tr>}
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td><code>{String(o.id)}</code></td>
                      <td><strong>{strField(o.supplier) || '-'}</strong></td>
                      <td>{String(o.date || '-')}</td>
                      <td>{itemsCount(o.items) || '-'}</td>
                      <td><strong>₹{(o.amount || o.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>{String(o.delivery || '-')}</td>
                      <td><span className={`d_badge ${statusClass[o.status] || 'd_info'}`}>{String(o.status)}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view" title="View"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" title="Edit" onClick={() => openEdit(o)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  title="Delete" onClick={() => handleDelete(o._id, `PO "${o.id}"`)}><MdDelete /></button>
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

      {/* ── GRN tab ───────────────────────────────────────── */}
      {tab === 'grn' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Goods Receipt Notes ({grnList.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr>
                  <th>GRN No.</th><th>PO Ref.</th><th>Supplier</th><th>Date</th>
                  <th>Items</th><th>Amount</th><th>Received By</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {grnList.length === 0 && <tr className="d_empty"><td colSpan={9}>No GRN records found.</td></tr>}
                  {grnList.map(g => (
                    <tr key={g._id}>
                      <td><code>{String(g.id)}</code></td>
                      <td><code>{String(g.po || '-')}</code></td>
                      <td><strong>{strField(g.supplier) || '-'}</strong></td>
                      <td>{String(g.date || '-')}</td>
                      <td>{itemsCount(g.items) || '-'}</td>
                      <td><strong>₹{(g.amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td>{String(g.receivedBy || '-')}</td>
                      <td><span className={`d_badge ${statusClass[g.status] || 'd_info'}`}>{String(g.status)}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" title="Edit" onClick={() => openEdit(g)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  title="Delete" onClick={() => handleDelete(g._id, `GRN "${g.id}"`)}><MdDelete /></button>
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

      {/* ── Returns tab ───────────────────────────────────── */}
      {tab === 'returns' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Returns ({returns.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr>
                  <th>Return No.</th><th>Supplier</th><th>Part</th><th>Qty</th>
                  <th>Date</th><th>Reason</th><th>Amount</th><th>Status</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {returns.length === 0 && <tr className="d_empty"><td colSpan={9}>No returns found.</td></tr>}
                  {returns.map(r => (
                    <tr key={r._id}>
                      <td><code>{String(r.id)}</code></td>
                      <td><strong>{strField(r.supplier) || '-'}</strong></td>
                      <td>{strField(r.part) || '-'}</td>
                      <td>{String(r.qty || '-')}</td>
                      <td>{String(r.date || '-')}</td>
                      <td>{String(r.reason || '-')}</td>
                      <td><strong>₹{(r.amount || 0).toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status] || 'd_warning'}`}>{String(r.status)}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" title="Edit" onClick={() => openEdit(r)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  title="Delete" onClick={() => handleDelete(r._id, `return "${r.id}"`)}><MdDelete /></button>
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

      {/* ══════════════════════════════════════════════════════
          SUPPLIER MODAL
      ══════════════════════════════════════════════════════ */}
      {isSup && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? 'Edit Supplier' : 'Add Supplier'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Supplier Name <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Reliance Infra Ltd." {...f('name')} />
              <Err field="name" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Contact Person <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Contact person name" {...f('contact')} />
              <Err field="contact" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Phone <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="10-digit mobile number" maxLength={10} inputMode="numeric" {...f('phone')} />
              <Err field="phone" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Email</label>
              <input type="email" className="d_form_control" placeholder="supplier@email.com" {...f('email')} />
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
              <input className="d_form_control" placeholder="e.g. 24ABCDE1234F1Z5" maxLength={15} {...f('gst')}
                onChange={(e) => { setForm(p => ({ ...p, gst: e.target.value.toUpperCase() })); setErrors(p => ({ ...p, gst: '' })); }} />
              <Err field="gst" />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Supplier Image</label>
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
                    alt="Supplier"
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update Supplier' : 'Save Supplier'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          PURCHASE ORDER MODAL
      ══════════════════════════════════════════════════════ */}
      {tab === 'orders' && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? 'Edit Purchase Order' : 'New Purchase Order'} size="md">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{String(s.name)}</option>)}
              </select>
              <Err field="supplier" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Order Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              <Err field="date" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Expected Delivery</label>
              <input type="date" className="d_form_control" {...f('delivery')} />
              <Err field="delivery" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Items</label>
              <input className="d_form_control" value={itemsCount(form.items)} readOnly />
              <Err field="items" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Total Amount (₹)</label>
              <input className="d_form_control" value={computeAmountFromItems(form.items).toFixed(2)} readOnly />
            </div>
          </div>
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Item Code</th><th>Item Name</th><th>Category</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, index) => (
                  <tr key={index}>
                    <td><input className="d_form_control" value={item.itemCode || ''}
                      onChange={(e) => updateItemField(index, 'itemCode', e.target.value)} /></td>
                    <td><input className="d_form_control" value={item.itemName || ''}
                      onChange={(e) => updateItemField(index, 'itemName', e.target.value)} />
                      <Err field={`items_${index}_itemName`} /></td>
                    <td><input className="d_form_control" value={item.category || ''}
                      onChange={(e) => updateItemField(index, 'category', e.target.value)} /></td>
                    <td><input type="number" className="d_form_control" min={1} value={item.quantity || ''}
                      onChange={(e) => updateItemField(index, 'quantity', e.target.value)} />
                      <Err field={`items_${index}_quantity`} /></td>
                    <td><input type="number" className="d_form_control" min={0} step="0.01" value={item.unitPrice || ''}
                      onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)} />
                      <Err field={`items_${index}_unitPrice`} /></td>
                    <td><strong>{computeLineTotal(item).toLocaleString('en-IN')}</strong></td>
                    <td><button type="button" className="d_icon_btn d_del" title="Remove item"
                      onClick={() => removeItemRow(index)}><MdDelete /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="d_btn d_btn_secondary" onClick={addItemRow}>Add Item</button>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>In Transit</option>
                <option>Received</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update PO' : 'Create PO'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          GRN MODAL
      ══════════════════════════════════════════════════════ */}
      {isGRN && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? 'Edit GRN' : 'Create Goods Receipt Note'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">PO Reference</label>
              <input className="d_form_control" placeholder="e.g. PO-123456" {...f('po')} />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{String(s.name)}</option>)}
              </select>
              <Err field="supplier" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Receipt Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              <Err field="date" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Received By <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="Name of person who received" {...f('receivedBy')} />
              <Err field="receivedBy" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Items</label>
              <input className="d_form_control" value={itemsCount(form.items)} readOnly />
              <Err field="items" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input className="d_form_control" value={computeAmountFromItems(form.items).toFixed(2)} readOnly />
            </div>
          </div>
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Item Code</th><th>Item Name</th><th>Category</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, index) => (
                  <tr key={index}>
                    <td><input className="d_form_control" value={item.itemCode || ''}
                      onChange={(e) => updateItemField(index, 'itemCode', e.target.value)} /></td>
                    <td><input className="d_form_control" value={item.itemName || ''}
                      onChange={(e) => updateItemField(index, 'itemName', e.target.value)} />
                      <Err field={`items_${index}_itemName`} /></td>
                    <td><input className="d_form_control" value={item.category || ''}
                      onChange={(e) => updateItemField(index, 'category', e.target.value)} /></td>
                    <td><input type="number" className="d_form_control" min={1} value={item.quantity || ''}
                      onChange={(e) => updateItemField(index, 'quantity', e.target.value)} />
                      <Err field={`items_${index}_quantity`} /></td>
                    <td><input type="number" className="d_form_control" min={0} step="0.01" value={item.unitPrice || ''}
                      onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)} />
                      <Err field={`items_${index}_unitPrice`} /></td>
                    <td><strong>{computeLineTotal(item).toLocaleString('en-IN')}</strong></td>
                    <td><button type="button" className="d_icon_btn d_del" title="Remove item"
                      onClick={() => removeItemRow(index)}><MdDelete /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="d_btn d_btn_secondary" onClick={addItemRow}>Add Item</button>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>Partial</option><option>Verified</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update GRN' : 'Create GRN'}
            </button>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          RETURNS MODAL
      ══════════════════════════════════════════════════════ */}
      {isRet && (
        <Modal open={modal} onClose={() => setModal(false)}
          title={editId ? 'Edit Return' : 'New Purchase Return'} size="lg">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{String(s.name)}</option>)}
              </select>
              <Err field="supplier" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">PO Reference</label>
              <input className="d_form_control" placeholder="e.g. PO-123456" {...f('po')} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Return Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              <Err field="date" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Reason <span className="d_req">*</span></label>
              <input className="d_form_control" placeholder="e.g. Defective part, wrong item…" {...f('reason')} />
              <Err field="reason" />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Items</label>
              <input className="d_form_control" value={itemsCount(form.items)} readOnly />
              <Err field="items" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input className="d_form_control" value={computeAmountFromItems(form.items).toFixed(2)} readOnly />
            </div>
          </div>
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Item Code</th><th>Item Name</th><th>Category</th>
                  <th>Qty</th><th>Unit Price</th><th>Total</th><th></th>
                </tr>
              </thead>
              <tbody>
                {(form.items || []).map((item, index) => (
                  <tr key={index}>
                    <td><input className="d_form_control" value={item.itemCode || ''}
                      onChange={(e) => updateItemField(index, 'itemCode', e.target.value)} /></td>
                    <td><input className="d_form_control" value={item.itemName || ''}
                      onChange={(e) => updateItemField(index, 'itemName', e.target.value)} />
                      <Err field={`items_${index}_itemName`} /></td>
                    <td><input className="d_form_control" value={item.category || ''}
                      onChange={(e) => updateItemField(index, 'category', e.target.value)} /></td>
                    <td><input type="number" className="d_form_control" min={1} value={item.quantity || ''}
                      onChange={(e) => updateItemField(index, 'quantity', e.target.value)} />
                      <Err field={`items_$`{index}_quantity`} /></td>
                    <td><input type="number" className="d_form_control" min={0} step="0.01" value={item.unitPrice || ''}
                      onChange={(e) => updateItemField(index, 'unitPrice', e.target.value)} />
                      <Err field={`items_${index}_unitPrice`} /></td>
                    <td><strong>{computeLineTotal(item).toLocaleString('en-IN')}</strong></td>
                    <td><button type="button" className="d_icon_btn d_del" title="Remove item"
                      onClick={() => removeItemRow(index)}><MdDelete /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="d_btn d_btn_secondary" onClick={addItemRow}>Add Item</button>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>Approved</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update Return' : 'Record Return'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchase;
