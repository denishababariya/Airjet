import React, { useState, useEffect, useCallback } from 'react';
import { MdAccessTime, MdWarning, MdPeople, MdBusiness, MdRefresh } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

export default function LateEntryReport() {
  const [lateEntries, setLateEntries] = useState([]);
  const [stats, setStats] = useState({ totalLate: 0, totalLateMinutes: 0, avgLateMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchLateEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await attendanceApi.getLateEntries(params);
      setLateEntries(res.data.lateEntries || []);
      setStats(res.data.stats || { totalLate: 0, totalLateMinutes: 0, avgLateMinutes: 0 });
    } catch (err) {
      console.error('Failed to fetch late entries:', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchLateEntries(); }, [fetchLateEntries]);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Late Entry Report</div>
          <div className="d_page_subtitle">Employees with late check-in entries</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <input type="date" className="d_form_input d_input_sm" value={startDate} onChange={e => setStartDate(e.target.value)} placeholder="From" />
          <input type="date" className="d_form_input d_input_sm" value={endDate} onChange={e => setEndDate(e.target.value)} placeholder="To" />
          <button className="d_btn d_btn_outline" onClick={fetchLateEntries}><MdRefresh /> Refresh</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdPeople /></span>Total Late Entries</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-accent)' }}>{stats.totalLate}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span>Avg Delay</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-warning)' }}>{stats.avgLateMinutes} min</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdBusiness /></span>Total Late Minutes</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-danger)' }}>{stats.totalLateMinutes}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdWarning /></span> Late Entry Details</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Emp ID</th><th>Name</th><th>Department</th><th>Date</th>
                  <th>Scheduled</th><th>Actual In</th><th>Delay (min)</th><th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                ) : lateEntries.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">No late entries found</td></tr>
                ) : (
                  lateEntries.map(e => (
                    <tr key={e._id}>
                      <td>{e.empId}</td>
                      <td>{e.emp}</td>
                      <td>{e.department}</td>
                      <td>{e.date}</td>
                      <td>09:00 AM</td>
                      <td>{e.checkIn}</td>
                      <td>
                        <span className={`d_badge ${e.lateMinutes > 30 ? 'd_danger' : e.lateMinutes > 15 ? 'd_warning' : 'd_info'}`}>
                          {e.lateMinutes} min
                        </span>
                      </td>
                      <td>--</td>
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
}
