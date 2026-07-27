import React, { useState, useEffect, useRef } from 'react';
import { MdQrCodeScanner, MdAccessTime, MdCheckCircle, MdError } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const scanTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleScan = async (qrToken) => {
    if (!qrToken) return;

    if (lastScanned && Date.now() - lastScanned < 30000) {
      setError('Please wait 30 seconds before scanning again');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.scan({ qrToken });
      setLastScanned(Date.now());
      setSuccess(true);
      setError('');
      
      setRecentScans(prev => [response.data, ...prev.slice(0, 9)]);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to scan QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter') {
      handleScan(e.target.value);
      e.target.value = '';
    }
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">QR Code Scanner</h1>
          <p className="d_page_subtitle">Scan employee QR codes to mark attendance</p>
        </div>
        <div className="d-flex gap-2">
          {success && (
            <span className="d_badge d_success d-flex align-items-center">
              <MdCheckCircle className="me-1" /> Attendance Recorded
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-3">
          <MdError className="me-2" />
          {error}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-5">
          <div className="d_card">
            <div className="d_card_header">
              <div className="d_card_title">
                <span className="d_card_icon"><MdQrCodeScanner /></span>
                Scanner
              </div>
            </div>
            <div className="d_card_body">
              <div className="qr-scanner-area text-center py-5">
                <div className={`qr-frame mx-auto d-flex align-items-center justify-content-center ${scanning ? 'scanning' : ''}`}>
                  <div className="text-center">
                    <MdQrCodeScanner size={64} className={scanning ? 'text-primary' : 'text-muted'} />
                    <p className="mt-3 mb-0 text-muted">
                      {scanning ? 'Ready to scan...' : 'Click Start Scanner to begin'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-center mt-3">
                <button 
                  className={`d_btn ${scanning ? 'd_btn_danger' : 'd_btn_primary'}`}
                  onClick={() => setScanning(!scanning)}
                >
                  {scanning ? 'Stop Scanner' : 'Start Scanner'}
                </button>
              </div>

              <div className="mt-4">
                <h6 className="d_card_title mb-3">Manual Entry</h6>
                <p className="text-muted small mb-2">Enter QR token manually if scanner is unavailable</p>
                <input
                  type="text"
                  className="d_form_control"
                  placeholder="Enter QR Token (e.g., AJ_83KDK92X)"
                  onKeyDown={handleManualInput}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="d_card">
            <div className="d_card_header">
              <div className="d_card_title">
                <span className="d_card_icon"><MdAccessTime /></span>
                Recent Scans
              </div>
            </div>
            <div className="d_card_body p-0">
              {recentScans.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <MdQrCodeScanner size={48} className="mb-2" />
                  <p>No scans yet. Scan a QR code to see results here.</p>
                </div>
              ) : (
                <div className="d_table_wrap">
                  <table className="d_table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentScans.map((scan, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32 }}>
                                {scan.employee?.name?.charAt(0) || 'E'}
                              </div>
                              <div>
                                <div className="fw-bold">{scan.employee?.name || scan.record?.emp}</div>
                                <small className="text-muted">{scan.employee?.id || scan.record?.empId}</small>
                              </div>
                            </div>
                          </td>
                          <td>{new Date(scan.record?.lastScannedAt || Date.now()).toLocaleTimeString()}</td>
                          <td>
                            <span className={`d_badge ${scan.record?.status === 'Present' ? 'd_success' : scan.record?.status === 'Late' ? 'd_warning' : 'd_danger'}`}>
                              {scan.record?.status}
                            </span>
                          </td>
                          <td>
                            <span className="d_badge d_info">
                              {scan.record?.checkOut !== '--' ? 'Check-out' : 'Check-in'}
                            </span>
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
      </div>
    </div>
  );
};

export default QRScanner;
