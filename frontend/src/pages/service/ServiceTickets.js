import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdConfirmationNumber, MdAttachFile } from 'react-icons/md';
import Modal from '../../components/Modal';
import { useErpRecords } from '../../utils/useErpRecords';
import api from '../../utils/api';

const STATUS_OPTIONS = ['Open', 'Verified', 'Assigned', 'In Progress', 'Waiting Parts', 'Completed', 'Closed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical'];

const statusBadge = s => {
  if (s === 'Closed' || s === 'Completed' || s === 'Resolved') return 'd_success';
  if (s === 'Open' || s === 'Cancelled') return 'd_danger';
  if (s === 'In Progress' || s === 'Assigned' || s === 'Verified') return 'd_warning';
  return 'd_info';
};

const priorityBadge = p => {
  if (p === 'Critical') return 'd_danger';
  if (p === 'High') return 'd_warning';
  if (p === 'Medium') return 'd_info';
  return 'd_primary';
};

const generateTicketNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ST-${year}${month}-${random}`;
};

const blank = {
  ticketNo: '',
  salesOrderNo: '',
  customer: '',
  machine: '',
  machineSerialNo: '',
  complaint: '',
  priority: 'Medium',
  status: 'Open',
  createdDate: new Date().toISOString().split('T')[0],
  warranty: 'No',
  warrantyExpiryDate: '',
  warrantyStatus: 'N/A',
  attachment: ''
};

export default function ServiceTickets() {
  const { data, loading, error, setError, save, remove } = useErpRecords('service', 'ticket');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [salesOrders, setSalesOrders] = useState([]);

  useEffect(() => {
    const fetchSalesOrders = async () => {
      try {
        const response = await api.get('/erp', { params: { module: 'sales', recordType: 'order' } });
        setSalesOrders(response.data || []);
      } catch (err) {
        console.error('Failed to fetch sales orders:', err);
      }
    };
    fetchSalesOrders();
  }, []);

  const checkWarrantyStatus = (warrantyExpiryDate) => {
    if (!warrantyExpiryDate) return { status: 'N/A', isValid: false };
    const today = new Date();
    const expiry = new Date(warrantyExpiryDate);
    const isValid = today <= expiry;
    return { status: isValid ? 'Active' : 'Expired', isValid };
  };

  const handleSalesOrderChange = async (soNumber) => {
    setForm(p => ({ ...p, salesOrderNo: soNumber }));
    if (!soNumber) {
      setForm(p => ({ ...p, warranty: 'No', warrantyExpiryDate: '', warrantyStatus: 'N/A' }));
      return;
    }

    const selectedOrder = salesOrders.find(o => o.so === soNumber);
    if (selectedOrder) {
      setForm(p => ({ ...p, customer: selectedOrder.customer }));

      try {
        const response = await api.get(`/erp/warranty/check/${soNumber}`);
        setForm(p => ({
          ...p,
          warranty: response.data.isWarrantyValid ? 'Yes' : 'No',
          warrantyExpiryDate: response.data.warrantyExpiryDate || '',
          warrantyStatus: response.data.warrantyStatus
        }));
      } catch (err) {
        console.error('Failed to check warranty:', err);
        const { status: warrantyStatus, isValid } = checkWarrantyStatus(selectedOrder.warrantyExpiryDate);
        setForm(p => ({
          ...p,
          warranty: isValid ? 'Yes' : 'No',
          warrantyExpiryDate: selectedOrder.warrantyExpiryDate || '',
          warrantyStatus
        }));
      }
    }
  };

  const counts = {
    Open: data.filter(t => t.status === 'Open').length,
    'In Progress': data.filter(t => t.status === 'In Progress').length,
    'Waiting Parts': data.filter(t => t.status === 'Waiting Parts').length,
    Completed: data.filter(t => t.status === 'Completed').length,
    Closed: data.filter(t => t.status === 'Closed').length,
  };

  const openAdd = () => {
    setForm({ ...blank, ticketNo: generateTicketNo() });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (t) => {
    setForm({
      ticketNo: t.ticketNo || '',
      salesOrderNo: t.salesOrderNo || '',
      customer: t.customer || '',
      machine: t.machine || '',
      machineSerialNo: t.machineSerialNo || '',
      complaint: t.complaint || '',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      createdDate: t.createdDate || new Date().toISOString().split('T')[0],
      warranty: t.warranty || 'No',
      warrantyExpiryDate: t.warrantyExpiryDate || '',
      warrantyStatus: t.warrantyStatus || 'N/A',
      attachment: t.attachment || ''
    });
    setEditId(t._id);
    setErrors({});
    setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = 'Customer is required';
    if (!form.machine.trim()) e.machine = 'Machine is required';
    if (!form.complaint.trim()) e.complaint = 'Complaint description is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await save(form, editId);
      setModal(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save ticket');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try { await remove(id); } catch (err) { setError(err.displayMessage || 'Failed to delete'); }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (ev) => { setForm(p => ({ ...p, [field]: ev.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Tickets</h1>
          <p className="d_page_subtitle">Manage field service and repair tickets</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Ticket</button>
      </div>

      <div className="d_summary_pills mb-3">
        <span className="d_badge d_danger">Open: {counts['Open']}</span>
        <span className="d_badge d_warning">In Progress: {counts['In Progress']}</span>
        <span className="d_badge d_info">Waiting Parts: {counts['Waiting Parts']}</span>
        <span className="d_badge d_success">Completed: {counts['Completed']}</span>
        <span className="d_badge d_primary">Closed: {counts['Closed']}</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdConfirmationNumber /></span>Tickets List ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading tickets…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Ticket No</th>
                    <th>Sales Order</th>
                    <th>Customer</th>
                    <th>Machine</th>
                    <th>Serial No</th>
                    <th>Complaint</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Warranty</th>
                    <th>Warranty Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={11}>No service tickets found.</td></tr>}
                  {data.map(t => (
                    <tr key={t._id}>
                      <td><strong>{String(t.ticketNo)}</strong></td>
                      <td><code>{String(t.salesOrderNo || '-')}</code></td>
                      <td>{String(t.customer)}</td>
                      <td>{String(t.machine)}</td>
                      <td><code>{String(t.machineSerialNo || '-')}</code></td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 150 }}>{String(t.complaint)}</td>
                      <td><span className={`d_badge ${priorityBadge(t.priority)}`}>{String(t.priority)}</span></td>
                      <td><span className={`d_badge ${statusBadge(t.status)}`}>{String(t.status)}</span></td>
                      <td>
                        <span className={`d_badge ${t.warranty === 'Yes' ? 'd_success' : 'd_info'}`}>
                          {String(t.warranty)} {t.warrantyStatus !== 'N/A' && `(${String(t.warrantyStatus)})`}
                        </span>
                      </td>
                      <td>{String(t.warrantyExpiryDate || '-')}</td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Service Ticket' : 'New Service Ticket'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Ticket No</label>
            <input className="d_form_control" value={form.ticketNo} disabled style={{ background: '#f5f5f5' }} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Sales Order (Optional)</label>
            <select className="d_form_control" value={form.salesOrderNo} onChange={(e) => handleSalesOrderChange(e.target.value)}>
              <option value="">Select Sales Order</option>
              {salesOrders.map(o => (
                <option key={o._id} value={o.so}>{String(o.so)} - {String(o.customer)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Customer <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Customer name" {...f('customer')} />
            {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty Status</label>
            <input className="d_form_control" value={form.warrantyStatus} disabled style={{ background: '#f5f5f5' }} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Machine <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Hydraulic Press" {...f('machine')} />
            {errors.machine && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.machine}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Machine Serial No</label>
            <input className="d_form_control" placeholder="e.g. HP-1025" {...f('machineSerialNo')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Complaint <span className="d_req">*</span></label>
            <textarea className="d_form_control" placeholder="Describe the issue in detail…" rows={3} {...f('complaint')} />
            {errors.complaint && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.complaint}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Priority</label>
            <select className="d_form_control" {...f('priority')}>
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Created Date</label>
            <input type="date" className="d_form_control" {...f('createdDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Warranty</label>
            <input className="d_form_control" value={form.warranty} disabled style={{ background: '#f5f5f5' }} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Warranty Expiry Date</label>
            <input className="d_form_control" value={form.warrantyExpiryDate || 'N/A'} disabled style={{ background: '#f5f5f5' }} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Attachment</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input className="d_form_control" placeholder="Image/Video URL" {...f('attachment')} />
              <button type="button" className="d_btn d_btn_outline"><MdAttachFile /> Upload</button>
            </div>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Ticket' : 'Create Ticket'}</button>
        </div>
      </Modal>
    </div>
  );
}
