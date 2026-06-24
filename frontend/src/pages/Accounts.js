import React, { useState } from 'react';
import { MdAccountBalance, MdAdd, MdEdit, MdDelete, MdVisibility } from 'react-icons/md';
import Modal from '../components/Modal';

const initReceivables = [
  { id:'RCV-001', party:'Shree Textile Mills',    type:'Invoice',  amount:24500, dueDate:'30-Jun-2026', status:'Pending' },
  { id:'RCV-002', party:'Modi Fabric Industries', type:'Invoice',  amount:42000, dueDate:'25-Jun-2026', status:'Overdue' },
  { id:'RCV-003', party:'National Weaving Works', type:'Advance',  amount:15000, dueDate:'28-Jun-2026', status:'Received' },
];

const initPayables = [
  { id:'PAY-001', party:'Techno Parts Pvt Ltd',  type:'Purchase Order', amount:124500, dueDate:'28-Jun-2026', status:'Pending' },
  { id:'PAY-002', party:'Global Machinery Co.',   type:'Purchase Order', amount:87200,  dueDate:'25-Jun-2026', status:'Paid' },
];

const statusClass = { Pending:'d_warning', Overdue:'d_danger', Received:'d_success', Paid:'d_success' };
const blank = { party: '', type: 'Invoice', amount: '', dueDate: '', status: 'Pending', notes: '' };

const initLedger = [
  { id:'LED001', date:'20-Jun-2026', party:'Shree Textile Mills',    type:'Sales Invoice',   debit:0,      credit:24500, balance:24500,  narration:'Invoice INV-001' },
  { id:'LED002', date:'18-Jun-2026', party:'Techno Parts Pvt Ltd',   type:'Purchase Payment',debit:87200,  credit:0,     balance:-87200, narration:'Payment for PO-002' },
  { id:'LED003', date:'17-Jun-2026', party:'Modi Fabric Industries',  type:'Sales Invoice',   debit:0,      credit:42000, balance:42000,  narration:'Invoice INV-003' },
  { id:'LED004', date:'15-Jun-2026', party:'Cash',                    type:'Cash Receipt',    debit:15000,  credit:0,     balance:15000,  narration:'Advance from NWW' },
];

const initGST = [
  { id:'GST001', month:'Jun 2026', taxable:'₹3,24,500', cgst:'₹29,205', sgst:'₹29,205', igst:'₹0',     total:'₹58,410', status:'Filed' },
  { id:'GST002', month:'May 2026', taxable:'₹2,88,200', cgst:'₹25,938', sgst:'₹25,938', igst:'₹0',     total:'₹51,876', status:'Filed' },
  { id:'GST003', month:'Apr 2026', taxable:'₹2,67,000', cgst:'₹24,030', sgst:'₹24,030', igst:'₹5,400', total:'₹53,460', status:'Pending' },
];

const initPL = [
  { id:'PL001', category:'Revenue',  item:'Sales',           jun:'₹3,24,500', may:'₹2,88,200', apr:'₹2,67,000' },
  { id:'PL002', category:'Expense',  item:'Purchase Cost',   jun:'₹2,11,700', may:'₹1,87,400', apr:'₹1,74,000' },
  { id:'PL003', category:'Expense',  item:'Salaries',        jun:'₹1,67,800', may:'₹1,67,800', apr:'₹1,67,800' },
  { id:'PL004', category:'Expense',  item:'Overheads',       jun:'₹18,500',   may:'₹16,200',   apr:'₹15,800' },
  { id:'PL005', category:'Profit',   item:'Net Profit/Loss', jun:'₹-73,500',  may:'₹16,800',   apr:'₹9,400' },
];

const Accounts = ({ defaultTab = 'receivables' }) => {
  const [tab, setTab]                     = useState(defaultTab);
  const [receivables, setReceivables]     = useState(initReceivables);
  const [payables, setPayables]           = useState(initPayables);
  const [modal, setModal]                 = useState(false);
  const [form, setForm]                   = useState(blank);
  const [editId, setEditId]               = useState(null);
  const [errors, setErrors]               = useState({});

  const isRcv = tab === 'receivables';

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (row) => {
    setForm({ party: row.party, type: row.type, amount: row.amount, dueDate: row.dueDate, status: row.status, notes: row.notes || '' });
    setEditId(row.id); setErrors({}); setModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.party.trim())   e.party  = 'Party name is required';
    if (!form.amount)         e.amount = 'Amount is required';
    if (!form.dueDate.trim()) e.due    = 'Due date is required';
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const amount = parseFloat(form.amount) || 0;
    if (isRcv) {
      if (editId) setReceivables(d => d.map(r => r.id === editId ? { ...r, ...form, amount } : r));
      else { const id = `RCV-${String(receivables.length+1).padStart(3,'0')}`; setReceivables(d => [...d, { id, ...form, amount }]); }
    } else {
      if (editId) setPayables(d => d.map(p => p.id === editId ? { ...p, ...form, amount } : p));
      else { const id = `PAY-${String(payables.length+1).padStart(3,'0')}`; setPayables(d => [...d, { id, ...form, amount }]); }
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this record?')) return;
    if (isRcv) setReceivables(d => d.filter(r => r.id !== id));
    else       setPayables(d => d.filter(p => p.id !== id));
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const totalRcv = receivables.reduce((s, r) => s + r.amount, 0);
  const totalPay = payables.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Accounts & GST</h1>
          <p className="d_page_subtitle">Manage receivables, payables, ledger and GST reports</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Entry</button>
      </div>

      {/* Summary */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="d_stat_card" style={{ borderLeftColor: 'var(--d-success)' }}>
            <div className="d_stat_value">₹{totalRcv.toLocaleString()}</div>
            <div className="d_stat_label">Total Receivables</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="d_stat_card" style={{ borderLeftColor: 'var(--d-danger)' }}>
            <div className="d_stat_value">₹{totalPay.toLocaleString()}</div>
            <div className="d_stat_label">Total Payables</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="d_stat_card" style={{ borderLeftColor: 'var(--d-accent)' }}>
            <div className="d_stat_value">₹{Math.abs(totalRcv - totalPay).toLocaleString()}</div>
            <div className="d_stat_label">Net {totalRcv >= totalPay ? 'Receivable' : 'Payable'}</div>
          </div>
        </div>
      </div>

      <div className="d_tabs mb-3">
        {[['receivables','Receivables'],['payables','Payables'],['ledger','Ledger'],['gst','GST Reports'],['pl','Profit & Loss']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'receivables' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Receivables ({receivables.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Party</th><th>Type</th><th>Amount (₹)</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {receivables.map(r => (
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td><td><strong>{r.party}</strong></td><td>{r.type}</td>
                      <td><strong>₹{r.amount.toLocaleString()}</strong></td><td>{r.dueDate}</td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(r)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(r.id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'payables' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Payables ({payables.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Party</th><th>Type</th><th>Amount (₹)</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {payables.map(p => (
                    <tr key={p.id}>
                      <td><code>{p.id}</code></td><td><strong>{p.party}</strong></td><td>{p.type}</td>
                      <td><strong>₹{p.amount.toLocaleString()}</strong></td><td>{p.dueDate}</td>
                      <td><span className={`d_badge ${statusClass[p.status]}`}>{p.status}</span></td>
                      <td><div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(p)}><MdEdit /></button>
                        <button className="d_icon_btn d_del"  onClick={() => handleDelete(p.id)}><MdDelete /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'ledger' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Ledger ({initLedger.length})</h2>
            <button className="d_btn d_btn_primary d_btn_sm" onClick={openAdd}><MdAdd /> Add Entry</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Date</th><th>Party</th><th>Type</th><th>Debit (₹)</th><th>Credit (₹)</th><th>Balance (₹)</th><th>Narration</th></tr></thead>
                <tbody>
                  {initLedger.map(l => (
                    <tr key={l.id}>
                      <td><code>{l.id}</code></td><td>{l.date}</td><td><strong>{l.party}</strong></td><td>{l.type}</td>
                      <td>{l.debit > 0 ? <span style={{color:'var(--d-danger)'}}>{l.debit.toLocaleString()}</span> : '--'}</td>
                      <td>{l.credit > 0 ? <span style={{color:'var(--d-success)'}}>{l.credit.toLocaleString()}</span> : '--'}</td>
                      <td><strong style={{color: l.balance >= 0 ? 'var(--d-success)' : 'var(--d-danger)'}}>{Math.abs(l.balance).toLocaleString()}</strong></td>
                      <td>{l.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'gst' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> GST Reports ({initGST.length})</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>ID</th><th>Month</th><th>Taxable Amount</th><th>CGST</th><th>SGST</th><th>IGST</th><th>Total Tax</th><th>Status</th></tr></thead>
                <tbody>
                  {initGST.map(g => (
                    <tr key={g.id}>
                      <td><code>{g.id}</code></td><td><strong>{g.month}</strong></td><td>{g.taxable}</td>
                      <td>{g.cgst}</td><td>{g.sgst}</td><td>{g.igst}</td><td><strong>{g.total}</strong></td>
                      <td><span className={`d_badge ${g.status === 'Filed' ? 'd_success' : 'd_warning'}`}>{g.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'pl' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Profit & Loss Statement</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Category</th><th>Item</th><th>Jun 2026</th><th>May 2026</th><th>Apr 2026</th></tr></thead>
                <tbody>
                  {initPL.map(p => (
                    <tr key={p.id} style={p.category === 'Profit' ? {fontWeight:700, background:'#f0f9ff'} : {}}>
                      <td><span className={`d_badge ${p.category === 'Revenue' ? 'd_success' : p.category === 'Profit' ? 'd_info' : 'd_danger'}`}>{p.category}</span></td>
                      <td><strong>{p.item}</strong></td>
                      <td>{p.jun}</td><td>{p.may}</td><td>{p.apr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Entry' : `Add ${isRcv ? 'Receivable' : 'Payable'}`} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Party Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="Customer / Supplier name" {...f('party')} />
            {errors.party && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.party}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Transaction Type</label>
            <select className="d_form_control" {...f('type')}>
              <option>Invoice</option><option>Purchase Order</option><option>Advance</option><option>Credit Note</option><option>Debit Note</option>
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Amount (₹) <span className="d_req">*</span></label>
            <input type="number" className="d_form_control" placeholder="e.g. 25000" {...f('amount')} />
            {errors.amount && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.amount}</span>}
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Due Date <span className="d_req">*</span></label>
            <input type="date" className="d_form_control" {...f('dueDate')} />
            {errors.due && <span style={{ color: 'var(--d-danger)', fontSize: 12 }}>{errors.due}</span>}
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Pending</option><option>{isRcv ? 'Received' : 'Paid'}</option><option>Overdue</option>
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Notes</label>
            <input className="d_form_control" placeholder="Optional notes" {...f('notes')} />
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save Entry'}</button>
        </div>
      </Modal>
    </div>
  );
};

export default Accounts;
