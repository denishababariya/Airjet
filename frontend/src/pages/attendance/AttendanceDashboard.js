import React, { useState, useEffect } from 'react';
import { MdQrCodeScanner, MdPeople, MdAccessTime, MdEventBusy, MdWarning, MdCancel, MdRefresh, MdCheckCircle, MdHighlightOff } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';
import { canTakeAttendance } from '../../utils/roles';

const AttendanceDashboard = ({ setActiveMenu, currentUser }) => {
  const [stats, setStats] = useState({
    todayPresent: 0,
    todayAbsent: 0,
    todayLeave: 0,
    todayLate: 0,
    todayEarlyCheckout: 0,
    weeklyPresent: 0,
    weeklyAbsent: 0,
    monthlyPresent: 0,
    monthlyAbsent: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earlyCheckoutWarning, setEarlyCheckoutWarning] = useState(null);

  const userRole = currentUser?.role || 'User';
  const isAdmin = canTakeAttendance(userRole);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayResponse = await attendanceApi.getToday();
      const todayData = todayResponse.data;

      const weeklyResponse = await attendanceApi.getReport({ startDate: weekAgo, endDate: today });
      const monthlyResponse = await attendanceApi.getReport({ startDate: monthAgo, endDate: today });

      const filteredToday = isAdmin ? todayData : todayData.filter(r => r.empId === currentUser?.employeeId);

      setStats({
        todayPresent: filteredToday.filter(r => r.status === 'Present').length,
        todayAbsent: filteredToday.filter(r => r.status === 'Absent').length,
        todayLeave: filteredToday.filter(r => r.status === 'Leave').length,
        todayLate: filteredToday.filter(r => r.status === 'Late').length,
        todayEarlyCheckout: filteredToday.filter(r => r.earlyCheckout === true).length,
        weeklyPresent: weeklyResponse.data?.stats?.present || 0,
        weeklyAbsent: weeklyResponse.data?.stats?.absent || 0,
        monthlyPresent: monthlyResponse.data?.stats?.present || 0,
        monthlyAbsent: monthlyResponse.data?.stats?.absent || 0
      });

      setRecentAttendance(filteredToday.slice(0, 8));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [currentUser, isAdmin]);

  const handleEarlyCheckout = (record) => {
    setEarlyCheckoutWarning({
      message: `Early check-out detected for ${record.emp}. Regular hours are 9:00 AM to 6:00 PM.`,
      record,
    });
  };

  const dismissWarning = () => {
    setEarlyCheckoutWarning(null);
  };

  const StatCard = ({ title, value, icon, color, bg }) => (
    <div className="d_card h-100">
      <div className="d_card_body">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="d_stat_value" style={{ color }}>{value}</div>
            <div className="d_stat_label">{title}</div>
          </div>
          <div className="d_stat_icon" style={{ color, backgroundColor: bg || 'transparent', fontSize: 32, padding: 8, borderRadius: 8 }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {earlyCheckoutWarning && (
        <div className="d_alert d_alert_warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <MdWarning style={{ marginRight: 8 }} />
            {earlyCheckoutWarning.message}
          </div>
          <div className="d-flex gap-2">
            <button className="d_btn d_btn_sm d_btn_outline" onClick={() => setActiveMenu('Check In/Out')}>
              Go to Check Out
            </button>
            <button className="d_btn d_btn_sm d_btn_outline" onClick={dismissWarning}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Attendance Dashboard</h1>
          <p className="d_page_subtitle">Overview of employee attendance</p>
        </div>
        <div className="d-flex gap-2">
          <button className="d_btn d_btn_outline" onClick={fetchDashboardData}>
            <MdRefresh /> Refresh
          </button>
          <button className="d_btn d_btn_primary" onClick={() => setActiveMenu && setActiveMenu('QR Scanner')}>
            <MdQrCodeScanner /> Open QR Scanner
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <StatCard title="Present Today" value={stats.todayPresent} icon={<MdPeople />} color="#22c55e" bg="#f0fdf4" />
        </div>
        <div className="col-md-3">
          <StatCard title="Absent Today" value={stats.todayAbsent} icon={<MdCancel />} color="#ef4444" bg="#fef2f2" />
        </div>
        <div className="col-md-3">
          <StatCard title="On Leave" value={stats.todayLeave} icon={<MdEventBusy />} color="#3b82f6" bg="#eff6ff" />
        </div>
        <div className="col-md-3">
          <StatCard title="Late Today" value={stats.todayLate} icon={<MdWarning />} color="#f59e0b" bg="#fffbeb" />
        </div>
        {isAdmin && (
          <div className="col-md-3">
            <StatCard title="Early Checkout" value={stats.todayEarlyCheckout} icon={<MdHighlightOff />} color="#ef4444" bg="#fef2f2" />
          </div>
        )}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="d_card h-100">
            <div className="d_card_header">
              <h6 className="d_card_title">Weekly Overview</h6>
            </div>
            <div className="d_card_body">
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Present Days</span>
                <span className="fw-bold text-success">{stats.weeklyPresent}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Absent Days</span>
                <span className="fw-bold text-danger">{stats.weeklyAbsent}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="d_card h-100">
            <div className="d_card_header">
              <h6 className="d_card_title">Monthly Overview</h6>
            </div>
            <div className="d_card_body">
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted">Present Days</span>
                <span className="fw-bold text-success">{stats.monthlyPresent}</span>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted">Absent Days</span>
                <span className="fw-bold text-danger">{stats.monthlyAbsent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header d-flex flex-wrap align-items-center justify-content-between gap-2">
          <h2 className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Today's Attendance Log
          </h2>
          <button className="d_btn d_btn_sm d_btn_outline" onClick={fetchDashboardData}>
            <MdRefresh /> Reload
          </button>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Working Hours</th>
                  <th>Status</th>
                  <th>Late</th>
                  <th>Overtime</th>
                  <th>Early Checkout</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                ) : recentAttendance.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">No attendance records for today</td></tr>
                ) : (
                  recentAttendance.map((record) => (
                    <tr key={record._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          {record.employeeId?.image ? (
                            <img
                              src={record.employeeId.image}
                              alt={record.emp}
                              className="d_table_avatar me-2"
                              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div className="d-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 36, height: 36, fontSize: 14 }}>
                              {record.emp?.charAt(0) || 'E'}
                            </div>
                          )}
                          <div>
                            <div className="fw-bold">{record.emp}</div>
                            <small className="text-muted">{record.empId}</small>
                          </div>
                        </div>
                      </td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.hours}</td>
                      <td>
                        <span className={`d_badge ${record.status === 'Present' ? 'd_success' : record.status === 'Absent' ? 'd_danger' : record.status === 'Late' ? 'd_warning' : 'd_info'}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.lateMinutes || 0} min</td>
                      <td>{record.overtimeMinutes || 0} min</td>
                      <td>
                        {record.earlyCheckout ? (
                          <span className="d_badge d_danger" style={{ cursor: 'pointer' }} onClick={() => handleEarlyCheckout(record)} title="Click to view details">
                            <MdHighlightOff /> Yes
                          </span>
                        ) : (
                          <span className="d_badge d_success">
                            <MdCheckCircle /> No
                          </span>
                        )}
                      </td>
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

export default AttendanceDashboard;
