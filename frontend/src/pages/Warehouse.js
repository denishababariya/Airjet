import React, { useState, useEffect } from 'react';
import { MdWarehouse, MdAdd, MdEdit, MdDelete, MdSwapHoriz, MdFactCheck, MdVisibility } from 'react-icons/md';
import Modal from '../components/Modal';

import ConfirmDialog from '../components/ConfirmDialog';

import ToastContainer from '../components/Toast';

import useToast from '../hooks/useToast';

import useConfirm from '../hooks/useConfirm';

import { stockApi, erpApi } from '../utils/api';

import { V, validate } from '../utils/validators';
import { getErrorMessage } from '../utils/errorMessages';



const statusClass = { Active:'d_success', Completed:'d_success', 'In Transit':'d_info', Pending:'d_warning', Inactive:'d_danger', Added:'d_success', Deducted:'d_danger', Transferred:'d_info' };

const blankWH  = { name: '', location: '', capacity: '', unitPrice: '', manager: '', status: 'Active' };

const blankTRF = { from: '', to: '', part: '', qty: '', date: '', status: 'Pending' };

const blankAUD = { location: '', date: '', items: [], status: 'Pending', notes: '' };

const blankTXN = { item: '', type: '', quantity: '', date: '', reference: '', notes: '' };



const toISODate = (d) => {

  if (!d) return '';

  if (d.includes('-') && d.length === 10) return d;

  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };

  const parts = d.split('-');

  if (parts.length === 3 && months[parts[1]]) return `${parts[2]}-${months[parts[1]]}-${parts[0]}`;

  return d;

};

const Warehouse = ({ defaultTab = 'warehouses', setActiveMenu }) => {
  const [tab, setTab]             = useState(defaultTab);

  // Map tab keys to sidebar menu labels
  const tabToMenuMap = {
    'warehouses': 'Warehouses',
    'transfers': 'Stock Transfers',
    'transactions': 'Inventory History',
    'audits': 'Stock Audits',
  };
  const [warehouses, setWarehouses] = useState([]);

  const [transfers, setTransfers] = useState([]);

  const [audits, setAudits]       = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading]     = useState(true);

  const [modal, setModal]         = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewRow, setViewRow]     = useState(null);
  const [form, setForm]           = useState(blankWH);

  const [editId, setEditId]       = useState(null);

  const [errors, setErrors]       = useState({});

  const [saving, setSaving]       = useState(false);

  const [imageFiles, setImageFiles] = useState([]);

  const [imagePreviews, setImagePreviews] = useState([]);



  const { toasts, toast, removeToast }         = useToast();

  const { confirmState, confirm, closeConfirm } = useConfirm();



  const isWH  = tab === 'warehouses';

  const isTRF = tab === 'transfers';

  const isAUD = tab === 'audits';

  const isTXN = tab === 'transactions';



  const fetchStock     = async () => { setLoading(true); try { const { data } = await stockApi.getAll(); setWarehouses(data); } catch (err) { toast.error(getErrorMessage(err, 'Unable to load stock. Please refresh.')); } finally { setLoading(false); } };

  const fetchTransfers = async () => { try { const { data } = await erpApi.getAll('warehouse','transfer'); setTransfers(data); } catch (err) { toast.error(getErrorMessage(err, 'Unable to load transfers. Please refresh.')); } };

  const fetchAudits    = async () => { try { const { data } = await erpApi.getAll('warehouse','audit');    setAudits(data);     } catch (err) { toast.error(getErrorMessage(err, 'Unable to load audits. Please refresh.')); } };

  const fetchTransactions = async () => { try { const { data } = await erpApi.getAll('warehouse','transaction'); setTransactions(data); } catch (err) { toast.error(getErrorMessage(err, 'Unable to load transactions. Please refresh.')); } };



  useEffect(() => { fetchStock(); fetchTransfers(); fetchAudits(); fetchTransactions(); }, []);



  const openAdd = () => {

    setForm(isWH ? blankWH : isAUD ? blankAUD : isTXN ? blankTXN : blankTRF);

    setEditId(null); setErrors({}); setImageFiles([]); setImagePreviews([]); setModal(true);

  };

  const openEdit = (row) => {

    if (isWH) {

      setForm({

        name: row.itemName||'', location: row.location||'', capacity: String(row.quantity??''),

        unitPrice: String(row.unitPrice??''), manager: row.supplier||'', status: 'Active',

        images: row.images || []

      });

      setImagePreviews(row.images || []);

    } else if (isAUD) {

      setForm({ location: row.location||'', date: toISODate(row.date), items: row.items || [], status: row.status||'Pending', notes: row.notes||'' });

      setImagePreviews([]);

    } else if (isTXN) {

      setForm({ item: row.item||'', type: row.type||'', quantity: String(row.quantity??''), date: toISODate(row.date), reference: row.reference||'', notes: row.notes||'' });

      setImagePreviews([]);

    } else {

      setForm({ from: row.from||'', to: row.to||'', part: row.part||'', qty: String(row.qty??''), date: toISODate(row.date), status: row.status||'Pending' });

      setImagePreviews([]);

    }

    setEditId(row._id || row.id); setErrors({}); setImageFiles([]); setModal(true);

  };

  const handleView = (row) => {
    setViewRow(row);
    setViewModal(true);
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

    if (isTXN) return validate({

      item:     V.required(form.item, 'Item'),

      type:     V.required(form.type, 'Transaction type'),

      quantity: V.positiveInt(form.quantity, 'Quantity'),

      date:     V.date(form.date, 'Transaction date'),

    });

    // audit
    if (isAUD) return validate({

      location: V.required(form.location, 'Location'),

      date:     V.date(form.date, 'Audit date'),

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

        const oldQty = editId ? warehouses.find(w => w._id === editId)?.quantity || 0 : 0;

        if (editId) await stockApi.update(editId, payload, imageFiles); else await stockApi.create(payload, imageFiles);

        

        // Log transaction if quantity changed

        if (editId && qty !== oldQty) {

          const txnPayload = {

            module: 'warehouse', recordType: 'transaction',

            id: `TXN-${String(Date.now()).slice(-6)}`,

            item: form.name,

            type: qty > oldQty ? 'Added' : 'Deducted',

            quantity: Math.abs(qty - oldQty),

            date: new Date().toISOString().split('T')[0],

            reference: `Stock Update - ${editId}`,

            notes: `Quantity changed from ${oldQty} to ${qty}`

          };

          await erpApi.create(txnPayload);

          fetchTransactions();

        }

        

        toast.success(editId ? 'Stock item updated!' : 'Stock item added!');

        fetchStock();

      } else if (isTRF) {

        const payload = { module:'warehouse', recordType:'transfer', ...form, qty: Number(form.qty)||0 };

        if (!editId) payload.id = `TRF-${String(Date.now()).slice(-6)}`;

        if (editId) await erpApi.update(editId, payload); else await erpApi.create(payload);

        

        // Log transaction for transfer

        if (!editId) {

          const txnPayload = {

            module: 'warehouse', recordType: 'transaction',

            id: `TXN-${String(Date.now()).slice(-6)}`,

            item: form.part,

            type: 'Transferred',

            quantity: Number(form.qty),

            date: form.date,

            reference: payload.id,

            notes: `Transfer from ${form.from} to ${form.to}`

          };

          await erpApi.create(txnPayload);

          fetchTransactions();

        }

        

        toast.success(editId ? 'Transfer updated!' : 'Transfer created!');

        fetchTransfers();

      } else if (isTXN) {

        const payload = { module:'warehouse', recordType:'transaction', ...form, quantity: Number(form.quantity)||0 };

        if (!editId) payload.id = `TXN-${String(Date.now()).slice(-6)}`;

        if (editId) await erpApi.update(editId, payload); else await erpApi.create(payload);

        toast.success(editId ? 'Transaction updated!' : 'Transaction recorded!');

        fetchTransactions();

      } else {

        const payload = { module:'warehouse', recordType:'audit', ...form, items: Array.isArray(form.items) ? form.items : [] };

        if (!editId) payload.id = `AUD-${String(Date.now()).slice(-6)}`;

        if (editId) await erpApi.update(editId, payload); else await erpApi.create(payload);

        toast.success(editId ? 'Audit updated!' : 'Audit scheduled!');

        fetchAudits();

      }

      setModal(false);

    } catch (err) {

      toast.error(getErrorMessage(err, 'Unable to save record. Please check the form and try again.'));

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

          else if (isTXN) { await erpApi.remove(id); fetchTransactions(); }

          else            { await erpApi.remove(id); fetchAudits(); }

          toast.success('Record deleted.');

        } catch (err) { toast.error(getErrorMessage(err, 'Unable to delete record. Please try again.')); }

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

          <MdAdd /> {isWH ? 'Add Warehouse' : isTRF ? 'New Transfer' : isTXN ? 'Record Transaction' : 'Schedule Audit'}

        </button>

      </div>



      <div className="d_tabs mb-3">

        {[['warehouses','Warehouses'],['transfers','Stock Transfers'],['transactions','Inventory History'],['audits','Stock Audits']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => {
            setTab(k);
            if (setActiveMenu) {
              setActiveMenu(tabToMenuMap[k]);
            }
          }}>{v}</button>
        ))}

      </div>



      {isWH && (

        <div className="d_card">

          <div className="d_card_header"><h2 className="d_card_title"><MdWarehouse className="d_card_icon" /> Warehouses ({warehouses.length})</h2></div>

          <div className="d_card_body p-0">

            {loading ? <div className="text-center py-4">Loading…</div> : (

            <div className="d_table_wrap"><table className="d_table">

              <thead><tr><th>Stock ID</th><th>Item Name</th><th>Location</th><th>Quantity</th><th>Unit Price</th><th>Supplier</th><th>Status</th><th>Image</th><th>Actions</th></tr></thead>

              <tbody>

                {warehouses.length === 0 && <tr className="d_empty"><td colSpan={9}>No stock items found.</td></tr>}

                {warehouses.map(w => (

                  <tr key={w._id}>

                    <td><code>{String(w.id)}</code></td><td><strong>{String(w.itemName)}</strong></td><td>{String(w.location||'-')}</td>

                    <td>{String(w.quantity)}</td><td>₹{(w.unitPrice||0).toLocaleString('en-IN')}</td><td>{String(w.supplier||'-')}</td>

                    <td><span className={`d_badge ${statusClass[w.status]||'d_info'}`}>{String(w.status)}</span></td>

                    <td>

                      {w.images && w.images.length > 0 ? (

                        <img

                          src={`http://localhost:5000${w.images[0]}`}

                          alt={w.itemName}

                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}

                          onClick={() => window.open(`http://localhost:5000${w.images[0]}`, '_blank')}

                        />

                      ) : (

                        <span style={{ color: '#999', fontSize: 12 }}>No image</span>

                      )}

                    </td>

                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_view" onClick={() => handleView(w)}><MdVisibility /></button>
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
                      <button className="d_icon_btn d_view" onClick={() => handleView(t)}><MdVisibility /></button>
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
                          <button className="d_icon_btn d_view" onClick={() => handleView(a)}><MdVisibility /></button>
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



      {/* Inventory Transaction History */}

      {isTXN && (

        <div className="d_card">

          <div className="d_card_header"><h2 className="d_card_title"><MdFactCheck className="d_card_icon" /> Inventory Transaction History ({transactions.length})</h2></div>

          <div className="d_card_body p-0">

            {transactions.length === 0 ? (

              <div className="text-center py-5">

                <p style={{ color:'var(--d-text-muted)' }}>No inventory transactions recorded.</p>

                <button className="d_btn d_btn_primary mt-2" onClick={openAdd}><MdAdd /> Record Transaction</button>

              </div>

            ) : (

              <div className="d_table_wrap"><table className="d_table">

                <thead><tr><th>Transaction ID</th><th>Item</th><th>Type</th><th>Quantity</th><th>Date</th><th>Reference</th><th>Notes</th><th>Actions</th></tr></thead>

                <tbody>

                  {transactions.map(t => (

                    <tr key={t._id}>

                      <td><code>{String(t.id)}</code></td>

                      <td><strong>{String(t.item)}</strong></td>

                      <td><span className={`d_badge ${statusClass[t.type]||'d_info'}`}>{String(t.type)}</span></td>

                      <td>{String(t.quantity)}</td>

                      <td>{String(t.date)}</td>

                      <td><code>{String(t.reference||'-')}</code></td>

                      <td>{String(t.notes||'-')}</td>

                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view" onClick={() => handleView(t)}><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>

                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(t._id, `transaction "${t.id}"`)}><MdDelete /></button>

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



      {/* Transaction Modal */}

      {isTXN && (

        <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Transaction' : 'Record Inventory Transaction'} size="md">

          <div className="d_form_row cols-2">

            <div className="d_form_group">

              <label className="d_form_label">Item <span className="d_req">*</span></label>

              <select className="d_form_control" {...f('item')}>

                <option value="">Select Item</option>

                {warehouses.map(w => <option key={w._id} value={w.itemName}>{w.itemName} ({w.itemCode})</option>)}

              </select>

              <Err field="item" />

            </div>

            <div className="d_form_group">

              <label className="d_form_label">Transaction Type <span className="d_req">*</span></label>

              <select className="d_form_control" {...f('type')}>

                <option value="">Select Type</option>

                <option>Added</option>

                <option>Deducted</option>

                <option>Transferred</option>

                <option>Adjusted</option>

              </select>

              <Err field="type" />

            </div>

          </div>

          <div className="d_form_row cols-2">

            <div className="d_form_group"><label className="d_form_label">Quantity <span className="d_req">*</span></label><input type="number" className="d_form_control" min={1} placeholder="e.g. 10" {...f('quantity')} /><Err field="quantity" /></div>

            <div className="d_form_group"><label className="d_form_label">Date <span className="d_req">*</span></label><input type="date" className="d_form_control" {...f('date')} /><Err field="date" /></div>

          </div>

          <div className="d_form_row cols-1">

            <div className="d_form_group"><label className="d_form_label">Reference</label><input className="d_form_control" placeholder="e.g. Order #ORD-123456" {...f('reference')} /></div>

          </div>

          <div className="d_form_row cols-1">

            <div className="d_form_group"><label className="d_form_label">Notes</label><textarea className="d_form_control" rows={2} placeholder="Reason for transaction..." {...f('notes')} /></div>

          </div>

          <div className="d_form_actions">

            <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>

            <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update Transaction' : 'Record Transaction'}</button>

          </div>

        </Modal>

      )}

      {/* View Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Record Details" size="lg">
        {viewRow && (
          <div>
            {isWH && (
              <>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Stock ID</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{String(viewRow.id)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Item Name</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.itemName)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Location</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.location||'-')}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Quantity</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.quantity)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Unit Price (₹)</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>₹{(viewRow.unitPrice||0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Supplier</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.supplier||'-')}</div>
                  </div>
                </div>
                <div className="d_form_row cols-1">
                  <div className="d_form_group">
                    <label className="d_form_label">Status</label>
                    <span className={`d_badge ${statusClass[viewRow.status]||'d_info'}`}>{String(viewRow.status)}</span>
                  </div>
                </div>
                {viewRow.images && viewRow.images.length > 0 && (
                  <div className="d_form_row cols-1">
                    <div className="d_form_group">
                      <label className="d_form_label">Images</label>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                        {viewRow.images.map((src, idx) => (
                          <img
                            key={idx}
                            src={src.startsWith('http') || src.startsWith('/uploads') ? `http://localhost:5000${src}` : src}
                            alt={`Item ${idx + 1}`}
                            style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd', cursor: 'pointer' }}
                            onClick={() => window.open(src.startsWith('http') || src.startsWith('/uploads') ? `http://localhost:5000${src}` : src, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            {isTRF && (
              <>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Transfer ID</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{String(viewRow.id)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Status</label>
                    <span className={`d_badge ${statusClass[viewRow.status]||'d_info'}`}>{String(viewRow.status)}</span>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">From</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.from)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">To</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.to)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Part</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.part)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Quantity</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.qty)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-1">
                  <div className="d_form_group">
                    <label className="d_form_label">Date</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.date)}</div>
                  </div>
                </div>
              </>
            )}
            {isAUD && (
              <>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Audit ID</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{String(viewRow.id)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Status</label>
                    <span className={`d_badge ${statusClass[viewRow.status]||'d_info'}`}>{String(viewRow.status)}</span>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Location</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.location)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Date</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.date)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Items Count</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.items)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Notes</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.notes||'-')}</div>
                  </div>
                </div>
              </>
            )}
            {isTXN && (
              <>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Transaction ID</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{String(viewRow.id)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Type</label>
                    <span className={`d_badge ${statusClass[viewRow.type]||'d_info'}`}>{String(viewRow.type)}</span>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Item</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.item)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Quantity</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.quantity)}</div>
                  </div>
                </div>
                <div className="d_form_row cols-2">
                  <div className="d_form_group">
                    <label className="d_form_label">Date</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.date)}</div>
                  </div>
                  <div className="d_form_group">
                    <label className="d_form_label">Reference</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa' }}>{String(viewRow.reference||'-')}</div>
                  </div>
                </div>
                <div className="d_form_row cols-1">
                  <div className="d_form_group">
                    <label className="d_form_label">Notes</label>
                    <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{String(viewRow.notes||'-')}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>

  );

};



export default Warehouse;

