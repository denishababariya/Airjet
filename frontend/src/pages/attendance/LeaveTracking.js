import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete, MdVisibility, MdEventNote, MdClose, MdAdd, MdPerson, MdSearch } from 'react-icons/md';
import { attendanceApi, employeesApi } from '../../utils/api';
import Modal from '../../components/Modal';

const statusBadge = (status) => {
  if (status === 'Approved') return 'd_success';
  if (status === 'Rejected') return 'd_danger';
  return 'd_warning';
};

const typeBadge = (type) => {
  if (type === 'Sick') return 'd_danger';
  if (type === 'Annual') return 'd_info';
  return 'd_primary';
};

const tabs = ['All Leaves', 'Pending Approval', 'Approved', 'Rejected'];

export default function LeaveTracking() {
  const [activeTab, setActiveTab] = useState('All Leaves');
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    employeeId: '',
    from: '',
    to: '',
    fromTime: '',
    toTime: '',
    type: 'Casual',
    reason: '',
    status: 'Pending'
  });
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getLeave();
      setLeaves(res.data.records || []);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    employeesApi.getAll().then(res => setEmployees(res.data)).catch(() => {});
  }, []);

  const filtered = leaves.filter(l => {
    if (activeTab === 'All Leaves') return true;
    if (activeTab === 'Pending Approval') return l.status === 'Pending';
    if (activeTab === 'Approved') return l.status === 'Approved';
    if (activeTab === 'Rejected') return l.status === 'Rejected';
    return true;
  });

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.from || !form.to || !form.reason) return;
    setSubmitting(true);
    try {
      if (editId) {
        await attendanceApi.updateLeave(editId, {
          employeeId: form.employeeId,
          from: form.from,
          to: form.to,
          fromTime: form.fromTime,
          toTime: form.toTime,
          type: form.type,
          reason: form.reason,
          status: form.status
        });
      } else {
        await attendanceApi.createLeave({
          employeeId: form.employeeId,
          from: form.from,
          to: form.to,
          fromTime: form.fromTime,
          toTime: form.toTime,
          type: form.type,
          reason: form.reason
        });
      }
      setShowModal(false);
      setEditId(null);
      setForm({ employeeId: '', from: '', to: '', fromTime: '', toTime: '', type: 'Casual', reason: '', status: 'Pending' });
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (leave) => {
    setEditId(leave._id);
    setForm({
      employeeId: leave.employeeId?._id || leave.employeeId,
      from: leave.from,
      to: leave.to,
      fromTime: leave.fromTime || '',
      toTime: leave.toTime || '',
      type: leave.type,
      reason: leave.reason,
      status: leave.status
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditId(null);
    setForm({ employeeId: '', from: '', to: '', fromTime: '', toTime: '', type: 'Casual', reason: '', status: 'Pending' });
    setShowModal(true);
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Leave Tracking</h1>
          <p className="d_page_subtitle">Manage and monitor employee leave requests</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={handleAddNew}>
          <MdAdd /> Apply Leave
        </button>
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => { setShowModal(false); setEditId(null); setForm({ employeeId: '', from: '', to: '', fromTime: '', toTime: '', type: 'Casual', reason: '', status: 'Pending' }); }} title={editId ? 'Edit Leave' : 'Apply Leave'} size="md">
          <form onSubmit={handleApplyLeave}>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Employee <span className="d_req">*</span></label>
                <select
                  className="d_form_control"
                  value={form.employeeId}
                  onChange={e => setForm({...form, employeeId: e.target.value})}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.id})</option>
                  ))}
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Leave Type <span className="d_req">*</span></label>
                <select
                  className="d_form_control"
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  required
                >
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">From Date <span className="d_req">*</span></label>
                <input
                  type="date"
                  className="d_form_control"
                  value={form.from}
                  onChange={e => setForm({...form, from: e.target.value})}
                  required
                />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">From Time</label>
                <input
                  type="time"
                  className="d_form_control"
                  value={form.fromTime}
                  onChange={e => setForm({...form, fromTime: e.target.value})}
                />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">To Date <span className="d_req">*</span></label>
                <input
                  type="date"
                  className="d_form_control"
                  value={form.to}
                  onChange={e => setForm({...form, to: e.target.value})}
                  required
                />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">To Time</label>
                <input
                  type="time"
                  className="d_form_control"
                  value={form.toTime}
                  onChange={e => setForm({...form, toTime: e.target.value})}
                />
              </div>
            </div>
            <div className="d_form_row">
              <div className="d_form_group">
                <label className="d_form_label">Reason <span className="d_req">*</span></label>
                <textarea
                  className="d_form_control"
                  rows="3"
                  value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value})}
                  required
                  placeholder="Please provide reason for leave"
                ></textarea>
              </div>
            </div>
            {editId && (
              <div className="d_form_row cols-2">
                <div className="d_form_group">
                  <label className="d_form_label">Status <span className="d_req">*</span></label>
                  <select
                    className="d_form_control"
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}
            <div className="d_form_actions">
              <button type="button" className="d_btn d_btn_outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="d_btn d_btn_primary" disabled={submitting}>
                {submitting ? 'Submitting...' : (editId ? 'Update Leave' : 'Submit Leave')}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="d_card mb-4">
        <div className="d_card_body">
          <div className="d_tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`d_tab_btn${activeTab === tab ? ' d_active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d_card_title">
            <span className="d_card_icon"><MdEventNote /></span>
            Leave Requests
          </div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input
              className="d_search_input"
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4 text-muted">No leave records found</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.filter(l => 
                    l.emp?.toLowerCase().includes(search.toLowerCase())
                  ).map(l => (
                    <tr key={l._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {l.employeeId?.image ? (
                            <img src={l.employeeId.image} alt={l.emp} className="d_table_avatar me-2" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="d-avatar text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32, fontSize: 12, backgroundColor: '#1a3c5e' }}>
                              {l.emp?.charAt(0)}
                            </div>
                          )}
                          {l.emp}
                        </div>
                      </td>
                      <td><span className={`d_badge ${typeBadge(l.type)}`}>{l.type}</span></td>
                      <td>{l.from}</td>
                      <td>{l.to}</td>
                      <td>{l.days}</td>
                      <td>{l.reason}</td>
                      <td><span className={`d_badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit" onClick={() => handleEdit(l)}><MdEdit /></button>
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
    </div>
  );
}
