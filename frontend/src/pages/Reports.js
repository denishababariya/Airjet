import React, { useState } from 'react';
import { MdBarChart, MdDownload, MdSearch, MdFilterAlt } from 'react-icons/md';

const reportData = {
  sales: [
    { period:'Jun 2026', revenue:'₹3,24,500', orders:48, customers:12, growth:'+12.4%' },
    { period:'May 2026', revenue:'₹2,88,200', orders:41, customers:10, growth:'+8.1%' },
    { period:'Apr 2026', revenue:'₹2,67,000', orders:37, customers:9,  growth:'+5.3%' },
  ],
  purchase: [
    { period:'Jun 2026', spend:'₹2,11,700', orders:22, suppliers:4, savings:'₹8,200' },
    { period:'May 2026', spend:'₹1,87,400', orders:18, suppliers:4, savings:'₹5,600' },
    { period:'Apr 2026', spend:'₹1,74,000', orders:15, suppliers:3, savings:'₹4,100' },
  ],
  inventory: [
    { part:'Reed Valve Assembly',  stock:142, minStock:20, value:'₹71,000', status:'In Stock' },
    { part:'Air Jet Nozzle Set',   stock:8,   minStock:15, value:'₹6,800',  status:'Low Stock' },
    { part:'Selvage Cutter Blade', stock:0,   minStock:30, value:'₹0',      status:'Out of Stock' },
    { part:'Main Shaft Bearing',   stock:84,  minStock:25, value:'₹2,10,000', status:'In Stock' },
    { part:'Weft Detector Sensor', stock:97,  minStock:10, value:'₹1,16,400', status:'In Stock' },
  ],
  payroll: [
    { month:'Jun 2026', employees:38, gross:'₹18,42,000', deductions:'₹1,64,000', net:'₹16,78,000', status:'Generated' },
    { month:'May 2026', employees:38, gross:'₹18,42,000', deductions:'₹1,64,000', net:'₹16,78,000', status:'Paid' },
    { month:'Apr 2026', employees:36, gross:'₹17,28,000', deductions:'₹1,54,800', net:'₹15,73,200', status:'Paid' },
  ],
};

const statusClass = { 'In Stock':'d_success', 'Low Stock':'d_warning', 'Out of Stock':'d_danger', Generated:'d_info', Paid:'d_success' };

const Reports = ({ defaultTab = 'sales' }) => {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Reports</h1>
          <p className="d_page_subtitle">View and export business reports</p>
        </div>
        <button className="d_btn d_btn_outline"><MdDownload /> Export Report</button>
      </div>

      <div className="d_tabs mb-3">
        {[['sales','Sales'],['purchase','Purchase'],['inventory','Inventory'],['payroll','Payroll']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'sales' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> Sales Report</h2>
            <button className="d_btn d_btn_outline d_btn_sm"><MdDownload /> Export</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Period</th><th>Revenue</th><th>Orders</th><th>Customers</th><th>Growth</th></tr></thead>
                <tbody>
                  {reportData.sales.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.period}</strong></td>
                      <td><strong>{r.revenue}</strong></td>
                      <td>{r.orders}</td>
                      <td>{r.customers}</td>
                      <td><span className="d_badge d_success">{r.growth}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'purchase' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> Purchase Report</h2>
            <button className="d_btn d_btn_outline d_btn_sm"><MdDownload /> Export</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Period</th><th>Total Spend</th><th>Orders</th><th>Suppliers</th><th>Savings</th></tr></thead>
                <tbody>
                  {reportData.purchase.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.period}</strong></td>
                      <td><strong>{r.spend}</strong></td>
                      <td>{r.orders}</td>
                      <td>{r.suppliers}</td>
                      <td><span className="d_badge d_success">{r.savings}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> Inventory Report</h2>
            <button className="d_btn d_btn_outline d_btn_sm"><MdDownload /> Export</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Part Name</th><th>Stock</th><th>Min Stock</th><th>Value</th><th>Status</th></tr></thead>
                <tbody>
                  {reportData.inventory.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.part}</strong></td>
                      <td>{r.stock}</td>
                      <td>{r.minStock}</td>
                      <td><strong>{r.value}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'payroll' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> Payroll Report</h2>
            <button className="d_btn d_btn_outline d_btn_sm"><MdDownload /> Export</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Month</th><th>Employees</th><th>Gross Pay</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead>
                <tbody>
                  {reportData.payroll.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.month}</strong></td>
                      <td>{r.employees}</td>
                      <td>{r.gross}</td>
                      <td>{r.deductions}</td>
                      <td><strong>{r.net}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
