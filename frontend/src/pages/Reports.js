import React, { useState, useEffect } from 'react';
import { MdBarChart } from 'react-icons/md';
import { reportsApi } from '../utils/api';
import ExportMenu from '../components/ExportMenu';
import { getErrorMessage } from '../utils/errorMessages';

const statusClass = { 'In Stock':'d_success', 'Low Stock':'d_warning', 'Out of Stock':'d_danger', Generated:'d_info', Paid:'d_success', Available:'d_success' };
const monthNumbers = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

const formatReportPeriod = (period, fallbackYear) => {
  const value = String(period || '').trim();
  let year;
  let month;

  const yearMonth = value.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
  const dayMonth = value.match(/^\d{1,2}-([a-z]{3})-?(\d{4})?$/i);
  const monthYear = value.match(/^([a-z]{3,9})\s+(\d{4})$/i);

  if (yearMonth) {
    year = Number(yearMonth[1]);
    month = Number(yearMonth[2]) - 1;
  } else if (dayMonth) {
    month = monthNumbers[dayMonth[1].toLowerCase()];
    year = Number(dayMonth[2] || fallbackYear);
  } else if (monthYear) {
    month = monthNumbers[monthYear[1].slice(0, 3).toLowerCase()];
    year = Number(monthYear[2]);
  }

  if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year)) return value || '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month, 1)));
};

const Reports = ({ defaultTab = 'sales', setActiveMenu }) => {
  const [tab, setTab] = useState(defaultTab);

  // Map tab keys to sidebar menu labels
  const tabToMenuMap = {
    'sales': 'Sales Report',
    'purchase': 'Purchase Report',
    'inventory': 'Inventory Report',
    'payroll': 'Payroll Report',
  };
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
        const inferredYear = report
          .map(row => String((tab === 'payroll' ? row.month : row.period) || '').match(/\b(19|20)\d{2}\b/))
          .find(Boolean)?.[0];
        const fallbackYear = Number(inferredYear || new Date().getFullYear());
        setData(report.map(row => tab === 'payroll'
          ? { ...row, month: formatReportPeriod(row.month, fallbackYear) }
          : { ...row, period: formatReportPeriod(row.period, fallbackYear) }
        ));
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to load report. Please try again.'));
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
        <ExportMenu label="Export Report" filename={`report_${tab}`} data={data} />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="d_tabs mb-3">
        {[['sales','Sales'],['purchase','Purchase'],['inventory','Inventory'],['payroll','Payroll']].map(([k,v]) => (
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={() => {
            setTab(k);
            if (setActiveMenu) {
              setActiveMenu(tabToMenuMap[k]);
            }
          }}>{v}</button>
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
