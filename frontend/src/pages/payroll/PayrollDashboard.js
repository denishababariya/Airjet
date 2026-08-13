import React, { useState, useEffect } from 'react';
import { MdPeople, MdMonetizationOn, MdCheckCircle, MdPendingActions, MdTrendingUp, MdAccountBalanceWallet, MdAttachMoney, MdSchedule } from 'react-icons/md';
import { payrollApi } from '../../utils/api';

const statusClass = { Draft:'d_info', Generated:'d_primary', Approved:'d_success', Paid:'d_success', Cancelled:'d_danger' };

export default function PayrollDashboard() {
  const [stats, setStats] = useState(null);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedMonth) params.month = selectedMonth;
      if (selectedYear) params.year = selectedYear;

      const [statsRes, monthlyRes, deptRes] = await Promise.all([
        payrollApi.getDashboardStats(params),
        payrollApi.getMonthlySummary({ year: selectedYear }),
        payrollApi.getDepartmentSummary(params)
      ]);

      setStats(statsRes.data);
      setMonthlySummary(monthlyRes.data);
      setDepartmentSummary(deptRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, prefix = '₹' }) => (
    <div className="d_card">
      <div className="d_card_header">
        <div className="d_card_title">
          <span className="d_card_icon" style={{ color }}>
            <Icon />
          </span>
          {title}
        </div>
      </div>
      <div className="d_card_body" style={{ fontSize: '1.8rem', fontWeight: 700, color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-4">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Payroll Dashboard</div>
          <div className="d_page_subtitle">Overview of salary and payroll management</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select 
            className="d_btn d_btn_outline" 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            className="d_btn d_btn_outline" 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={MdPeople} title="Total Employees" value={stats?.totalEmployees || 0} color="var(--d-primary)" prefix="" />
        <StatCard icon={MdPeople} title="Active Employees" value={stats?.activeEmployees || 0} color="var(--d-success)" prefix="" />
        <StatCard icon={MdMonetizationOn} title="Gross Salary" value={stats?.grossSalary || 0} color="var(--d-primary)" />
        <StatCard icon={MdAccountBalanceWallet} title="Net Salary" value={stats?.netSalary || 0} color="var(--d-success)" />
        <StatCard icon={MdTrendingUp} title="Total Allowances" value={stats?.totalAllowances || 0} color="var(--d-info)" />
        <StatCard icon={MdAttachMoney} title="Total Deductions" value={stats?.totalDeductions || 0} color="var(--d-danger)" />
        <StatCard icon={MdSchedule} title="Total Overtime" value={stats?.totalOvertime || 0} color="var(--d-warning)" />
        <StatCard icon={MdPendingActions} title="Pending Salary" value={stats?.pendingSalary || 0} color="var(--d-warning)" />
        <StatCard icon={MdCheckCircle} title="Paid Salary" value={stats?.paidSalary || 0} color="var(--d-success)" />
      </div>

      {/* Monthly Payroll Summary */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Monthly Payroll Summary - {selectedYear}</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Employees</th>
                  <th>Gross Salary</th>
                  <th>Allowances</th>
                  <th>Overtime</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Paid Amount</th>
                  <th>Pending Amount</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.length === 0 && <tr className="d_empty"><td colSpan={9}>No data available</td></tr>}
                {monthlySummary.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item._id.month} {item._id.year}</strong></td>
                    <td>{item.totalEmployees}</td>
                    <td>₹{item.grossSalary.toLocaleString('en-IN')}</td>
                    <td>₹{item.totalAllowance.toLocaleString('en-IN')}</td>
                    <td>₹{item.totalOvertime.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-danger)' }}>₹{item.totalDeduction.toLocaleString('en-IN')}</td>
                    <td><strong>₹{item.netSalary.toLocaleString('en-IN')}</strong></td>
                    <td style={{ color: 'var(--d-success)' }}>₹{item.paidAmount.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-warning)' }}>₹{item.pendingAmount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Department-wise Salary Summary */}
      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Department-wise Salary Summary</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employee Count</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Overtime</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {departmentSummary.length === 0 && <tr className="d_empty"><td colSpan={7}>No data available</td></tr>}
                {departmentSummary.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.departmentName || item.department?.title || 'Unassigned'}</strong></td>
                    <td>{item.employeeCount}</td>
                    <td>₹{item.basicSalary.toLocaleString('en-IN')}</td>
                    <td>₹{item.totalAllowance.toLocaleString('en-IN')}</td>
                    <td>₹{item.totalOvertime.toLocaleString('en-IN')}</td>
                    <td style={{ color: 'var(--d-danger)' }}>₹{item.totalDeduction.toLocaleString('en-IN')}</td>
                    <td><strong>₹{item.netSalary.toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
