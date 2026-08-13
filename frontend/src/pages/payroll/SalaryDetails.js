import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdEdit, MdCheckCircle, MdPayment, MdDownload, MdPrint, MdPerson, MdCalendarToday, MdWork, MdAttachMoney, MdRemoveCircle } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import Modal from '../../components/Modal';
import SalaryPayment from './SalaryPayment';

const statusClass = { Draft:'d_info', Generated:'d_primary', Approved:'d_success', Paid:'d_success', Cancelled:'d_danger' };

export default function SalaryDetails({ salaryId, onBack, onEdit, onApprove }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (salaryId) {
      fetchSalaryDetails();
    }
  }, [salaryId]);

  const fetchSalaryDetails = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getById(salaryId);
      setSalary(res.data);
    } catch (error) {
      console.error('Error fetching salary details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await payrollApi.approve(salaryId);
      fetchSalaryDetails();
      if (onApprove) onApprove(salaryId);
    } catch (error) {
      console.error('Error approving salary:', error);
    }
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    fetchSalaryDetails();
  };

  if (loading) {
    return <div className="text-center py-4">Loading salary details...</div>;
  }

  if (!salary) {
    return <div className="text-center py-4">Salary record not found</div>;
  }

  const employee = salary.employee || {};
  const department = salary.department || {};
  const designation = salary.designation || {};

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="d_btn d_btn_outline" onClick={onBack}>
            <MdArrowBack /> Back
          </button>
          <div>
            <div className="d_page_title">Salary Details</div>
            <div className="d_page_subtitle">{salary.employeeName} - {salary.month}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {salary.status === 'Generated' && (
            <button className="d_btn d_btn_success" onClick={handleApprove}>
              <MdCheckCircle /> Approve
            </button>
          )}
          {salary.status === 'Approved' && salary.paymentStatus === 'Pending' && (
            <button className="d_btn d_btn_primary" onClick={() => setShowPaymentModal(true)}>
              <MdPayment /> Mark as Paid
            </button>
          )}
          {salary.status !== 'Paid' && salary.status !== 'Cancelled' && (
            <button className="d_btn d_btn_outline" onClick={() => onEdit && onEdit(salaryId)}>
              <MdEdit /> Edit
            </button>
          )}
          <button className="d_btn d_btn_outline">
            <MdDownload /> Download Payslip
          </button>
          <button className="d_btn d_btn_outline">
            <MdPrint /> Print
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Employee Information */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdPerson /></span>Employee Information</div>
          </div>
          <div className="d_card_body">
            {employee.image && (
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img 
                  src={employee.image} 
                  alt={salary.employeeName}
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div style={{ marginBottom: '0.5rem' }}><strong>Name:</strong> {salary.employeeName}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Employee ID:</strong> {salary.employeeId}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Department:</strong> {salary.departmentName}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Designation:</strong> {salary.designationName}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>Joining Date:</strong> {salary.joiningDate ? new Date(salary.joiningDate).toLocaleDateString() : 'N/A'}</div>
            <div><strong>Status:</strong> <span className={`d_badge ${statusClass[salary.status]}`}>{salary.status}</span></div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdCalendarToday /></span>Attendance Summary</div>
          </div>
          <div className="d_card_body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div><strong>Working Days:</strong> {salary.workingDays}</div>
              <div><strong>Present Days:</strong> {salary.presentDays}</div>
              <div><strong>Absent Days:</strong> {salary.absentDays}</div>
              <div><strong>Paid Leave:</strong> {salary.paidLeave}</div>
              <div><strong>Unpaid Leave:</strong> {salary.unpaidLeave}</div>
              <div><strong>Late Entries:</strong> {salary.lateEntries}</div>
              <div><strong>Half Days:</strong> {salary.halfDays}</div>
              <div><strong>Overtime Hours:</strong> {salary.overtimeHours}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Earnings */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdAttachMoney /></span>Earnings</div>
          </div>
          <div className="d_card_body">
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem 0' }}>Basic Salary</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>₹{(salary.basicSalary || 0).toLocaleString('en-IN')}</td>
                </tr>
                {salary.allowances && salary.allowances.map((allowance, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.5rem 0' }}>{allowance.name}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>₹{allowance.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '0.5rem 0' }}>Overtime</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>₹{(salary.overtimeAmount || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #ddd' }}>
                  <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Gross Salary</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 'bold', color: 'var(--d-success)' }}>₹{(salary.grossSalary || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Deductions */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdRemoveCircle /></span>Deductions</div>
          </div>
          <div className="d_card_body">
            <table style={{ width: '100%' }}>
              <tbody>
                {salary.deductions && salary.deductions.map((deduction, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '0.5rem 0' }}>{deduction.name}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>₹{deduction.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '0.5rem 0' }}>Leave Deduction</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0' }}>₹{(salary.leaveDeduction || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr style={{ borderTop: '1px solid #ddd' }}>
                  <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Total Deductions</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 'bold', color: 'var(--d-danger)' }}>₹{(salary.totalDeduction || 0).toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Final Calculation */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title">Final Calculation</div>
        </div>
        <div className="d_card_body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Gross Salary</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>₹{(salary.grossSalary || 0).toLocaleString('en-IN')}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '2rem' }}>−</div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Deductions</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--d-danger)' }}>₹{(salary.totalDeduction || 0).toLocaleString('en-IN')}</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '2rem' }}>=</div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Net Salary</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{(salary.netSalary || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {salary.paymentStatus === 'Paid' && (
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdPayment /></span>Payment Information</div>
          </div>
          <div className="d_card_body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div><strong>Payment Date:</strong> {salary.paymentDate ? new Date(salary.paymentDate).toLocaleDateString() : 'N/A'}</div>
              <div><strong>Payment Mode:</strong> {salary.paymentMode || 'N/A'}</div>
              <div><strong>Transaction Reference:</strong> {salary.transactionReference || 'N/A'}</div>
              <div><strong>Payment Notes:</strong> {salary.paymentNotes || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal 
        open={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
        title="Process Salary Payment"
        size="md"
      >
        <SalaryPayment 
          salaryId={salaryId} 
          netSalary={salary.netSalary}
          onComplete={handlePaymentComplete}
          onCancel={() => setShowPaymentModal(false)}
        />
      </Modal>
    </div>
  );
}
