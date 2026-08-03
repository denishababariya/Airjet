import React, { useState, useEffect } from 'react';
import { MdAccessTime, MdCalendarToday, MdRefresh, MdSearch, MdFilterList } from 'react-icons/md';
import { attendanceApi, auth } from '../../utils/api';

const CheckInOut = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'monthly'

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError('');
    try {
      const user = auth.getCurrentUser();
      const canManage = user && ['Admin', 'Super Admin', 'Manager', 'Head', 'HR Manager'].includes(user.role);
      
      let response;
      if (viewMode === 'daily') {
        // Fetch specific date data
        response = await attendanceApi.getReport({
          startDate: selectedDate,
          endDate: selectedDate
        });
      } else {
        // Fetch monthly data
        const monthStr = String(selectedMonth).padStart(2, '0');
        const startDate = `${selectedYear}-${monthStr}-01`;
        const endDate = `${selectedYear}-${monthStr}-31`;
        response = await attendanceApi.getReport({
          startDate,
          endDate
        });
      }
      
      const filteredData = canManage 
        ? response.data.records 
        : response.data.records.filter(r => r.empId === user?.employee?.id);
      
      setAttendanceData(filteredData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedMonth, selectedYear, viewMode]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (viewMode === 'monthly') {
      const dateObj = new Date(date);
      setSelectedMonth(dateObj.getMonth() + 1);
      setSelectedYear(dateObj.getFullYear());
    }
  };

  const filteredData = attendanceData.filter(record =>
    record.emp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.empId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: attendanceData.length,
    present: attendanceData.filter(r => r.status === 'Present').length,
    absent: attendanceData.filter(r => r.status === 'Absent').length,
    late: attendanceData.filter(r => r.status === 'Late').length,
    onLeave: attendanceData.filter(r => r.status === 'Leave').length,
    earlyCheckout: attendanceData.filter(r => r.earlyCheckout === true).length,
    totalWorkingHours: attendanceData.reduce((sum, r) => sum + (r.workingHours || 0), 0).toFixed(2),
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Present': { class: 'd_success' },
      'Absent': { class: 'd_danger' },
      'Late': { class: 'd_warning' },
      'Leave': { class: 'd_info' }
    };
    const config = statusConfig[status] || { class: 'd_primary' };
    return <span className={`d_badge ${config.class}`}>{status}</span>;
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Check In/Out Records</h1>
          <p className="d_page_subtitle">View daily and monthly attendance records</p>
        </div>
        <div className="d-flex gap-2">
          <button className="d_btn d_btn_primary" onClick={fetchAttendanceData}>
            <MdRefresh /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filters */}
      <div className="d_card mb-4">
        <div className="d_card_body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="d_form_label">View Mode</label>
              <select
                className="d_form_control"
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
            
            {viewMode === 'daily' ? (
              <div className="col-md-3">
                <label className="d_form_label">Select Date</label>
                <input
                  type="date"
                  className="d_form_control"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="col-md-2">
                  <label className="d_form_label">Month</label>
                  <select
                    className="d_form_control"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="d_form_label">Year</label>
                  <select
                    className="d_form_control"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                  >
                    {[2024, 2025, 2026, 2027, 2028].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="col-md-3">
              <label className="d_form_label">Search</label>
              <div className="d_search_box">
                <span className="d_search_icon"><MdSearch /></span>
                <input
                  className="d_search_input"
                  placeholder="Search employee or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value">{stats.total}</div>
              <div className="d_stat_label">Total Records</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value d_success">{stats.present}</div>
              <div className="d_stat_label">Present</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value d_danger">{stats.absent}</div>
              <div className="d_stat_label">Absent</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value d_warning">{stats.late}</div>
              <div className="d_stat_label">Late</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value d_info">{stats.onLeave}</div>
              <div className="d_stat_label">On Leave</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value">{stats.earlyCheckout}</div>
              <div className="d_stat_label">Early Checkout</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d_stat_value">{stats.totalWorkingHours} hrs</div>
              <div className="d_stat_label">Total Working Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            {viewMode === 'daily' ? `Attendance for ${selectedDate}` : `Attendance for ${new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} ${selectedYear}`}
          </h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-4 text-muted">No attendance records found</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Emp ID</th>
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
                  {filteredData.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {record.employeeId?.image ? (
                            <img
                              src={record.employeeId.image}
                              alt={record.emp}
                              className="d_table_avatar me-2"
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="d-avatar text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32, fontSize: 12, backgroundColor: '#1a3c5e' }}>
                              {record.emp?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{record.emp}</div>
                          </div>
                        </div>
                      </td>
                      <td><code>{record.empId}</code></td>
                      <td>{record.date}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.hours}</td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td>{record.lateMinutes > 0 ? <span className="d_badge d_warning">{record.lateMinutes}m</span> : <span className="text-muted">—</span>}</td>
                      <td>
                        {record.earlyCheckout ? (
                          <span className="d_badge d_danger">Yes</span>
                        ) : (
                          <span className="d_badge d_success">No</span>
                        )}
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
  );
};

export default CheckInOut;
