import React, { useState, useRef } from 'react';
import { MdFilterList } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';
import ExportMenu from '../../components/ExportMenu';
import { getErrorMessage } from '../../utils/errorMessages';

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const reportRef = useRef(null);

  const fileName = `attendance_report_${startDate || 'start'}_to_${endDate || 'end'}`;

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select start and end dates');
      return;
    }

    if (endDate < startDate) {
      setError('End date must be on or after start date');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.getReport({
        startDate,
        endDate,
        ...(employeeId && { employeeId }),
      });
      setReportData(response.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load attendance report. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Attendance Report</h1>
          <p className="d_page_subtitle">Generate and export attendance reports</p>
        </div>

        {/* Export dropdown — PDF + JSON */}
        <ExportMenu
          label="Export Report"
          filename={fileName}
          data={reportData}
          targetRef={reportRef}
        />
      </div>

      {!reportData && (
        <div className="alert alert-info">
          Generate a report first — then use “Export Report” to download PDF or JSON.
        </div>
      )}

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
                min={startDate || undefined}
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

      {/* Report Results — this block is captured for the PDF export */}
      {reportData && (
        <div ref={reportRef}>
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
                  <div className="d_stat_value">{reportData.stats.earlyCheckout || 0}</div>
                  <div className="d_stat_label">Early Checkout</div>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="d_card">
                <div className="d_card_body text-center">
                  <div className="d_stat_value">{reportData.stats.totalLateMinutes || 0}m</div>
                  <div className="d_stat_label">Total Late Min</div>
                </div>
              </div>
            </div>
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
                      <th>Early Checkout</th>
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
                            record.status === 'Absent' ? 'd_danger' :
                            record.status === 'Leave' ? 'd_info' : 'd_warning'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.lateMinutes || 0}</td>
                        <td>{record.earlyCheckout ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;