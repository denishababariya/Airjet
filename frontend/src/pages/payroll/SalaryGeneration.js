import React, { useState, useEffect } from 'react';
import { MdVisibility, MdDownload, MdPeople, MdMonetizationOn, MdCheckCircle, MdPendingActions, MdRefresh, MdFilterList } from 'react-icons/md';
import { payrollApi, employeesApi, departmentsApi, designationsApi } from '../../utils/api';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const statusClass = { Draft:'d_info', Generated:'d_primary', Approved:'d_success', Paid:'d_success', Cancelled:'d_danger' };
const paymentStatusClass = { Pending:'d_warning', Paid:'d_success', Failed:'d_danger' };

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SalaryGeneration({ onViewSalary, onEditSalary, onDownloadPayslip }) {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    month: months[new Date().getMonth()],
    year: new Date().getFullYear(),
    department: '',
    employee: '',
    designation: '',
    status: '',
    paymentStatus: ''
  });

  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchDesignations();
  }, []);

  useEffect(() => {
    if (filters.month && filters.year) {
      fetchSalaries();
    }
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const res = await employeesApi.getAll();
      setEmployees(res.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentsApi.getAll();
      setDepartments(res.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDesignations = async () => {
    try {
      const res = await designationsApi.getAll();
      setDesignations(res.data);
    } catch (error) {
      console.error('Error fetching designations:', error);
    }
  };

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = {
        month: `${filters.month} ${filters.year}`,
        year: filters.year
      };
      if (filters.department) params.department = filters.department;
      if (filters.employee) params.employee = filters.employee;
      if (filters.designation) params.designation = filters.designation;
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

      const res = await payrollApi.getAll(params);
      setSalaries(res.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAll = async () => {
    confirm({
      title: 'Generate All Salaries',
      message: `Generate salaries for all active employees for ${filters.month} ${filters.year}?`,
      confirmLabel: 'Generate',
      variant: 'primary',
      onConfirm: async () => {
        closeConfirm();
        setGenerating(true);
        try {
          const res = await payrollApi.generateAll({
            month: filters.month,
            year: filters.year,
            department: filters.department || undefined,
            overtimeRate: 150
          });
          toast.success(`Generated ${res.data.results.length} salaries`);
          if (res.data.errors.length > 0) {
            toast.warning(`${res.data.errors.length} errors occurred`);
          }
          fetchSalaries();
        } catch (error) {
          toast.error(error.displayMessage || 'Failed to generate salaries');
        } finally {
          setGenerating(false);
        }
      }
    });
  };

  const handleReset = () => {
    setFilters({
      month: months[new Date().getMonth()],
      year: new Date().getFullYear(),
      department: '',
      employee: '',
      designation: '',
      status: '',
      paymentStatus: ''
    });
  };

  const totalPayable = salaries.reduce((s, r) => s + (r.netSalary || 0), 0);
  const paid = salaries.filter(r => r.paymentStatus === 'Paid').reduce((s, r) => s + (r.netSalary || 0), 0);
  const pending = salaries.filter(r => r.paymentStatus === 'Pending').reduce((s, r) => s + (r.netSalary || 0), 0);

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Salary Generation</div>
          <div className="d_page_subtitle">Generate and manage monthly salary for all employees</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="d_btn d_btn_outline" onClick={handleReset} disabled={loading}>
            <MdRefresh /> Reset
          </button>
          <button 
            className="d_btn d_btn_primary" 
            onClick={handleGenerateAll} 
            disabled={generating || loading}
          >
            {generating ? 'Generating...' : <><MdCheckCircle /> Generate All Salaries</>}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdFilterList /></span>Filters</div>
        </div>
        <div className="d_card_body">
          <div className="d_form_row cols-4">
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
            <div className="d_form_group">
              <label className="d_form_label">Department</label>
              <select 
                className="d_form_control" 
                value={filters.department} 
                onChange={e => setFilters({...filters, department: e.target.value})}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Designation</label>
              <select 
                className="d_form_control" 
                value={filters.designation} 
                onChange={e => setFilters({...filters, designation: e.target.value})}
              >
                <option value="">All Designations</option>
                {designations.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div className="d_form_row cols-3">
            <div className="d_form_group">
              <label className="d_form_label">Employee</label>
              <select 
                className="d_form_control" 
                value={filters.employee} 
                onChange={e => setFilters({...filters, employee: e.target.value})}
              >
                <option value="">All Employees</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Salary Status</label>
              <select 
                className="d_form_control" 
                value={filters.status} 
                onChange={e => setFilters({...filters, status: e.target.value})}
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Generated">Generated</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Payment Status</label>
              <select 
                className="d_form_control" 
                value={filters.paymentStatus} 
                onChange={e => setFilters({...filters, paymentStatus: e.target.value})}
              >
                <option value="">All Payment Status</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Total Employees</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700 }}>{salaries.length}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Total Payable</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalPayable.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdCheckCircle /></span>Paid</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{paid.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdPendingActions /></span>Pending</div></div>
          <div className="d_card_body" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--d-warning)' }}>₹{pending.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Salary Sheet — {filters.month} {filters.year}</div>
        </div>
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Basic (₹)</th>
                    <th>Allowances (₹)</th>
                    <th>Overtime (₹)</th>
                    <th>Deductions (₹)</th>
                    <th>Net Salary (₹)</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.length === 0 && <tr className="d_empty"><td colSpan={11}>No salary records found. Generate salaries to get started.</td></tr>}
                  {salaries.map(r => (
                    <tr key={r._id}>
                      <td><code>{r.employeeId}</code></td>
                      <td><strong>{r.employeeName}</strong></td>
                      <td>{r.departmentName}</td>
                      <td>₹{(r.basicSalary || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(r.totalAllowance || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(r.overtimeAmount || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--d-danger)' }}>₹{(r.totalDeduction || 0).toLocaleString('en-IN')}</td>
                      <td><strong>₹{(r.netSalary || 0).toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]||'d_info'}`}>{r.status}</span></td>
                      <td><span className={`d_badge ${paymentStatusClass[r.paymentStatus]||'d_info'}`}>{r.paymentStatus}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button 
                            className="d_icon_btn d_view" 
                            onClick={() => onViewSalary && onViewSalary(r._id)}
                            title="View Details"
                          >
                            <MdVisibility />
                          </button>
                          <button 
                            className="d_icon_btn d_edit" 
                            onClick={() => onEditSalary && onEditSalary(r._id)}
                            title="Edit"
                          >
                            <MdDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
