import React, { useState, useEffect } from 'react';
import { MdBarChart, MdDownload } from 'react-icons/md';
import { reportsApi } from '../utils/api';

const statusClass = { 'In Stock':'d_success', 'Low Stock':'d_warning', 'Out of Stock':'d_danger', Generated:'d_info', Paid:'d_success', Available:'d_success' };

const Reports = ({ defaultTab = 'sales' }) => {
  const [tab, setTab] = useState(defaultTab);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const fn = { sales: reportsApi.sales, purchase: reportsApi.purchase, inventory: reportsApi.inventory, payroll: reportsApi.payroll }[tab];
        const { data: report } = await fn();
        setData(report);
      } catch (err) {
        setError(err.displayMessage || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Reports</h1>
          <p className="d_page_subtitle">View business reports from live data</p>
        </div>
        <button className="d_btn d_btn_outline"><MdDownload /> Export Report</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_tabs mb-3">
        {[['sales','Sales'],['purchase','Purchase'],['inventory','Inventory'],['payroll','Payroll']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => setTab(k)}>{v}</button>
        ))}
      </div>

      {loading ? <div className="text-center py-4">Loading report…</div> : (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBarChart className="d_card_icon" /> {tab.charAt(0).toUpperCase() + tab.slice(1)} Report</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              {tab === 'sales' && (
                <table className="d_table">
                  <thead><tr><th>Period</th><th>Revenue</th><th>Orders</th><th>Customers</th><th>Growth</th></tr></thead>
                  <tbody>
                    {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No data</td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}><td><strong>{r.period}</strong></td><td><strong>{r.revenue}</strong></td><td>{r.orders}</td><td>{r.customers}</td><td><span className="d_badge d_success">{r.growth}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'purchase' && (
                <table className="d_table">
                  <thead><tr><th>Period</th><th>Spend</th><th>Orders</th><th>Suppliers</th><th>Savings</th></tr></thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i}><td><strong>{r.period}</strong></td><td><strong>{r.spend}</strong></td><td>{r.orders}</td><td>{r.suppliers}</td><td>{r.savings}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'inventory' && (
                <table className="d_table">
                  <thead><tr><th>Part</th><th>Stock</th><th>Min Stock</th><th>Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No inventory data</td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}><td><strong>{r.part}</strong></td><td>{r.stock}</td><td>{r.minStock}</td><td>{r.value}</td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === 'payroll' && (
                <table className="d_table">
                  <thead><tr><th>Month</th><th>Employees</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={i}><td><strong>{r.month}</strong></td><td>{r.employees}</td><td>{r.gross}</td><td>{r.deductions}</td><td><strong>{r.net}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]}`}>{r.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
