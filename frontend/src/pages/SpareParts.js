import React, { useState, useEffect, useMemo } from 'react';
import { MdInventory2, MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { sparePartsApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = { 'In Stock': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger' };
const blank = { name: '', cat: '', brand: '', model: '', stock: '', minStock: '', price: '', status: 'In Stock' };

const SpareParts = ({ defaultTab = 'parts' }) => {
  const [tab, setTab]     = useState(defaultTab);
  const [data, setData]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(blank);
  const [editId, setEditId]   = useState(null);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

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

  useEffect(() => { fetchParts(); }, []);

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

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (part) => {
    setForm({
      name: part.partName || '', cat: part.category || '', brand: part.brand || '',
      model: (part.compatibility || []).join(', '),
      stock: String(part.quantity ?? ''), minStock: String(part.minimumStock ?? ''),
      price: String(part.unitPrice ?? ''), status: part.status || 'In Stock',
    });
    setEditId(part._id); setErrors({}); setModal(true);
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
      const payload = {
        partName: form.name.trim(), category: form.cat.trim(), brand: form.brand.trim(),
        compatibility: form.model ? form.model.split(',').map(s => s.trim()).filter(Boolean) : [],
        quantity: parseInt(form.stock) || 0, minimumStock: parseInt(form.minStock) || 0,
        unitPrice: parseFloat(form.price) || 0, sellingPrice: parseFloat(form.price) || 0,
      };
      if (editId) {
        await sparePartsApi.update(editId, payload);
      } else {
        payload.partNumber = `AJ-${form.cat.toUpperCase().slice(0,3)}-${String(data.length+1).padStart(3,'0')}`;
        await sparePartsApi.create(payload);
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
              <thead><tr><th>Part No.</th><th>Part Name</th><th>Category</th><th>Brand</th><th>Models</th><th>Stock</th><th>Min</th><th>Price (₹)</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 && <tr className="d_empty"><td colSpan={10}>No parts found.</td></tr>}
                {filtered.map(p => (
                  <tr key={p._id}>
                    <td><code>{p.partNumber}</code></td><td><strong>{p.partName}</strong></td>
                    <td>{p.category}</td><td>{p.brand}</td>
                    <td style={{ maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{(p.compatibility||[]).join(', ')}</td>
                    <td><strong>{p.quantity}</strong></td><td>{p.minimumStock}</td>
                    <td>₹{(p.unitPrice||0).toLocaleString('en-IN')}</td>
                    <td><span className={`d_badge ${statusClass[p.status]||'d_info'}`}>{p.status}</span></td>
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
          <div className="d_card_header"><h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Categories ({derivedCategories.length})</h2></div>
          <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
            <thead><tr><th>Cat ID</th><th>Category Name</th><th>No. of Parts</th><th>Status</th></tr></thead>
            <tbody>
              {derivedCategories.length === 0 && <tr className="d_empty"><td colSpan={4}>No categories yet.</td></tr>}
              {derivedCategories.map(c => <tr key={c.id}><td><code>{c.id}</code></td><td><strong>{c.name}</strong></td><td><span className="d_badge d_info">{c.parts}</span></td><td><span className="d_badge d_success">{c.status}</span></td></tr>)}
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
              {derivedBrands.map(b => <tr key={b.id}><td><code>{b.id}</code></td><td><strong>{b.name}</strong></td><td><span className="d_badge d_info">{b.parts}</span></td><td><span className="d_badge d_success">{b.status}</span></td></tr>)}
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
              {derivedModels.map(m => <tr key={m.id}><td><code>{m.id}</code></td><td><strong>{m.model}</strong></td><td>{m.brand}</td><td>{m.type}</td><td><span className="d_badge d_info">{m.parts}</span></td><td><span className="d_badge d_success">{m.status}</span></td></tr>)}
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
            <input className="d_form_control" placeholder="e.g. Valve, Nozzle, Sensor" {...f('cat')} />
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
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Part' : 'Save Part'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SpareParts;
