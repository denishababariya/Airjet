import React, { useState } from 'react';
import { MdDownload, MdFileDownload, MdFilterList, MdSearch } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.getReport({ 
        startDate, 
        endDate,
        ...(employeeId && { employeeId })
      });
      setReportData(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;
    
    const csv = [
      ['Employee', 'Employee ID', 'Date', 'Check In', 'Check Out', 'Working Hours', 'Status', 'Late Minutes', 'Overtime Minutes'],
      ...reportData.records.map(r => [
        r.emp,
        r.empId,
        r.date,
        r.checkIn,
        r.checkOut,
        r.hours,
        r.status,
        r.lateMinutes,
        r.overtimeMinutes
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${startDate}_to_${endDate}.csv`;
    a.click();
  };

  const exportToPDF = () => {
    // For PDF export, you would typically use a library like jsPDF
    // This is a placeholder for the PDF export functionality
    alert('PDF export requires jsPDF library. Please install it first.');
  };

  return (
    <div>
      <div className="d_page_header">
        <h1 className="d_page_title">Attendance Report</h1>
        <p className="d_page_subtitle">Generate and export attendance reports</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="d_card mb-4">
        <div className="d_card_body">
          <div className="row">
            <div className="col-md-3">
              <label className="d_form_label">Start Date</label>
              <input
                type="date"
                className="d_form_control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="d_form_label">End Date</label>
              <input
                type="date"
                className="d_form_control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="d_form_label">Employee ID (Optional)</label>
              <input
                type="text"
                className="d_form_control"
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="d_form_label">&nbsp;</label>
              <button 
                className="d_btn d_btn_primary w-100"
                onClick={fetchReport}
                disabled={loading}
              >
                <MdFilterList /> {loading ? 'Loading...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Statistics */}
          <div className="row mb-4">
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value">{reportData.stats.total}</div>
                  <div className="d_stat_label">Total</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value d_success">{reportData.stats.present}</div>
                  <div className="d_stat_label">Present</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value d_danger">{reportData.stats.absent}</div>
                  <div className="d_stat_label">Absent</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value d_warning">{reportData.stats.late}</div>
                  <div className="d_stat_label">Late</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value">{reportData.stats.totalWorkingHours.toFixed(1)}h</div>
                  <div className="d_stat_label">Total Hours</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value">{reportData.stats.totalOvertime}m</div>
                  <div className="d_stat_label">Overtime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="d-flex gap-2 mb-4">
            <button className="d_btn d_btn_success" onClick={exportToExcel}>
              <MdFileDownload /> Export to Excel
            </button>
            <button className="d_btn d_btn_primary" onClick={exportToPDF}>
              <MdDownload /> Export to PDF
            </button>
          </div>

          {/* Report Table */}
          <div className="d_card">
            <div className="d_card_body">
              <div className="table-responsive">
                <table className="d_table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Working Hours</th>
                      <th>Status</th>
                      <th>Late Minutes</th>
                      <th>Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map((record) => (
                      <tr key={record._id}>
                        <td>{record.emp}</td>
                        <td>{record.empId}</td>
                        <td>{record.date}</td>
                        <td>{record.checkIn}</td>
                        <td>{record.checkOut}</td>
                        <td>{record.hours}</td>
                        <td>
                          <span className={`d_badge ${
                            record.status === 'Present' ? 'd_success' : 
                            record.status === 'Absent' ? 'd_danger' : 'd_warning'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.lateMinutes || 0}</td>
                        <td>{record.overtimeMinutes || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceReport;
