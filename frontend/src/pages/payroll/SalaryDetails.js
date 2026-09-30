import React, { useState, useEffect, useRef } from 'react';
import { MdArrowBack, MdEdit, MdCheckCircle, MdPayment, MdDownload, MdPrint, MdPerson, MdCalendarToday, MdWork, MdAttachMoney, MdRemoveCircle } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import Modal from '../../components/Modal';
import SalaryPayment from './SalaryPayment';
import html2pdf from 'html2pdf.js';

const statusClass = { Draft: 'd_info', Generated: 'd_primary', Approved: 'd_success', Paid: 'd_success', Cancelled: 'd_danger' };

export default function SalaryDetails({ salaryId, onBack, onEdit, onApprove }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const payslipRef = useRef(null);

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
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {employee.image ? (
                  <img
                    src={employee.image}
                    alt={salary.employeeName}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'flex';
                    }}
                    style={{ 
                      width: '90px', 
                      height: '90px', 
                      borderRadius: '12px', 
                      objectFit: 'cover',
                      border: '3px solid #007bff',
                      boxShadow: '0 4px 8px rgba(0,123,255,0.2)'
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: employee.image ? 'none' : 'flex',
                    width: '90px',
                    height: '90px',
                    borderRadius: '12px',
                    backgroundColor: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: '#fff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 8px rgba(0,123,255,0.3)'
                  }}
                >
                  {salary.employeeName ? salary.employeeName.charAt(0).toUpperCase() : 'E'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#333' }}>
                    {salary.employeeName}
                  </h3>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                    {salary.designationName || 'N/A'}
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #007bff' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee ID</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{salary.employeeId || 'N/A'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #28a745' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{salary.departmentName || 'N/A'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #ffc107' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joining Date</div>
                    <div style={{ fontWeight: 600, color: '#333' }}>{salary.joiningDate ? new Date(salary.joiningDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '8px', borderLeft: '3px solid #6c757d' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                    <span className={`d_badge ${statusClass[salary.status]}`}>{salary.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Payslip for PDF Generation */}
        <div 
          ref={payslipRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '0',
            width: '800px',
            padding: '2rem',
            background: 'white'
          }}
        >
          {/* Company Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: '#333' }}>AIRJET</h1>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem', color: '#666' }}>Machine Spare Parts Manufacturing & Trading</p>
          </div>

          {/* Payslip Title */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#333' }}>SALARY SLIP</h2>
            <p style={{ margin: '0.5rem 0', fontSize: '1rem', color: '#666' }}>For the month of {salary.month}</p>
          </div>

          {/* Employee Information */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Employee Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
              <div><strong>Name:</strong> {salary.employeeName}</div>
              <div><strong>Employee ID:</strong> {salary.employeeId}</div>
              <div><strong>Department:</strong> {salary.departmentName}</div>
              <div><strong>Designation:</strong> {salary.designationName}</div>
              <div><strong>Joining Date:</strong> {salary.joiningDate ? new Date(salary.joiningDate).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Attendance Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <div><strong>Working Days:</strong> {salary.workingDays}</div>
              <div><strong>Present Days:</strong> {salary.presentDays}</div>
              <div><strong>Absent Days:</strong> {salary.absentDays}</div>
              <div><strong>Paid Leave:</strong> {salary.paidLeave}</div>
              <div><strong>Unpaid Leave:</strong> {salary.unpaidLeave}</div>
              <div><strong>Late Entries:</strong> {salary.lateEntries}</div>
              <div><strong>Overtime Hours:</strong> {salary.overtimeHours}</div>
            </div>
          </div>

          {/* Earnings and Deductions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Earnings */}
            <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Earnings</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Basic Salary</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(salary.basicSalary || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  {salary.allowances && salary.allowances.map((allowance, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>{allowance.name}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{allowance.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Overtime</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(salary.overtimeAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, background: '#f5f5f5' }}>
                    <td style={{ padding: '0.5rem 0' }}>Gross Salary</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>₹{(salary.grossSalary || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions */}
            <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Deductions</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {salary.deductions && salary.deductions.map((deduction, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>{deduction.name}</td>
                      <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{deduction.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Leave Deduction</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(salary.leaveDeduction || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr style={{ fontWeight: 600, background: '#f5f5f5' }}>
                    <td style={{ padding: '0.5rem 0' }}>Total Deductions</td>
                    <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>₹{(salary.totalDeduction || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Net Salary */}
          <div style={{ 
            padding: '1.5rem', 
            background: '#333', 
            color: 'white', 
            borderRadius: '4px', 
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>NET SALARY</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>₹{(salary.netSalary || 0).toLocaleString('en-IN')}</div>
          </div>

          {/* Payment Status */}
          <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', marginBottom: '2rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Payment Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
              <div><strong>Status:</strong> {salary.status}</div>
              <div><strong>Payment Status:</strong> {salary.paymentStatus}</div>
              {salary.paymentDate && <div><strong>Payment Date:</strong> {new Date(salary.paymentDate).toLocaleDateString()}</div>}
              {salary.paymentMode && <div><strong>Payment Mode:</strong> {salary.paymentMode}</div>}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.9rem', color: '#666' }}>
            <p style={{ margin: 0 }}>This is a computer-generated payslip. No signature required.</p>
            <p style={{ margin: '0.5rem 0 0 0' }}>Generated on: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title"><span className="d_card_icon"><MdCalendarToday /></span>Attendance Summary</div>
          </div>
          <div className="d_card_body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Working Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>{salary.workingDays || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Present Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#28a745' }}>{salary.presentDays || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Absent Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc3545' }}>{salary.absentDays || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Paid Leave</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#007bff' }}>{salary.paidLeave || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Unpaid Leave</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffc107' }}>{salary.unpaidLeave || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Late Entries</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6c757d' }}>{salary.lateEntries || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Half Days</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#343a40' }}>{salary.halfDays || 0}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>Overtime Hours</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#6f42c1' }}>{salary.overtimeHours || 0}</div>
              </div>
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
