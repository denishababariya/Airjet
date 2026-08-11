import React, { useState, useEffect } from 'react';
import { MdPayments, MdAdd, MdEdit, MdDelete, MdDownload } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { useErpRecords } from '../utils/useErpRecords';
import { employeesApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const statusClass = { Generated:'d_info', Paid:'d_success', Pending:'d_warning', Active:'d_success', Applied:'d_warning', Sent:'d_success', Downloaded:'d_info' };
const TAB_TYPE = { salary:'salary', allowances:'allowance', deductions:'deduction', payslip:'payslip' };

const blankSalary     = { emp:'', empId:'', month:'', basic:'', allowances:'', deductions:'', status:'Pending' };
const blankAllowance  = { emp:'', empId:'', type:'HRA', amount:'', month:'', status:'Active' };
const blankDeduction  = { emp:'', empId:'', type:'PF',  amount:'', month:'', status:'Applied' };
const blankPayslip    = { emp:'', empId:'', month:'', net:'', generated:'', status:'Sent' };

/* Month format e.g. "Jun 2026" */
const MONTH_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i;

const Payroll = ({ defaultTab = 'salary' }) => {
  const [tab, setTab]         = useState(defaultTab);
  const recordType            = TAB_TYPE[tab];
  const { data, loading, setError: setErrCtx, save, remove } = useErpRecords('payroll', recordType);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(blankSalary);
  const [editId, setEditId]   = useState(null);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);

  const { toasts, toast, removeToast }         = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => { employeesApi.getAll().then(r => setEmployees(r.data)).catch(() => {}); }, []);

  const getBlank = () => ({ salary: blankSalary, allowances: blankAllowance, deductions: blankDeduction, payslip: blankPayslip }[tab] || blankSalary);

  const openAdd  = () => { setForm(getBlank()); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (rec) => {
    setForm({ ...getBlank(), ...rec, basic: rec.basic??'', allowances: rec.allowances??'', deductions: rec.deductions??'', amount: rec.amount??'', net: rec.net??'' });
    setEditId(rec._id); setErrors({}); setModal(true);
  };

  const onEmpSelect = (id) => {
    const emp = employees.find(e => e._id === id);
    if (emp) setForm(p => ({ ...p, emp: emp.name, empId: emp.id || emp._id }));
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });
  const Err = ({ field }) => errors[field] ? <span className="d_field_error">{errors[field]}</span> : null;

  const doValidate = () => {
    const base = { emp: V.name(form.emp, 'Employee name') };
    if (tab === 'salary') return validate({
      ...base,
      month:       form.month ? (MONTH_RE.test(form.month.trim()) ? '' : 'Month must be like "Jun 2026"') : 'Month is required',
      basic:       V.amount(form.basic, 'Basic salary'),
      allowances:  form.allowances ? V.optionalAmount(form.allowances, 'Allowances') : '',
      deductions:  form.deductions ? V.optionalAmount(form.deductions, 'Deductions') : '',
    });
    if (tab === 'allowances' || tab === 'deductions') return validate({
      ...base,
      amount: V.amount(form.amount, 'Amount'),
      month:  form.month ? (MONTH_RE.test(form.month.trim()) ? '' : 'Month must be like "Jun 2026"') : 'Month is required',
    });
    if (tab === 'payslip') return validate({
      ...base,
      month: form.month ? (MONTH_RE.test(form.month.trim()) ? '' : 'Month must be like "Jun 2026"') : 'Month is required',
      net:   V.amount(form.net, 'Net pay'),
    });
    return validate(base);
  };

  const handleSave = async () => {
    const e = doValidate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (tab === 'salary') {
        payload.basic       = Number(form.basic)       || 0;
        payload.allowances  = Number(form.allowances)  || 0;
        payload.deductions  = Number(form.deductions)  || 0;
        payload.net         = payload.basic + payload.allowances - payload.deductions;
      } else if (tab === 'allowances' || tab === 'deductions') {
        payload.amount = Number(form.amount) || 0;
      } else {
        payload.net = Number(form.net) || 0;
      }
      await save(payload, editId);
      setModal(false);
      toast.success(editId ? 'Record updated!' : 'Record saved!');
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete Record', message: 'Delete this payroll record? This cannot be undone.',
      confirmLabel: 'Delete', variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try { await remove(id); toast.success('Record deleted.'); }
        catch (err) { toast.error(err.displayMessage || 'Failed to delete'); }
      },
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div><h1 className="d_page_title">Payroll</h1><p className="d_page_subtitle">Manage salary generation, allowances and deductions</p></div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> {tab === 'salary' ? 'Generate Salary' : 'Add Record'}</button>
      </div>

      <div className="d_tabs mb-3">
        {[['salary','Salary Generation'],['allowances','Allowances'],['deductions','Deductions'],['payslip','Payslip Download']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-4">Loading…</div> : (<>
        {tab === 'salary' && (
          <div className="d_card">
            <div className="d_card_header"><h2 className="d_card_title"><MdPayments className="d_card_icon" /> Salary Records ({data.length})</h2></div>
            <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Pay ID</th><th>Employee</th><th>Month</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={9}>No salary records.</td></tr>}
                {data.map(r => (
                  <tr key={r._id}>
                    <td><code>{r.id}</code></td><td><strong>{r.emp}</strong></td><td>{r.month}</td>
                    <td>₹{(r.basic||0).toLocaleString('en-IN')}</td><td>₹{(r.allowances||0).toLocaleString('en-IN')}</td>
                    <td>₹{(r.deductions||0).toLocaleString('en-IN')}</td><td><strong>₹{(r.net||0).toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${statusClass[r.status]||'d_info'}`}>{r.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(r._id)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          </div>
        )}

        {tab === 'allowances' && (
          <div className="d_card">
            <div className="d_card_header"><h2 className="d_card_title"><MdPayments className="d_card_icon" /> Allowances ({data.length})</h2></div>
            <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>Amount</th><th>Month</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={7}>No allowances.</td></tr>}
                {data.map(a => (
                  <tr key={a._id}>
                    <td><code>{a.id}</code></td><td><strong>{a.emp}</strong></td><td>{a.type}</td>
                    <td>₹{(a.amount||0).toLocaleString('en-IN')}</td><td>{a.month}</td>
                    <td><span className="d_badge d_success">{a.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(a)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(a._id)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          </div>
        )}

        {tab === 'deductions' && (
          <div className="d_card">
            <div className="d_card_header"><h2 className="d_card_title"><MdPayments className="d_card_icon" /> Deductions ({data.length})</h2></div>
            <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>ID</th><th>Employee</th><th>Type</th><th>Amount</th><th>Month</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={7}>No deductions.</td></tr>}
                {data.map(d => (
                  <tr key={d._id}>
                    <td><code>{d.id}</code></td><td><strong>{d.emp}</strong></td><td>{d.type}</td>
                    <td>₹{(d.amount||0).toLocaleString('en-IN')}</td><td>{d.month}</td>
                    <td><span className="d_badge d_warning">{d.status}</span></td>
                    <td><div className="d_action_btns">
                      <button className="d_icon_btn d_edit" onClick={() => openEdit(d)}><MdEdit /></button>
                      <button className="d_icon_btn d_del"  onClick={() => handleDelete(d._id)}><MdDelete /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          </div>
        )}

        {tab === 'payslip' && (
          <div className="d_card">
            <div className="d_card_header"><h2 className="d_card_title"><MdPayments className="d_card_icon" /> Payslips ({data.length})</h2></div>
            <div className="d_card_body p-0"><div className="d_table_wrap"><table className="d_table">
              <thead><tr><th>Slip ID</th><th>Employee</th><th>Month</th><th>Net Pay</th><th>Generated</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={7}>No payslips.</td></tr>}
                {data.map(s => (
                  <tr key={s._id}>
                    <td><code>{s.id}</code></td><td><strong>{s.emp}</strong></td><td>{s.month}</td>
                    <td><strong>₹{(s.net||0).toLocaleString('en-IN')}</strong></td><td>{s.generated}</td>
                    <td><span className={`d_badge ${statusClass[s.status]||'d_info'}`}>{s.status}</span></td>
                    <td><button className="d_icon_btn d_view" title="Download"><MdDownload /></button></td>
                  </tr>
                ))}
              </tbody>
            </table></div></div>
          </div>
        )}
      </>)}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Record' : 'Add Record'} size="md">
        <div className="d_form_group mb-3">
          <label className="d_form_label">Select Employee</label>
          <select className="d_form_control" onChange={e => onEmpSelect(e.target.value)} defaultValue="">
            <option value="">— Select to auto-fill —</option>
            {employees.map(e => <option key={e._id} value={e._id}>{String(e.name)}</option>)}
          </select>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Employee Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Auto-filled from selection" {...f('emp')} />
            <Err field="emp" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Emp ID</label>
            <input className="d_form_control" readOnly {...f('empId')} />
          </div>
        </div>

        {tab === 'salary' && (<>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Month <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Jun 2026" {...f('month')} /><Err field="month" /></div>
            <div className="d_form_group"><label className="d_form_label">Basic Salary (₹) <span className="d_req">*</span></label><input type="number" className="d_form_control" min={0} placeholder="e.g. 25000" {...f('basic')} /><Err field="basic" /></div>
          </div>
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Allowances (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 5000" {...f('allowances')} /><Err field="allowances" /></div>
            <div className="d_form_group"><label className="d_form_label">Deductions (₹)</label><input type="number" className="d_form_control" min={0} placeholder="e.g. 2000" {...f('deductions')} /><Err field="deductions" /></div>
          </div>
          <div className="d_form_group mb-3"><label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}><option>Pending</option><option>Generated</option><option>Paid</option></select>
          </div>
        </>)}

        {(tab === 'allowances' || tab === 'deductions') && (
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Type</label><input className="d_form_control" placeholder="e.g. HRA / PF" {...f('type')} /></div>
            <div className="d_form_group"><label className="d_form_label">Amount (₹) <span className="d_req">*</span></label><input type="number" className="d_form_control" min={0} placeholder="e.g. 3000" {...f('amount')} /><Err field="amount" /></div>
            <div className="d_form_group"><label className="d_form_label">Month <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Jun 2026" {...f('month')} /><Err field="month" /></div>
          </div>
        )}

        {tab === 'payslip' && (
          <div className="d_form_row cols-2">
            <div className="d_form_group"><label className="d_form_label">Month <span className="d_req">*</span></label><input className="d_form_control" placeholder="e.g. Jun 2026" {...f('month')} /><Err field="month" /></div>
            <div className="d_form_group"><label className="d_form_label">Net Pay (₹) <span className="d_req">*</span></label><input type="number" className="d_form_control" min={0} placeholder="e.g. 28000" {...f('net')} /><Err field="net" /></div>
            <div className="d_form_group"><label className="d_form_label">Generated On</label><input type="date" className="d_form_control" {...f('generated')} /></div>
          </div>
        )}

        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;
