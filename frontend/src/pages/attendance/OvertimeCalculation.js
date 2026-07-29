import React, { useState, useEffect, useCallback } from 'react';
import { MdAccessTime, MdMonetizationOn, MdRefresh } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

export default function OvertimeCalculation() {
  const [overtimeData, setOvertimeData] = useState([]);
  const [stats, setStats] = useState({ totalRecords: 0, totalOvertimeMinutes: 0, totalOvertimeHours: '0' });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchOvertime = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getOvertime({ month, year });
      setOvertimeData(res.data.records || []);
      setStats(res.data.stats || { totalRecords: 0, totalOvertimeMinutes: 0, totalOvertimeHours: '0' });
    } catch (err) {
      console.error('Failed to fetch overtime data:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchOvertime(); }, [fetchOvertime]);

  const totalOT = overtimeData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Overtime Calculation</div>
          <div className="d_page_subtitle">Monthly overtime summary</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <select className="d_form_select d_select_sm" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
            ))}
          </select>
          <select className="d_form_select d_select_sm" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="d_btn d_btn_outline" onClick={fetchOvertime}><MdRefresh /> Refresh</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Total OT Amount</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{totalOT.toLocaleString('en-IN')}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span>Total OT Hours</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-accent)' }}>{stats.totalOvertimeHours} hrs</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span>Total Records</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-primary)' }}>{stats.totalRecords}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdAccessTime /></span> Overtime Details</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Emp ID</th><th>Name</th><th>Department</th><th>Month</th>
                  <th>Regular Hours</th><th>OT Hours</th><th>OT Rate (₹/hr)</th><th>OT Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
                ) : overtimeData.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-4 text-muted">No overtime records found</td></tr>
                ) : (
                  overtimeData.map(r => (
                    <tr key={r._id}>
                      <td>{r.empId || r.emp}</td>
                      <td>{r.emp}</td>
                      <td>{r.employeeId?.department?.title || 'N/A'}</td>
                      <td>{r.date}</td>
                      <td>{r.workingHours || 8}</td>
                      <td>{(r.overtimeMinutes || 0) / 60}</td>
                      <td>₹{r.rate || '--'}</td>
                      <td><strong>₹{(Number(r.amount) || 0).toLocaleString('en-IN')}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'right', fontWeight: 600 }}>Total OT Amount</td>
                  <td><strong>₹{totalOT.toLocaleString('en-IN')}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
