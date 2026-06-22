import React, { useState } from 'react';
import { MdBook } from 'react-icons/md';

const ledgerData = [
  { date: '01 Jun 2026', voucher: 'OPN-001', desc: 'Opening Balance', debit: 0, credit: 500000, balance: 500000 },
  { date: '05 Jun 2026', voucher: 'PO-2026-0035', desc: 'Purchase – Sulzer Rüti Spare Parts', debit: 98000, credit: 0, balance: 402000 },
  { date: '10 Jun 2026', voucher: 'INV-2026-0109', desc: 'Sales – Vardhman Textiles Ltd', debit: 0, credit: 103250, balance: 505250 },
  { date: '12 Jun 2026', voucher: 'PO-2026-0039', desc: 'Purchase – Toyota Industries Parts', debit: 215000, credit: 0, balance: 290250 },
  { date: '15 Jun 2026', voucher: 'INV-2026-0110', desc: 'Sales – Sri Ramakrishna Mills', debit: 0, credit: 85668, balance: 375918 },
  { date: '17 Jun 2026', voucher: 'SAL-JUN-001', desc: 'Salary Disbursement – June 2026', debit: 277700, credit: 0, balance: 98218 },
  { date: '20 Jun 2026', voucher: 'INV-2026-0112', desc: 'Sales – Arvind Limited', debit: 0, credit: 63956, balance: 162174 },
  { date: '22 Jun 2026', voucher: 'EXP-2026-012', desc: 'Warehouse Rent – June 2026', debit: 45000, credit: 0, balance: 117174 },
];

export default function Ledger() {
  const [party, setParty] = useState('All');

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Ledger</div>
          <div className="d_page_subtitle">Account-wise transaction ledger with running balance</div>
        </div>
      </div>

      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>Party:</label>
            <select className="d_btn d_btn_outline" value={party} onChange={e => setParty(e.target.value)}>
              <option>All</option>
              <option>Arvind Limited</option>
              <option>Vardhman Textiles Ltd</option>
              <option>Toyota Industries Parts</option>
              <option>Sulzer Rüti Spare Parts</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>From:</label>
            <input type="date" defaultValue="2026-06-01" style={{ padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid var(--d-border)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>To:</label>
            <input type="date" defaultValue="2026-06-30" style={{ padding: '0.4rem 0.7rem', borderRadius: 6, border: '1px solid var(--d-border)' }} />
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBook /></span>Ledger Entries — June 2026</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Voucher No.</th>
                  <th>Description</th>
                  <th>Debit (₹)</th>
                  <th>Credit (₹)</th>
                  <th>Balance (₹)</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td><code>{row.voucher}</code></td>
                    <td>{row.desc}</td>
                    <td style={{ color: row.debit > 0 ? 'var(--d-danger)' : 'inherit' }}>
                      {row.debit > 0 ? `₹${row.debit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ color: row.credit > 0 ? 'var(--d-success)' : 'inherit' }}>
                      {row.credit > 0 ? `₹${row.credit.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td><strong>₹{row.balance.toLocaleString('en-IN')}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
