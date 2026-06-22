import React, { useState } from 'react';
import { MdAccountBalance, MdAdd, MdDownload, MdVisibility } from 'react-icons/md';

const receivables = [
  { id:'RCV-001', customer:'Shree Textile Mills',    invoice:'INV-001', amount:'₹24,500', due:'30-Jun-2026', days: 8, status:'Unpaid' },
  { id:'RCV-002', customer:'Modi Fabric Industries', invoice:'INV-003', amount:'₹42,000', due:'25-Jun-2026', days:-3, status:'Overdue' },
  { id:'RCV-003', customer:'National Weaving Works', invoice:'INV-005', amount:'₹18,000', due:'28-Jun-2026', days: 6, status:'Partial' },
];

const payables = [
  { id:'PAY-001', supplier:'Techno Parts Pvt Ltd',  po:'PO-001', amount:'₹1,24,500', due:'28-Jun-2026', days: 6, status:'Unpaid' },
  { id:'PAY-002', supplier:'Global Machinery Co.',  po:'PO-002', amount:'₹87,200',  due:'25-Jun-2026', days:-3, status:'Overdue' },
  { id:'PAY-003', supplier:'Airjet Components Ltd', po:'PO-003', amount:'₹2,10,000',due:'22-Jun-2026', days: 0, status:'Paid' },
];

const gstData = [
  { period:'May 2026', sales:'₹3,24,500', tax18:'₹58,410', tax12:'₹12,400', total:'₹70,810', status:'Filed' },
  { period:'Apr 2026', sales:'₹2,98,000', tax18:'₹53,640', tax12:'₹11,800', total:'₹65,440', status:'Filed' },
  { period:'Mar 2026', sales:'₹3,54,000', tax18:'₹63,720', tax12:'₹14,200', total:'₹77,920', status:'Filed' },
];

const statusClass = { Unpaid:'d_warning', Overdue:'d_danger', Paid:'d_success', Partial:'d_info', Filed:'d_success', Pending:'d_warning' };

const Accounts = () => {
  const [tab, setTab] = useState('receivables');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Accounts & GST</h1>
          <p className="d_page_subtitle">Receivables, payables, ledger, GST reports and P&L</p>
        </div>
        <button className="d_btn d_btn_accent"><MdDownload /> Export Report</button>
      </div>

      <div className="d_tabs mb-3">
        {[['receivables','Receivables'],['payables','Payables'],['ledger','Ledger'],['gst','GST Reports'],['pl','Profit & Loss']].map(([k,v])=>(
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={()=>setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'receivables' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Receivables</h2>
            <span className="d_badge d_danger">Overdue: 1</span>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Ref ID</th><th>Customer</th><th>Invoice No.</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {receivables.map(r=>(
                    <tr key={r.id}>
                      <td><code>{r.id}</code></td><td><strong>{r.customer}</strong></td><td><code>{r.invoice}</code></td>
                      <td><strong>{r.amount}</strong></td><td>{r.due}</td>
                      <td><span className={`d_badge ${r.days < 0 ? 'd_danger' : 'd_success'}`}>{r.days < 0 ? `${Math.abs(r.days)}d overdue` : `${r.days}d left`}</span></td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button></div></td>
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
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> Payables</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Ref ID</th><th>Supplier</th><th>PO Number</th><th>Amount</th><th>Due Date</th><th>Days</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {payables.map(p=>(
                    <tr key={p.id}>
                      <td><code>{p.id}</code></td><td><strong>{p.supplier}</strong></td><td><code>{p.po}</code></td>
                      <td><strong>{p.amount}</strong></td><td>{p.due}</td>
                      <td><span className={`d_badge ${p.days < 0 ? 'd_danger' : p.days === 0 ? 'd_warning' : 'd_success'}`}>{p.days < 0 ? `${Math.abs(p.days)}d overdue` : p.days === 0 ? 'Due today' : `${p.days}d left`}</span></td>
                      <td><span className={`d_badge ${statusClass[p.status]}`}>{p.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button></div></td>
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
            <h2 className="d_card_title"><MdAccountBalance className="d_card_icon" /> GST Reports</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Period</th><th>Total Sales</th><th>GST @18%</th><th>GST @12%</th><th>Total GST</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {gstData.map((g,i)=>(
                    <tr key={i}>
                      <td><strong>{g.period}</strong></td><td>{g.sales}</td><td>{g.tax18}</td><td>{g.tax12}</td>
                      <td><strong>{g.total}</strong></td>
                      <td><span className={`d_badge ${statusClass[g.status]}`}>{g.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdDownload /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(tab === 'ledger' || tab === 'pl') && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}>📊</div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>{tab === 'pl' ? 'Profit & Loss Statement' : 'Ledger'} — Select date range to generate report.</p>
          <button className="d_btn d_btn_primary mt-2"><MdDownload /> Generate Report</button>
        </div></div>
      )}
    </div>
  );
};
export default Accounts;
