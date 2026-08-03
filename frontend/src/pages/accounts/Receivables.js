import React, { useState, useEffect } from 'react';
import { MdVisibility, MdEdit, MdAccountBalance, MdMonetizationOn, MdWarning, MdRefresh } from 'react-icons/md';
import { accountsApi } from '../../utils/api';

const statusBadge = s => {
  if (s === 'Collected') return 'd_success';
  if (s === 'Overdue') return 'd_danger';
  return 'd_warning';
};

export default function Receivables() {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivables = async () => {
    try {
      const res = await accountsApi.getAll('accounts', 'receivable');
      const data = res.data || [];
      setReceivables(data);
    } catch {
      setReceivables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  const totalReceivable = receivables
    .filter(r => r.status !== 'Collected' && r.status !== 'Paid')
    .reduce((s, r) => s + (r.amount || 0), 0);
  const overdue = receivables
    .filter(r => r.status === 'Overdue')
    .reduce((s, r) => s + (r.amount || 0), 0);
  const collected = receivables
    .filter(r => r.status === 'Collected')
    .reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Receivables</div>
          <div className="d_page_subtitle">Track customer outstanding amounts and collections</div>
        </div>
        <button className="d_btn d_btn_outline d_btn_sm" onClick={fetchReceivables}>
          <MdRefresh style={{ marginRight: 4 }} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-3">Loading receivables…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Total Receivable</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-accent)' }}>₹{totalReceivable.toLocaleString('en-IN')}</div>
            </div>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdWarning /></span>Overdue</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-danger)' }}>₹{overdue.toLocaleString('en-IN')}</div>
            </div>
            <div className="d_card">
              <div className="d_card_header"><div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Collected</div></div>
              <div className="d_card_body" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--d-success)' }}>₹{collected.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="d_card">
            <div className="d_card_header">
              <div className="d_card_title"><span className="d_card_icon"><MdAccountBalance /></span>Receivables List</div>
            </div>
            <div className="d_card_body">
              <div className="d_table_wrap">
                <table className="d_table" style={{ minWidth: 750 }}>
                  <thead>
                    <tr>
                      <th>Ref ID</th>
                      <th>Customer</th>
                      <th>Invoice No.</th>
                      <th>Amount (₹)</th>
                      <th>Invoice Date</th>
                      <th>Due Date</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivables.length === 0 && <tr className="d_empty"><td colSpan={9}>No receivables found.</td></tr>}
                    {receivables.map(r => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td><strong>{r.customer || r.party || '—'}</strong></td>
                        <td><code>{r.invoice || r.id}</code></td>
                        <td>₹{(r.amount || 0).toLocaleString('en-IN')}</td>
                        <td>{r.invoiceDate || r.date || '—'}</td>
                        <td>{r.dueDate || r.due || '—'}</td>
                        <td style={{ color: (r.days || '').startsWith('-') ? 'var(--d-danger)' : 'inherit' }}>{r.days || '—'}</td>
                        <td><span className={`d_badge ${statusBadge(r.status)}`}>{r.status}</span></td>
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
