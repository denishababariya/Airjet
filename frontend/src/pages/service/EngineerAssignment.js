import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdEngineering } from 'react-icons/md';
import Modal from '../../components/Modal';
import api from '../../utils/api';
import { getErrorMessage } from '../../utils/errorMessages';

const STATUS_OPTIONS = ['Assigned', 'In Progress', 'Completed', 'Cancelled'];

const statusBadge = s => {
  if (s === 'Completed') return 'd_success';
  if (s === 'Cancelled') return 'd_danger';
  if (s === 'In Progress') return 'd_warning';
  return 'd_info';
};

const blank = {
  requestNumber: '',
  assignedEngineer: '',
  assignDate: new Date().toISOString().split('T')[0],
  scheduledDate: '',
  status: 'Assigned'
};

export default function EngineerAssignment() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [serviceRequests, setServiceRequests] = useState([]);
  const [engineers, setEngineers] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, requestsRes, engineersRes] = await Promise.all([
        api.get('/service-requests'),
        api.get('/service-requests'),
        api.get('/employees')
      ]);
      
      // Filter only assigned requests
      const assignedRequests = requestsRes.data.filter(req => req.assignedEngineer);
      setData(assignedRequests);
      setServiceRequests(requestsRes.data);
      setEngineers(engineersRes.data || []);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load data')); = () => {
    setForm({ ...blank });
    setEditId(null);
    setErrors({});
    setModal(true);
  };

  const openEdit = (req) => {
    setForm({
      requestNumber: req.requestNumber || '',
      assignedEngineer: req.assignedEngineer?._id || req.assignedEngineer,
      assignDate: req.assignedDate ? req.assignedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      scheduledDate: req.scheduledDate ? req.scheduledDate.split('T')[0] : '',
      status: req.status || 'Assigned'
    });
    setEditId(req._id);
    setErrors({});
    setModal(true);
  };

  const handleView = (req) => {
    setViewAssignment(req);
    setViewModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.requestNumber.trim()) e.requestNumber = 'Request Number is required';
    if (!form.assignedEngineer) e.assignedEngineer = 'Engineer is required';
    if (!form.scheduledDate) e.scheduledDate = 'Scheduled date is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    
    try {
      // Find the service request by request number
      const selectedRequest = serviceRequests.find(req => req.requestNumber === form.requestNumber);
      if (!selectedRequest) {
        setError('Service request not found');
        return;
      }

      const payload = {
        engineerId: form.assignedEngineer,
        scheduledDate: form.scheduledDate,
        status: form.status
      };

      await api.post(`/service-requests/${selectedRequest._id}/assign-engineer`, payload);
      setModal(false);
      fetchData();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save assignment'));
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
          <h1 className="d_page_title">Engineer Assignment</h1>
          <p className="d_page_subtitle">Assign engineers to service requests</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdEngineering /> New Assignment</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdEngineering /></span>Assignment List ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading assignments…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Customer</th>
                    <th>Machine</th>
                    <th>Engineer</th>
                    <th>Assign Date</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                    <th>Service Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={9}>No assignments found.</td></tr>}
                  {data.map(req => (
                    <tr key={req._id}>
                      <td><strong>{String(req.requestNumber)}</strong></td>
                      <td>{String(req.customer?.name || req.customer)}</td>
                      <td>{String(req.machine)}</td>
                      <td>
                        {req.assignedEngineer ? (
                          <span>{String(req.assignedEngineer.name || req.assignedEngineer)}</span>
                        ) : (
                          <span className="d_badge d_warning">Unassigned</span>
                        )}
                      </td>
                      <td>{String(req.assignedDate ? req.assignedDate.split('T')[0] : '-')}</td>
                      <td>{String(req.scheduledDate ? req.scheduledDate.split('T')[0] : '-')}</td>
                      <td><span className={`d_badge ${statusBadge(req.status)}`}>{String(req.status)}</span></td>
                      <td>
                        <span className={`d_badge ${req.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>
                          {String(req.serviceType)}
                        </span>
                      </td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => handleView(req)}><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(req)}><MdEdit /></button>
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

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Assignment' : 'New Assignment'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Service Request <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('requestNumber')}>
              <option value="">Select Service Request</option>
              {serviceRequests.filter(req => !req.assignedEngineer).map(req => (
                <option key={req._id} value={req.requestNumber}>
                  {String(req.requestNumber)} - {String(req.customer?.name)} - {String(req.machine)}
                </option>
              ))}
            </select>
            {errors.requestNumber && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.requestNumber}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Engineer <span className="d_req">*</span></label>
            <select className="d_form_control" {...f('assignedEngineer')}>
              <option value="">Select Engineer</option>
              {engineers.map(eng => (
                <option key={eng._id} value={eng._id}>
                  {String(eng.name)} - {String(eng.designation?.title || eng.designation)}
                </option>
              ))}
            </select>
            {errors.assignedEngineer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.assignedEngineer}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Assign Date</label>
            <input type="date" className="d_form_control" {...f('assignDate')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Scheduled Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('scheduledDate')} />
            {errors.scheduledDate && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.scheduledDate}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Assignment' : 'Create Assignment'}</button>
        </div>
      </Modal>

      {/* View Assignment Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Assignment Details" size="lg">
        {viewAssignment && (
          <div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Request Number</label>
                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewAssignment.requestNumber}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <span className={`d_badge ${statusBadge(viewAssignment.status)}`}>{viewAssignment.status}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Customer</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewAssignment.customer?.name || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Machine</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewAssignment.machine || '-'}</div>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Assigned Engineer</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>
                  {viewAssignment.assignedEngineer?.name || viewAssignment.assignedEngineer || 'Unassigned'}
                </div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Assign Date</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>
                  {viewAssignment.assignedDate ? new Date(viewAssignment.assignedDate).toLocaleDateString('en-IN') : '-'}
                </div>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Scheduled Date</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>
                  {viewAssignment.scheduledDate ? new Date(viewAssignment.scheduledDate).toLocaleDateString('en-IN') : '-'}
                </div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Service Type</label>
                <span className={`d_badge ${viewAssignment.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>
                  {viewAssignment.serviceType}
                </span>
              </div>
            </div>

            <div className="d_form_row cols-1">
              <div className="d_form_group">
                <label className="d_form_label">Complaint</label>
                <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewAssignment.complaint || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
