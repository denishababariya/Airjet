import React, { useState, useEffect } from 'react';
import { MdShoppingCart, MdAdd, MdEdit, MdVisibility, MdDelete, MdInventory, MdClose, MdSearch, MdRemoveRedEye, MdExpandMore, MdExpandLess } from 'react-icons/md';
import Modal from '../components/Modal';
import { suppliersApi, purchaseOrdersApi, purchaseReturnsApi, stockApi, sparePartsApi, erpApi, grnApi } from '../utils/api';

const statusClass = { Active:'d_success', Inactive:'d_danger', Pending:'d_warning', Received:'d_success', 'In Transit':'d_info', Verified:'d_success', Partial:'d_warning', Approved:'d_success', Cancelled:'d_danger', Rejected:'d_danger', Processed:'d_info' };
const blankSup = { name: '', contact: '', phone: '', city: '', gst: '', email: '', address: '', status: 'Active', products: [] };
const blankPO  = { supplier: '', supplierId: '', date: new Date().toISOString().split('T')[0], delivery: '', status: 'Pending', notes: '', items: [] };
const blankGRN = { po: '', poId: '', supplier: '', supplierId: '', date: new Date().toISOString().split('T')[0], receivedBy: '', status: 'Pending', items: [] };
const blankRet = { po: '', poId: '', supplier: '', supplierId: '', date: new Date().toISOString().split('T')[0], reason: '', status: 'Pending', items: [] };

const toISODate = (d) => {
  if (!d) return '';
  if (d.includes('-') && d.length === 10) return d;
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = d.split('-');
  if (parts.length === 3 && months[parts[1]]) return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;
  return d;
};

const getProductCode = (p) => p.itemCode || p.code || '-';
const getProductName = (p) => p.itemName || p.name || '-';

const Purchase = ({ defaultTab = 'suppliers' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [grnList, setGrnList]     = useState([]);
  const [returns, setReturns]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankSup);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierProducts, setSupplierProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [modalProductSearch, setModalProductSearch] = useState('');
  const [showModalProductPicker, setShowModalProductPicker] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedGRN, setExpandedGRN] = useState(null);
  const [expandedReturn, setExpandedReturn] = useState(null);

  const isSup = tab === 'suppliers';
  const isPO = tab === 'orders';
  const isRet = tab === 'returns';
  const isGRN = tab === 'grn';

  const fetchSuppliers = async () => {
    try {
      const { data } = await suppliersApi.getAll();
      setSuppliers(data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load suppliers');
    }
  };

  const fetchProducts = async () => {
    try {
      const [stockRes, partsRes] = await Promise.all([
        stockApi.getAll(),
        sparePartsApi.getAll()
      ]);
      const allProducts = [
        ...(stockRes.data || []).map(p => ({ ...p, productType: 'stock', id: p._id })),
        ...(partsRes.data || []).map(p => ({ ...p, productType: 'sparePart', id: p._id }))
      ];
      setProducts(allProducts);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load products');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: list } = await purchaseOrdersApi.getAll();
      setOrders(list || []);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchGrn = async () => {
    try {
      const { data } = await erpApi.getAll('purchase', 'grn');
      setGrnList(data || []);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load GRN');
    }
  };

  const fetchReturns = async () => {
    try {
      const { data } = await purchaseReturnsApi.getAll();
      setReturns(data || []);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load returns');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchProducts(), fetchOrders(), fetchGrn(), fetchReturns()]);
      setLoading(false);
    };
    load();
  }, []);

  const openAdd = () => {
    let blank = blankSup;
    if (isGRN) blank = { ...blankGRN };
    else if (isRet) blank = { ...blankRet };
    else if (isPO) blank = { ...blankPO, items: [{ itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }] };
    setForm(blank); 
    setEditId(null); 
    setErrors({}); 
    setModal(true);
  };

  const openSupplierProducts = async (supplier) => {
    setSelectedSupplier(supplier);
    setShowProductModal(false);
    setProductSearch('');
    try {
      const { data } = await suppliersApi.getProducts(supplier._id);
      setSupplierProducts(data.products || []);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load supplier products');
    }
  };

  const addProductToSupplier = async (product) => {
    if (!selectedSupplier) return;
    try {
      await suppliersApi.addProduct(selectedSupplier._id, {
        productId: product.id,
        productType: product.productType,
        itemName: product.itemName || product.name,
        itemCode: product.itemCode || product.code || '',
        category: product.category || '',
        unitPrice: product.unitPrice || product.sellingPrice || 0
      });
      const { data } = await suppliersApi.getProducts(selectedSupplier._id);
      setSupplierProducts(data.products || []);
      setShowProductModal(false);
      setProductSearch('');
    } catch (err) {
      setError(err.displayMessage || 'Failed to add product to supplier');
    }
  };

  const removeProductFromSupplier = async (product) => {
    if (!selectedSupplier || !window.confirm('Remove this product from supplier?')) return;
    try {
      await suppliersApi.removeProduct(selectedSupplier._id, product.id, {
        productType: product.productType
      });
      const { data } = await suppliersApi.getProducts(selectedSupplier._id);
      setSupplierProducts(data.products || []);
    } catch (err) {
      setError(err.displayMessage || 'Failed to remove product from supplier');
    }
  };

  // --- Supplier Form Modal Product Helpers ---
  const addSupplierProductInForm = (product) => {
    setForm(f => {
      const exists = (f.products || []).find(p => p.productId?.toString() === product.id && p.productType === product.productType);
      if (exists) return f;
      return {
        ...f,
        products: [
          ...(f.products || []),
          {
            productType: product.productType,
            productId: product.id,
            itemName: getProductName(product),
            itemCode: getProductCode(product),
            category: product.category || '',
            unitPrice: product.unitPrice || product.sellingPrice || 0,
          }
        ]
      };
    });
    setShowModalProductPicker(false);
    setModalProductSearch('');
  };

  const removeSupplierProductInForm = (index) => {
    setForm(f => ({
      ...f,
      products: (f.products || []).filter((_, i) => i !== index)
    }));
  };

  const addPOItem = () => {
    setForm(f => ({ ...f, items: [...(f.items || []), { itemName: '', itemCode: '', category: '', quantity: 1, unitPrice: 0, totalPrice: 0, stockId: null, sparePartId: null }] }));
  };

  const removePOItem = (index) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== index) }));
  };

  const selectProductForItem = (index, product) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = {
        ...items[index],
        itemName: getProductName(product),
        itemCode: getProductCode(product),
        category: product.category || '',
        unitPrice: product.unitPrice || product.sellingPrice || 0,
        totalPrice: (Number(items[index].quantity) || 0) * (Number(product.unitPrice || product.sellingPrice || 0)),
        stockId: product.productType === 'stock' ? product.id : null,
        sparePartId: product.productType === 'sparePart' ? product.id : null,
        productType: product.productType,
      };
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
      const grandTotal = totalAmount * 1.18;
      return { ...f, items, amount: totalAmount, totalAmount, grandTotal };
    });
  };

  const updatePOItem = (index, field, value) => {
    setForm(f => {
      const items = [...f.items];
      items[index] = { ...items[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        items[index].totalPrice = (Number(items[index].quantity) || 0) * (Number(items[index].unitPrice) || 0);
      }
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
      const grandTotal = totalAmount * 1.18;
      return { ...f, items, amount: totalAmount, totalAmount, grandTotal };
    });
  };

  const getPOItemTotal = () => {
    if (!form.items || !Array.isArray(form.items)) return 0;
    return form.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  };

  const strField = (val) => (val && typeof val === 'object') ? (val.name || val.title || '') : (val || '');

  const handleSupplierChange = (supplierName) => {
    const supplier = suppliers.find(s => s.name === supplierName);
    setForm(f => ({ 
      ...f, 
      supplier: supplierName,
      supplierId: supplier?._id || ''
    }));
  };

  const openEdit = (row) => {
    if (isSup) {
      setForm({ 
        name: row.name, 
        contact: row.contact, 
        phone: row.phone, 
        city: row.city, 
        gst: row.gst, 
        email: row.email || '', 
        address: row.address || '', 
        status: row.status,
        products: Array.isArray(row.products) ? row.products : []
      });
    } else if (isGRN) {
      setForm({ 
        po: row.po || row.id, 
        poId: row.poId || '',
        supplier: strField(row.supplier), 
        supplierId: row.supplierId || '',
        date: toISODate(row.date), 
        items: Array.isArray(row.items) && row.items.length > 0 ? row.items : [{ itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }], 
        receivedBy: row.receivedBy || '', 
        status: row.status || 'Pending' 
      });
    } else if (isRet) {
      setForm({ 
        po: row.po || '', 
        poId: row.poId || '', 
        supplier: strField(row.supplier), 
        supplierId: row.supplierId || '',
        date: toISODate(row.date), 
        reason: row.reason || '', 
        items: Array.isArray(row.items) && row.items.length > 0 ? row.items : [{ itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }], 
        status: row.status || 'Pending' 
      });
    } else {
      setForm({
        supplier: strField(row.supplier),
        supplierId: row.supplierId || '',
        date: toISODate(row.date),
        items: Array.isArray(row.items) && row.items.length > 0 ? row.items : [{ itemName: '', itemCode: '', quantity: 1, unitPrice: 0, totalPrice: 0 }],
        totalAmount: row.totalAmount || 0,
        grandTotal: row.grandTotal || 0,
        delivery: toISODate(row.delivery),
        status: row.status || 'Pending',
        notes: row.notes || ''
      });
    }
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (isSup) {
      if (!form.name?.trim())    e.name    = 'Supplier name is required';
      if (!form.contact?.trim()) e.contact = 'Contact person is required';
      if (!form.phone?.trim())   e.phone   = 'Phone is required';
    } else if (isPO || isGRN || isRet) {
      if (!form.supplier?.trim()) e.supplier = 'Supplier is required';
      if (!form.date?.trim())     e.date     = 'Date is required';
      if (isPO && (!form.items || !Array.isArray(form.items) || form.items.length === 0)) e.items = 'At least one item is required';
      if (isGRN && (!form.items || !Array.isArray(form.items) || form.items.length === 0)) e.items = 'At least one item is required';
      if (isRet && (!form.items || !Array.isArray(form.items) || form.items.length === 0)) e.items = 'At least one item is required';
      if (isRet && !form.reason?.trim()) e.reason = 'Reason is required';
    }
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    if (isSup) {
      try {
        if (editId) await suppliersApi.update(editId, form);
        else await suppliersApi.create(form);
        setModal(false);
        fetchSuppliers();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save supplier');
      }
    } else if (isGRN) {
      try {
        const payload = { 
          module: 'purchase', 
          recordType: 'grn', 
          ...form, 
          items: form.items || [], 
          amount: Number(form.totalAmount) || Number(String(form.amount).replace(/[^\d.]/g, '')) || 0,
          totalAmount: Number(form.totalAmount) || Number(String(form.amount).replace(/[^\d.]/g, '')) || 0
        };
        if (editId) await grnApi.update(editId, payload);
        else await grnApi.create(payload);
        setModal(false);
        fetchGrn();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save GRN');
      }
    } else if (isRet) {
      try {
        let totalAmount = 0;
        const processedItems = (form.items || []).map(item => {
          const qty = Number(item.quantity) || 0;
          const unitPrice = Number(item.unitPrice) || 0;
          const totalPrice = qty * unitPrice;
          totalAmount += totalPrice;
          return { ...item, quantity: qty, unitPrice, totalPrice };
        });
        const payload = { 
          ...form, 
          items: processedItems, 
          totalAmount 
        };
        if (editId) await purchaseReturnsApi.update(editId, payload);
        else await purchaseReturnsApi.create(payload);
        setModal(false);
        fetchReturns();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save return');
      }
    } else {
      const payload = {
        supplier: form.supplier || '',
        supplierId: form.supplierId || '',
        date: form.date || '',
        items: form.items || [],
        totalAmount: Number(form.totalAmount) || 0,
        grandTotal: Number(form.grandTotal) || 0,
        delivery: form.delivery || '',
        status: form.status || 'Pending',
        notes: form.notes || '',
      };
      if (!editId) payload.id = `PO-${String(Date.now()).slice(-6)}`;
      try {
        if (editId) await purchaseOrdersApi.update(editId, payload);
        else await purchaseOrdersApi.create(payload);
        setModal(false);
        fetchOrders();
      } catch (err) {
        setError(err.displayMessage || 'Failed to save purchase order');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isSup) {
      try { await suppliersApi.remove(id); fetchSuppliers(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete supplier'); }
    } else if (isGRN) {
      try { await erpApi.remove(id); fetchGrn(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete GRN'); }
    } else if (isRet) {
      try { await purchaseReturnsApi.remove(id); fetchReturns(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete return'); }
    } else {
      try { await purchaseOrdersApi.remove(id); fetchOrders(); }
      catch (err) { setError(err.displayMessage || 'Failed to delete purchase order'); }
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { 
      const val = e.target.value;
      if (isPO || isGRN || isRet) {
        if (field === 'supplier') handleSupplierChange(val);
        else setForm(p => ({ ...p, [field]: val }));
      } else {
        setForm(p => ({ ...p, [field]: val })); 
      }
      setErrors(p => ({ ...p, [field]: '' })); 
    },
  });

  const renderItemsTable = (items, forEdit = true, itemIndexPrefix = '') => (
    <div className="d_table_wrap mb-2">
      <table className="d_table d_table_sm">
        <thead>
          <tr>
            {!forEdit && <th>Item Code</th>}
            <th>{forEdit ? 'Product / Item Name' : 'Item Name'}</th>
            {forEdit && <th>Qty</th>}
            {forEdit && <th>Unit Price</th>}
            <th>{forEdit ? 'Total' : 'Quantity'}</th>
            {!forEdit && <th>Unit Price</th>}
            {!forEdit && <th>Total</th>}
            {forEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item, idx) => (
            <tr key={itemIndexPrefix + idx}>
              {!forEdit && <td><code>{item.itemCode || '-'}</code></td>}
              <td>
                {forEdit ? (
                  <SelectableProductField 
                    products={products} 
                    value={item}
                    onChange={(p) => selectProductForItem(idx, p)}
                    onTextChange={(val) => updatePOItem(idx, 'itemName', val)}
                  />
                ) : (
                  <strong>{item.itemName || '-'}</strong>
                )}
              </td>
              {forEdit && <td><input type="number" className="d_form_control" value={item.quantity} onChange={e => updatePOItem(idx, 'quantity', e.target.value)} /></td>}
              {forEdit && <td><input type="number" className="d_form_control" value={item.unitPrice} onChange={e => updatePOItem(idx, 'unitPrice', e.target.value)} /></td>}
              <td>{forEdit ? null : (item.quantity || 0)}</td>
              {!forEdit && <td>₹{(Number(item.unitPrice) || 0).toLocaleString()}</td>}
              <td>₹{(Number(item.totalPrice) || (forEdit ? 0 : (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))).toLocaleString()}</td>
              {forEdit && <td><button className="d_icon_btn d_del" onClick={() => removePOItem(idx)}><MdDelete /></button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Purchase Management</h1>
          <p className="d_page_subtitle">Manage suppliers, purchase orders, GRN and returns</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {tab === 'suppliers' ? 'Add Supplier' : tab === 'products' ? '' : tab === 'orders' ? 'New PO' : tab === 'grn' ? 'Create GRN' : 'New Return'}
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[['suppliers','Suppliers'],['products','Products'],['orders','Purchase Orders'],['grn','GRN'],['returns','Returns']].map(([k,v]) => (
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
                    <tr key={s._id}>
                      <td><code>{s.id || s._id}</code></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.contact}</td>
                      <td>{s.phone}</td><td>{s.city}</td><td><code>{s.gst}</code></td>
                      <td><span className={`d_badge ${statusClass[s.status]}`}>{s.status}</span></td>
                       <td><div className="d_action_btns">
                         <button className="d_icon_btn d_edit" onClick={() => openEdit(s)}><MdEdit /></button>
                         <button className="d_icon_btn d_view" onClick={() => openSupplierProducts(s)} title="View Products"><MdVisibility /></button>
                         <button className="d_icon_btn d_del"  onClick={() => handleDelete(s._id)}><MdDelete /></button>
                       </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdInventory className="d_card_icon" /> Products ({products.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Supplier</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && <tr className="d_empty"><td colSpan={8}>No products found.</td></tr>}
                  {products.map(p => (
                    <tr key={`${p.productType}-${p._id}`}>
                      <td><code>{getProductCode(p)}</code></td>
                      <td><strong>{getProductName(p)}</strong></td>
                      <td>{p.category}</td>
                      <td><span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'}`}>{p.productType === 'stock' ? 'Stock' : 'Spare Part'}</span></td>
                      <td>{p.supplier || '-'}</td>
                      <td>₹{(p.unitPrice || p.sellingPrice || 0).toLocaleString()}</td>
                      <td>{p.quantity}</td>
                      <td><span className={`d_badge ${statusClass[p.status] || 'd_info'}`}>{p.status}</span></td>
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
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Orders ({orders.length})</h2>
          </div>
          <div className="d_card_body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}
            {loading ? (
              <div className="text-center py-4">Loading purchase orders…</div>
            ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th></th><th>PO No.</th><th>Supplier</th><th>Order Date</th><th>Items</th><th>Amount</th><th>Expected Delivery</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.length === 0 && <tr className="d_empty"><td colSpan={9}>No purchase orders found.</td></tr>}
                  {orders.map(o => (
                    <React.Fragment key={o._id}>
                      <tr>
                        <td>
                          <button className="d_icon_btn" onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}>
                            {expandedOrder === o._id ? <MdExpandLess /> : <MdExpandMore />}
                          </button>
                        </td>
                        <td><code>{o.id}</code></td>
                        <td><strong>{typeof o.supplier === 'object' ? o.supplier?.name || '-' : o.supplier || '-'}</strong></td>
                        <td>{o.date || '-'}</td>
                        <td>{Array.isArray(o.items) ? o.items.length : (o.items || '-')}</td>
                        <td><strong>₹{(o.amount || o.totalAmount || o.grandTotal || 0).toLocaleString()}</strong></td>
                        <td>{o.delivery || '-'}</td>
                        <td><span className={`d_badge ${statusClass[o.status] || 'd_info'}`}>{o.status}</span></td>
                        <td><div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => setExpandedOrder(expandedOrder === o._id ? null : o._id)}><MdRemoveRedEye /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(o)}><MdEdit /></button>
                          <button className="d_icon_btn d_del"  onClick={() => handleDelete(o._id)}><MdDelete /></button>
                        </div></td>
                      </tr>
                      {expandedOrder === o._id && (
                        <tr>
                          <td colSpan={9} style={{ backgroundColor: 'var(--d-bg-soft)' }}>
                            <div className="p-3">
                              <h6 className="mb-2">Order Items</h6>
                              {renderItemsTable(o.items, false)}
                              {o.notes && <p className="mb-0 mt-2"><strong>Notes: </strong>{o.notes}</p>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {tab === 'grn' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Goods Receipt Notes ({grnList.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Create GRN</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th></th><th>GRN No.</th><th>PO Ref.</th><th>Supplier</th><th>Date</th><th>Items</th><th>Amount</th><th>Received By</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {grnList.length === 0 && <tr className="d_empty"><td colSpan={10}>No GRN records found.</td></tr>}
                  {grnList.map(g => (
                    <React.Fragment key={g._id}>
                      <tr>
                        <td>
                          <button className="d_icon_btn" onClick={() => setExpandedGRN(expandedGRN === g._id ? null : g._id)}>
                            {expandedGRN === g._id ? <MdExpandLess /> : <MdExpandMore />}
                          </button>
                        </td>
                        <td><code>{g.id}</code></td>
                        <td><code>{g.po}</code></td>
                        <td><strong>{typeof g.supplier === 'object' ? g.supplier?.name || '-' : g.supplier || '-'}</strong></td>
                        <td>{g.date}</td>
                        <td>{Array.isArray(g.items) ? g.items.length : (g.items || '-')}</td>
                        <td><strong>₹{(g.amount || g.totalAmount || 0).toLocaleString()}</strong></td>
                        <td>{g.receivedBy}</td>
                        <td><span className={`d_badge ${statusClass[g.status] || 'd_info'}`}>{g.status}</span></td>
                        <td><div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => setExpandedGRN(expandedGRN === g._id ? null : g._id)}><MdRemoveRedEye /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(g)}><MdEdit /></button>
                          <button className="d_icon_btn d_del" onClick={() => handleDelete(g._id)}><MdDelete /></button>
                        </div></td>
                      </tr>
                      {expandedGRN === g._id && (
                        <tr>
                          <td colSpan={10} style={{ backgroundColor: 'var(--d-bg-soft)' }}>
                            <div className="p-3">
                              <h6 className="mb-2">Received Items</h6>
                              {renderItemsTable(g.items, false)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
            <h2 className="d_card_title"><MdShoppingCart className="d_card_icon" /> Purchase Returns ({returns.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> New Return</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th></th><th>Return No.</th><th>PO Ref.</th><th>Supplier</th><th>Date</th><th>Reason</th><th>Items</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {returns.length === 0 && <tr className="d_empty"><td colSpan={10}>No return records found.</td></tr>}
                  {returns.map(r => (
                    <React.Fragment key={r._id}>
                      <tr>
                        <td>
                          <button className="d_icon_btn" onClick={() => setExpandedReturn(expandedReturn === r._id ? null : r._id)}>
                            {expandedReturn === r._id ? <MdExpandLess /> : <MdExpandMore />}
                          </button>
                        </td>
                        <td><code>{r.id}</code></td>
                        <td><code>{r.po}</code></td>
                        <td><strong>{typeof r.supplier === 'object' ? r.supplier?.name || '-' : r.supplier || '-'}</strong></td>
                        <td>{r.date}</td>
                        <td style={{ maxWidth: 200 }}>{r.reason}</td>
                        <td>{Array.isArray(r.items) ? r.items.length : (r.items || '-')}</td>
                        <td><strong>₹{(r.amount || r.totalAmount || 0).toLocaleString()}</strong></td>
                        <td><span className={`d_badge ${statusClass[r.status] || 'd_warning'}`}>{r.status}</span></td>
                        <td><div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => setExpandedReturn(expandedReturn === r._id ? null : r._id)}><MdRemoveRedEye /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
                          <button className="d_icon_btn d_del"  onClick={() => handleDelete(r._id)}><MdDelete /></button>
                        </div></td>
                      </tr>
                      {expandedReturn === r._id && (
                        <tr>
                          <td colSpan={10} style={{ backgroundColor: 'var(--d-bg-soft)' }}>
                            <div className="p-3">
                              <h6 className="mb-2">Returned Items</h6>
                              {renderItemsTable(r.items, false)}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSup && (
        <Modal open={modal} onClose={() => { setModal(false); setShowModalProductPicker(false); }} title={editId ? 'Edit Supplier' : 'Add Supplier'} size="lg">
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
              <label className="d_form_label">Email</label>
              <input className="d_form_control" placeholder="supplier@example.com" {...f('email')} />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Address</label>
              <textarea className="d_form_control" rows="2" {...f('address')}></textarea>
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Products Section in Supplier Modal */}
          <div className="d_form_row cols-1 mt-3">
            <div className="d_form_group">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="d_form_label mb-0">Supplier Products</label>
                <button 
                  type="button" 
                  className="d_btn d_btn_sm d_btn_outline" 
                  onClick={() => setShowModalProductPicker(!showModalProductPicker)}
                >
                  <MdAdd /> Link Products
                </button>
              </div>

              {/* Product Picker */}
              {showModalProductPicker && (
                <div className="mb-3 p-3" style={{ border: '1px solid var(--d-border)', borderRadius: 8, backgroundColor: 'var(--d-bg-soft)' }}>
                  <div className="d_search_box mb-3">
                    <span className="d_search_icon"><MdSearch /></span>
                    <input
                      className="d_search_input"
                      placeholder="Search products to add..."
                      value={modalProductSearch}
                      onChange={e => setModalProductSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                    {products.filter(p => 
                      !modalProductSearch || 
                      getProductName(p).toLowerCase().includes(modalProductSearch.toLowerCase()) || 
                      getProductCode(p).toLowerCase().includes(modalProductSearch.toLowerCase())
                    ).map(p => (
                      <div key={`modal-${p.productType}-${p._id}`} className="d-flex justify-content-between align-items-center p-2 mb-2" style={{ border: '1px solid var(--d-border)', borderRadius: 6, backgroundColor: 'white' }}>
                        <div>
                          <strong>{getProductName(p)}</strong> <code>{getProductCode(p)}</code>
                          <span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'} ml-2`}>{p.productType === 'stock' ? 'Stock' : 'Spare'}</span>
                          <small className="text-muted ml-2">{p.category || '-'}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <span>₹{(p.unitPrice || p.sellingPrice || 0).toLocaleString()}</span>
                          <button 
                            type="button" 
                            className="d_btn d_btn_sm d_btn_primary" 
                            onClick={() => addSupplierProductInForm(p)}
                          >
                            <MdAdd /> Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Products List */}
              <div>
                {(!form.products || form.products.length === 0) && (
                  <div className="text-center py-3 text-muted">No products linked yet. Click "Link Products" above.</div>
                )}
                {(form.products || []).map((p, idx) => (
                  <div key={`sup-prod-${idx}`} className="d-flex justify-content-between align-items-center p-2 mb-2" style={{ border: '1px solid var(--d-border)', borderRadius: 6, backgroundColor: 'var(--d-bg-soft)' }}>
                    <div>
                      <code>{p.itemCode || '-'}</code> - <strong>{p.itemName}</strong>
                      <span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'} ml-2`}>{p.productType === 'stock' ? 'Stock' : 'Spare'}</span>
                      <small className="text-muted ml-2">{p.category || '-'}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <input 
                        type="number" 
                        className="d_form_control" 
                        style={{ minWidth: 100 }}
                        value={p.unitPrice || 0} 
                        onChange={(e) => {
                          setForm(prev => {
                            const products = [...(prev.products || [])];
                            products[idx] = { ...products[idx], unitPrice: Number(e.target.value) || 0 };
                            return { ...prev, products };
                          });
                        }}
                      />
                      <button 
                        type="button" 
                        className="d_icon_btn d_del" 
                        onClick={() => removeSupplierProductInForm(idx)}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => { setModal(false); setShowModalProductPicker(false); }}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Supplier'}</button>
          </div>
        </Modal>
      )}

      {/* GRN / Returns Modal */}
      {(isGRN || isRet) && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? (isGRN ? 'Edit GRN' : 'Edit Return') : (isGRN ? 'Create GRN' : 'New Return')} size="lg">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">PO Reference</label>
              <select className="d_form_control" {...f('po')}>
                <option value="">Select Purchase Order (Optional)</option>
                {orders.map(o => <option key={o._id} value={o.id}>{o.id} - {typeof o.supplier === 'object' ? o.supplier?.name : o.supplier}</option>)}
              </select>
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
              {errors.supplier && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.supplier}</span>}
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" {...f('date')} />
              {errors.date && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.date}</span>}
            </div>
          </div>
          {isGRN && (
            <div className="d_form_row cols-1">
              <div className="d_form_group">
                <label className="d_form_label">Received By</label>
                <input className="d_form_control" placeholder="Received by name" {...f('receivedBy')} />
              </div>
            </div>
          )}
          {isRet && (
            <div className="d_form_row cols-1">
              <div className="d_form_group">
                <label className="d_form_label">Reason <span className="d_req">*</span></label>
                <textarea className="d_form_control" rows="2" {...f('reason')}></textarea>
                {errors.reason && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.reason}</span>}
              </div>
            </div>
          )}
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Items <span className="d_req">*</span></label>
              {renderItemsTable(form.items, true)}
              <button className="d_btn d_btn_outline d_btn_sm" onClick={addPOItem}><MdAdd /> Add Item</button>
              {errors.items && <span style={{ color: 'var(--d-danger)', fontSize: 12, display: 'block', marginTop: 8 }}>{errors.items}</span>}
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Subtotal (₹)</label>
              <input className="d_form_control" value={getPOItemTotal().toLocaleString()} readOnly />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                {isGRN ? (<><option>Pending</option><option>Verified</option><option>Partial</option></>) : (<><option>Pending</option><option>Approved</option><option>Rejected</option><option>Processed</option></>)}
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : (isGRN ? 'Create GRN' : 'Create Return')}</button>
          </div>
        </Modal>
      )}
      {/* PO Modal */}
      {isPO && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Purchase Order' : 'New Purchase Order'} size="lg">
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Supplier <span className="d_req">*</span></label>
              <select className="d_form_control" {...f('supplier')}>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
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
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Items <span className="d_req">*</span></label>
              {renderItemsTable(form.items, true)}
              <button className="d_btn d_btn_outline d_btn_sm" onClick={addPOItem}><MdAdd /> Add Item</button>
              {errors.items && <span style={{ color: 'var(--d-danger)', fontSize: 12, display: 'block', marginTop: 8 }}>{errors.items}</span>}
            </div>
          </div>
          <div className="d_form_row cols-3">
            <div className="d_form_group">
              <label className="d_form_label">Subtotal (₹)</label>
              <input className="d_form_control" value={getPOItemTotal().toLocaleString()} readOnly />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">GST (18%)</label>
              <input className="d_form_control" value={(getPOItemTotal() * 0.18).toLocaleString()} readOnly />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Grand Total (₹)</label>
              <input className="d_form_control" value={(Number(form.grandTotal) || 0).toLocaleString()} readOnly />
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Notes</label>
              <textarea className="d_form_control" rows="2" {...f('notes')}></textarea>
            </div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" {...f('status')}>
                <option>Pending</option><option>In Transit</option><option>Received</option><option>Partial</option><option>Cancelled</option>
              </select>
            </div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update PO' : 'Create PO'}</button>
          </div>
        </Modal>
      )}

      {/* Supplier Products Modal */}
      {selectedSupplier && (
        <div className="d_modal_overlay">
          <div className="d_modal d_modal_lg">
            <div className="d_modal_header">
              <h3><MdInventory /> {selectedSupplier.name} - Products</h3>
              <button className="d_btn_close" onClick={() => { setSelectedSupplier(null); setSupplierProducts([]); }}><MdClose /></button>
            </div>
            <div className="d_modal_body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Products supplied by {selectedSupplier.name}</h6>
                <button className="d_btn d_btn_primary d_btn_sm" onClick={() => setShowProductModal(true)}>
                  <MdAdd /> Add Product
                </button>
              </div>
              {supplierProducts.length === 0 ? (
                <div className="text-center py-4 text-muted">No products found for this supplier</div>
              ) : (
                <div className="d_table_wrap">
                  <table className="d_table">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>Category</th><th>Type</th><th>Price</th><th>Qty Available</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {supplierProducts.map(p => (
                        <tr key={`${p.productType}-${p._id}`}>
                          <td><code>{getProductCode(p)}</code></td>
                          <td><strong>{getProductName(p)}</strong></td>
                          <td>{p.category}</td>
                          <td><span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'}`}>{p.productType === 'stock' ? 'Stock' : 'Spare Part'}</span></td>
                          <td>₹{(Number(p.unitPrice) || Number(p.sellingPrice) || 0).toLocaleString()}</td>
                          <td>{p.quantity}</td>
                          <td>
                            <button className="d_icon_btn d_del" onClick={() => removeProductFromSupplier(p)}>
                              <MdDelete />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product to Supplier Modal */}
      {showProductModal && (
        <div className="d_modal_overlay">
          <div className="d_modal d_modal_lg">
            <div className="d_modal_header">
              <h3><MdAdd /> Add Product to {selectedSupplier?.name}</h3>
              <button className="d_btn_close" onClick={() => setShowProductModal(false)}><MdClose /></button>
            </div>
            <div className="d_modal_body">
              <div className="d_search_box mb-3">
                <span className="d_search_icon"><MdSearch /></span>
                <input
                  className="d_search_input"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead>
                    <tr><th>Code</th><th>Name</th><th>Category</th><th>Type</th><th>Price</th><th>Qty</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {products.filter(p => !productSearch || getProductName(p).toLowerCase().includes(productSearch.toLowerCase()) || getProductCode(p).toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                      <tr key={`${p.productType}-${p._id}`}>
                        <td><code>{getProductCode(p)}</code></td>
                        <td><strong>{getProductName(p)}</strong></td>
                        <td>{p.category}</td>
                        <td><span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'}`}>{p.productType === 'stock' ? 'Stock' : 'Spare Part'}</span></td>
                        <td>₹{(p.unitPrice || p.sellingPrice || 0).toLocaleString()}</td>
                        <td>{p.quantity}</td>
                        <td>
                          <button className="d_btn d_btn_sm d_btn_primary" onClick={() => addProductToSupplier(p)}>
                            <MdAdd /> Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SelectableProductField = ({ products, value, onChange, onTextChange }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => 
    !search || 
    (p.itemName || p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.itemCode || p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div className="d-flex gap-2">
        <input
          className="d_form_control"
          placeholder="Click to select product or type name"
          value={(value && (value.itemName || value.name)) || search}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          onChange={(e) => {
            setSearch(e.target.value);
            if (onTextChange) onTextChange(e.target.value);
            if (!dropdownOpen) setDropdownOpen(true);
          }}
        />
      </div>
      {dropdownOpen && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--d-border)',
            borderRadius: 8,
            zIndex: 1000,
            maxHeight: 250,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          {filtered.length === 0 && (
            <div className="p-3 text-muted text-center">No products found</div>
          )}
          {filtered.map(p => (
            <div 
              key={`${p.productType}-${p._id}`}
              onClick={() => { 
                onChange(p); 
                setDropdownOpen(false); 
                setSearch(''); 
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--d-border-soft)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--d-bg-soft)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{getProductName(p)}</strong> <code className="ml-2">{getProductCode(p)}</code>
                </div>
                <div className="d-flex gap-2 align-items-center">
                  <span className={`d_badge ${p.productType === 'stock' ? 'd_info' : 'd_warning'}`}>{p.productType === 'stock' ? 'Stock' : 'Spare'}</span>
                  <span>₹{(p.unitPrice || p.sellingPrice || 0).toLocaleString()}</span>
                </div>
              </div>
              <small style={{ color: 'var(--d-text-soft)' }}>
                {p.category} • In stock: {p.quantity}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Purchase;
