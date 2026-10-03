import React, { useState, useEffect } from 'react';
import { MdVisibility, MdEdit, MdDelete, MdCheckCircle, MdCancel, MdSearch, MdFilterList } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

const statusClass = { Draft:'d_info', Generated:'d_primary', Approved:'d_success', Paid:'d_success', Cancelled:'d_danger' };
const paymentStatusClass = { Pending:'d_warning', Paid:'d_success', Failed:'d_danger' };

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function SalaryList({ onViewDetails, onEdit, onApprove, onPay, onCancel }) {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    status: '',
    paymentStatus: ''
  });

  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    fetchSalaries();
  }, [filters, searchTerm]);

  const fetchSalaries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.month) params.month = filters.month;
      if (filters.year) params.year = parseInt(filters.year);
      if (filters.status) params.status = filters.status;
      if (filters.paymentStatus) params.paymentStatus = filters.paymentStatus;

      const res = await payrollApi.getAll(params);
      let data = res.data;
      
      // Client-side search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        data = data.filter(s => 
          s.employeeName?.toLowerCase().includes(term) ||
          s.employeeId?.toLowerCase().includes(term) ||
          s.departmentName?.toLowerCase().includes(term)
        );
      }
      
      setSalaries(data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete Salary Record',
      message: 'Are you sure you want to delete this salary record? This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await payrollApi.remove(id);
          toast.success('Salary record deleted successfully');
          fetchSalaries();
        } catch (error) {
          toast.error(error.displayMessage || 'Failed to delete salary record');
        }
      }
    });
  };

  const handleApprove = (id) => {
    confirm({
      title: 'Approve Salary',
      message: 'Approve this salary record for payment?',
      confirmLabel: 'Approve',
      variant: 'success',
      onConfirm: async () => {
        closeConfirm();
        try {
          await payrollApi.approve(id);
          toast.success('Salary approved successfully');
          fetchSalaries();
          if (onApprove) onApprove(id);
        } catch (error) {
          toast.error(error.displayMessage || 'Failed to approve salary');
        }
      }
    });
  };

  const handleCancel = (id) => {
    confirm({
      title: 'Cancel Salary',
      message: 'Cancel this salary record?',
      confirmLabel: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await payrollApi.cancel(id);
          toast.success('Salary cancelled successfully');
          fetchSalaries();
          if (onCancel) onCancel(id);
        } catch (error) {
          toast.error(error.displayMessage || 'Failed to cancel salary');
        }
      }
    });
  };

  const handleReset = () => {
    setFilters({ month: '', year: '', status: '', paymentStatus: '' });
    setSearchTerm('');
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div style={{ minWidth: 0 }}>
          <div className="d_page_title">Salary List</div>
          <div className="d_page_subtitle">View and manage all salary records</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdFilterList /></span>Search & Filters</div>
        </div>
        <div className="d_card_body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            <div className="d_form_group">
              <label className="d_form_label">Search</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="d_form_control" 
                  placeholder="Search by name, ID, department..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <MdSearch style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
              </div>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Month</label>
              <select 
                className="d_form_control" 
                value={filters.month} 
                onChange={e => setFilters({...filters, month: e.target.value})}
              >
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Year</label>
              <select 
                className="d_form_control" 
                value={filters.year} 
                onChange={e => setFilters({...filters, year: e.target.value})}
              >
                <option value="">All Years</option>
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Status</label>
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
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
            <div className="d_form_group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="d_btn d_btn_outline" onClick={handleReset}>Reset Filters</button>
            </div>
          </div>
        </div>
      </div>

      {/* Salary Table */}
      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">Salary Records ({salaries.length})</div>
        </div>
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Month</th>
                    <th>Basic (₹)</th>
                    <th>Allowances (₹)</th>
                    <th>Overtime (₹)</th>
                    <th>Gross (₹)</th>
                    <th>Deductions (₹)</th>
                    <th>Net (₹)</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salaries.length === 0 && <tr className="d_empty"><td colSpan={13}>No salary records found</td></tr>}
                  {salaries.map(r => (
                    <tr key={r._id}>
                      <td>
                        <strong>{r.employeeName}</strong>
                        <br/>
                        <small style={{ color: '#666' }}>{r.employeeId}</small>
                      </td>
                      <td>{r.departmentName}</td>
                      <td>{r.designationName}</td>
                      <td>{r.month}</td>
                      <td>₹{(r.basicSalary || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(r.totalAllowance || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(r.overtimeAmount || 0).toLocaleString('en-IN')}</td>
                      <td>₹{(r.grossSalary || 0).toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--d-danger)' }}>₹{(r.totalDeduction || 0).toLocaleString('en-IN')}</td>
                      <td><strong>₹{(r.netSalary || 0).toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${statusClass[r.status]||'d_info'}`}>{r.status}</span></td>
                      <td><span className={`d_badge ${paymentStatusClass[r.paymentStatus]||'d_info'}`}>{r.paymentStatus}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button 
                            className="d_icon_btn d_view" 
                            onClick={() => onViewDetails && onViewDetails(r._id)}
                            title="View Details"
                          >
                            <MdVisibility />
                          </button>
                          {r.status === 'Generated' && (
                            <button 
                              className="d_icon_btn d_success" 
                              onClick={() => handleApprove(r._id)}
                              title="Approve"
                            >
                              <MdCheckCircle />
                            </button>
                          )}
                          {r.status !== 'Paid' && r.status !== 'Cancelled' && (
                            <button 
                              className="d_icon_btn d_del" 
                              onClick={() => handleCancel(r._id)}
                              title="Cancel"
                            >
                              <MdCancel />
                            </button>
                          )}
                          {r.status !== 'Paid' && (
                            <button 
                              className="d_icon_btn d_del" 
                              onClick={() => handleDelete(r._id)}
                              title="Delete"
                            >
                              <MdDelete />
                            </button>
                          )}
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
