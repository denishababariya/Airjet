import React, { useState } from 'react';
import { MdQrCode, MdDownload, MdPrint, MdPerson } from 'react-icons/md';
import { employeesApi, attendanceApi } from '../../utils/api';

const EmployeeQRCode = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [qrData, setQrData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll();
      setEmployees(response.data);
    } catch (err) {
      setError('Failed to fetch employees');
    }
  };

  const generateQR = async (employeeId) => {
    if (!employeeId) {
      setError('Please select an employee');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.generateQr(employeeId);
      setQrData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData) return;
    
    // Create a simple QR code representation
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw placeholder QR code
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 300, 300);
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', 150, 140);
    ctx.fillText(qrData.qrToken, 150, 160);
    
    const link = document.createElement('a');
    link.download = `qr_${qrData.employeeName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const printIDCard = () => {
    if (!qrData) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Employee ID Card - ${qrData.employeeName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .id-card { 
              border: 2px solid #000; 
              padding: 20px; 
              width: 300px; 
              margin: 0 auto;
              text-align: center;
            }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
            .qr-placeholder { 
              width: 150px; 
              height: 150px; 
              border: 2px dashed #000; 
              margin: 20px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
            }
            .employee-name { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .employee-id { font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="logo">AIRJET ERP</div>
            <div class="employee-name">${qrData.employeeName}</div>
            <div class="employee-id">ID: ${qrData.qrToken}</div>
            <div class="qr-placeholder">QR Code</div>
            <small>Scan for attendance</small>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div>
      <div className="d_page_header">
        <h1 className="d_page_title">Employee QR Codes</h1>
        <p className="d_page_subtitle">Generate and manage employee QR codes for attendance</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-4">
          <div className="d_card">
            <div className="d_card_body">
              <h5 className="d_card_title mb-3">Select Employee</h5>
              
              <div className="mb-3">
                <label className="d_form_label">Employee</label>
                <select
                  className="d_form_control"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="d_btn d_btn_primary w-100"
                onClick={() => generateQR(selectedEmployee)}
                disabled={loading || !selectedEmployee}
              >
                <MdQrCode /> {loading ? 'Generating...' : 'Generate QR Code'}
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          {qrData && (
            <div className="d_card">
              <div className="d_card_body">
                <div className="text-center">
                  <h5 className="d_card_title mb-3">QR Code for {qrData.employeeName}</h5>
                  
                  <div className="qr-code-display mb-3">
                    <div className="qr-placeholder">
                      <MdQrCode size={150} />
                      <div className="mt-2">
                        <small>{qrData.qrToken}</small>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-center">
                    <button className="d_btn d_btn_success" onClick={downloadQR}>
                      <MdDownload /> Download QR
                    </button>
                    <button className="d_btn d_btn_primary" onClick={printIDCard}>
                      <MdPrint /> Print ID Card
                    </button>
                  </div>

                  <div className="mt-3">
                    <small className="text-muted">
                      QR Token: {qrData.qrToken}<br />
                      Employee ID: {qrData.employeeId}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeQRCode;
