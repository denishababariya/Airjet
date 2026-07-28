import React, { useState, useEffect } from 'react';
import { MdRefresh, MdPerson, MdAccessTime, MdCheckCircle, MdCancel, MdWarning } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const TodayAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    pending: 0
  });

  const fetchTodayAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.getToday();
      setAttendance(response.data);
      
      // Calculate stats
      const stats = {
        total: response.data.length,
        present: response.data.filter(r => r.status === 'Present').length,
        absent: response.data.filter(r => r.status === 'Absent').length,
        late: response.data.filter(r => r.status === 'Late').length,
        pending: response.data.filter(r => r.checkOut === '--').length
      };
      setStats(stats);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch today\'s attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Present': { class: 'd_success', icon: <MdCheckCircle /> },
      'Absent': { class: 'd_danger', icon: <MdCancel /> },
      'Late': { class: 'd_warning', icon: <MdWarning /> }
    };
    const config = statusConfig[status] || { class: 'd_info', icon: <MdAccessTime /> };
    return (
      <span className={`d_badge ${config.class} d-flex align-items-center`}>
        {config.icon} {status}
      </span>
    );
  };

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Today's Attendance</h1>
          <p className="d_page_subtitle">Real-time attendance tracking for {new Date().toLocaleDateString()}</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={fetchTodayAttendance}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="d_card">
            <div className="d_card_body">
              <div className="d_stat_value">{stats.total}</div>
              <div className="d_stat_label">Total Employees</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="d_card">
            <div className="d_card_body">
              <div className="d_stat_value d_success">{stats.present}</div>
              <div className="d_stat_label">Present</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="d_card">
            <div className="d_card_body">
              <div className="d_stat_value d_warning">{stats.late}</div>
              <div className="d_stat_label">Late</div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="d_card">
            <div className="d_card_body">
              <div className="d_stat_value d_danger">{stats.absent}</div>
              <div className="d_stat_label">Absent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="d_card">
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-4">No attendance records for today</div>
          ) : (
            <div className="table-responsive">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee ID</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Late Minutes</th>
                    <th>Overtime</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {record.employeeId?.image && (
                            <img 
                              src={record.employeeId.image} 
                              alt={record.emp}
                              className="d_table_avatar me-2"
                              style={{ width: 32, height: 32, borderRadius: '50%' }}
                            />
                          )}
                          <div>
                            <div className="fw-bold">{record.emp}</div>
                            <small className="text-muted">
                              {record.employeeId?.department?.title || 'N/A'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{record.empId}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.hours}</td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td>{record.lateMinutes || 0} min</td>
                      <td>{record.overtimeMinutes || 0} min</td>
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

export default TodayAttendance;
