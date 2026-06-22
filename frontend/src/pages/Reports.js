import React, { useState } from 'react';
import { MdBarChart, MdDownload, MdTrendingUp, MdTrendingDown } from 'react-icons/md';

const salesReport = [
  { month:'Jan 2026', orders:42, amount:'₹2,84,500', invoiced:'₹2,70,000', collected:'₹2,70,000', pending:'₹0' },
  { month:'Feb 2026', orders:38, amount:'₹2,54,000', invoiced:'₹2,50,000', collected:'₹2,30,000', pending:'₹20,000' },
  { month:'Mar 2026', orders:55, amount:'₹3,54,000', invoiced:'₹3,50,000', collected:'₹3,50,000', pending:'₹0' },
  { month:'Apr 2026', orders:47, amount:'₹2,98,000', invoiced:'₹2,95,000', collected:'₹2,75,000', pending:'₹20,000' },
  { month:'May 2026', orders:61, amount:'₹3,24,500', invoiced:'₹3,20,000', collected:'₹3,10,000', pending:'₹10,000' },
  { month:'Jun 2026', orders:24, amount:'₹1,24,500', invoiced:'₹1,20,000', collected:'₹1,02,000', pending:'₹18,000' },
];

const reportTypes = [
  ['sales','Sales Report'],['purchase','Purchase Report'],['inventory','Inventory Report'],
  ['employee','Employee Report'],['attendance','Attendance Report'],['payroll','Payroll Report'],['service','Service Report'],
];

const Reports = () => {
  const [tab, setTab] = useState('sales');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Reports</h1>
          <p className="d_page_subtitle">Business intelligence and analytical reports</p>
        </div>
        <button className="d_btn d_btn_accent"><MdDownload /> Export</button>
      </div>

      <div className="d_tabs d_tabs_wrap mb-3">
        {reportTypes.map(([k,v])=>(
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={()=>setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'sales' && (
        <>
          <div className="row g-3 mb-4">
            {[
              { label:'Total Sales (YTD)', value:'₹16,39,500', trend:'up', change:'+18.4%', color:'d_accent' },
              { label:'Total Orders (YTD)', value:'267', trend:'up', change:'+12.1%', color:'d_primary' },
              { label:'Avg Order Value', value:'₹6,141', trend:'up', change:'+5.3%', color:'d_info' },
              { label:'Pending Collections', value:'₹68,000', trend:'down', change:'-2.1%', color:'d_warning' },
            ].map((s,i)=>(
              <div key={i} className="col-6 col-md-3">
                <div className={`d_stat_card ${s.color}`}>
                  <div className="d_stat_value" style={{fontSize:18}}>{s.value}</div>
                  <div className="d_stat_label">{s.label}</div>
                  <div className={`d_stat_change ${s.trend === 'up' ? 'd_up' : 'd_down'}`}>
                    {s.trend === 'up' ? <MdTrendingUp /> : <MdTrendingDown />} {s.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> Monthly Sales Report — 2026</h2>
            </div>
            <div className="d_card_body p-0">
              <div className="d_table_wrap">
                <table className="d_table">
                  <thead><tr><th>Month</th><th>Orders</th><th>Total Amount</th><th>Invoiced</th><th>Collected</th><th>Pending</th></tr></thead>
                  <tbody>
                    {salesReport.map((r,i)=>(
                      <tr key={i}>
                        <td><strong>{r.month}</strong></td><td>{r.orders}</td><td>{r.amount}</td>
                        <td>{r.invoiced}</td><td className="text-success"><strong>{r.collected}</strong></td>
                        <td className={r.pending !== '₹0' ? 'text-danger' : 'text-success'}>{r.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {tab !== 'sales' && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}>📈</div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>
            {reportTypes.find(([k])=>k===tab)?.[1]} — Select filters and date range to generate.
          </p>
          <button className="d_btn d_btn_primary mt-2"><MdDownload /> Generate Report</button>
        </div></div>
      )}
    </div>
  );
};
export default Reports;
