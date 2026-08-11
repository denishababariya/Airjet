import React, { useState, useEffect } from 'react';
import { MdWarehouse, MdAdd, MdEdit, MdDelete, MdSwapHoriz, MdFactCheck } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { stockApi, erpApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = { Active:'d_success', Completed:'d_success', 'In Transit':'d_info', Pending:'d_warning', Inactive:'d_danger' };
const blankWH  = { name: '', location: '', capacity: '', unitPrice: '', manager: '', status: 'Active' };
const blankTRF = { from: '', to: '', part: '', qty: '', date: '', status: 'Pending' };
const blankAUD = { location: '', date: '', items: '', status: 'Pending', notes: '' };

const toISODate = (d) => {
  if (!d) return '';
  if (d.includes('-') && d.length === 10) return d;
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = d.split('-');
  if (parts.length === 3 && months[parts[1]]) return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;
  return d;
};

const Warehouse = ({ defaultTab = 'warehouses' }) => {
  const [tab, setTab]             = useState(defaultTab);
  const [warehouses, setWarehouses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [audits, setAudits]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [form, setForm]           = useState(blankWH);
  const [editId, setEditId]       = useState(null);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const isWH  = tab === 'warehouses';
  const isTRF = tab === 'transfers';
  const isAUD = tab === 'audits';

  const fetchStock     = async () => { setLoading(true); try { const { data } = await stockApi.getAll(); setWarehouses(data); } catch (err) { toast.error(err.displayMessage || 'Failed to load stock'); } finally { setLoading(false); } };
  const fetchTransfers = async () => { try { const { data } = await erpApi.getAll('warehouse','transfer'); setTransfers(data); } catch (err) { toast.error(err.displayMessage || 'Failed to load transfers'); } };
  const fetchAudits    = async () => { try { const { data } = await erpApi.getAll('warehouse','audit');    setAudits(data);     } catch (err) { toast.error(err.displayMessage || 'Failed to load audits'); } };

  useEffect(() => { fetchStock(); fetchTransfers(); fetchAudits(); }, []);

  const openAdd = () => {
    setForm(isWH ? blankWH : isAUD ? blankAUD : blankTRF);
    setEditId(null); setErrors({}); setModal(true);
  };
  const openEdit = (row) => {
    if (isWH)       setForm({ name: row.itemName||'', location: row.location||'', capacity: String(row.quantity??''), unitPrice: String(row.unitPrice??''), manager: row.supplier||'', status: 'Active' });
    else if (isAUD) setForm({ location: row.location||'', date: toISODate(row.date), items: String(row.items??''), status: row.status||'Pending', notes: row.notes||'' });
    else            setForm({ from: row.from||'', to: row.to||'', part: row.part||'', qty: String(row.qty??''), date: toISODate(row.date), status: row.status||'Pending' });
    setEditId(row._id || row.id); setErrors({}); setModal(true);
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });
  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => {
    if (isWH) return validate({
      name:     V.partName(form.name, 'Item name'),
      location: V.required(form.location, 'Location'),
      manager:  V.required(form.manager, 'Supplier / manager'),
      capacity: form.capacity !== '' ? V.nonNegInt(form.capacity, 'Quantity') : '',
      unitPrice: form.unitPrice !== '' ? V.optionalAmount(form.unitPrice, 'Unit price') : '',
    });
    if (isTRF) return validate({
      from: V.required(form.from, 'From warehouse'),
      to:   V.required(form.to,   'To warehouse'),
      part: V.partName(form.part, 'Part name'),
      qty:  V.positiveInt(form.qty, 'Quantity'),
      date: V.date(form.date, 'Transfer date'),
    });
    // audit
    return validate({
      location: V.required(form.location, 'Location'),
      date:     V.date(form.date, 'Audit date'),
      items:    form.items !== '' ? V.nonNegInt(form.items, 'Items count') : '',
    });
  };

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (isWH) {
        const qty = parseInt(form.capacity) || 0;
        const price = parseFloat(String(form.unitPrice||'0').replace(/[^\d.]/g,'')) || 0;
        const payload = {
          id: `STK${String(Date.now()).slice(-6)}`, itemName: form.name.trim(),
          itemCode: `IC-${String(Date.now()).slice(-4)}`, category: 'General',
          quantity: qty, unit: 'pieces', unitPrice: price, totalPrice: qty * price,
          location: form.location.trim(), supplier: form.manager.trim(),
          minimumStock: 0, description: '',
        };
        if (editId) await stockApi.update(editId, payload); else await stockApi.create(payload);
        toast.success(editId ? 'Stock item updated!' : 'Stock item added!');
        fetchStock();
      } else if (isTRF) {
        const payload = { module:'warehouse', recordType:'transfer', ...form, qty: Number(form.qty)||0 };
        if (!editId) payload.id = `TRF-${String(Date.now()).slice(-6)}`;
        if (editId) await erpApi.update(editId, payload); else await erpApi.create(payload);
        toast.success(editId ? 'Transfer updated!' : 'Transfer created!');
        fetchTransfers();
      } else {
        const payload = { module:'warehouse', recordType:'audit', ...form, items: Number(form.items)||0 };
        if (!editId) payload.id = `AUD-${String(Date.now()).slice(-6)}`;
        if (editId) await erpApi.update(editId, payload); else await erpApi.create(payload);
        toast.success(editId ? 'Audit updated!' : 'Audit scheduled!');
        fetchAudits();
      }
      setModal(false);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = (id, label) => {
    confirm({
      title: 'Delete Record', message: `Delete ${label}? This cannot be undone.`,
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          if (isWH)       { await stockApi.remove(id); fetchStock(); }
          else if (isTRF) { await erpApi.remove(id); fetchTransfers(); }
          else            { await erpApi.remove(id); fetchAudits(); }
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
        <div><h1 className="d_page_title">Warehouse Management</h1><p className="d_page_subtitle">Manage warehouses, stock transfers and audits</p></div>
        <button className="d_btn d_btn_primary" onClick={openAdd}>
          <MdAdd /> {isWH ? 'Add Warehouse' : isTRF ? 'New Transfer' : 'Schedule Audit'}
        </button>
      </div>

      <div className="d_tabs mb-3">
        {[['warehouses','Warehouses'],['transfers','Stock Transfers'],['audits','Stock Audits']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {isWH && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdWarehouse className="d_card_icon" /> Warehouses ({warehouses.length})</h2></div>
          <div className="d_card_body p-0">
            {loading ? <div className="text-center py-4">Loading…</div> : (
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Stock ID</th><th>Item Name</th><th>Location</th><th>Quantity</th><th>Unit Price</th><th>Supplier</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {warehouses.length === 0 && <tr className="d_empty"><td colSpan={8}>No stock items found.</td></tr>}
                {warehouses.map(w => (
                  <tr key={w._id}>
                    <td><code>{String(w.id)}</code></td><td><strong>{String(w.itemName)}</strong></td><td>{String(w.location||'-')}</td>
                    <td>{String(w.quantity)}</td><td>₹{(w.unitPrice||0).toLocaleString('en-IN')}</td><td>{String(w.supplier||'-')}</td>
                    <td><span className={`d_badge ${statusClass[w.status]||'d_info'}`}>{String(w.status)}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(w)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(w._id, `item "${w.itemName}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            )}
          </div>
        </div>
      )}

      {isTRF && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdSwapHoriz className="d_card_icon" /> Stock Transfers ({transfers.length})</h2></div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Transfer ID</th><th>From</th><th>To</th><th>Part</th><th>Qty</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {transfers.length === 0 && <tr className="d_empty"><td colSpan={8}>No transfers found.</td></tr>}
                {transfers.map(t => (
                  <tr key={t._id}>
                    <td><code>{String(t.id)}</code></td><td>{String(t.from)}</td><td>{String(t.to)}</td><td><strong>{String(t.part)}</strong></td>
                    <td>{String(t.qty)}</td><td>{String(t.date)}</td>
                    <td><span className={`d_badge ${statusClass[t.status]||'d_info'}`}>{String(t.status)}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(t._id, `transfer "${t.id}"`)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </div>
      )}

      {isAUD && (
        <div className="d_card">
          <div className="d_card_header"><h2 className="d_card_title"><MdFactCheck className="d_card_icon" /> Stock Audits ({audits.length})</h2></div>
          <div className="d_card_body p-0">
            {audits.length === 0 ? (
              <div className="text-center py-5">
                <p style={{ color:'var(--d-text-muted)' }}>No stock audits scheduled.</p>
                <button className="d_btn d_btn_primary mt-2" onClick={openAdd}><MdAdd /> Schedule Audit</button>
              </div>
            ) : (
              <div className="d_table_wrap"><table className="d_table">
                <thead><tr><th>Audit ID</th><th>Location</th><th>Date</th><th>Items</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
                <tbody>
                  {audits.map(a => (
                    <tr key={a._id}>
                      <td><code>{String(a.id)}</code></td><td>{String(a.location)}</td><td>{String(a.date)}</td><td>{String(a.items)}</td>
                      <td><span className={`d_badge ${statusClass[a.status]||'d_info'}`}>{String(a.status)}</span></td>
                      <td>{String(a.notes)}</td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(a)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(a._id, `audit "${a.id}"`)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </div>
        </div>
      )}

      {/* Warehouse / Stock Modal */}
      {isWH && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Stock Item' : 'Add Stock Item'} size="md">
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Item Name <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Bearing SKF 6205" {...f('name')} /><Err field="name" /></div>
            <div className="d_form_group"><label className="d_form_label">Location <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Surat - Unit 1" {...f('location')} /><Err field="location" /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Quantity</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 100" {...f('capacity')} /><Err field="capacity" /></div>
            <div className="d_form_group"><label className="d_form_label">Unit Price (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 500" {...f('unitPrice')} /><Err field="unitPrice" /></div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group"><label className="d_form_label">Supplier / Manager <span className="d_req">*</span></label><input className="d_form_control" placeholder="Supplier name or manager" {...f('manager')} /><Err field="manager" /></div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {/* Transfer Modal */}
      {isTRF && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Transfer' : 'New Stock Transfer'} size="md">
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">From Warehouse <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Warehouse A" {...f('from')} /><Err field="from" /></div>
            <div className="d_form_group"><label className="d_form_label">To Warehouse <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Warehouse B" {...f('to')} /><Err field="to" /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Part Name <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Bearing 6205" {...f('part')} /><Err field="part" /></div>
            <div className="d_form_group"><label className="d_form_label">Quantity <span className="d_req">*</span></label><input type="number" className="d_form_control" min={1} placeholder="e.g. 50" {...f('qty')} /><Err field="qty" /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Transfer Date <span className="d_req">*</span></label><input type="date" className="d_form_control" {...f('date')} /><Err field="date" /></div>
            <div className="d_form_group"><label className="d_form_label">Status</label><select className="d_form_control" {...f('status')}><option>Pending</option><option>In Transit</option><option>Completed</option></select></div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Transfer' : 'Create Transfer'}</button>
          </div>
        </Modal>
      )}

      {/* Audit Modal */}
      {isAUD && (
        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Audit' : 'Schedule Audit'} size="md">
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Location <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Surat Unit 1" {...f('location')} /><Err field="location" /></div>
            <div className="d_form_group"><label className="d_form_label">Audit Date <span className="d_req">*</span></label><input type="date" className="d_form_control" {...f('date')} /><Err field="date" /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Items Count</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 200" {...f('items')} /><Err field="items" /></div>
            <div className="d_form_group"><label className="d_form_label">Status</label><select className="d_form_control" {...f('status')}><option>Pending</option><option>Completed</option></select></div>
          </div>
          <div className="d_form_row cols-1">
            <div className="d_form_group"><label className="d_form_label">Notes</label><input className="d_form_control" placeholder="Any notes…" {...f('notes')} /></div>
          </div>
          <div className="d_form_actions">
            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Audit' : 'Schedule Audit'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Warehouse;
