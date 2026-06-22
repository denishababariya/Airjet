import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdDescription } from 'react-icons/md';

const quotations = [
  { no: 'QT-2026-0055', customer: 'Vardhman Textiles Ltd', date: '20 Jun 2026', valid: '20 Jul 2026', items: 6, amount: 87500, status: 'Sent' },
  { no: 'QT-2026-0054', customer: 'Arvind Limited', date: '18 Jun 2026', valid: '18 Jul 2026', items: 4, amount: 54200, status: 'Accepted' },
  { no: 'QT-2026-0053', customer: 'Bhilwara Spinners Pvt Ltd', date: '15 Jun 2026', valid: '15 Jul 2026', items: 8, amount: 132000, status: 'Draft' },
  { no: 'QT-2026-0052', customer: 'Welspun India Ltd', date: '12 Jun 2026', valid: '12 Jul 2026', items: 3, amount: 38900, status: 'Rejected' },
  { no: 'QT-2026-0051', customer: 'Sri Ramakrishna Mills', date: '10 Jun 2026', valid: '10 Jul 2026', items: 5, amount: 72600, status: 'Accepted' },
];

const statusBadge = s => {
  if (s === 'Accepted') return 'd_success';
  if (s === 'Rejected') return 'd_danger';
  if (s === 'Sent') return 'd_info';
  return 'd_warning';
};

const tabs = ['All', 'Draft', 'Sent', 'Accepted', 'Rejected'];

export default function Quotations() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = quotations.filter(q => activeTab === 'All' || q.status === activeTab);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Quotations</div>
          <div className="d_page_subtitle">Manage quotations sent to customers</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Quotation</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_tabs">
            {tabs.map(t => (
              <button key={t} className={`d_tab_btn${activeTab === t ? ' d_active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Quot No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Valid Until</th>
                  <th>Items</th>
                  <th>Amount (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.no}>
                    <td><strong>{q.no}</strong></td>
                    <td>{q.customer}</td>
                    <td>{q.date}</td>
                    <td>{q.valid}</td>
                    <td>{q.items}</td>
                    <td>₹{q.amount.toLocaleString('en-IN')}</td>
                    <td><span className={`d_badge ${statusBadge(q.status)}`}>{q.status}</span></td>
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
    </div>
  );
}
