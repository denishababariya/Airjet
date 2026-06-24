import React, { useState } from 'react';
import { MdPayments, MdAdd, MdEdit, MdDownload } from 'react-icons/md';
import Modal from '../components/Modal';

const initData = [
  { id: 'PAY001', emp: 'Rajesh Kumar',  empId: 'EMP001', month: 'June 2026', basic: 35000, allowances: 8000, deductions: 3500, net: 39500, status: 'Generated' },
  { id: 'PAY002', emp: 'Priya Sharma',  empId: 'EMP002', month: 'June 2026', basic: 30000, allowances: 7000, deductions: 3000, net: 34000, status: 'Generated' },
  { id: 'PAY003', emp: 'Amit Patel',    empId: 'EMP003', month: 'June 2026', basic: 32000, allowances: 7500, deductions: 3200, net: 36300, status: 'Paid' },
  { id: 'PAY004', emp: 'Karan Mehta',   empId: 'EMP005', month: 'June 2026', basic: 28000, allowances: 6000, deductions: 2800, net: 31200, status: 'Pending' },
];

const statusClass = { Generated: 'd_info', Paid: 'd_success', Pending: 'd_warning' };
const blank = { emp: '', empId: '', month: '', basic: '', allowances: '', deductions: '', status: 'Pending' };

const initAllowances = [
  { id: 'ALW001', emp: 'Rajesh Kumar',  empId: 'EMP001', type: 'HRA',           amount: 5000, month: 'Jun 2026', status: 'Active' },
  { id: 'ALW002', emp: 'Priya Sharma',  empId: 'EMP002', type: 'Travel Allow.',  amount: 2000, month: 'Jun 2026', status: 'Active' },
  { id: 'ALW003', emp: 'Karan Mehta',   empId: 'EMP005', type: 'Medical Allow.', amount: 1500, month: 'Jun 2026', status: 'Active' },
  { id: 'ALW004', emp: 'Amit Patel',    empId: 'EMP003', type: 'HRA',           amount: 4800, month: 'Jun 2026', status: 'Active' },
];

const initDeductions = [
  { id: 'DED001', emp: 'Rajesh Kumar',  empId: 'EMP001', type: 'PF',           amount: 2100, month: 'Jun 2026', status: 'Applied' },
  { id: 'DED002', emp: 'Priya Sharma',  empId: 'EMP002', type: 'ESI',          amount: 450,  month: 'Jun 2026', status: 'Applied' },
  { id: 'DED003', emp: 'Karan Mehta',   empId: 'EMP005', type: 'TDS',          amount: 800,  month: 'Jun 2026', status: 'Applied' },
  { id: 'DED004', emp: 'Amit Patel',    empId: 'EMP003', type: 'Professional Tax', amount: 200, month: 'Jun 2026', status: 'Applied' },
];

const initPayslips = [
  { id: 'SLP001', emp: 'Rajesh Kumar', empId: 'EMP001', month: 'Jun 2026', net: '₹39,500', generated: '25-Jun-2026', status: 'Sent' },
  { id: 'SLP002', emp: 'Priya Sharma', empId: 'EMP002', month: 'Jun 2026', net: '₹34,000', generated: '25-Jun-2026', status: 'Sent' },
  { id: 'SLP003', emp: 'Amit Patel',   empId: 'EMP003', month: 'May 2026', net: '₹36,300', generated: '25-May-2026', status: 'Downloaded' },
];

const Payroll = ({ defaultTab = 'salary' }) => {
  const [tab, setTab]       = useState(defaultTab);
  const [data, setData]     = useState(initData);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (rec) => {
    setForm({ emp: rec.emp, empId: rec.empId, month: rec.month, basic: rec.basic, allowances: rec.allowances, deductions: rec.deductions, status: rec.status });
    setEditId(rec.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.emp.trim())   e.emp   = 'Employee name is required';
    if (!form.month.trim()) e.month = 'Salary month is required';
    if (!form.basic)        e.basic = 'Basic salary is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const basic       = parseFloat(form.basic) || 0;
    const allowances  = parseFloat(form.allowances) || 0;
    const deductions  = parseFloat(form.deductions) || 0;
    const net         = basic + allowances - deductions;
    if (editId) {
      setData(d => d.map(r => r.id === editId ? { ...r, ...form, basic, allowances, deductions, net } : r));
    } else {
      const newId = `PAY${String(data.length + 1).padStart(3, '0')}`;
      setData(d => [...d, { id: newId, ...form, basic, allowances, deductions, net }]);
    }
    setModal(false);
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Payroll</h1>
          <p className="d_page_subtitle">Manage salary generation, allowances and deductions</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Generate Salary</button>
      </div>

      <div className="d_tabs mb-3">
        {[['salary','Salary Generation'],['allowances','Allowances'],['deductions','Deductions'],['payslip','Payslip Download']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'salary' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Salary Records</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr><th>Pay ID</th><th>Employee</th><th>Month</th><th>Basic (₹)</th><th>Allowances (₹)</th><th>Deductions (₹)</th><th>Net Pay (₹)</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {data.map(r => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td>
                      <td><strong>{r.emp}</strong></td>
                      <td>{r.month}</td>
                      <td>{r.basic.toLocaleString()}</td>
                      <td>{r.allowances.toLocaleString()}</td>
                      <td>{r.deductions.toLocaleString()}</td>
                      <td><strong>₹{r.net.toLocaleString()}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_edit" onClick={() => openEdit(r)} title="Edit"><MdEdit /></button>
                          <button className="d_icon_btn d_view" title="Download"><MdDownload /></button>
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

      {tab === 'allowances' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Allowances ({initAllowances.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Add Allowance</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Employee</th><th>Emp ID</th><th>Allowance Type</th><th>Amount (₹)</th><th>Month</th><th>Status</th></tr></thead>
                <tbody>
                  {initAllowances.map(a => (
                    <tr key={a.id}>
                      <td><code>{a.id}</code></td><td><strong>{a.emp}</strong></td><td><code>{a.empId}</code></td>
                      <td>{a.type}</td><td><strong>{a.amount.toLocaleString()}</strong></td><td>{a.month}</td>
                      <td><span className="d_badge d_success">{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'deductions' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Deductions ({initDeductions.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Add Deduction</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Employee</th><th>Emp ID</th><th>Deduction Type</th><th>Amount (₹)</th><th>Month</th><th>Status</th></tr></thead>
                <tbody>
                  {initDeductions.map(d => (
                    <tr key={d.id}>
                      <td><code>{d.id}</code></td><td><strong>{d.emp}</strong></td><td><code>{d.empId}</code></td>
                      <td>{d.type}</td><td><strong>{d.amount.toLocaleString()}</strong></td><td>{d.month}</td>
                      <td><span className="d_badge d_warning">{d.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'payslip' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPayments className="d_card_icon" /> Payslips ({initPayslips.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Slip ID</th><th>Employee</th><th>Emp ID</th><th>Month</th><th>Net Pay</th><th>Generated On</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {initPayslips.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td><td><strong>{s.emp}</strong></td><td><code>{s.empId}</code></td>
                      <td>{s.month}</td><td><strong>{s.net}</strong></td><td>{s.generated}</td>
                      <td><span className={`d_badge ${s.status === 'Sent' ? 'd_success' : 'd_info'}`}>{s.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view" title="Download"><MdDownload /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Salary Record' : 'Generate Salary'} size="md">
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
            <label className="d_form_label">Salary Month <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. June 2026" {...f('month')} />
            {errors.month && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.month}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Basic Salary (₹) <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="e.g. 30000" {...f('basic')} />
            {errors.basic && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.basic}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Allowances (₹)</label>
            <input type="number" className="d_form_control" placeholder="e.g. 5000" {...f('allowances')} />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Deductions (₹)</label>
            <input type="number" className="d_form_control" placeholder="e.g. 2000" {...f('deductions')} />
          </div>
        </div>
        <div className="d_form_row cols-1">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Pending</option>
              <option>Generated</option>
              <option>Paid</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Generate Salary'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;
