import React, { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdShoppingCart, MdVisibility, MdDelete, MdInventory, MdTrendingUp, MdAttachMoney, MdReceipt } from 'react-icons/md';
import Modal from '../components/Modal';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import { rawMaterialPurchasesApi, suppliersApi } from '../utils/api';
import './RawMaterialPurchases.css';

const statusClass = {
  Pending: 'd_warning',
  Confirmed: 'd_info',
  'In Transit': 'd_primary',
  Delivered: 'd_success',
  Partial: 'd_warning',
  Cancelled: 'd_danger'
};

const blankForm = {
  supplier: '',
  supplierId: '',
  purchaseDate: '',
  expectedDelivery: '',
  status: 'Delivered',
  items: [{ id: '', name: '', category: 'Metal', unit: 'piece', quantity: 1, unitPrice: 0 }],
  paymentTerms: '',
  notes: ''
};

const RawMaterialPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [purchaseRes, supplierRes] = await Promise.all([
        rawMaterialPurchasesApi.getAll(),
        suppliersApi.getAll()
      ]);
      setPurchases(purchaseRes.data || []);
      setSuppliers(supplierRes.data || []);
      console.log('Suppliers loaded:', supplierRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error(err.response?.data?.error || 'Failed to load raw material purchases');
    } finally {
      setLoading(false);
    }
  };

  const money = (value) => {
    const num = Number(value) || 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const summary = useMemo(() => {
    return purchases.reduce((acc, purchase) => {
      acc.purchases += 1;
      acc.items += purchase.items?.length || 0;
      acc.quantity += (purchase.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      acc.amount += Number(purchase.totalAmount) || 0;
      return acc;
    }, { purchases: 0, items: 0, quantity: 0, amount: 0 });
  }, [purchases]);

  const openAdd = () => {
    setForm({
      ...blankForm,
      purchaseDate: new Date().toISOString().split('T')[0],
      items: [{ id: Date.now().toString(), name: '', category: 'Metal', unit: 'piece', quantity: 1, unitPrice: 0 }]
    });
    setErrors({});
    setModal(true);
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), name: '', category: 'Metal', unit: 'piece', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.supplierId) nextErrors.supplierId = 'Supplier is required';
    if (!form.purchaseDate) nextErrors.purchaseDate = 'Purchase date is required';
    if (!form.items.length) nextErrors.items = 'At least one item is required';
    form.items.forEach((item, index) => {
      if (!item.name?.trim()) nextErrors[`item_${index}_name`] = 'Material name is required';
      if (!item.quantity || Number(item.quantity) <= 0) nextErrors[`item_${index}_quantity`] = 'Qty must be greater than 0';
      if (item.unitPrice === '' || Number(item.unitPrice) < 0) nextErrors[`item_${index}_price`] = 'Price is required';
    });
    return nextErrors;
  };

  const handleSave = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        items: form.items.map((item) => ({
          name: item.name.trim(),
          category: item.category,
          unit: item.unit,
          quantity: Number(item.quantity) || 0,
          unitPrice: Number(item.unitPrice) || 0
        }))
      };

      await rawMaterialPurchasesApi.create(payload);
      toast.success('Raw material purchase added successfully');
      setModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save purchase');
    } finally {
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    return form.items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
  };

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const renderPurchaseDetails = () => {
    if (!selectedPurchase) return null;

    const items = selectedPurchase.items || [];
    const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalAmount = Number(selectedPurchase.totalAmount) || 0;
    const gstAmount = totalAmount * 0.18;
    const grandTotal = totalAmount + gstAmount;

    return (
      <div className="d_rmp_details">
        <div className="d_rmp_details_hero">
          <div className="d_rmp_details_identity">
            <div className="d_rmp_details_eyebrow">
              <MdShoppingCart />
              Purchase Overview
            </div>
            <div className="d_rmp_details_ref">
              Purchase ID: <code>{selectedPurchase.id}</code>
            </div>
            <div className="d_rmp_details_supplier">{selectedPurchase.supplier || 'Unknown Supplier'}</div>
            <div className="d_rmp_details_notes">{selectedPurchase.notes || 'No notes added for this purchase.'}</div>
          </div>

          <div className="d_rmp_details_amount_card">
            <span className={`d_badge ${statusClass[selectedPurchase.status] || 'd_info'}`}>{selectedPurchase.status}</span>
            <div>
              <div className="d_rmp_details_amount_label">Grand Total</div>
              <div className="d_rmp_details_amount_value">{money(grandTotal)}</div>
            </div>
            <div className="d_rmp_details_amount_meta">Base {money(totalAmount)} + GST {money(gstAmount)}</div>
          </div>
        </div>

        <div className="d_rmp_details_info_grid">
          <div className="d_rmp_info_card">
            <div className="d_rmp_info_label">Purchase Date</div>
            <div className="d_rmp_info_value">{formatDate(selectedPurchase.purchaseDate)}</div>
          </div>
          <div className="d_rmp_info_card">
            <div className="d_rmp_info_label">Expected Delivery</div>
            <div className="d_rmp_info_value">{formatDate(selectedPurchase.expectedDelivery)}</div>
          </div>
          <div className="d_rmp_info_card">
            <div className="d_rmp_info_label">Payment Terms</div>
            <div className="d_rmp_info_value">{selectedPurchase.paymentTerms || 'Not specified'}</div>
          </div>
          <div className="d_rmp_info_card">
            <div className="d_rmp_info_label">Material Lines</div>
            <div className="d_rmp_info_value">{items.length} items</div>
          </div>
        </div>

        <div className="d_rmp_details_stats">
          <div className="d_rmp_stat_card">
            <div className="d_rmp_stat_icon"><MdInventory /></div>
            <div>
              <div className="d_rmp_stat_label">Item Count</div>
              <div className="d_rmp_stat_value">{items.length}</div>
            </div>
          </div>
          <div className="d_rmp_stat_card">
            <div className="d_rmp_stat_icon"><MdTrendingUp /></div>
            <div>
              <div className="d_rmp_stat_label">Total Quantity</div>
              <div className="d_rmp_stat_value">{totalQty}</div>
            </div>
          </div>
          <div className="d_rmp_stat_card">
            <div className="d_rmp_stat_icon"><MdAttachMoney /></div>
            <div>
              <div className="d_rmp_stat_label">Purchase Value</div>
              <div className="d_rmp_stat_value">{money(totalAmount)}</div>
            </div>
          </div>
        </div>

        <div className="d_rmp_details_section">
          <div className="d_rmp_details_section_header">
            <div className="d_rmp_details_section_title">
              <MdReceipt />
              Item Breakdown
            </div>
            <div className="d_rmp_details_section_hint">Detailed pricing for each purchased material</div>
          </div>

          <div className="d_rmp_item_list">
            {items.map((item, index) => {
              const lineTotal = Number(item.totalPrice) || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));

              return (
                <div key={item.id || item._id || index} className="d_rmp_item_card">
                  <div className="d_rmp_item_header">
                    <div>
                      <div className="d_rmp_item_name">{item.materialName || item.name || `Material ${index + 1}`}</div>
                      <div className="d_rmp_item_subtitle">{item.category || 'Other'} | {item.quantity || 0} {item.unit || 'unit'}</div>
                    </div>
                    <div className="d_rmp_item_total">{money(lineTotal)}</div>
                  </div>

                  <div className="d_rmp_item_stats">
                    <div className="d_rmp_item_stat">
                      <span>Unit Price</span>
                      <strong>{money(item.unitPrice || 0)}</strong>
                    </div>
                    <div className="d_rmp_item_stat">
                      <span>Quantity</span>
                      <strong>{item.quantity || 0} {item.unit || 'unit'}</strong>
                    </div>
                    <div className="d_rmp_item_stat">
                      <span>Category</span>
                      <strong>{item.category || 'Other'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="d_rmp_totals_card">
            <div className="d_rmp_total_row">
              <span>Subtotal</span>
              <strong>{money(totalAmount)}</strong>
            </div>
            <div className="d_rmp_total_row">
              <span>GST (18%)</span>
              <strong>{money(gstAmount)}</strong>
            </div>
            <div className="d_rmp_total_row is_grand">
              <span>Grand Total</span>
              <strong>{money(grandTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Raw Material Purchases</h1>
          <p className="d_page_subtitle">Purchase history for raw materials</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Purchase</button>
      </div> */}



      <div className="d_card mb-3">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Report ({purchases.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Purchase ID</th>
                    <th>Supplier</th>
                    <th>Purchase Date</th>
                    <th>Expected Delivery</th>
                    <th>Payment Terms</th>
                    <th>Items Count</th>
                    <th>Total Quantity</th>
                    <th>Total Amount (₹)</th>
                    <th>GST Amount (₹)</th>
                    <th>Grand Total (₹)</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={13}>No raw material purchases found.</td>
                    </tr>
                  )}
                  {purchases.map((purchase) => {
                    const totalQty = (purchase.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                    const totalAmount = Number(purchase.totalAmount) || 0;
                    const gstAmount = totalAmount * 0.18;
                    const grandTotal = totalAmount + gstAmount;
                    return (
                      <tr key={purchase._id}>
                        <td><code>{String(purchase.id)}</code></td>
                        <td><strong>{String(purchase.supplier)}</strong></td>
                        <td>{String(purchase.purchaseDate)}</td>
                        <td>{String(purchase.expectedDelivery || '-')}</td>
                        <td>{String(purchase.paymentTerms || '-')}</td>
                        <td><strong>{String(purchase.items?.length || 0)}</strong></td>
                        <td><strong>{String(totalQty)}</strong></td>
                        <td><strong>{money(totalAmount)}</strong></td>
                        <td>{money(gstAmount)}</td>
                        <td><strong>{money(grandTotal)}</strong></td>
                        <td><span className={`d_badge ${statusClass[purchase.status] || 'd_info'}`}>{String(purchase.status)}</span></td>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={String(purchase.notes || '-')}>{String(purchase.notes || '-')}</td>
                        <td>
                          <div className="d_action_btns">
                            <button className="d_icon_btn d_view" onClick={() => { setSelectedPurchase(purchase); setViewModal(true); }}><MdVisibility /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="row ">
        <div className="col-md-2-4 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_primary">
            <div className="d_stat_icon"><MdShoppingCart /></div>
            <div className="d_stat_content">
              <div className="d_stat_label">Total Purchases</div>
              <div className="d_stat_value">{summary.purchases}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2-4 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_success">
            <div className="d_stat_icon"><MdInventory /></div>
            <div className="d_stat_content">
              <div className="d_stat_label">Total Items</div>
              <div className="d_stat_value">{summary.items}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2-4 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_info">
            <div className="d_stat_icon"><MdTrendingUp /></div>
            <div className="d_stat_content">
              <div className="d_stat_label">Total Qty</div>
              <div className="d_stat_value">{summary.quantity}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2-4 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_accent">
            <div className="d_stat_icon"><MdAttachMoney /></div>
            <div className="d_stat_content">
              <div className="d_stat_label">Purchase Value</div>
              <div className="d_stat_value">{money(summary.amount)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2-4 col-sm-6 mb-3">
          <div className="d_stat_card d_stat_card_warning">
            <div className="d_stat_icon"><MdReceipt /></div>
            <div className="d_stat_content">
              <div className="d_stat_label">Grand Total</div>
              <div className="d_stat_value">{money(summary.amount * 1.18)}</div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Raw Material Purchase" size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Supplier <span className="d_req">*</span></label>
            <select className="d_form_control" value={form.supplierId} onChange={(e) => {
              const supplier = suppliers.find((s) => s._id === e.target.value);
              setForm((prev) => ({ ...prev, supplierId: e.target.value, supplier: supplier?.name || '' }));
              setErrors((prev) => ({ ...prev, supplierId: '' }));
            }}>
              <option value="">Select Supplier</option>
              {suppliers.length === 0 ? (
                <option disabled>No suppliers available</option>
              ) : (
                suppliers.map((supplier) => <option key={supplier._id} value={supplier._id}>{supplier.name}</option>)
              )}
            </select>
            <Err field="supplierId" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Purchase Date <span className="d_req">*</span></label>
            <input className="d_form_control" type="date" value={form.purchaseDate} onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))} />
            <Err field="purchaseDate" />
          </div>
        </div>

        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
              <option>Delivered</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>In Transit</option>
              <option>Partial</option>
              <option>Cancelled</option>
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Expected Delivery</label>
            <input className="d_form_control" type="date" value={form.expectedDelivery} onChange={(e) => setForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))} />
          </div>
        </div>

        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr>
                <th>Material Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Qty</th>
                <th>Unit Price (₹)</th>
                {/* <th>Total (₹)</th> */}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, index) => (
                <tr key={item.id || index}>
                  <td>
                    <input className="d_form_control" type="text" placeholder="Enter material name" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} />
                    <Err field={`item_${index}_name`} />
                  </td>
                  <td>
                    <select className="d_form_control" value={item.category} onChange={(e) => updateItem(index, 'category', e.target.value)}>
                      <option>Metal</option>
                      <option>Plastic</option>
                      <option>Chemical</option>
                      <option>Fabric</option>
                      <option>Electronics</option>
                      <option>Packaging</option>
                      <option>Other</option>
                    </select>
                  </td>
                  <td>
                    <select className="d_form_control" value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)}>
                      <option>kg</option>
                      <option>g</option>
                      <option>litre</option>
                      <option>ml</option>
                      <option>meter</option>
                      <option>cm</option>
                      <option>piece</option>
                      <option>box</option>
                      <option>roll</option>
                      <option>bag</option>
                    </select>
                  </td>
                  <td>
                    <input className="d_form_control" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} />
                    <Err field={`item_${index}_quantity`} />
                  </td>
                  <td>
                    <input className="d_form_control" type="number" min={0} step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} />
                    <Err field={`item_${index}_price`} />
                  </td>
                  {/* <td><strong>₹{((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)).toLocaleString('en-IN')}</strong></td> */}
                  <td><button className="d_icon_btn d_del" onClick={() => removeItem(index)}><MdDelete /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="d_btn d_btn_outline d_btn_sm mt-2" onClick={addItem}><MdAdd /> Add Item</button>

        <div className="d_form_row cols-2 mt-3">
          <div className="d_form_group">
            <label className="d_form_label">Total Amount</label>
            <div className="d_form_control d_readonly">{money(calculateTotal())}</div>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Grand Total (18% GST)</label>
            <div className="d_form_control d_readonly">{money(calculateTotal() * 1.18)}</div>
          </div>
        </div>

        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Purchase'}</button>
        </div>
      </Modal>

      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Purchase Details" size="lg">
        {renderPurchaseDetails()}
      </Modal>
    </div>
  );
};

export default RawMaterialPurchases;
