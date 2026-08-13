import React, { useState, useEffect } from 'react';
import { MdInventory, MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdRemove, MdAddCircle } from 'react-icons/md';
import Modal from '../components/Modal';
// import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { rawMaterialsApi, suppliersApi } from '../utils/api';

const statusClass = { 'In Stock': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger' };
const categoryOptions = ['Metal', 'Plastic', 'Chemical', 'Fabric', 'Electronics', 'Packaging', 'Other'];
const unitOptions = ['kg', 'g', 'litre', 'ml', 'meter', 'cm', 'piece', 'box', 'roll', 'bag'];

const RawMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [report, setReport] = useState({ summary: {}, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [stockModal, setStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({ materialId: '', quantity: 0, unitPrice: '', reason: '' });
  const [stockAction, setStockAction] = useState('add'); // 'add' or 'deduct'
  const [form, setForm] = useState({
    name: '', category: 'Metal', description: '',
    unit: 'kg', quantity: 0, minimumStock: 10, unitPrice: 0, totalPrice: 0,
    supplier: '', supplierId: '', location: '', specifications: {}
  });
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
    fetchReport();
  }, []);

  // Auto-calculate total price
  useEffect(() => {
    const total = (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0);
    setForm(prev => ({ ...prev, totalPrice: total }));
  }, [form.quantity, form.unitPrice]);

  const fetchMaterials = async () => {
    setLoading(true);

    try {
      const res = await rawMaterialsApi.getAll();
      setMaterials(res.data || []);
    } catch (err) {
      toast.error('Failed to fetch raw materials');
    } finally {
      setLoading(false);
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

  const fetchReport = async () => {
    try {
      const res = await rawMaterialsApi.getReport();
      setReport(res.data || { summary: {}, transactions: [] });
    } catch (err) {
      console.error('Failed to fetch raw material report:', err);
    }
  };

  const openAdd = () => {
    setForm({
      name: '', category: 'Metal', description: '',
      unit: 'kg', quantity: 0, minimumStock: 10, unitPrice: 0, totalPrice: 0,
      supplier: '', supplierId: '', location: '', specifications: {}
    });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (material) => {
    setForm({
      name: material.name || '',
      category: material.category || 'Metal',
      description: material.description || '',
      unit: material.unit || 'kg',
      quantity: material.quantity || 0,
      minimumStock: material.minimumStock || 10,
      unitPrice: material.unitPrice || 0,
      totalPrice: material.totalPrice || 0,
      supplier: material.supplierName || '',
      supplierId: material.supplier?._id || '',
      location: material.location || '',
      specifications: material.specifications || {}
    });
    setEditId(material._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = 'Material name is required';
    if (!form.unit) e.unit = 'Unit is required';
    if (!form.unitPrice || form.unitPrice <= 0) e.unitPrice = 'Unit price must be greater than 0';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        minimumStock: Number(form.minimumStock) || 10,
        unitPrice: Number(form.unitPrice) || 0
      };
      if (editId) {
        await rawMaterialsApi.update(editId, payload);
        toast.success('Raw material updated successfully!');
      } else {
        await rawMaterialsApi.create(payload);
        toast.success('Raw material added successfully!');
      }
      fetchMaterials();
      fetchReport();
      setModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save raw material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, label) => {
    confirm({
      title: 'Delete Raw Material',
      message: `Delete ${label}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await rawMaterialsApi.remove(id);
          toast.success('Raw material deleted successfully.');
          fetchMaterials();
        } catch (err) {
          toast.error('Failed to delete raw material.');
        }
      },
    });
  };

  const openStockModal = (material, action) => {
    setStockForm({
      materialId: material._id,
      quantity: 0,
      unitPrice: action === 'add' ? material.unitPrice || '' : '',
      reason: ''
    });
    setStockAction(action);
    setStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!stockForm.quantity || stockForm.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      if (stockAction === 'deduct') {
        await rawMaterialsApi.deductStock(stockForm);
        toast.success('Stock deducted successfully');
      } else {
        await rawMaterialsApi.addStock(stockForm);
        toast.success('Stock added successfully');
      }
      fetchMaterials();
      fetchReport();
      setStockModal(false);
      setStockForm({ materialId: '', quantity: 0, unitPrice: '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update stock');
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
  const money = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN')}`;

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !searchTerm ||
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || m.category === filterCategory;
    const matchesStatus = !filterStatus || m.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* <ConfirmDialog {...confirmState} onCancel={closeConfirm} /> */}

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Raw Materials</h1>
          <p className="d_page_subtitle">Manage raw materials inventory with supplier connections</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> Add Raw Material
        </button>
      </div>

      <div className="d_card mb-3">
        <div className="d_card_body">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <div className="d_search_box flex-grow-1">
              <MdSearch className="d_search_icon" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="d_form_control"
              />
            </div>
            <select
              className="d_form_control"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All Categories</option>
              {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              className="d_form_control"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="">All Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className="d_summary_pills mb-3">
        <span>Total Materials: <strong>{report.summary?.totalMaterials || materials.length}</strong></span>
        <span>Current Qty: <strong>{report.summary?.currentQuantity || 0}</strong></span>
        <span>Purchase Value: <strong>{money(report.summary?.purchaseValue)}</strong></span>
        <span>Current Stock Value: <strong>{money(report.summary?.currentStockValue)}</strong></span>
        <span>Low Stock: <strong>{report.summary?.lowStock || 0}</strong></span>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdInventory className="d_card_icon" /> Raw Materials ({filteredMaterials.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Min Stock</th>
                    <th>Unit Price (₹)</th>
                    <th>Purchase Value (₹)</th>
                    <th>Current Stock Value (₹)</th>
                    <th>Supplier</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaterials.length === 0 && (
                    <tr className="d_empty">
                      <td colSpan={12}>No raw materials found.</td>
                    </tr>
                  )}
                  {filteredMaterials.map(m => (
                    <tr key={m._id}>
                      <td><code>{String(m.code)}</code></td>
                      <td><strong>{String(m.name)}</strong></td>
                      <td>{String(m.category)}</td>
                      <td>{String(m.unit)}</td>
                      <td><strong>{String(m.quantity)}</strong></td>
                      <td>{String(m.minimumStock)}</td>
                      <td>{money(m.unitPrice)}</td>
                      <td><strong>{money(m.totalPrice)}</strong></td>
                      <td>{money((m.quantity || 0) * (m.unitPrice || 0))}</td>
                      <td>{String(m.supplierName || '-')}</td>
                      <td><span className={`d_badge ${statusClass[m.status] || 'd_info'}`}>{String(m.status)}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(m)}><MdEdit /></button>
                          <button className="d_icon_btn d_success" onClick={() => openStockModal(m, 'add')} title="Add Stock"><MdAddCircle /></button>
                          <button className="d_icon_btn d_warning" onClick={() => openStockModal(m, 'deduct')} title="Deduct Stock"><MdRemove /></button>
                          <button className="d_icon_btn d_del" onClick={() => handleDelete(m._id, m.name)}><MdDelete /></button>
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

      <div className="d_card mt-3">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdInventory className="d_card_icon" /> Raw Material Stock Report</h2>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Material</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Unit Price (₹)</th>
                  <th>Row Value (₹)</th>
                  <th>Balance After</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {(!report.transactions || report.transactions.length === 0) && (
                  <tr className="d_empty"><td colSpan={9}>No stock movement found.</td></tr>
                )}
                {(report.transactions || []).map((txn) => (
                  <tr key={txn._id}>
                    <td>{txn.transactionDate ? new Date(txn.transactionDate).toLocaleDateString('en-IN') : '-'}</td>
                    <td><strong>{String(txn.materialCode || txn.rawMaterialId?.code || '')}</strong> - {String(txn.materialName || txn.rawMaterialId?.name || '')}</td>
                    <td><span className={`d_badge ${txn.type === 'Deduct' ? 'd_warning' : 'd_success'}`}>{String(txn.type)}</span></td>
                    <td>{String(txn.quantity || 0)}</td>
                    <td>{String(txn.unit || txn.rawMaterialId?.unit || '')}</td>
                    <td>{money(txn.unitPrice)}</td>
                    <td><strong>{money(txn.totalAmount)}</strong></td>
                    <td>{String(txn.balanceAfter || 0)}</td>
                    <td>{String(txn.reason || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Raw Material' : 'Add Raw Material'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Material Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Steel Sheet" {...f('name')} />
            <Err field="name" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Category <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('category')}>
              {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Unit <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('unit')}>
              {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <Err field="unit" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Quantity</label>
            <input type="number" className="d_form_control" placeholder="0" min={0} {...f('quantity')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Minimum Stock</label>
            <input type="number" className="d_form_control" placeholder="10" min={0} {...f('minimumStock')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Unit Price (₹) <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="0" min={0} step="0.01" {...f('unitPrice')} />
            <Err field="unitPrice" />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Total Price (₹)</label>
            <input type="number" className="d_form_control d_readonly" value={form.totalPrice} disabled />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Supplier</label>
            <select className="d_form_control" {...f('supplierId')} onChange={(e) => {
              const supplier = suppliers.find(s => s._id === e.target.value);
              setForm(p => ({ ...p, supplierId: e.target.value, supplier: supplier?.name || '' }));
            }}>
              <option value="">Select Supplier</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{String(s.name)}</option>)}
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Location</label>
            <input className="d_form_control" placeholder="e.g. Warehouse A" {...f('location')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Description</label>
            <textarea className="d_form_control" rows={3} placeholder="Material description..." {...f('description')} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Material' : 'Add Material'}
          </button>
        </div>
      </Modal>

      <Modal open={stockModal} onClose={() => setStockModal(false)} title={stockAction === 'add' ? 'Add Stock' : 'Deduct Stock'} size="sm">
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Quantity <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="0" min={1} value={stockForm.quantity}
              onChange={(e) => setStockForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
          </div>
        </div>
        {stockAction === 'add' && (
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Purchase Price (₹)</label>
              <input
                type="number"
                className="d_form_control"
                placeholder="0"
                min={0}
                step="0.01"
                value={stockForm.unitPrice}
                onChange={(e) => setStockForm(p => ({ ...p, unitPrice: e.target.value }))}
              />
            </div>
          </div>
        )}
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Reason (Optional)</label>
            <textarea className="d_form_control" rows={2} placeholder="Reason for stock adjustment..."
              value={stockForm.reason}
              onChange={(e) => setStockForm(p => ({ ...p, reason: e.target.value }))} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setStockModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleStockUpdate}>
            {stockAction === 'add' ? 'Add Stock' : 'Deduct Stock'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default RawMaterials;
