import React, { useState, useEffect, useRef } from 'react';
import { MdAssessment, MdFilterList } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import ExportMenu from '../../components/ExportMenu';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function PayrollReports() {
  const [activeTab, setActiveTab] = useState('monthly');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: months[new Date().getMonth()],
    year: new Date().getFullYear()
  });
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReport();
  }, [activeTab, filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        month: filters.month,
        year: filters.year
      };
      
      let res;
      switch (activeTab) {
        case 'monthly':
          res = await payrollApi.getMonthlyReport(params);
          break;
        case 'overtime':
          res = await payrollApi.getOvertimeReport(params);
          break;
        case 'deductions':
          res = await payrollApi.getDeductionReport(params);
          break;
        case 'payments':
          res = await payrollApi.getPaymentReport(params);
          break;
        default:
          res = await payrollApi.getMonthlyReport(params);
      }
      
      setReportData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMonthlyReport = () => (
    <div className="d_table_wrap">
      <table className="d_table" style={{ minWidth: 900 }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Basic (₹)</th>
            <th>Allowances (₹)</th>
            <th>Overtime (₹)</th>
            <th>Gross (₹)</th>
            <th>Deductions (₹)</th>
            <th>Net (₹)</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 && <tr className="d_empty"><td colSpan={8}>No data available</td></tr>}
          {reportData.map((item, idx) => (
            <tr key={idx}>
              <td><strong>{item.employeeName}</strong></td>
              <td>{item.departmentName}</td>
              <td>₹{(item.basicSalary || 0).toLocaleString('en-IN')}</td>
              <td>₹{(item.totalAllowance || 0).toLocaleString('en-IN')}</td>
              <td>₹{(item.overtimeAmount || 0).toLocaleString('en-IN')}</td>
              <td>₹{(item.grossSalary || 0).toLocaleString('en-IN')}</td>
              <td style={{ color: 'var(--d-danger)' }}>₹{(item.totalDeduction || 0).toLocaleString('en-IN')}</td>
              <td><strong>₹{(item.netSalary || 0).toLocaleString('en-IN')}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOvertimeReport = () => (
    <div className="d_table_wrap">
      <table className="d_table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Overtime Hours</th>
            <th>Overtime Rate (₹/hr)</th>
            <th>Overtime Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 && <tr className="d_empty"><td colSpan={5}>No overtime data available</td></tr>}
          {reportData.map((item, idx) => (
            <tr key={idx}>
              <td><strong>{item.employeeName}</strong></td>
              <td>{item.departmentName}</td>
              <td>{item.overtimeHours}</td>
              <td>₹{item.overtimeRate}</td>
              <td><strong>₹{(item.overtimeAmount || 0).toLocaleString('en-IN')}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeductionReport = () => (
    <div className="d_table_wrap">
      <table className="d_table" style={{ minWidth: 800 }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Deduction Type</th>
            <th>Amount (₹)</th>
            <th>Total Deductions (₹)</th>
            <th>Leave Deduction (₹)</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 && <tr className="d_empty"><td colSpan={5}>No deduction data available</td></tr>}
          {reportData.map((item, idx) => {
            const deductionRows = item.deductions && item.deductions.length > 0 ? item.deductions : [{ name: 'No deductions', amount: 0 }];
            const leaveDeductionAmount = (item.deductions || []).reduce((sum, d) => {
              const name = (d.name || '').toLowerCase();
              if (name.includes('leave') || name.includes('absent')) {
                return sum + (Number(d.amount) || 0);
              }
              return sum;
            }, 0);
            return deductionRows.map((d, i) => (
              <tr key={`${idx}-${i}`}>
                {i === 0 && (
                  <td rowSpan={deductionRows.length}><strong>{item.employeeName}</strong></td>
                )}
                <td>{d.name}</td>
                <td>₹{d.amount.toLocaleString('en-IN')}</td>
                {i === 0 && (
                  <>
                    <td rowSpan={deductionRows.length} style={{ color: 'var(--d-danger)' }}><strong>₹{(item.totalDeduction || 0).toLocaleString('en-IN')}</strong></td>
                    <td rowSpan={deductionRows.length}>₹{leaveDeductionAmount.toLocaleString('en-IN')}</td>
                  </>
                )}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );

  const renderPaymentReport = () => (
    <div className="d_table_wrap">
      <table className="d_table" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Salary Month</th>
            <th>Net Salary (₹)</th>
            <th>Payment Date</th>
            <th>Payment Mode</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reportData.length === 0 && <tr className="d_empty"><td colSpan={6}>No payment data available</td></tr>}
          {reportData.map((item, idx) => (
            <tr key={idx}>
              <td><strong>{item.employeeName}</strong></td>
              <td>{item.month}</td>
              <td><strong>₹{(item.netSalary || 0).toLocaleString('en-IN')}</strong></td>
              <td>{item.paymentDate ? new Date(item.paymentDate).toLocaleDateString() : 'N/A'}</td>
              <td>{item.paymentMode || 'N/A'}</td>
              <td><span className="d_badge d_success">{item.paymentStatus}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Payroll Reports</div>
          <div className="d_page_subtitle">View and export payroll reports</div>
        </div>
        <ExportMenu
          label="Export Report"
          filename={`payroll_${activeTab}_${filters.month}_${filters.year}`}
          data={reportData?.length ? { tab: activeTab, ...filters, records: reportData } : null}
          targetRef={reportRef}
        />
      </div>

      {/* Captured for PDF export */}
      <div ref={reportRef}>

      {/* Filters */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdFilterList /></span>Filters</div>
        </div>
        <div className="d_card_body">
          <div className="d_form_row cols-2">
            <div className="d_form_group">
              <label className="d_form_label">Month</label>
              <select 
                className="d_form_control" 
                value={filters.month} 
                onChange={e => setFilters({...filters, month: e.target.value})}
              >
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Year</label>
              <select 
                className="d_form_control" 
                value={filters.year} 
                onChange={e => setFilters({...filters, year: parseInt(e.target.value)})}
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="d_tabs mb-3">
        {[
          ['monthly', 'Monthly Salary Report'],
          ['overtime', 'Overtime Report'],
          ['deductions', 'Deduction Report'],
          ['payments', 'Payment Report']
        ].map(([key, label]) => (
          <button 
            key={key} 
            className={`d_tab_btn ${activeTab === key ? 'd_active' : ''}`} 
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdAssessment /></span>
            {activeTab === 'monthly' && 'Monthly Salary Report'}
            {activeTab === 'overtime' && 'Overtime Report'}
            {activeTab === 'deductions' && 'Deduction Report'}
            {activeTab === 'payments' && 'Payment Report'}
            {' — '}{filters.month} {filters.year}
          </div>
        </div>
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading report...</div>
          ) : (
            <>
              {activeTab === 'monthly' && renderMonthlyReport()}
              {activeTab === 'overtime' && renderOvertimeReport()}
              {activeTab === 'deductions' && renderDeductionReport()}
              {activeTab === 'payments' && renderPaymentReport()}
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
