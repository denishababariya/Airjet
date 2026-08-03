import React, { useState, useEffect } from 'react';
import { MdRefresh, MdAccessTime, MdCheckCircle, MdCancel, MdWarning, MdHighlightOff, MdPeople, MdBeachAccess, MdSearch } from 'react-icons/md';
import { attendanceApi, auth } from '../../utils/api';

const getStatusBadge = (status) => {
  const statusConfig = {
    'Present': { class: 'd_success', icon: <MdCheckCircle /> },
    'Absent': { class: 'd_danger', icon: <MdCancel /> },
    'Late': { class: 'd_warning', icon: <MdWarning /> },
    'Leave': { class: 'd_info', icon: <MdBeachAccess /> }
  };
  const config = statusConfig[status] || { class: 'd_primary', icon: <MdAccessTime /> };
  return (
    <span className={`d_badge ${config.class} d-flex align-items-center`}>
      {config.icon} {status}
    </span>
  );
};

const StatCard = ({ title, value, icon, color, bg }) => (
  <div className="d_card h-100">
    <div className="d_card_body">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="d_stat_value" style={{ color }}>{value}</div>
          <div className="d_stat_label">{title}</div>
        </div>
        <div className="d_stat_icon" style={{ color, backgroundColor: bg || 'transparent', fontSize: 28, padding: 8, borderRadius: 8 }}>
          {icon}
        </div>
      </div>
    </div>
  </div>
);

const TodayAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchTodayAttendance = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await attendanceApi.getToday();
      const user = auth.getCurrentUser();
      const canManage = user && ['Admin', 'Super Admin', 'Manager', 'Head', 'HR Manager'].includes(user.role);
      const filteredData = canManage ? response.data : response.data.filter(r => r.empId === user?.employee?.id);
      setAttendance(filteredData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch today\'s attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    const interval = setInterval(fetchTodayAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: attendance.length,
    present: attendance.filter(r => r.status === 'Present').length,
    absent: attendance.filter(r => r.status === 'Absent').length,
    late: attendance.filter(r => r.status === 'Late').length,
    onLeave: attendance.filter(r => r.status === 'Leave').length,
    earlyCheckout: attendance.filter(r => r.earlyCheckout === true).length,
  };

  const filtered = attendance.filter(a =>
    a.emp?.toLowerCase().includes(search.toLowerCase()) ||
    a.empId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Today's Attendance</h1>
          <p className="d_page_subtitle">Real-time attendance tracking — {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={fetchTodayAttendance}>
          <MdRefresh /> Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <StatCard title="Total" value={stats.total} icon={<MdPeople />} color="var(--d-primary)" bg="#eff6ff" />
        </div>
        <div className="col-md-2">
          <StatCard title="Present" value={stats.present} icon={<MdCheckCircle />} color="#22c55e" bg="#f0fdf4" />
        </div>
        <div className="col-md-2">
          <StatCard title="Late" value={stats.late} icon={<MdWarning />} color="#f59e0b" bg="#fffbeb" />
        </div>
        <div className="col-md-2">
          <StatCard title="Absent" value={stats.absent} icon={<MdCancel />} color="#ef4444" bg="#fef2f2" />
        </div>
        <div className="col-md-2">
          <StatCard title="On Leave" value={stats.onLeave} icon={<MdBeachAccess />} color="#3b82f6" bg="#eff6ff" />
        </div>
        <div className="col-md-2">
          <StatCard title="Early Out" value={stats.earlyCheckout} icon={<MdHighlightOff />} color="#ef4444" bg="#fef2f2" />
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h2 className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Attendance Log
          </h2>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input
              className="d_search_input"
              placeholder="Search employee or ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-4 text-muted">No attendance records for today</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Emp ID</th>
                    <th>Department</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Late</th>
                    <th>Early Out</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
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
                      <td>{record.department?.title || record.employeeId?.department?.title || 'N/A'}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.hours}</td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td>
                        {record.lateMinutes > 0
                          ? <span className="d_badge d_warning">{record.lateMinutes}m</span>
                          : <span className="d_badge d_info">—</span>}
                      </td>
                      <td>
                        {record.earlyCheckout ? (
                          <span className="d_badge d_danger"><MdHighlightOff /> Yes</span>
                        ) : (
                          <span className="d_badge d_success"><MdCheckCircle /> No</span>
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

export default TodayAttendance;
