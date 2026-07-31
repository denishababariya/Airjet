import React, { useState, useEffect } from 'react';
import { MdWarning, MdPeople, MdBusiness, MdAccessTime, MdSearch, MdFilterList } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const LateEntryReport = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await attendanceApi.getLateEntries(params);
      setEntries(res.data.lateEntries || []);
    } catch (err) {
      console.error('Failed to fetch late entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const avgDelay = entries.length > 0
    ? Math.round(entries.reduce((sum, e) => sum + (e.lateMinutes || 0), 0) / entries.length)
    : 0;

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Late Entry Report</h1>
          <p className="d_page_subtitle">Employees with late check-in entries</p>
        </div>
        <div className="d-flex gap-2">
          <input
            type="date"
            className="d_form_control"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ width: 150 }}
          />
          <input
            type="date"
            className="d_form_control"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ width: 150 }}
          />
          <button className="d_btn d_btn_primary" onClick={fetchReport}>
            <MdFilterList /> Apply
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: 'var(--d-warning)' }}>{entries.length}</div>
                  <div className="d_stat_label">Total Late Entries</div>
                </div>
                <div className="d_stat_icon" style={{ color: 'var(--d-warning)', backgroundColor: '#fffbeb', fontSize: 32, padding: 8, borderRadius: 8 }}><MdWarning /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: '#f59e0b' }}>{avgDelay} min</div>
                  <div className="d_stat_label">Average Delay</div>
                </div>
                <div className="d_stat_icon" style={{ color: '#f59e0b', backgroundColor: '#fffbeb', fontSize: 32, padding: 8, borderRadius: 8 }}><MdAccessTime /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: '#3b82f6' }}>{entries.length > 0 ? entries[0]?.department || 'N/A' : 'N/A'}</div>
                  <div className="d_stat_label">Most Late Department</div>
                </div>
                <div className="d_stat_icon" style={{ color: '#3b82f6', backgroundColor: '#eff6ff', fontSize: 32, padding: 8, borderRadius: 8 }}><MdBusiness /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdWarning /></span>
            Late Entry Details
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-4 text-muted">No late entries found</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Scheduled</th>
                    <th>Actual In</th>
                    <th>Delay</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e._id}>
                      <td><code>{e.empId}</code></td>
                      <td>
                        <div className="d-flex align-items-center">
                          {e.employeeId?.image ? (
                            <img src={e.employeeId.image} alt={e.emp} className="d_table_avatar me-2" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="d-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {e.emp?.charAt(0)}
                            </div>
                          )}
                          {e.emp}
                        </div>
                      </td>
                      <td>{typeof e.department === 'object' ? e.department?.title : (e.department || 'N/A')}</td>
                      <td>{e.date}</td>
                      <td>09:00 AM</td>
                      <td>{e.checkIn}</td>
                      <td>
                        <span className={`d_badge ${e.lateMinutes > 30 ? 'd_danger' : e.lateMinutes > 15 ? 'd_warning' : 'd_info'}`}>
                          {e.lateMinutes} min
                        </span>
                      </td>
                      <td>—</td>
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

export default LateEntryReport;
