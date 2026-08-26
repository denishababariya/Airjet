import React, { useState, useEffect, useMemo } from 'react';
import { MdInventory2, MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { sparePartsApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = { 'Available': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger', 'Discontinued': 'd_danger' };
const blank = { name: '', cat: '', brand: '', model: '', stock: '', minStock: '', price: '', warrantyPeriod: '', warrantyUnit: 'Months', status: 'Available', images: [] };
const blankCategory = { name: '', desc: '', status: 'Active' };

const SpareParts = ({ defaultTab = 'parts' }) => {
  const [tab, setTab]     = useState(defaultTab);
  const [data, setData]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(blank);
  const [editId, setEditId]   = useState(null);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categoryModal, setCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState(blankCategory);
  const [categoryEditId, setCategoryEditId] = useState(null);
  const [categoryErrors, setCategoryErrors] = useState({});
  const [savingCategory, setSavingCategory] = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchParts = async () => {
    setLoading(true);
    try {
      const { data: list } = await sparePartsApi.getAll();
      setData(list);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load spare parts');
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => { 
    fetchParts(); 
    fetchCategories();
  }, []);

  useEffect(() => {
    // Handle URL parameters for editing
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    
    if (tabParam) {
      setTab(tabParam);
    }
  }, []);

  useEffect(() => {
    const editId = new URLSearchParams(window.location.search).get('edit');
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    
    if (editId && tabParam === 'category' && categories.length > 0) {
      // Find and open the category for editing
      const categoryToEdit = categories.find(c => (c._id || c.id) === editId);
      if (categoryToEdit) {
        setCategoryForm({
          name: categoryToEdit.name || '',
          desc: categoryToEdit.desc || categoryToEdit.description || '',
          status: categoryToEdit.status || 'Active'
        });
        setCategoryEditId(categoryToEdit._id || categoryToEdit.id);
        setCategoryErrors({});
        setCategoryModal(true);
      }
    }
  }, [categories]);

  const derivedCategories = useMemo(() => {
    const map = {};
    data.forEach(p => {
      if (!p.category) return;
      if (!map[p.category]) map[p.category] = { id: `CAT-${p.category}`, name: p.category, parts: 0, status: 'Active' };
      map[p.category].parts++;
    });
    return Object.values(map);
  }, [data]);

  const derivedBrands = useMemo(() => {
    const map = {};
    data.forEach(p => {
      if (!p.brand) return;
      if (!map[p.brand]) map[p.brand] = { id: `BRD-${p.brand}`, name: p.brand, parts: 0, status: 'Active' };
      map[p.brand].parts++;
    });
    return Object.values(map);
  }, [data]);

  const derivedModels = useMemo(() => {
    const map = {};
    data.forEach(p => {
      (p.compatibility || []).forEach(m => {
        if (!map[m]) map[m] = { id: `MDL-${m}`, model: m, brand: p.brand||'-', type: p.category||'-', parts: 0, status: 'Active' };
        map[m].parts++;
      });
    });
    return Object.values(map);
  }, [data]);

  const filtered = data.filter(p =>
    (p.partName||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.partNumber||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.category||'').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => {
    setForm(blank);
    setEditId(null);
    setErrors({});
    setImageFiles([]);
    setImagePreviews([]);
    setModal(true);
  };
  const openEdit = (part) => {
    setForm({
      name: part.partName || '', cat: part.category || '', brand: part.brand || '',
      model: (part.compatibility || []).join(', '),
      stock: String(part.quantity ?? ''), minStock: String(part.minimumStock ?? ''),
      price: String(part.unitPrice ?? ''), warrantyPeriod: String(part.warrantyPeriod ?? ''),
      warrantyUnit: part.warrantyUnit || 'Months', status: part.status || 'Available',
      images: part.images || [],
    });
    setEditId(part._id);
    setErrors({});
    setImageFiles([]);
    setImagePreviews(part.images || []);
    setModal(true);
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => validate({
    name:     V.partName(form.name, 'Part name'),
    cat:      V.alphaNum(form.cat, 'Category'),
    brand:    V.alphaNum(form.brand, 'Brand'),
    price:    V.amount(form.price, 'Unit price'),
    stock:    form.stock !== '' ? V.nonNegInt(form.stock, 'Stock quantity') : '',
    minStock: form.minStock !== '' ? V.nonNegInt(form.minStock, 'Minimum stock') : '',
  });

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const categoryName = form.cat.trim();
      
      const payload = {
        partName: form.name.trim(), category: categoryName, brand: form.brand.trim(),
        compatibility: form.model ? form.model.split(',').map(s => s.trim()).filter(Boolean) : [],
        quantity: parseInt(form.stock) || 0, minimumStock: parseInt(form.minStock) || 0,
        unitPrice: parseFloat(form.price) || 0, sellingPrice: parseFloat(form.price) || 0,
        warrantyPeriod: parseInt(form.warrantyPeriod) || 0, warrantyUnit: form.warrantyUnit || 'Months',
        status: form.status || 'Available',
      };
      if (editId) {
        await sparePartsApi.update(editId, payload, imageFiles);
      } else {
        payload.partNumber = `AJ-${categoryName.toUpperCase().slice(0,3)}-${String(data.length+1).padStart(3,'0')}`;
        await sparePartsApi.create(payload, imageFiles);
      }
      setModal(false);
      toast.success(editId ? 'Spare part updated!' : 'Spare part added!');
      fetchParts();
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save spare part');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, name) => {
    confirm({
      title: 'Delete Spare Part', message: `Delete part "${name}"?`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try { await sparePartsApi.remove(id); toast.success('Part deleted.'); fetchParts(); }
        catch (err) { toast.error(err.displayMessage || 'Failed to delete'); }
      },
    });
  };

  const openAddCategory = () => {
    setCategoryForm(blankCategory);
    setCategoryEditId(null);
    setCategoryErrors({});
    setCategoryModal(true);
  };

  const openEditCategory = (category) => {
    setCategoryForm({
      name: category.name || '',
      desc: category.desc || category.description || '',
      status: category.status || 'Active'
    });
    setCategoryEditId(category._id || category.id);
    setCategoryErrors({});
    setCategoryModal(true);
  };

  const handleCategorySave = async () => {
    const e = {};
    if (!categoryForm.name.trim()) e.name = 'Category name is required';
    if (Object.keys(e).length) { setCategoryErrors(e); return; }
    
    setSavingCategory(true);
    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.desc.trim(),
        status: categoryForm.status
      };
      
      if (categoryEditId) {
        await fetch(`http://localhost:5000/api/categories/${categoryEditId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        toast.success('Category updated!');
      } else {
        await fetch('http://localhost:5000/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        toast.success('Category added!');
      }
      setCategoryModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryDelete = (id, name) => {
    confirm({
      title: 'Delete Category', message: `Delete category "${name}"?`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await fetch(`http://localhost:5000/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          toast.success('Category deleted.');
          fetchCategories();
        } catch (err) {
          toast.error(err.displayMessage || 'Failed to delete category');
        }
      },
    });
  };

  const cf = (field) => ({
    value: categoryForm[field] ?? '',
    onChange: (e) => { setCategoryForm(p => ({ ...p, [field]: e.target.value })); setCategoryErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div><h1 className="d_page_title">Spare Parts Inventory</h1><p className="d_page_subtitle">Manage parts, categories, brands and compatibility</p></div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Part</button>
      </div>

      <div className="d_tabs mb-3">
        {[['parts','Part Number'],['category','Category'],['brand','Brand'],['models','Compatible Models']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'parts' && (
        <div className="d_card">
          <div className="d_card_header flex-wrap gap-2">
            <h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Spare Parts ({filtered.length})</h2>
            <div className="d_search_box"><MdSearch className="d_search_icon" />
              <input className="d_search_input" placeholder="Search parts…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Part No.</th><th>Part Name</th><th>Category</th><th>Brand</th><th>Models</th><th>Stock</th><th>Min</th><th>Price (₹)</th><th>Status</th><th>Image</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr className="d_empty"><td colSpan={11}>No parts found.</td></tr>}
                {filtered.map(p => (
                  <tr key={p._id}>
                    <td><code>{String(p.partNumber)}</code></td><td><strong>{String(p.partName)}</strong></td>
                    <td>{String(p.category)}</td><td>{String(p.brand)}</td>
                    <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(p.compatibility||[]).join(', ')}</td>
                    <td><strong>{String(p.quantity)}</strong></td><td>{String(p.minimumStock)}</td>
                    <td>₹{(p.unitPrice||0).toLocaleString('en-IN')}</td>
                    <td><span className={`d_badge ${statusClass[p.status]||'d_info'}`}>{String(p.status)}</span></td>
                    <td>
                      {p.images && p.images.length > 0 ? (
                        <img
                          src={`http://localhost:5000${p.images[0]}`}
                          alt={p.partName}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                          onClick={() => window.open(`http://localhost:5000${p.images[0]}`, '_blank')}
                        />
                      ) : (
                        <span style={{ color: '#999', fontSize: 12 }}>No image</span>
                      )}
                    </td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(p._id, p.partName)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            )}
          </div>
        </div>
      )}

      {tab === 'category' && (
        <div className="d_card">
          <div className="d_card_header flex-wrap gap-2">
            <h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Categories ({categories.length})</h2>
            <button className="d_btn d_btn_primary" onClick={openAddCategory}><MdAdd /> Add Category</button>
          </div>
          <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
            <thead><tr><th>Cat ID</th><th>Category Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {categories.length === 0 && <tr className="d_empty"><td colSpan={5}>No categories yet.</td></tr>}
              {categories.map(c => (
                <tr key={c._id || c.id}>
                  <td><code>{String(c._id || c.id)}</code></td>
                  <td><strong>{String(c.name)}</strong></td>
                  <td style={{ maxWidth: 300, fontSize: '0.88rem', color: 'var(--d-text-muted)' }}>{String(c.description || c.desc || '-')}</td>
                  <td><span className={`d_badge ${c.status === 'Active' ? 'd_success' : 'd_danger'}`}>{String(c.status)}</span></td>
                  <td>
                    <div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEditCategory(c)}><MdEdit /></button>
                      <button className="d_icon_btn d_del" onClick={() => handleCategoryDelete(c._id || c.id, c.name)}><MdDelete /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div></div>
        </div>
      )}

      {tab === 'brand' && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Brands ({derivedBrands.length})</h2></div>
          <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
            <thead><tr><th>Brand ID</th><th>Brand Name</th><th>Parts</th><th>Status</th></tr></thead>
            <tbody>
              {derivedBrands.length === 0 && <tr className="d_empty"><td colSpan={4}>No brands yet.</td></tr>}
              {derivedBrands.map(b => <tr key={b.id}><td><code>{String(b.id)}</code></td><td><strong>{String(b.name)}</strong></td><td><span className="d_badge d_info">{String(b.parts)}</span></td><td><span className="d_badge d_success">{String(b.status)}</span></td></tr>)}
            </tbody>
          </table></div></div>
        </div>
      )}

      {tab === 'models' && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Compatible Models ({derivedModels.length})</h2></div>
          <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
            <thead><tr><th>Model ID</th><th>Model</th><th>Brand</th><th>Type</th><th>Parts</th><th>Status</th></tr></thead>
            <tbody>
              {derivedModels.length === 0 && <tr className="d_empty"><td colSpan={6}>No models yet.</td></tr>}
              {derivedModels.map(m => <tr key={m.id}><td><code>{String(m.id)}</code></td><td><strong>{String(m.model)}</strong></td><td>{String(m.brand)}</td><td>{String(m.type)}</td><td><span className="d_badge d_info">{String(m.parts)}</span></td><td><span className="d_badge d_success">{String(m.status)}</span></td></tr>)}
            </tbody>
          </table></div></div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Spare Part' : 'Add Spare Part'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Part Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Reed Valve Assembly" {...f('name')} />
            <Err field="name" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Category <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('cat')}>
              <option value="">Select Category</option>
              {categories.filter(c => c.status === 'Active').map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <Err field="cat" />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Brand <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. SKF, AirTex" {...f('brand')} />
            <Err field="brand" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Compatible Models</label>
            <input className="d_form_control" placeholder="e.g. AT-200, AT-300 (comma separated)" {...f('model')} />
          </div>
        </div>
        <div className="d_form_row cols-3">
          <div className="d_form_group">
            <label className="d_form_label">Current Stock</label>
            <input type="number" className="d_form_control" placeholder="0" min={0} {...f('stock')} />
            <Err field="stock" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Min. Stock</label>
            <input type="number" className="d_form_control" placeholder="0" min={0} {...f('minStock')} />
            <Err field="minStock" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Unit Price (₹) <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="e.g. 500" min={0} {...f('price')} />
            <Err field="price" />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Period</label>
            <input type="number" className="d_form_control" placeholder="e.g. 12" min={0} {...f('warrantyPeriod')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty Unit</label>
            <select className="d_form_control" {...f('warrantyUnit')}>
              <option value="Days">Days</option>
              <option value="Months">Months</option>
              <option value="Years">Years</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option value="Available">Available</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
              <option value="Discontinued">Discontinued</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Images</label>
            <input
              type="file"
              className="d_form_control"
              accept="image/*"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setImageFiles(files);
                const previews = files.map(file => URL.createObjectURL(file));
                setImagePreviews(previews);
              }}
            />
            {(imagePreviews.length > 0 || form.images?.length > 0) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                {(imagePreviews.length > 0 ? imagePreviews : form.images).map((src, idx) => (
                  <img
                    key={idx}
                    src={src.startsWith('http') || src.startsWith('/uploads') ? `http://localhost:5000${src}` : src}
                    alt={`Preview ${idx + 1}`}
                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Part' : 'Save Part'}
          </button>
        </div>
      </Modal>

      <Modal open={categoryModal} onClose={() => setCategoryModal(false)} title={categoryEditId ? 'Edit Category' : 'Add Category'} size="md">
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Category Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Nozzle & Air System" {...cf('name')} />
            {categoryErrors.name && <span className="d_field_error">{categoryErrors.name}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Description</label>
            <textarea className="d_form_control" placeholder="Enter category description" rows="3" {...cf('desc')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...cf('status')}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setCategoryModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleCategorySave} disabled={savingCategory}>
            {savingCategory ? 'Saving…' : categoryEditId ? 'Update Category' : 'Save Category'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SpareParts;
