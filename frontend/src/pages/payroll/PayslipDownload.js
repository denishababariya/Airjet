import React, { useState, useEffect, useRef } from 'react';
import { MdVisibility, MdDownload, MdDescription, MdArrowBack, MdPrint } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import Payslip from './Payslip';
import html2pdf from 'html2pdf.js';
import Modal from '../../components/Modal';

export default function PayslipDownload() {
  const [payslips, setPayslips] = useState([]);
  const [filteredPayslips, setFilteredPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);
  const [showPayslipModal, setShowPayslipModal] = useState(null);
  const [modalSalaryData, setModalSalaryData] = useState(null);
  const hiddenPayslipRef = useRef(null);

  useEffect(() => {
    fetchPayslips();
  }, []);

  useEffect(() => {
    if (month) {
      const filtered = payslips.filter(p => p.month === month);
      setFilteredPayslips(filtered);
    } else {
      setFilteredPayslips(payslips);
    }
  }, [month, payslips]);

  const fetchPayslips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollApi.getAll();
      const data = res.data || res;
      setPayslips(data);
      
      // Extract unique months
      const months = [...new Set(data.map(p => p.month))].sort((a, b) => {
        // Sort months chronologically
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const aMonth = a.split(' ')[0];
        const bMonth = b.split(' ')[0];
        const aYear = parseInt(a.split(' ')[1]);
        const bYear = parseInt(b.split(' ')[1]);
        
        if (aYear !== bYear) return bYear - aYear;
        return monthOrder.indexOf(bMonth) - monthOrder.indexOf(aMonth);
      });
      setAvailableMonths(months);
      
      // Set default month to most recent
      if (months.length > 0) {
        setMonth(months[0]);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      setError('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (payslipId) => {
    setSelectedPayslip(payslipId);
  };

  const handleDownload = async (payslip) => {
    setDownloadingId(payslip._id);
    
    try {
      // Fetch full payslip details
      const res = await payrollApi.getById(payslip._id);
      const salaryData = res.data || res;
      setModalSalaryData(salaryData);
      setShowPayslipModal(payslip._id);
    } catch (error) {
      console.error('Error fetching payslip details:', error);
      setDownloadingId(null);
    }
  };

  const handleModalDownload = () => {
    if (!hiddenPayslipRef.current || !modalSalaryData) return;
    
    const element = hiddenPayslipRef.current;
    const employeeName = modalSalaryData.employeeName?.replace(/\s+/g, '_') || 'employee';
    const month = modalSalaryData.month?.replace(/\s+/g, '_') || 'month';
    const filename = `Payslip_${employeeName}_${month}.pdf`;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };
    
    html2pdf().set(opt).from(element).save()
      .then(() => {
        setShowPayslipModal(null);
        setModalSalaryData(null);
        setDownloadingId(null);
      })
      .catch((error) => {
        console.error('Error generating PDF:', error);
        setDownloadingId(null);
      });
  };

  const handleModalPrint = () => {
    window.print();
  };

  const handleCloseModal = () => {
    setShowPayslipModal(null);
    setModalSalaryData(null);
    setDownloadingId(null);
  };

  const handleBack = () => {
    setSelectedPayslip(null);
  };

  if (selectedPayslip) {
    return <Payslip salaryId={selectedPayslip} onBack={handleBack} />;
  }

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div style={{ minWidth: 0 }}>
          <div className="d_page_title">Payslip Download</div>
          <div className="d_page_subtitle">View and download employee payslips</div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="d_btn d_btn_outline" 
            value={month} 
            onChange={e => setMonth(e.target.value)}
            disabled={loading}
          >
            <option value="">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdDescription /></span>Payslips — {month}</div>
        </div>
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading payslips...</div>
          ) : error ? (
            <div className="text-center py-4 text-danger">{error}</div>
          ) : filteredPayslips.length === 0 ? (
            <div className="text-center py-4">No payslips found for {month || 'any month'}</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Month</th>
                    <th>Net Salary (₹)</th>
                    <th>Generated Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayslips.map(p => (
                    <tr key={p._id}>
                      <td>{p.employeeId}</td>
                      <td>{p.employeeName}</td>
                      <td>{p.departmentName}</td>
                      <td>{p.month}</td>
                      <td><strong>₹{(p.netSalary || 0).toLocaleString('en-IN')}</strong></td>
                      <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td><span className={`d_badge ${p.status === 'Generated' || p.status === 'Approved' || p.status === 'Paid' ? 'd_success' : 'd_warning'}`}>{p.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button 
                            className="d_icon_btn d_view" 
                            onClick={() => handleView(p._id)}
                            disabled={p.status === 'Pending' || p.status === 'Draft'}
                            title="View Payslip"
                          >
                            <MdVisibility />
                          </button>
                          <button 
                            className="d_icon_btn d_edit" 
                            onClick={() => handleDownload(p)}
                            disabled={p.status === 'Pending' || p.status === 'Draft' || downloadingId === p._id}
                            title={downloadingId === p._id ? 'Downloading...' : 'Download Payslip'}
                            style={{ opacity: downloadingId === p._id ? 0.6 : 1 }}
                          >
                            {downloadingId === p._id ? (
                              <span style={{ fontSize: '12px' }}>...</span>
                            ) : (
                              <MdDownload />
                            )}
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

      {/* Payslip Modal */}
      <Modal
        open={showPayslipModal !== null}
        onClose={handleCloseModal}
        title="Payslip Preview"
        size="lg"
      >
        {modalSalaryData && (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button className="d_btn d_btn_outline" onClick={handleCloseModal}>
                <MdArrowBack /> Close
              </button>
            </div>
            
            {/* Payslip Document */}
            <div 
              ref={hiddenPayslipRef}
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: '2rem',
                background: 'white',
                border: '1px solid #ddd',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxHeight: '70vh',
                overflowY: 'auto'
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
                <p style={{ margin: '0.5rem 0', fontSize: '1rem', color: '#666' }}>For the month of {modalSalaryData.month}</p>
              </div>

              {/* Employee Information */}
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Employee Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Name:</strong> {modalSalaryData.employeeName}</div>
                  <div><strong>Employee ID:</strong> {modalSalaryData.employeeId}</div>
                  <div><strong>Department:</strong> {modalSalaryData.departmentName}</div>
                  <div><strong>Designation:</strong> {modalSalaryData.designationName}</div>
                  <div><strong>Joining Date:</strong> {modalSalaryData.joiningDate ? new Date(modalSalaryData.joiningDate).toLocaleDateString() : 'N/A'}</div>
                </div>
              </div>

              {/* Attendance Summary */}
              <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Attendance Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Working Days:</strong> {modalSalaryData.workingDays}</div>
                  <div><strong>Present Days:</strong> {modalSalaryData.presentDays}</div>
                  <div><strong>Absent Days:</strong> {modalSalaryData.absentDays}</div>
                  <div><strong>Paid Leave:</strong> {modalSalaryData.paidLeave}</div>
                  <div><strong>Unpaid Leave:</strong> {modalSalaryData.unpaidLeave}</div>
                  <div><strong>Late Entries:</strong> {modalSalaryData.lateEntries}</div>
                  <div><strong>Overtime Hours:</strong> {modalSalaryData.overtimeHours}</div>
                </div>
              </div>

              {/* Earnings and Deductions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Earnings */}
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Earnings</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Basic Salary</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(modalSalaryData.basicSalary || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      {modalSalaryData.allowances && modalSalaryData.allowances.map((allowance, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>{allowance.name}</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{allowance.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Overtime</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(modalSalaryData.overtimeAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ fontWeight: 600, background: '#f5f5f5' }}>
                        <td style={{ padding: '0.5rem 0' }}>Gross Salary</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>₹{(modalSalaryData.grossSalary || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions */}
                <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Deductions</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {modalSalaryData.deductions && modalSalaryData.deductions.map((deduction, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>{deduction.name}</td>
                          <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{deduction.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      <tr>
                        <td style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>Leave Deduction</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right', borderBottom: '1px solid #eee' }}>₹{(modalSalaryData.leaveDeduction || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr style={{ fontWeight: 600, background: '#f5f5f5' }}>
                        <td style={{ padding: '0.5rem 0' }}>Total Deductions</td>
                        <td style={{ padding: '0.5rem 0', textAlign: 'right' }}>₹{(modalSalaryData.totalDeduction || 0).toLocaleString('en-IN')}</td>
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
                <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>₹{(modalSalaryData.netSalary || 0).toLocaleString('en-IN')}</div>
              </div>

              {/* Payment Status */}
              <div style={{ padding: '1rem', background: '#f9f9f9', borderRadius: '4px', marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#333' }}>Payment Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <div><strong>Status:</strong> {modalSalaryData.status}</div>
                  <div><strong>Payment Status:</strong> {modalSalaryData.paymentStatus}</div>
                  {modalSalaryData.paymentDate && <div><strong>Payment Date:</strong> {new Date(modalSalaryData.paymentDate).toLocaleDateString()}</div>}
                  {modalSalaryData.paymentMode && <div><strong>Payment Mode:</strong> {modalSalaryData.paymentMode}</div>}
                </div>
              </div>

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.9rem', color: '#666' }}>
                <p style={{ margin: 0 }}>This is a computer-generated payslip. No signature required.</p>
                <p style={{ margin: '0.5rem 0 0 0' }}>Generated on: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
