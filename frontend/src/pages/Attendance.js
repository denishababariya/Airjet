import React, { useState } from 'react';
import { MdAccessTime, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';

const initRecords = [
  { id: 'ATT001', emp: 'Rajesh Kumar',  empId: 'EMP001', date: '23-Jun-2026', checkIn: '09:05', checkOut: '18:10', hours: '9h 05m', status: 'Present' },
  { id: 'ATT002', emp: 'Priya Sharma',  empId: 'EMP002', date: '23-Jun-2026', checkIn: '09:30', checkOut: '18:00', hours: '8h 30m', status: 'Late' },
  { id: 'ATT003', emp: 'Amit Patel',    empId: 'EMP003', date: '23-Jun-2026', checkIn: '--',    checkOut: '--',    hours: '--',     status: 'Absent' },
  { id: 'ATT004', emp: 'Karan Mehta',   empId: 'EMP005', date: '23-Jun-2026', checkIn: '08:55', checkOut: '18:05', hours: '9h 10m', status: 'Present' },
  { id: 'ATT005', emp: 'Divya Verma',   empId: 'EMP006', date: '23-Jun-2026', checkIn: '--',    checkOut: '--',    hours: '--',     status: 'Leave' },
];

const statusClass = { Present: 'd_success', Late: 'd_warning', Absent: 'd_danger', Leave: 'd_info' };

const initLeave = [
  { id: 'LVE001', emp: 'Divya Verma',  empId: 'EMP006', from: '23-Jun-2026', to: '25-Jun-2026', days: 3, type: 'Sick Leave',   reason: 'Fever and rest',              status: 'Approved' },
  { id: 'LVE002', emp: 'Pooja Desai',  empId: 'EMP008', from: '24-Jun-2026', to: '24-Jun-2026', days: 1, type: 'Casual Leave', reason: 'Personal work',               status: 'Pending' },
  { id: 'LVE003', emp: 'Nikhil Rao',   empId: 'EMP007', from: '26-Jun-2026', to: '27-Jun-2026', days: 2, type: 'Earned Leave', reason: 'Family function',             status: 'Approved' },
];

const initOvertime = [
  { id: 'OT001', emp: 'Rajesh Kumar', empId: 'EMP001', date: '20-Jun-2026', extraHours: '2h 30m', reason: 'Month-end sales closing', rate: '₹350/hr', amount: '₹875' },
  { id: 'OT002', emp: 'Karan Mehta',  empId: 'EMP005', date: '21-Jun-2026', extraHours: '3h 00m', reason: 'Stock audit completion',   rate: '₹300/hr', amount: '₹900' },
  { id: 'OT003', emp: 'Amit Patel',   empId: 'EMP003', date: '22-Jun-2026', extraHours: '1h 45m', reason: 'Urgent purchase order',    rate: '₹320/hr', amount: '₹560' },
];

const blank = { emp: '', empId: '', date: '', checkIn: '', checkOut: '', status: 'Present' };

const Attendance = ({ defaultTab = 'records' }) => {
  const [tab, setTab]       = useState(defaultTab);
  const [data, setData]     = useState(initRecords);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (rec) => {
    setForm({ emp: rec.emp, empId: rec.empId, date: rec.date, checkIn: rec.checkIn === '--' ? '' : rec.checkIn, checkOut: rec.checkOut === '--' ? '' : rec.checkOut, status: rec.status });
    setEditId(rec.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.emp.trim())  e.emp  = 'Employee name is required';
    if (!form.date.trim()) e.date = 'Date is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setData(d => d.map(r => r.id === editId ? { ...r, ...form, checkIn: form.checkIn || '--', checkOut: form.checkOut || '--', hours: '--' } : r));
    } else {
      const newId = `ATT${String(data.length + 1).padStart(3, '0')}`;
      setData(d => [...d, { id: newId, ...form, checkIn: form.checkIn || '--', checkOut: form.checkOut || '--', hours: '--' }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Delete record?')) setData(d => d.filter(r => r.id !== id)); };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const present = data.filter(r => r.status === 'Present').length;
  const absent  = data.filter(r => r.status === 'Absent').length;
  const late    = data.filter(r => r.status === 'Late').length;
  const leave   = data.filter(r => r.status === 'Leave').length;

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Attendance</h1>
          <p className="d_page_subtitle">Track employee check-in, leave and overtime</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Record</button>
      </div>

      {/* Summary cards */}
      <div className="row g-3 mb-3">
        {[['Present', present, 'd_success'], ['Absent', absent, 'd_danger'], ['Late', late, 'd_warning'], ['On Leave', leave, 'd_info']].map(([lbl, val, cls]) => (
          <div key={lbl} className="col-6 col-md-3">
            <div className={`d_stat_card`} style={{ borderLeftColor: `var(--${cls.replace('d_', 'd-')})` }}>
              <div className="d_stat_value">{val}</div>
              <div className="d_stat_label">{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d_tabs mb-3">
        {[['records','Today\'s Records'],['leave','Leave Requests'],['overtime','Overtime']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'records' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Attendance Records</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr><th>ID</th><th>Employee</th><th>Emp ID</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td>
                      <td><strong>{r.emp}</strong></td>
                      <td><code>{r.empId}</code></td>
                      <td>{r.date}</td>
                      <td>{r.checkIn}</td>
                      <td>{r.checkOut}</td>
                      <td>{r.hours}</td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(r)} title="Edit"><MdEdit /></button>
                          <button className="d_icon_btn d_del"  onClick={() => handleDelete(r.id)} title="Delete"><MdDelete /></button>
                        </div>
                      </td>
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
            <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Leave Requests ({initLeave.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Apply Leave</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Employee</th><th>From</th><th>To</th><th>Days</th><th>Leave Type</th><th>Reason</th><th>Status</th></tr></thead>
                <tbody>
                  {initLeave.map(l => (
                    <tr key={l.id}>
                      <td><code>{l.id}</code></td>
                      <td><strong>{l.emp}</strong></td>
                      <td>{l.from}</td><td>{l.to}</td><td>{l.days}</td>
                      <td>{l.type}</td><td>{l.reason}</td>
                      <td><span className={`d_badge ${l.status === 'Approved' ? 'd_success' : 'd_warning'}`}>{l.status}</span></td>
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
            <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Overtime Records ({initOvertime.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Add Overtime</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Employee</th><th>Date</th><th>Extra Hours</th><th>Reason</th><th>Rate</th><th>Amount</th></tr></thead>
                <tbody>
                  {initOvertime.map(o => (
                    <tr key={o.id}>
                      <td><code>{o.id}</code></td>
                      <td><strong>{o.emp}</strong></td>
                      <td>{o.date}</td><td><strong>{o.extraHours}</strong></td>
                      <td>{o.reason}</td><td>{o.rate}</td>
                      <td><strong>{o.amount}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Attendance Record' : 'Add Attendance Record'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Employee Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Full name" {...f('emp')} />
            {errors.emp && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.emp}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Employee ID</label>
            <input className="d_form_control" placeholder="e.g. EMP001" {...f('empId')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('date')} />
            {errors.date && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.date}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Present</option>
              <option>Absent</option>
              <option>Late</option>
              <option>Leave</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Check In Time</label>
            <input type="time" className="d_form_control" {...f('checkIn')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Check Out Time</label>
            <input type="time" className="d_form_control" {...f('checkOut')} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Record'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
