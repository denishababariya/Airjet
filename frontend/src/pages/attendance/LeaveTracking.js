import React, { useState, useEffect } from 'react';
import { MdEdit, MdVisibility, MdEventNote, MdAdd, MdSearch } from 'react-icons/md';
import { attendanceApi, employeesApi } from '../../utils/api';
import Modal from '../../components/Modal';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import { V, validate } from '../../utils/validators';

const statusBadge = (s) => s==='Approved'?'d_success':s==='Rejected'?'d_danger':'d_warning';
const typeBadge   = (t) => t==='Sick'?'d_danger':t==='Annual'?'d_info':'d_primary';
const tabs = ['All Leaves','Pending Approval','Approved','Rejected'];

const blankForm = { employeeId:'', from:'', to:'', fromTime:'', toTime:'', type:'Casual', reason:'', status:'Pending' };

// A leave application is stored as one record per day (needed for attendance mapping).
// Collapse those day rows into a single table row per application.
const groupKey = (l) =>
  l.leaveGroup || `${l.employeeId?._id || l.employeeId || l.empId || l.emp}|${l.from}|${l.to}`;

const groupLeaves = (records = []) => {
  const map = new Map();
  records.forEach(r => {
    const key = groupKey(r);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...r, _ids: [r._id], recordCount: 1 });
      return;
    }
    existing.recordCount += 1;
    existing._ids.push(r._id);
    if (r.status && r.status !== existing.status) {
      const order = { Pending: 0, Approved: 1, Rejected: 2 };
      existing.status = (order[r.status] ?? 0) > (order[existing.status] ?? 0) ? r.status : existing.status;
    }
    if (r.from && r.from < existing.from) existing.from = r.from;
    if (r.to && r.to > existing.to) existing.to = r.to;
  });
  return [...map.values()];
};

export default function LeaveTracking() {
  const [activeTab, setActiveTab] = useState('All Leaves');
  const [leaves, setLeaves]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(blankForm);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [editLeave, setEditLeave] = useState(null);

  const { toasts, toast, removeToast } = useToast();

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getLeave();
      const records = Array.isArray(res.data) ? res.data : (res.data?.records || []);
      setLeaves(groupLeaves(records));
    } catch (err) {
      toast.error(err.response?.data?.error || err.displayMessage || 'Failed to fetch leaves');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLeaves();
    employeesApi.getAll().then(r => setEmployees(r.data)).catch(() => {});
  }, []);

  const filtered = leaves.filter(l => {
    const matchTab =
      activeTab === 'All Leaves'       ? true :
      activeTab === 'Pending Approval' ? l.status === 'Pending' :
      activeTab === 'Approved'         ? l.status === 'Approved' :
      activeTab === 'Rejected'         ? l.status === 'Rejected' : true;
    const matchSearch = !search || (l.emp || l.employeeId?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const setF = (field, val) => { setForm(p => ({ ...p, [field]: val })); setErrors(p => ({ ...p, [field]: '' })); };

  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => validate({
    employeeId: V.required(form.employeeId, 'Employee'),
    from:       V.date(form.from, 'From date'),
    to:         V.date(form.to,   'To date'),
    dateRange:  V.dateRange(form.from, form.to, 'From date', 'To date'),
    reason:     V.reason(form.reason, 'Reason', 10),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = doValidate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        employeeId: form.employeeId, from: form.from, to: form.to,
        fromTime: form.fromTime, toTime: form.toTime,
        type: form.type, reason: form.reason.trim(),
        ...(editId ? { status: form.status } : {}),
        ...(editLeave?.leaveGroup ? { leaveGroup: editLeave.leaveGroup } : {}),
      };
      if (editId) await attendanceApi.updateLeave(editId, payload);
      else        await attendanceApi.createLeave(payload);
      setShowModal(false); setEditId(null); setEditLeave(null); setForm(blankForm);
      toast.success(editId ? 'Leave updated!' : 'Leave applied successfully!');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.error || err.displayMessage || 'Failed to apply leave');
    } finally { setSubmitting(false); }
  };

  const openLeave = (leave) => {
    setEditId(leave._ids?.[0] || leave._id);
    setEditLeave(leave);
    setForm({
      employeeId: leave.employeeId?._id || leave.employeeId,
      from: leave.from || '', to: leave.to || '',
      fromTime: leave.fromTime && leave.fromTime.includes(':') ? leave.fromTime.substring(0, 5) : '',
      toTime: leave.toTime && leave.toTime.includes(':') ? leave.toTime.substring(0, 5) : '',
      type: leave.type || 'Casual', reason: leave.reason || '', status: leave.status || 'Pending',
    });
    setErrors({});
    setShowModal(true);
  };

  const handleEdit = (leave) => openLeave(leave);

  const handleView = (leave) => openLeave(leave);

  const handleAddNew = () => {
    setEditId(null); setEditLeave(null); setForm(blankForm); setErrors({}); setShowModal(true);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div><h1 className="d_page_title">Leave Tracking</h1><p className="d_page_subtitle">Manage and monitor employee leave requests</p></div>
        <button className="d_btn d_btn_primary" onClick={handleAddNew}><MdAdd /> Apply Leave</button>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditId(null); setEditLeave(null); setForm(blankForm); setErrors({}); }}
        title={editId ? 'Edit Leave' : 'Apply Leave'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Employee <span className="d_req">*</span></label>
              <select className="d_form_control" value={form.employeeId} onChange={e => setF('employeeId', e.target.value)} disabled={!!editId}>
                <option value="">Select Employee</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{String(emp.name)} ({String(emp.id)})</option>)}
              </select>
              <Err field="employeeId" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Leave Type <span className="d_req">*</span></label>
              <select className="d_form_control" value={form.type} onChange={e => setF('type', e.target.value)}>
                <option>Casual</option><option>Sick</option><option>Annual</option>
              </select>
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">From Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" value={form.from} onChange={e => setF('from', e.target.value)} />
              <Err field="from" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">From Time</label>
              <input type="time" className="d_form_control" value={form.fromTime} onChange={e => setF('fromTime', e.target.value)} />
            </div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">To Date <span className="d_req">*</span></label>
              <input type="date" className="d_form_control" value={form.to} onChange={e => setF('to', e.target.value)} />
              <Err field="to" />
              <Err field="dateRange" />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">To Time</label>
              <input type="time" className="d_form_control" value={form.toTime} onChange={e => setF('toTime', e.target.value)} />
            </div>
          </div>
          <div className="d_form_group mb-3">
            <label className="d_form_label">Reason <span className="d_req">*</span></label>
            <textarea className="d_form_control" rows={3} value={form.reason}
              onChange={e => setF('reason', e.target.value)}
              placeholder="Minimum 10 characters — please describe the reason" />
            <Err field="reason" />
          </div>
          {editId && (
            <div className="d_form_group mb-3">
              <label className="d_form_label">Status</label>
              <select className="d_form_control" value={form.status} onChange={e => setF('status', e.target.value)}>
                <option>Pending</option><option>Approved</option><option>Rejected</option>
              </select>
            </div>
          )}
          <div className="d_form_actions">
            <button type="button" className="d_btn d_btn_outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="d_btn d_btn_primary" disabled={submitting}>
              {submitting ? 'Submitting…' : editId ? 'Update Leave' : 'Submit Leave'}
            </button>
          </div>
        </form>
      </Modal>

      <div className="d_card mb-4">
        <div className="d_card_body">
          <div className="d_tabs">{tabs.map(t => <button key={t} className={`d_tab_btn${activeTab===t?' d_active':''}`} onClick={() => setActiveTab(t)}>{t}</button>)}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d_card_title"><span className="d_card_icon"><MdEventNote /></span>Leave Requests</div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input className="d_search_input" placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? <div className="text-center py-4">Loading…</div> :
          filtered.length === 0 ? <div className="text-center py-4 text-muted">No leave records found</div> : (
            <div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.leaveGroup || l._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="d-avatar text-white rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width:32, height:32, fontSize:12, background:'#1a3c5e', flexShrink:0 }}>
                          {(l.emp || l.employeeId?.name || '?').charAt(0)}
                        </div>
                        {l.emp || l.employeeId?.name || '-'}
                      </div>
                    </td>
                    <td><span className={`d_badge ${typeBadge(l.type)}`}>{l.type}</span></td>
                    <td>{l.from}</td><td>{l.to}</td><td>{l.recordCount || l.days || 1}</td>
                    <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.reason}</td>
                    <td><span className={`d_badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_view" onClick={() => handleView(l)}><MdVisibility /></button>
                      <button className="d_icon_btn d_edit" onClick={() => handleEdit(l)}><MdEdit /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </div>
  );
}
