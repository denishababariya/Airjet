import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { MdSearch, MdEdit, MdAccessTime, MdPeople, MdEventBusy, MdBeachAccess, MdRefresh, MdWarning, MdClose } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const statusBadge = (status) => {
  if (status === 'Present') return 'd_success';
  if (status === 'Absent') return 'd_danger';
  if (status === 'Late') return 'd_warning';
  return 'd_info';
};

export default function CheckInOut() {
  const history = useHistory();
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, onLeave: 0, earlyCheckout: 0 });
  const [popupRecord, setPopupRecord] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await attendanceApi.getToday();
      setAttendance(response.data);
      setStats({
        present: response.data.filter(a => a.status === 'Present').length,
        absent: response.data.filter(a => a.status === 'Absent').length,
        onLeave: response.data.filter(a => a.status === 'Leave').length,
        earlyCheckout: response.data.filter(a => a.earlyCheckout === true).length,
      });
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = attendance.filter(a =>
    a.emp?.toLowerCase().includes(search.toLowerCase()) ||
    a.empId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEarlyCheckoutClick = (record) => {
    setPopupRecord(record);
  };

  const closePopup = () => {
    setPopupRecord(null);
  };

  const handleRedirectToCheckOut = () => {
    closePopup();
    history.push('/attendance');
  };

  return (
    <div>
      {popupRecord && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="d_card" style={{ maxWidth: 450, width: '90%', zIndex: 1051 }}>
            <div className="d_card_header">
              <div className="d_card_title" style={{ color: 'var(--d-warning)' }}>
                <MdWarning /> Early Check-Out Alert


                
              </div>
              <button className="d_btn d_btn_sm d_btn_outline" onClick={closePopup}><MdClose /></button>
            </div>
            <div className="d_card_body">
              <p><strong>{popupRecord.emp}</strong> (ID: {popupRecord.empId})</p>
              <p>Checked out at <strong>{popupRecord.checkOut}</strong> which is before the regular 6:00 PM end time.</p>
              <p className="text-muted">Regular hours are 9:00 AM to 6:00 PM. Please ensure proper check-out timing.</p>
              <div className="d-flex gap-2 mt-3">
                <button className="d_btn d_btn_primary" onClick={handleRedirectToCheckOut}>
                  Go to Check-Out Page
                </button>
                <button className="d_btn d_btn_outline" onClick={closePopup}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Check In / Out</div>
          <div className="d_page_subtitle">Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
        <button className="d_btn d_btn_outline" onClick={fetchAttendance}>
          <MdRefresh /> Refresh
        </button>
      </div>

      <div className="d_summary_pills">
        <span className="d_badge d_success"><MdPeople /> Present: {stats.present}</span>
        <span className="d_badge d_danger"><MdEventBusy /> Absent: {stats.absent}</span>
        <span className="d_badge d_warning"><MdBeachAccess /> On Leave: {stats.onLeave}</span>
        {stats.earlyCheckout > 0 && (
          <span className="d_badge d_danger"><MdWarning /> Early Checkout: {stats.earlyCheckout}</span>
        )}
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Attendance Log
          </div>
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
        <div className="d_card_body">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 750 }}>
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                    <th>Status</th>
                    <th>Late</th>
                    <th>Early Checkout</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-4">No attendance records found</td></tr>
                  ) : (
                    filtered.map(a => (
                      <tr key={a._id}>
                        <td>{a.empId}</td>
                        <td>{a.emp}</td>
                        <td>{a.checkIn}</td>
                        <td>{a.checkOut}</td>
                        <td>{a.hours}</td>
                        <td><span className={`d_badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                        <td>
                          {a.lateMinutes > 0
                            ? <span className="d_badge d_warning">{a.lateMinutes} min</span>
                            : <span className="d_badge d_info">—</span>}
                        </td>
                        <td>
                          {a.earlyCheckout ? (
                            <span className="d_badge d_danger" style={{ cursor: 'pointer' }} onClick={() => handleEarlyCheckoutClick(a)}>
                              <MdWarning /> Yes
                            </span>
                          ) : (
                            <span className="d_badge d_success">No</span>
                          )}
                        </td>
                        <td>
                          <div className="d_action_btns">
                            <button className="d_icon_btn d_edit"><MdEdit /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}