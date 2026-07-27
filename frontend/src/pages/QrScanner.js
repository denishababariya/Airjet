import React, { useState, useEffect, useCallback } from 'react';
import { MdQrCodeScanner, MdCheckCircle, MdPeople, MdAccessTime, MdRefresh } from 'react-icons/md';
import { attendanceApi } from '../utils/api';
import { Scanner } from '@yudiel/react-qr-scanner';
import { canTakeAttendance } from '../utils/roles';

const QrScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [soundEnabled] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const canScanAttendance = canTakeAttendance(currentUser?.role);

  const extractScanValue = (scanData) => {
    if (!scanData) return '';
    if (typeof scanData === 'string') return scanData.trim();
    if (typeof scanData === 'object') {
      return String(scanData.rawValue || scanData.text || scanData.value || '').trim();
    }
    return '';
  };

  // Play success sound
  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.frequency.value = 1200;
        setTimeout(() => {
          oscillator.stop();
          audioCtx.close();
        }, 150);
      }, 150);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Play error sound
  const playErrorSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 200;
      oscillator.type = 'sawtooth';
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 300);
    } catch (e) {
      // Audio not supported
    }
  }, [soundEnabled]);

  // Handle scan result
  const handleScan = useCallback(async (data) => {
    const parsedData = extractScanValue(data);
    if (!parsedData || loading || !canScanAttendance) return;
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const result = await attendanceApi.scan({ employeeId: parsedData });
      setScanResult(result.data);
      playSuccessSound();

      // Refresh today's attendance
      fetchTodayAttendance();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Scan failed');
      playErrorSound();
    } finally {
      setLoading(false);
    }
  }, [loading, playSuccessSound, playErrorSound, canScanAttendance]);

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const res = await attendanceApi.getToday();
      setTodayAttendance(res.data.records || []);
    } catch (err) {
      console.error('Failed to fetch today attendance:', err);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const statusBadge = (status) => {
    const map = {
      Present: 'd_success',
      Late: 'd_warning',
      Absent: 'd_danger',
      Leave: 'd_info',
      Approved: 'd_success',
      Pending: 'd_warning',
    };
    return <span className={`d_badge ${map[status] || 'd_info'}`}>{status}</span>;
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title"><MdQrCodeScanner className="d_card_icon" /> QR Attendance Scanner</h1>
          <p className="d_page_subtitle">Scan employee QR codes to record check-in/check-out</p>
        </div>
        <div className="d-flex gap-2">
          <button className="d_btn d_btn_outline" onClick={fetchTodayAttendance}>
            <MdRefresh /> Refresh
          </button>
          <button className="d_btn d_btn_primary" onClick={() => setShowScanner(!showScanner)}>
            {showScanner ? 'Hide Scanner' : 'Show Scanner'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}



































      {!canScanAttendance && (
        <div className="alert alert-warning m">
          Only Head, Manager, and Admin roles can take attendance from QR scanner. You currently have view-only access.
        </div>
      )}

      {/* Scanner Section */}
      {showScanner && canScanAttendance && (
        <div className="d_card mb-4">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdQrCodeScanner className="d_card_icon" /> Scanner</h2>
          </div>
          <div className="d_card-body">
            <div className="d_scanner_container">
              {/* QR Scanner using @yudiel/react-qr-scanner */}
              <div className="d_qr_scanner_wrapper">
                <Scanner
                  onScan={(result) => {
                    if (result && result.length > 0) {
                      handleScan(result[0]);
                    }
                  }}
                  onError={(error) => {
                    console.error('QR Scanner error:', error);
                  }}
                  scanDelay={500}
                  showVideo={true}
                  videoConstraints={{
                    facingMode: 'environment',
                  }}
                  styles={{
                    width: '100%',
                    height: 350,
                  }}
                  videoStyle={{
                    borderRadius: 8,
                  }}
                />
              </div>

              {/* Manual Entry Fallback */}
              <div className="d_manual_entry mt-3">
                <div className="d_input-group">
                  <input
                    type="text"
                    className="d_form_control"
                    placeholder="Enter Employee ID or QR Token (e.g., EMP001 or AJ_3F82KQ91)"
                    id="qrManualInput"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleScan(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    className="d_btn d_btn_primary"
                    onClick={() => {
                      const input = document.getElementById('qrManualInput');
                      if (input && input.value.trim()) {
                        handleScan(input.value.trim());
                        input.value = '';
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="d_card mb-4">
          <div className="d_card_header">
            <h2 className="d_card_title">
              {scanResult.type === 'checkin' ? (
                <MdCheckCircle style={{ color: 'var(--d-success)' }} />
              ) : scanResult.type === 'checkout' ? (
                <MdAccessTime style={{ color: 'var(--d-warning)' }} />
              ) : (
                <MdPeople style={{ color: 'var(--d-primary)' }} />
              )}{' '}
              {scanResult.type === 'checkin' ? 'Check-In Recorded' : scanResult.type === 'checkout' ? 'Check-Out Recorded' : 'Attendance Record'}
            </h2>
          </div>
          <div className="d_card-body">
            <div className="d_scan_result">
              <div className="d_result_header">
                <div className="d_result_avatar">
                  {scanResult.employee?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{scanResult.employee?.name}</h4>
                  <p className="text-muted mb-1">
                    <strong>Employee ID:</strong> {scanResult.employee?.id}
                  </p>
                  <p className="text-muted mb-1">
                    <strong>Department:</strong> {scanResult.employee?.department?.title || scanResult.employee?.department || 'N/A'}
                  </p>
                  <p className="text-muted mb-1">
                    <strong>Designation:</strong> {scanResult.employee?.designation?.title || scanResult.employee?.designation || 'N/A'}
                  </p>
                  <p className="text-muted">
                    <strong>Email:</strong> {scanResult.employee?.email || 'N/A'}
                  </p>
                </div>
              </div>

              <hr />

              <div className="d_result_details">
                <div className="d_result_field">
                  <span className="d_result_label">Status</span>
                  {statusBadge(scanResult.attendance?.status)}
                </div>
                <div className="d_result_field">
                  <span className="d_result_label">Check-In</span>
                  <strong>{scanResult.attendance?.checkIn || '--'}</strong>
                </div>
                <div className="d_result_field">
                  <span className="d_result_label">Check-Out</span>
                  <strong>{scanResult.attendance?.checkOut || '--'}</strong>
                </div>
                <div className="d_result_field">
                  <span className="d_result_label">Hours</span>
                  <strong>{scanResult.attendance?.hours || '--'}</strong>
                </div>
                <div className="d_result_field">
                  <span className="d_result_label">Date</span>
                  <strong>{scanResult.attendance?.date || new Date().toISOString().split('T')[0]}</strong>
                </div>
              </div>

              <div className="d_result_message mt-3">
                {scanResult.type === 'checkin' ? (
                  <div className="alert alert-success">
                    <MdCheckCircle /> {scanResult.employee?.name} checked in at {scanResult.attendance?.checkIn}
                  </div>
                ) : scanResult.type === 'checkout' ? (
                  <div className="alert alert-warning">
                    <MdAccessTime /> {scanResult.employee?.name} checked out at {scanResult.attendance?.checkOut} (Total: {scanResult.attendance?.hours})
                  </div>
                ) : (
                  <div className="alert alert-info">
                    <MdPeople /> Attendance record found for {scanResult.employee?.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Attendance Log */}
      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdAccessTime className="d_card_icon" /> Today's Attendance Log</h2>
          <span className="d_badge d_primary">{todayAttendance.length} records</span>
        </div>
        <div className="d_card-body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Emp ID</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.length === 0 ? (
                  <tr className="d_empty"><td colSpan={7}>No attendance records for today yet.</td></tr>
                ) : (
                  todayAttendance.map(record => (
                    <tr key={record._id}>
                      <td><code>{record.id}</code></td>
                      <td><strong>{record.emp}</strong></td>
                      <td><code>{record.empId}</code></td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.hours}</td>
                      <td>{statusBadge(record.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;