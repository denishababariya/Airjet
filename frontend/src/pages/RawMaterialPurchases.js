import React, { useState, useEffect } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdDelete, MdVisibility, MdCheckCircle } from 'react-icons/md';
import Modal from '../components/Modal';
// import ConfirmDialog from './components/C';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { rawMaterialPurchasesApi, rawMaterialsApi, suppliersApi } from '../utils/api';

const statusClass = { Pending:'d_warning', Confirmed:'d_info', 'In Transit':'d_primary', Delivered:'d_success', Partial:'d_warning', Cancelled:'d_danger' };
const paymentStatusClass = { Pending:'d_warning', Partial:'d_info', Paid:'d_success', Overdue:'d_danger' };

const RawMaterialPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [form, setForm] = useState({
    supplier: '', supplierId: '', purchaseDate: '', expectedDelivery: '',
    items: [], paymentTerms: '', notes: ''
  });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchPurchases();
    fetchMaterials();
    fetchSuppliers();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await rawMaterialPurchasesApi.getAll();
      setPurchases(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const res = await rawMaterialsApi.getAll();
      setMaterials(res.data || []);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersApi.getAll();
      setSuppliers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const openAdd = () => {
    setForm({
      supplier: '', supplierId: '', purchaseDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '', items: [], paymentTerms: '', notes: ''
    });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (purchase) => {
    setForm({
      supplier: purchase.supplier || '',
      supplierId: purchase.supplierId?._id || '',
      purchaseDate: purchase.purchaseDate || '',
      expectedDelivery: purchase.expectedDelivery || '',
      items: purchase.items || [],
      paymentTerms: purchase.paymentTerms || '',
      notes: purchase.notes || ''
    });
    setEditId(purchase._id);
    setErrors({});
    setModal(true);
  };

  const openView = (purchase) => {
    setSelectedPurchase(purchase);
    setViewModal(true);
  };

  const addItem = () => {
    setForm(p => ({
      ...p,
      items: [...p.items, { rawMaterialId: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const updateItem = (index, field, value) => {
    setForm(p => ({
      ...p,
      items: p.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index) => {
    setForm(p => ({
      ...p,
      items: p.items.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.supplierId) e.supplierId = 'Supplier is required';
    if (!form.purchaseDate) e.purchaseDate = 'Purchase date is required';
    if (!form.items || form.items.length === 0) e.items = 'At least one item is required';
    form.items?.forEach((item, i) => {
      if (!item.rawMaterialId) e[`item_${i}_material`] = 'Material is required';
      if (!item.quantity || item.quantity <= 0) e[`item_${i}_qty`] = 'Quantity must be greater than 0';
    });
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const processedItems = form.items.map(item => {
        const material = materials.find(m => m._id === item.rawMaterialId);
        return {
          rawMaterialId: item.rawMaterialId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice) || (material?.unitPrice || 0)
        };
      });

      const payload = {
        ...form,
        items: processedItems
      };

      if (editId) {
        await rawMaterialPurchasesApi.update(editId, payload);
        toast.success('Purchase updated successfully!');
      } else {
        await rawMaterialPurchasesApi.create(payload);
        toast.success('Purchase created successfully!');
      }
      fetchPurchases();
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, label) => {
    confirm({
      title: 'Delete Purchase',
      message: `Delete ${label}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await rawMaterialPurchasesApi.remove(id);
          toast.success('Purchase deleted successfully.');
          fetchPurchases();
        } catch (err) {
          toast.error('Failed to delete purchase.');
        }
      },
    });
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await rawMaterialPurchasesApi.update(id, { status });
      toast.success(`Status updated to ${status}`);
      fetchPurchases();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }));
      setErrors(p => ({ ...p, [field]: '' }));
    },
  });

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => {
      const material = materials.find(m => m._id === item.rawMaterialId);
      const price = Number(item.unitPrice) || (material?.unitPrice || 0);
      return sum + (Number(item.quantity) * price);
    }, 0);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* <ConfirmDialog {...confirmState} onCancel={closeConfirm} /> */}

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Raw Material Purchases</h1>
          <p className="d_page_subtitle">Manage raw material purchases from suppliers</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> New Purchase
        </button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchases ({purchases.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Purchase ID</th>
                    <th>Supplier</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total Amount (₹)</th>
                    <th>Grand Total (₹)</th>
                    <th>Status</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={9}>No purchases found.</td>
                    </tr>
                  )}
                  {purchases.map(p => (
                    <tr key={p._id}>
                      <td><code>{String(p.id)}</code></td>
                      <td><strong>{String(p.supplier)}</strong></td>
                      <td>{String(p.purchaseDate)}</td>
                      <td>{String(p.items?.length || 0)}</td>
                      <td><strong>₹{(p.totalAmount || 0).toLocaleString('en-IN')}</strong></td>
                      <td><strong>₹{(p.grandTotal || 0).toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${statusClass[p.status] || 'd_info'}`}>{String(p.status)}</span></td>
                      <td><span className={`d_badge ${paymentStatusClass[p.paymentStatus] || 'd_info'}`}>{String(p.paymentStatus)}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => openView(p)}><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
                          {p.status !== 'Delivered' && p.status !== 'Cancelled' && (
                            <button className="d_icon_btn d_success" onClick={() => handleStatusUpdate(p._id, 'Delivered')} title="Mark as Delivered">
                              <MdCheckCircle />
                            </button>
                          )}
                          <button className="d_icon_btn d_del" onClick={() => handleDelete(p._id, p.id)}><MdDelete /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Purchase' : 'New Purchase'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Supplier <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('supplierId')} onChange={(e) => {
              const supplier = suppliers.find(s => s._id === e.target.value);
              setForm(p => ({ ...p, supplierId: e.target.value, supplier: supplier?.name || '' }));
            }}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{String(s.name)}</option>)}
            </select>
            <Err field="supplierId" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Purchase Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('purchaseDate')} />
            <Err field="purchaseDate" />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Expected Delivery</label>
            <input type="date" className="d_form_control" {...f('expectedDelivery')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Payment Terms</label>
            <input className="d_form_control" placeholder="e.g. Net 30" {...f('paymentTerms')} />
          </div>
        </div>

        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Items <span className="d_req">*</span></label>
            {form.items?.map((item, index) => (
              <div key={index} className="d_item_row d-flex gap-2 mb-2 align-items-end">
                <div style={{ flex: 2 }}>
                  <select
                    className="d_form_control"
                    value={item.rawMaterialId}
                    onChange={(e) => updateItem(index, 'rawMaterialId', e.target.value)}
                  >
                    <option value="">Select Material</option>
                    {materials.map(m => <option key={m._id} value={m._id}>{String(m.code)} - {String(m.name)}</option>)}
                  </select>
                  <Err field={`item_${index}_material`} />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    className="d_form_control"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    min={1}
                  />
                  <Err field={`item_${index}_qty`} />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number"
                    className="d_form_control"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    min={0}
                    step="0.01"
                  />
                </div>
                <button className="d_btn d_btn_danger" onClick={() => removeItem(index)}><MdDelete /></button>
              </div>
            ))}
            <button className="d_btn d_btn_outline d_btn_sm" onClick={addItem}><MdAdd /> Add Item</button>
            <Err field="items" />
          </div>
        </div>

        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Total Amount</label>
            <div className="d_form_control d_readonly">₹{calculateTotal().toLocaleString('en-IN')}</div>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Grand Total (incl. 18% GST)</label>
            <div className="d_form_control d_readonly">₹{(calculateTotal() * 1.18).toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Notes</label>
            <textarea className="d_form_control" rows={3} placeholder="Additional notes..." {...f('notes')} />
          </div>
        </div>

        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Purchase' : 'Create Purchase'}
          </button>
        </div>
      </Modal>

      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Purchase Details" size="lg">
        {selectedPurchase && (
          <div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Purchase ID</label>
                <div className="d_form_control d_readonly">{String(selectedPurchase.id)}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Supplier</label>
                <div className="d_form_control d_readonly">{String(selectedPurchase.supplier)}</div>
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Purchase Date</label>
                <div className="d_form_control d_readonly">{String(selectedPurchase.purchaseDate)}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Expected Delivery</label>
                <div className="d_form_control d_readonly">{String(selectedPurchase.expectedDelivery || '-')}</div>
              </div>
            </div>
            
            <h4 className="mt-3 mb-2">Items</h4>
            <table className="d_table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPurchase.items?.map((item, i) => (
                  <tr key={i}>
                    <td>{String(item.materialName)}</td>
                    <td>{String(item.quantity)}</td>
                    <td>{String(item.unit)}</td>
                    <td>₹{(item.unitPrice || 0).toLocaleString('en-IN')}</td>
                    <td>₹{(item.totalPrice || 0).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d_form_row cols-2 mt-3">
              <div className="d_form_group">
                <label className="d_form_label">Total Amount</label>
                <div className="d_form_control d_readonly">₹{(selectedPurchase.totalAmount || 0).toLocaleString('en-IN')}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Grand Total</label>
                <div className="d_form_control d_readonly">₹{(selectedPurchase.grandTotal || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>

            <div className="d_form_actions mt-3">
              <button className="d_btn d_btn_outline" onClick={() => setViewModal(false)}>Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RawMaterialPurchases;
