import React, { useState, useEffect } from 'react';
import { MdAssessment, MdVisibility } from 'react-icons/md';
import Modal from '../../components/Modal';
import api from '../../utils/api';

export default function ServiceReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/service-requests');
      setData(res.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load service requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (r) => {
    setViewReport(r);
    setViewModal(true);
  };

  const statusBadge = s => {
    if (s === 'Open') return 'd_warning';
    if (s === 'Verified') return 'd_info';
    if (s === 'Assigned') return 'd_primary';
    if (s === 'In Progress') return 'd_info';
    if (s === 'Waiting Parts') return 'd_warning';
    if (s === 'Completed') return 'd_success';
    if (s === 'Closed') return 'd_danger';
    if (s === 'Cancelled') return 'd_danger';
    return 'd_info';
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Reports</h1>
          <p className="d_page_subtitle">Service requests and details</p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAssessment /></span>Service Requests ({data.length})</div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading service requests…</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 1000 }}>
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Customer</th>
                    <th>Machine</th>
                    <th>Serial No</th>
                    <th>Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Service Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && <tr className="d_empty"><td colSpan={9}>No service requests found.</td></tr>}
                  {data.map(r => (
                    <tr key={r._id}>
                      <td><strong>{String(r.requestNumber)}</strong></td>
                      <td>{r.customer?.name || r.customer || '-'}</td>
                      <td>{String(r.machine || '-')}</td>
                      <td>{String(r.machineSerialNo || '-')}</td>
                      <td>{r.requestDate ? new Date(r.requestDate).toLocaleDateString('en-IN') : '-'}</td>
                      <td><span className={`d_badge ${r.priority === 'Critical' ? 'd_danger' : r.priority === 'High' ? 'd_warning' : 'd_info'}`}>{String(r.priority)}</span></td>
                      <td><span className={`d_badge ${statusBadge(r.status)}`}>{String(r.status)}</span></td>
                      <td><span className={`d_badge ${r.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>{String(r.serviceType)}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view" onClick={() => handleView(r)}><MdVisibility /></button>
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

      {/* View Service Request Modal */}
      <Modal open={viewModal} onClose={() => setViewModal(false)} title="Service Request Details" size="lg">
        {viewReport && (
          <div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Request Number</label>
                <div className="d_form_control" style={{ background: '#f8f9fa', fontWeight: 'bold' }}>{viewReport.requestNumber}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <span className={`d_badge ${statusBadge(viewReport.status)}`}>{viewReport.status}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Customer</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.customer?.name || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Service Type</label>
                <span className={`d_badge ${viewReport.serviceType === 'Warranty' ? 'd_success' : 'd_warning'}`}>{viewReport.serviceType}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Machine</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.machine || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Machine Serial No</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.machineSerialNo || '-'}</div>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Request Date</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.requestDate ? new Date(viewReport.requestDate).toLocaleDateString('en-IN') : '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Priority</label>
                <span className={`d_badge ${viewReport.priority === 'Critical' ? 'd_danger' : viewReport.priority === 'High' ? 'd_warning' : 'd_info'}`}>{viewReport.priority}</span>
              </div>
            </div>

            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Sales Order</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.salesOrderNumber || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Assigned Engineer</label>
                <div className="d_form_control" style={{ background: '#f8f9fa' }}>{viewReport.assignedEngineer?.name || 'Unassigned'}</div>
              </div>
            </div>

            {viewReport.complaint && (
              <div className="d_form_row cols-1">
                <div className="d_form_group">
                  <label className="d_form_label">Complaint</label>
                  <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewReport.complaint}</div>
                </div>
              </div>
            )}

            {viewReport.technicianNotes && (
              <div className="d_form_row cols-1">
                <div className="d_form_group">
                  <label className="d_form_label">Technician Notes</label>
                  <div className="d_form_control" style={{ background: '#f8f9fa', minHeight: '60px' }}>{viewReport.technicianNotes}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
