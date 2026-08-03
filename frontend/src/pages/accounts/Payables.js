import React, { useState, useEffect } from 'react';
import { MdVisibility, MdEdit, MdAccountBalance, MdMonetizationOn, MdWarning, MdRefresh } from 'react-icons/md';
import { accountsApi } from '../../utils/api';

const statusBadge = s => {
  if (s === 'Paid') return 'd_success';
  if (s === 'Overdue') return 'd_danger';
  return 'd_warning';
};

export default function Payables() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayables = async () => {
    try {
      const res = await accountsApi.getAll('accounts', 'payable');
      const data = res.data || [];
      setPayables(data);
    } catch {
      setPayables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayables();
  }, []);

  const totalPayable = payables
    .filter(p => p.status !== 'Paid' && p.status !== 'Collected')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const overdueAmt = payables
    .filter(p => p.status === 'Overdue')
    .reduce((s, p) => s + (p.amount || 0), 0);
  const paidAmt = payables
    .filter(p => p.status === 'Paid')
    .reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Payables</div>
          <div className="d_page_subtitle">Track supplier outstanding payments and dues</div>
        </div>
        <button className="d_btn d_btn_outline d_btn_sm" onClick={fetchPayables}>
          <MdRefresh style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-3">Loading payables…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Total Payable</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalPayable.toLocaleString('en-IN')}</div>
            </div>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdWarning /></span>Overdue</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-danger)' }}>₹{overdueAmt.toLocaleString('en-IN')}</div>
            </div>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Paid</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{paidAmt.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="d_card">
            <div className="d_card_header">
              <div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Payables List</div>
            </div>
            <div className="d_card_body">
              <div className="d_table_wrap">
                <table className="d_table" style={{ minWidth: 750 }}>
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Supplier</th>
                      <th>PO No.</th>
                      <th>Amount (₹)</th>
                      <th>PO Date</th>
                      <th>Due Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payables.length === 0 && <tr className="d_empty"><td colSpan={9}>No payables found.</td></tr>}
                    {payables.map(p => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td><strong>{p.supplier || p.party || '—'}</strong></td>
                        <td><code>{p.po || p.id}</code></td>
                        <td>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td>{p.poDate || p.date || '—'}</td>
                        <td>{p.dueDate || p.due || '—'}</td>
                        <td style={{ color: (p.days || '').startsWith('-') ? 'var(--d-danger)' : 'inherit' }}>{p.days || '—'}</td>
                        <td><span className={`d_badge ${statusBadge(p.status)}`}>{p.status}</span></td>
                        <td>
                          <div className="d_action_btns">
                            <button className="d_icon_btn d_view"><MdVisibility /></button>
                            <button className="d_icon_btn d_edit"><MdEdit /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
