import React, { useState, useEffect, useCallback } from 'react';
import { MdEdit, MdDelete, MdVisibility, MdEventNote, MdRefresh, MdAdd } from 'react-icons/md';
import { attendanceApi } from '../../utils/api';

const statusBadge = (status) => {
  if (status === 'Approved') return 'd_success';
  if (status === 'Rejected') return 'd_danger';
  return 'd_warning';
};

const typeBadge = (type) => {
  if (type === 'Sick') return 'd_danger';
  if (type === 'Annual') return 'd_info';
  return 'd_primary';
};

const tabs = ['All Leaves', 'Pending Approval', 'Approved', 'Rejected'];

export default function LeaveTracking() {
  const [activeTab, setActiveTab] = useState('All Leaves');
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, totalDays: 0 });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = { month, year };
      const res = await attendanceApi.getLeave(params);
      setLeaves(res.data.records || []);
      setStats(res.data.stats || { total: 0, approved: 0, pending: 0, rejected: 0, totalDays: 0 });
    } catch (err) {
      console.error('Failed to fetch leave data:', err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const filtered = leaves.filter(l => {
    if (activeTab === 'All Leaves') return true;
    if (activeTab === 'Pending Approval') return l.status === 'Pending';
    if (activeTab === 'Approved') return l.status === 'Approved';
    if (activeTab === 'Rejected') return l.status === 'Rejected';
    return true;
  });

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Leave Tracking</div>
          <div className="d_page_subtitle">Manage and monitor employee leave requests</div>
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
          <button className="d_btn d_btn_outline" onClick={fetchLeaves}><MdRefresh /> Refresh</button>
          <button className="d_btn d_btn_primary"><MdAdd /> Apply Leave</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdEventNote /></span>Total Leaves</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-primary)' }}>{stats.total}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon" style={{ color: 'var(--d-success)' }}>✓</span>Approved</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-success)' }}>{stats.approved}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon" style={{ color: 'var(--d-warning)' }}>⏳</span>Pending</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-warning)' }}>{stats.pending}</div>
        </div>
        <div className="d_card">
          <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon" style={{ color: 'var(--d-danger)' }}>✗</span>Rejected</div></div>
          <div className="d_card_body" style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-danger)' }}>{stats.rejected}</div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`d_tab_btn${activeTab === tab ? ' d_active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Leave ID</th><th>Employee</th><th>Type</th><th>From Date</th>
                  <th>To Date</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-4">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-4 text-muted">No leave records found</td></tr>
                ) : (
                  filtered.map(l => (
                    <tr key={l._id}>
                      <td>{l.id || l.empId}</td>
                      <td>{l.emp}</td>
                      <td><span className={`d_badge ${typeBadge(l.type)}`}>{l.type}</span></td>
                      <td>{l.from}</td>
                      <td>{l.to}</td>
                      <td>{l.days}</td>
                      <td>{l.reason}</td>
                      <td><span className={`d_badge ${statusBadge(l.status)}`}>{l.status}</span></td>
                      <td>
                        <div className="d_action_btns">
                          <button className="d_icon_btn d_view"><MdVisibility /></button>
                          <button className="d_icon_btn d_edit"><MdEdit /></button>
                          <button className="d_icon_btn d_del"><MdDelete /></button>
                        </div>
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
}
