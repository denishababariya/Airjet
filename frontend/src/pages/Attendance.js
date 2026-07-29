import React, { useState, useEffect } from 'react';
import { MdAccessTime, MdAdd } from 'react-icons/md';
import Modal from '../components/Modal';
import { attendanceApi, employeesApi, auth } from '../utils/api';
import { canTakeAttendance } from '../utils/roles';

const statusClass = { Present: 'd_success', Late: 'd_warning', Absent: 'd_danger', Leave: 'd_info', Approved: 'd_success', Pending: 'd_warning' };

const TAB_TYPE = { records: 'attendance', leave: 'leave', overtime: 'overtime' };

const blankAttendance = { emp: '', empId: '', date: '', checkIn: '', checkOut: '', status: 'Present' };
const blankLeave = { emp: '', empId: '', from: '', to: '', days: '', type: 'Casual Leave', reason: '', status: 'Pending' };
const blankOvertime = { emp: '', empId: '', date: '', extraHours: '', reason: '', rate: '', amount: '' };

const Attendance = ({ defaultTab = 'records' }) => {
  const [tab, setTab] = useState(defaultTab);
  const [records, setRecords] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [overtimeData, setOvertimeData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(blankAttendance);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.getCurrentUser();
      setCurrentUser(user);
      
      const canManageAttendance = canTakeAttendance(user?.role);
      
      let attRes, leaveRes, otRes, empRes;
      
      if (canManageAttendance) {
        [attRes, leaveRes, otRes, empRes] = await Promise.all([
          attendanceApi.getAll({ recordType: 'attendance' }),
          attendanceApi.getAll({ recordType: 'leave' }),
          attendanceApi.getAll({ recordType: 'overtime' }),
          employeesApi.getAll(),
        ]);
      } else {
        // Non-admin users see only their own attendance
        [attRes, leaveRes, otRes] = await Promise.all([
          attendanceApi.getMy({ recordType: 'attendance', month: selectedMonth, year: selectedYear }),
          attendanceApi.getMy({ recordType: 'leave' }),
          attendanceApi.getMy({ recordType: 'overtime' }),
        ]);
        empRes = { data: [] };
      }
      
      setRecords(attRes.data);
      setLeaveData(leaveRes.data);
      setOvertimeData(otRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      setError(err.displayMessage || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => { 
    if (!canTakeAttendance(currentUser?.role)) {
      fetchAll(); 
    }
  }, [selectedMonth, selectedYear]);

  const getBlank = () => tab === 'leave' ? blankLeave : tab === 'overtime' ? blankOvertime : blankAttendance;

  const openAdd = () => { setForm(getBlank()); setEditId(null); setErrors({}); setModal(true); };

  const validate = () => {
    const e = {};
    if (!form.emp?.trim()) e.emp = 'Employee name is required';
    if (tab === 'records' && !form.date?.trim()) e.date = 'Date is required';
    if (tab === 'leave' && !form.from?.trim()) e.from = 'From date is required';
    if (tab === 'overtime' && !form.date?.trim()) e.date = 'Date is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const recordType = TAB_TYPE[tab];
      let payload = { recordType, emp: form.emp, empId: form.empId };
      if (tab === 'leave') {
        payload = { ...payload, from: form.from, to: form.to, days: Number(form.days) || 1, type: form.type, reason: form.reason, status: form.status };
      } else if (tab === 'overtime') {
        payload = { ...payload, date: form.date, extraHours: form.extraHours, reason: form.reason, rate: form.rate, amount: form.amount };
      } else {
        payload = { ...payload, date: form.date, checkIn: form.checkIn || '--', checkOut: form.checkOut || '--', hours: '--', status: form.status };
      }
      if (editId) {
        await attendanceApi.update(editId, payload);
      } else {
        await attendanceApi.create(payload);
      }
      setModal(false);
      fetchAll();
    } catch (err) {
      setError(err.displayMessage || 'Failed to save record');
    }
  };

  const onEmpSelect = (empMongoId) => {
    const emp = employees.find(e => e._id === empMongoId);
    if (emp) setForm(p => ({ ...p, emp: emp.name, empId: emp.id, employeeId: emp._id }));
  };

  const f = (field) => ({
    value: form[field] || '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const present = records.filter(r => r.status === 'Present').length;
  const absent  = records.filter(r => r.status === 'Absent').length;
  const late    = records.filter(r => r.status === 'Late').length;
  const leave   = records.filter(r => r.status === 'Leave').length;
  const earlyCheckout = records.filter(r => r.earlyCheckout === true).length;

  const canManage = canTakeAttendance(currentUser?.role);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Attendance</h1>
          <p className="d_page_subtitle">Track employee check-in, leave and overtime</p>
        </div>
        <div className="d-flex gap-2">
          {canManage && (
            <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Record</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!canManage && (
        <div className="d_card mb-3">
          <div className="d_card_body">
            <div className="d-flex gap-3 align-items-center">
              <div>
                <label className="d_form_label">Month</label>
                <select 
                  className="d_form_control" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="d_form_label">Year</label>
                <select 
                  className="d_form_control" 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(Number(e.target.value))}
                >
                  {[2024, 2025, 2026, 2027, 2028].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row g-3 mb-3">
        {[['Present', present, 'd_success'], ['Absent', absent, 'd_danger'], ['Late', late, 'd_warning'], ['On Leave', leave, 'd_info'], ['Early Out', earlyCheckout, 'd_danger']].map(([lbl, val, cls]) => (
          <div key={lbl} className="col-6 col-md-3">
            <div className="d_stat_card" style={{ borderLeftColor: `var(--${cls.replace('d_', 'd-')})` }}>
              <div className="d_stat_value">{val}</div>
              <div className="d_stat_label">{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d_tabs mb-3">
        {[['records', "Today's Records"], ['leave', 'Leave Requests'], ['overtime', 'Overtime']].map(([k, v]) => (
          <button key={k} className={`d_tab_btn ${tab === k ? 'd_active' : ''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-4">Loading…</div> : (
        <>
          {tab === 'records' && (
            <div className="d_card">
              <div className="d_card_header">
                <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Attendance Records ({records.length})</h2>
              </div>
              <div className="d_card_body p-0">
                <div className="d_table_wrap">
                  <table className="d_table">
                    <thead>
                      <tr><th>ID</th><th>Employee</th><th>Emp ID</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {records.length === 0 && <tr className="d_empty"><td colSpan={7}>No records found.</td></tr>}
                      {records.map(r => (
                        <tr key={r._id}>
                          <td><code>{r.id}</code></td>
                          <td><strong>{r.emp}</strong></td>
                          <td><code>{r.empId}</code></td>
                          <td>{r.date}</td>
                          <td>{r.checkIn}</td>
                          <td>{r.checkOut}</td>
                          <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'leave' && (
            <div className="d_card">
              <div className="d_card_header">
                <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Leave Requests ({leaveData.length})</h2>
              </div>
              <div className="d_card_body p-0">
                <div className="d_table_wrap">
                  <table className="d_table">
                    <thead><tr><th>ID</th><th>Employee</th><th>From</th><th>To</th><th>Days</th><th>Type</th><th>Reason</th><th>Status</th></tr></thead>
                    <tbody>
                      {leaveData.length === 0 && <tr className="d_empty"><td colSpan={8}>No leave requests.</td></tr>}
                      {leaveData.map(l => (
                        <tr key={l._id}>
                          <td><code>{l.id}</code></td>
                          <td><strong>{l.emp}</strong></td>
                          <td>{l.from}</td><td>{l.to}</td><td>{l.days}</td>
                          <td>{l.type}</td><td>{l.reason}</td>
                          <td><span className={`d_badge ${statusClass[l.status]}`}>{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'overtime' && (
            <div className="d_card">
              <div className="d_card_header">
                <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Overtime Records ({overtimeData.length})</h2>
              </div>
              <div className="d_card_body p-0">
                <div className="d_table_wrap">
<table className="d_table">
                     <thead><tr><th>ID</th><th>Employee</th><th>Emp ID</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Late Min</th><th>Early Checkout</th></tr></thead>
                     <tbody>
                       {records.length === 0 && <tr className="d_empty"><td colSpan={10}>No records found.</td></tr>}
                       {records.map(r => (
                         <tr key={r._id}>
                           <td><code>{r.id}</code></td>
                           <td><strong>{r.emp}</strong></td>
                           <td><code>{r.empId}</code></td>
                           <td>{r.date}</td>
                           <td>{r.checkIn}</td>
                           <td>{r.checkOut}</td>
                           <td>{r.hours}</td>
                           <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                           <td>{r.lateMinutes || 0} min</td>
                           <td>{r.earlyCheckout ? <span className="d_badge d_danger">Yes</span> : <span className="d_badge d_success">No</span>}</td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Record' : 'Add Record'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Select Employee</label>
            <select className="d_form_control" onChange={e => onEmpSelect(e.target.value)}>
              <option value="">Select employee</option>
              {employees.map(e => <option key={e._id} value={e._id}>{e.name} ({e.id})</option>)}
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Employee Name <span className="d_req">*</span></label>
            <input className="d_form_control" {...f('emp')} />
            {errors.emp && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.emp}</span>}
          </div>
        </div>

        {tab === 'records' && (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Date <span className="d_req">*</span></label>
                <input type="date" className="d_form_control" {...f('date')} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <select className="d_form_control" {...f('status')}>
                  <option>Present</option><option>Absent</option><option>Late</option><option>Leave</option>
                </select>
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Check In</label>
                <input type="time" className="d_form_control" {...f('checkIn')} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Check Out</label>
                <input type="time" className="d_form_control" {...f('checkOut')} />
              </div>
            </div>
          </>
        )}

        {tab === 'leave' && (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">From <span className="d_req">*</span></label>
                <input type="date" className="d_form_control" {...f('from')} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">To</label>
                <input type="date" className="d_form_control" {...f('to')} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Leave Type</label>
                <select className="d_form_control" {...f('type')}>
                  <option>Sick Leave</option><option>Casual Leave</option><option>Earned Leave</option>
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Status</label>
                <select className="d_form_control" {...f('status')}>
                  <option>Pending</option><option>Approved</option>
                </select>
              </div>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Reason</label>
              <input className="d_form_control" {...f('reason')} />
            </div>
          </>
        )}

        {tab === 'overtime' && (
          <>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Date <span className="d_req">*</span></label>
                <input type="date" className="d_form_control" {...f('date')} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Extra Hours</label>
                <input className="d_form_control" placeholder="e.g. 2h 30m" {...f('extraHours')} />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Rate</label>
                <input className="d_form_control" placeholder="₹350/hr" {...f('rate')} />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Amount</label>
                <input className="d_form_control" placeholder="₹875" {...f('amount')} />
              </div>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Reason</label>
              <input className="d_form_control" {...f('reason')} />
            </div>
          </>
        )}

        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
