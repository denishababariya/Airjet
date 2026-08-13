import React, { useState, useEffect } from 'react';
import { MdDownload, MdPrint, MdArrowBack } from 'react-icons/md';
import { payrollApi } from '../../utils/api';

export default function Payslip({ salaryId, onBack }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll use the browser's print functionality
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center py-4">Loading payslip...</div>;
  }

  if (!salary) {
    return <div className="text-center py-4">Salary record not found</div>;
  }

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2" style={{ '@media print': { display: 'none' } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="d_btn d_btn_outline" onClick={onBack}>
            <MdArrowBack /> Back
          </button>
          <div>
            <div className="d_page_title">Payslip</div>
            <div className="d_page_subtitle">{salary.employeeName} - {salary.month}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="d_btn d_btn_primary" onClick={handleDownload}>
            <MdDownload /> Download PDF
          </button>
          <button className="d_btn d_btn_outline" onClick={handlePrint}>
            <MdPrint /> Print
          </button>
        </div>
      </div>

      {/* Payslip Document */}
      <div 
        id="payslip-document"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '2rem',
          background: 'white',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
    </div>
  );
}
