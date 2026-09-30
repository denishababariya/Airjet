import React, { useState, useEffect, useRef } from 'react';
import { MdQrCode, MdDownload, MdPrint, MdPerson } from 'react-icons/md';
import { employeesApi, attendanceApi } from '../../utils/api';
import QRCode from 'qrcode';

const EmployeeQRCode = () => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [qrData, setQrData] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const qrCanvasRef = useRef(null);

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
      
      // Generate QR code image
      const qrImage = await QRCode.toDataURL(response.data.qrToken, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrImageUrl(qrImage);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrImageUrl || !qrData) return;
    
    const link = document.createElement('a');
    link.download = `qr_${qrData.employeeName.replace(/\s+/g, '_')}.png`;
    link.href = qrImageUrl;
    link.click();
  };

const printIDCard = () => {
  if (!qrData || !qrImageUrl) return;

  const printWindow = window.open('', '_blank', 'width=500,height=700');

  if (!printWindow) {
    setError('Please allow popups to print the QR code');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Employee ID Card - ${qrData.employeeName}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: Arial, sans-serif;
          }

          body {
            padding: 20px;
          }

          .id-card {
            border: 2px solid #000;
            padding: 20px;
            width: 340px;
            margin: 0 auto;
            text-align: center;
            background: white;
            border-radius: 10px;
          }

          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1a1a1a;
          }

          .employee-name {
            font-size: 18px;
            font-weight: bold;
            margin: 10px 0;
            color: #333;
          }

          .employee-id {
            font-size: 14px;
            color: #666;
            margin-bottom: 15px;
          }

          .qr-wrapper {
            width: 200px;
            height: 200px;
            margin: 15px auto;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .qr-image {
            width: 200px;
            height: 200px;
            display: block;
          }

          .footer {
            font-size: 12px;
            color: #777;
            margin-top: 15px;
          }

          @media print {
            body {
              padding: 0;
            }

            .id-card {
              margin: 0 auto;
              page-break-inside: avoid;
            }

            @page {
              margin: 10mm;
            }
          }
        </style>
      </head>

      <body>
        <div class="id-card">
          <div class="logo">AIRJET ERP</div>

          <div class="employee-name">
            ${qrData.employeeName}
          </div>

          <div class="employee-id">
            Employee ID: ${qrData.employeeId}
          </div>

          <div class="qr-wrapper">
            <img
              src="${qrImageUrl}"
              class="qr-image"
              alt="Employee QR Code"
              id="qrImage"
            />
          </div>

          <div class="footer">
            Scan this QR code for attendance
          </div>
        </div>

        <script>
          const qrImage = document.getElementById('qrImage');

          qrImage.onload = function () {
            setTimeout(function () {
              window.focus();
              window.print();
            }, 300);
          };

          qrImage.onerror = function () {
            alert('QR Code image could not be loaded.');
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
};

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
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
                    {qrImageUrl ? (
                      <img 
                        src={qrImageUrl} 
                        alt="QR Code" 
                        style={{ width: '200px', height: '200px', border: '1px solid #ddd' }}
                      />
                    ) : (
                      <div className="qr-placeholder">
                        <MdQrCode size={150} />
                        <div className="mt-2">
                          <small>{qrData.qrToken}</small>
                        </div>
                      </div>
                    )}
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
