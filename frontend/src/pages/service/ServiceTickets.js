import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdConfirmationNumber, MdAttachFile } from 'react-icons/md';
import Modal from '../../components/Modal';
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
  requestNumber: '',
  salesOrderNumber: '',
  customer: '',
  machine: '',
  machineSerialNo: '',
  complaint: '',
  priority: 'Medium',
  status: 'Open',
  createdDate: new Date().toISOString().split('T')[0],
  serviceType: 'Paid',
  warranty: 'No',
  warrantyExpiryDate: '',
  warrantyStatus: 'N/A',
  attachment: ''
};

export default function ServiceTickets() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewTicket, setViewTicket] = useState(null);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [salesOrders, setSalesOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedSalesOrderItems, setSelectedSalesOrderItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [serviceRes, salesRes, customersRes] = await Promise.all([
        api.get('/service-requests'),
        api.get('/sales-orders'),
        api.get('/customers')
      ]);
      setData(serviceRes.data || []);
      setSalesOrders(salesRes.data || []);
      setCustomers(customersRes.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkWarrantyStatus = async (salesOrderNumber) => {
    if (!salesOrderNumber) {
      setForm(p => ({ ...p, warranty: 'No', warrantyExpiryDate: '', warrantyStatus: 'N/A', serviceType: 'Paid' }));
      return;
    }

    try {
      const response = await api.get('/warranties/check', { 
        params: { salesOrderNumber } 
      });
      
      if (response.data.hasWarranty && response.data.warranties.length > 0) {
        const warranty = response.data.warranties[0];
        setForm(p => ({
          ...p,
          warranty: 'Yes',
          warrantyExpiryDate: warranty.warrantyEndDate ? warranty.warrantyEndDate.split('T')[0] : '',
          warrantyStatus: warranty.warrantyStatus,
          serviceType: 'Warranty'
        }));
      } else {
        setForm(p => ({
          ...p,
          warranty: 'No',
          warrantyExpiryDate: '',
          warrantyStatus: 'Expired',
          serviceType: 'Paid'
        }));
      }
    } catch (err) {
      console.error('Failed to check warranty:', err);
      setForm(p => ({ ...p, warranty: 'No', warrantyExpiryDate: '', warrantyStatus: 'N/A', serviceType: 'Paid' }));
    }
  };

  const handleSalesOrderChange = async (soNumber) => {
    setForm(p => ({ ...p, salesOrderNumber: soNumber }));
    setSelectedProduct('');
    
    const selectedOrder = salesOrders.find(o => o.orderNumber === soNumber);
    if (selectedOrder) {
      setForm(p => ({ ...p, customer: selectedOrder.customer?._id || selectedOrder.customer }));
      
      // Fetch sales order items
      try {
        const orderDetails = await api.get(`/sales-orders/${selectedOrder._id}`);
        setSelectedSalesOrderItems(orderDetails.data.items || []);
      } catch (err) {
        console.error('Failed to fetch sales order items:', err);
        setSelectedSalesOrderItems([]);
      }
    } else {
      setSelectedSalesOrderItems([]);
    }
    
    await checkWarrantyStatus(soNumber);
  };

  const counts = {
    Open: data.filter(t => t.status === 'Open').length,
    'In Progress': data.filter(t => t.status === 'In Progress').length,
    'Waiting Parts': data.filter(t => t.status === 'Waiting Parts').length,
    Completed: data.filter(t => t.status === 'Completed').length,
    Closed: data.filter(t => t.status === 'Closed').length,
  };

  const openAdd = () => {
    setForm({ ...blank, requestNumber: generateTicketNo() });
    setEditId(null);
    setErrors({});
    setSelectedSalesOrderItems([]);
    setSelectedProduct('');
    setModal(true);
  };

  const openEdit = (t) => {
    setForm({
      requestNumber: t.requestNumber || '',
      salesOrderNumber: t.salesOrder?.orderNumber || '',
      customer: t.customer?._id || t.customer,
      machine: t.machine || '',
      machineSerialNo: t.machineSerialNumber || '',
      complaint: t.complaint || '',
      priority: t.priority || 'Medium',
      status: t.status || 'Open',
      createdDate: t.requestDate ? t.requestDate.split('T')[0] : new Date().toISOString().split('T')[0],
      serviceType: t.serviceType || 'Paid',
      warranty: t.warranty ? 'Yes' : 'No',
      warrantyExpiryDate: t.warranty?.warrantyEndDate ? t.warranty.warrantyEndDate.split('T')[0] : '',
      warrantyStatus: t.warranty?.warrantyStatus || 'N/A',
      attachment: t.attachment || ''
    });
    setEditId(t._id);
    setErrors({});
    setModal(true);
  };

  const handleView = (t) => {
    setViewTicket(t);
    setViewModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.customer) e.customer = 'Customer is required';
    if (!form.machine.trim()) e.machine = 'Machine is required';
    if (!form.complaint.trim()) e.complaint = 'Complaint description is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    try {
      const payload = {
        customer: form.customer,
        salesOrderNumber: form.salesOrderNumber,
        machine: form.machine,
        machineSerialNumber: form.machineSerialNumber,
        complaint: form.complaint,
        priority: form.priority,
        status: form.status,
        scheduledDate: form.scheduledDate,
        attachment: form.attachment
      };

      if (editId) {
        await api.put(`/service-requests/${editId}`, payload);
      } else {
        await api.post('/service-requests', payload);
      }
      
      setModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save ticket');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ticket?')) return;
    try { 
      await api.delete(`/service-requests/${id}`); 
      fetchData();
    } catch (err) { 
      setError(err.response?.data?.error || 'Failed to delete'); 
    }
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
              <table className="d_table" style={{ minWidth: 1200 }}>
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Sales Order</th>
                    <th>Customer</th>
                    <th>Machine</th>
                    <th>Serial No</th>
                    <th>Complaint</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Service Type</th>
                    <th>Warranty</th>
                    <th>Warranty Expiry</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={12}>No service tickets found.</td></tr>}
                  {data.map(t => (
                    <tr key={t._id}>
                      <td><strong>{String(t.requestNumber)}</strong></td>
                      <td><code>{String(t.salesOrder?.orderNumber || '-')}</code></td>
                      <td>{String(t.customer?.name || t.customer)}</td>
                      <td>{String(t.machine)}</td>
                      <td><code>{String(t.machineSerialNo || '-')}</code></td>
                      <td style={{ fontSize: '0.85rem', maxWidth: 150 }}>{String(t.complaint)}</td>
                      <td><span className={`d_badge ${priorityBadge(t.priority)}`}>{String(t.priority)}</span></td>
                      <td><span className={`d_badge ${statusBadge(t.status)}`}>{String(t.status)}</span></td>
                      <td>
                        <span className={`d_badge ${t.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>
                          {String(t.serviceType)}
                        </span>
                      </td>
                      <td>
                        <span className={`d_badge ${t.warranty ? 'd_success' : 'd_info'}`}>
                          {t.warranty ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{String(t.warranty?.warrantyEndDate ? t.warranty.warrantyEndDate.split('T')[0] : '-')}</td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => handleView(t)}><MdVisibility /></button>
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
            <label className="d_form_label">Request No</label>
            <input className="d_form_control" value={form.requestNumber} disabled style={{ background: '#f5f5f5' }} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Sales Order (Optional)</label>
            <select className="d_form_control" value={form.salesOrderNumber} onChange={(e) => handleSalesOrderChange(e.target.value)}>
              <option value="">Select Sales Order</option>
              {salesOrders.map(o => (
                <option key={o._id} value={o.orderNumber}>{String(o.orderNumber)} - {String(o.customer?.name)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Product (Optional)</label>
            <select 
              className="d_form_control" 
              value={selectedProduct} 
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                const selectedItem = selectedSalesOrderItems.find(item => item.sparePart?._id === e.target.value || item.sparePart === e.target.value);
                setForm(p => ({ 
                  ...p, 
                  machine: selectedItem?.sparePart?.partName || selectedItem?.description || '',
                  machineSerialNo: selectedItem?.partNumber || ''
                }));
              }}
              disabled={!form.salesOrderNumber}
            >
              <option value="">Select Product</option>
              {selectedSalesOrderItems.map((item, idx) => (
                <option key={idx} value={item.sparePart?._id || item.sparePart}>
                  {String(item.sparePart?.partName || item.description)} - {String(item.partNumber)}
                </option>
              ))}
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Customer <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('customer')}>
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{String(c.name)} {c.companyName ? `(${String(c.companyName)})` : ''}</option>
              ))}
            </select>
            {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
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
            <label className="d_form_label">Warranty</label>
            <input className="d_form_control" value={form.warranty} disabled style={{ background: '#f5f5f5' }} />
          </div>
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

      {/* View Ticket Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Service Ticket Details" size="lg">
        {viewTicket && (
          <div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Request Number</label>
                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewTicket.requestNumber}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <span className={`d_badge ${statusBadge(viewTicket.status)}`}>{viewTicket.status}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Customer</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewTicket.customer?.name || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Sales Order</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewTicket.salesOrder?.orderNumber || '-'}</div>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Machine</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewTicket.machine || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Machine Serial No</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewTicket.machineSerialNo || viewTicket.machineSerialNumber || '-'}</div>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Priority</label>
                <span className={`d_badge ${priorityBadge(viewTicket.priority)}`}>{viewTicket.priority}</span>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Service Type</label>
                <span className={`d_badge ${viewTicket.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>{viewTicket.serviceType}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Request Date</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewTicket.requestDate ? new Date(viewTicket.requestDate).toLocaleDateString('en-IN') : '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Warranty</label>
                <span className={`d_badge ${viewTicket.warranty ? 'd_success' : 'd_info'}`}>{viewTicket.warranty ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {viewTicket.warranty && viewTicket.warranty.warrantyEndDate && (
              <div className="d_form_row cols-1">
                <div className="d_form_group">
                  <label className="d_form_label">Warranty Expiry Date</label>
                  <div className="d_form_control" style={{ background: '#f8f9fa', color: new Date(viewTicket.warranty.warrantyEndDate) < new Date() ? 'var(--d-danger)' : 'var(--d-success)' }}>
                    {new Date(viewTicket.warranty.warrantyEndDate).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <div className="d_form_row cols-1">
              <div className="d_form_group">
                <label className="d_form_label">Complaint</label>
                <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewTicket.complaint || '-'}</div>
              </div>
            </div>

            {viewTicket.technicianNotes && (
              <div className="d_form_row cols-1">
                <div className="d_form_group">
                  <label className="d_form_label">Technician Notes</label>
                  <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewTicket.technicianNotes}</div>
                </div>
              </div>
            )}

            {viewTicket.attachment && (
              <div className="d_form_row cols-1">
                <div className="d_form_group">
                  <label className="d_form_label">Attachment</label>
                  <div style={{ marginTop: '8px' }}>
                    <a href={viewTicket.attachment} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--d-primary)' }}>View Attachment</a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
