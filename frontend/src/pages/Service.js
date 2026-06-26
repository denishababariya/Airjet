import React, { useState } from 'react';
import { MdBuildCircle, MdAdd, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import Modal from '../components/Modal';

const initTickets = [
  { id:'SRV-001', customer:'Shree Textile Mills',    machine:'AirJet AT-200', issue:'Nozzle blockage',     engineer:'Divya Verma',  date:'20-Jun-2026', status:'Open' },
  { id:'SRV-002', customer:'National Weaving Works', machine:'AirJet JP-150', issue:'Weft sensor failure', engineer:'Nikhil Rao',   date:'19-Jun-2026', status:'In Progress' },
  { id:'SRV-003', customer:'Modi Fabric Industries', machine:'AirJet AT-300', issue:'Motor overheating',   engineer:'Divya Verma',  date:'18-Jun-2026', status:'Resolved' },
  { id:'SRV-004', customer:'Rajlaxmi Textiles',      machine:'AirJet CM-200', issue:'Cutter blade worn',   engineer:'Unassigned',   date:'17-Jun-2026', status:'Open' },
];

const statusClass = { Open:'d_warning', 'In Progress':'d_info', Resolved:'d_success', Closed:'d_danger' };
const blank = { customer: '', machine: '', issue: '', engineer: '', date: '', status: 'Open', priority: 'Medium' };

const initAssignments = [
  { id:'ASG001', engineer:'Divya Verma',  empId:'EMP006', assigned:2, inProgress:1, resolved:4, expertise:'Nozzle, Valve Systems',    available:'Yes' },
  { id:'ASG002', engineer:'Nikhil Rao',   empId:'EMP007', assigned:1, inProgress:1, resolved:6, expertise:'Sensor, Electrical',        available:'Yes' },
  { id:'ASG003', engineer:'Karan Mehta',  empId:'EMP005', assigned:0, inProgress:0, resolved:3, expertise:'Motor, Bearing',            available:'Yes' },
];
 
const initServiceReports = [
  { id:'SR-001', ticket:'SRV-003', customer:'Modi Fabric Industries', engineer:'Divya Verma',  date:'18-Jun-2026', parts:'Nozzle Set x2',      hours:'4h 30m', cost:'₹3,200', status:'Completed' },
  { id:'SR-002', ticket:'SRV-002', customer:'National Weaving Works', engineer:'Nikhil Rao',   date:'19-Jun-2026', parts:'Weft Sensor x1',     hours:'2h 15m', cost:'₹1,800', status:'In Progress' },
  { id:'SR-003', ticket:'SRV-001', customer:'Shree Textile Mills',    engineer:'Divya Verma',  date:'20-Jun-2026', parts:'Reed Valve x3',      hours:'3h 00m', cost:'₹2,500', status:'Completed' },
];

const Service = ({ defaultTab = 'tickets' }) => {
  const [tab, setTab]       = useState(defaultTab);
  const [data, setData]     = useState(initTickets);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (t) => {
    setForm({ customer: t.customer, machine: t.machine, issue: t.issue, engineer: t.engineer, date: t.date, status: t.status, priority: t.priority || 'Medium' });
    setEditId(t.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.customer.trim()) e.customer = 'Customer is required';
    if (!form.machine.trim())  e.machine  = 'Machine model is required';
    if (!form.issue.trim())    e.issue    = 'Issue description is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (editId) {
      setData(d => d.map(t => t.id === editId ? { ...t, ...form } : t));
    } else {
      const id = `SRV-${String(data.length+1).padStart(3,'0')}`;
      setData(d => [...d, { id, ...form }]);
    }
    setModal(false);
  };

  const handleDelete = (id) => { if (window.confirm('Delete this ticket?')) setData(d => d.filter(t => t.id !== id)); };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const open       = data.filter(t => t.status === 'Open').length;
  const inProgress = data.filter(t => t.status === 'In Progress').length;
  const resolved   = data.filter(t => t.status === 'Resolved').length;

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Management</h1>
          <p className="d_page_subtitle">Manage service tickets, engineer assignments and reports</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> New Ticket</button>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-3">
        {[['Open', open, '#f59e0b'], ['In Progress', inProgress, '#17a2b8'], ['Resolved', resolved, '#28a745']].map(([lbl, val, color]) => (
          <div key={lbl} className="col-6 col-md-4">
            <div className="d_stat_card" style={{ borderLeftColor: color }}>
              <div className="d_stat_value">{val}</div>
              <div className="d_stat_label">{lbl} Tickets</div>
            </div>
          </div>
        ))}
      </div>

      <div className="d_tabs mb-3">
        {[['tickets','Service Tickets'],['assignment','Engineer Assignment'],['reports','Service Reports']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'tickets' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBuildCircle className="d_card_icon" /> Service Tickets ({data.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Ticket ID</th><th>Customer</th><th>Machine</th><th>Issue</th><th>Engineer</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.map(t => (
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td><td><strong>{t.customer}</strong></td><td>{t.machine}</td>
                      <td>{t.issue}</td><td>{t.engineer}</td><td>{t.date}</td>
                      <td><span className={`d_badge ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(t)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(t.id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'assignment' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBuildCircle className="d_card_icon" /> Engineer Assignments ({initAssignments.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Engineer</th><th>Emp ID</th><th>Assigned</th><th>In Progress</th><th>Resolved</th><th>Expertise</th><th>Available</th></tr></thead>
                <tbody>
                  {initAssignments.map(a => (
                    <tr key={a.id}>
                      <td><code>{a.id}</code></td><td><strong>{a.engineer}</strong></td><td><code>{a.empId}</code></td>
                      <td><span className="d_badge d_warning">{a.assigned}</span></td>
                      <td><span className="d_badge d_info">{a.inProgress}</span></td>
                      <td><span className="d_badge d_success">{a.resolved}</span></td>
                      <td>{a.expertise}</td>
                      <td><span className={`d_badge ${a.available === 'Yes' ? 'd_success' : 'd_danger'}`}>{a.available}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBuildCircle className="d_card_icon" /> Service Reports ({initServiceReports.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Report ID</th><th>Ticket</th><th>Customer</th><th>Engineer</th><th>Date</th><th>Parts Used</th><th>Hours</th><th>Cost</th><th>Status</th></tr></thead>
                <tbody>
                  {initServiceReports.map(r => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td><td><code>{r.ticket}</code></td><td><strong>{r.customer}</strong></td>
                      <td>{r.engineer}</td><td>{r.date}</td><td>{r.parts}</td>
                      <td>{r.hours}</td><td><strong>{r.cost}</strong></td>
                      <td><span className={`d_badge ${r.status === 'Completed' ? 'd_success' : 'd_info'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Service Ticket' : 'New Service Ticket'} size="lg">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Customer / Company <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Customer name" {...f('customer')} />
            {errors.customer && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.customer}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Machine Model <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. AirJet AT-200" {...f('machine')} />
            {errors.machine && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.machine}</span>}
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Issue Description <span className="d_req">*</span></label>
            <textarea className="d_form_control" placeholder="Describe the issue in detail…" rows={3} {...f('issue')} />
            {errors.issue && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.issue}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Assigned Engineer</label>
            <input className="d_form_control" placeholder="Engineer name" {...f('engineer')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Date</label>
            <input type="date" className="d_form_control" {...f('date')} />
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Priority</label>
            <select className="d_form_control" {...f('priority')}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Open</option><option>In Progress</option><option>Resolved</option><option>Closed</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update Ticket' : 'Create Ticket'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Service;
