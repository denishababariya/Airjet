import React, { useState } from 'react';
import { MdVisibility, MdDownload, MdAdd, MdReceipt } from 'react-icons/md';

const invoices = [
  { no: 'INV-2026-0112', customer: 'Arvind Limited', date: '20 Jun 2026', due: '20 Jul 2026', amount: 54200, gst: 9756, total: 63956, status: 'Paid' },
  { no: 'INV-2026-0111', customer: 'Welspun India Ltd', date: '17 Jun 2026', due: '17 Jul 2026', amount: 38900, gst: 7002, total: 45902, status: 'Unpaid' },
  { no: 'INV-2026-0110', customer: 'Sri Ramakrishna Mills', date: '15 Jun 2026', due: '15 Jul 2026', amount: 72600, gst: 13068, total: 85668, status: 'Paid' },
  { no: 'INV-2026-0109', customer: 'Vardhman Textiles Ltd', date: '10 Jun 2026', due: '10 Jul 2026', amount: 87500, gst: 15750, total: 103250, status: 'Overdue' },
  { no: 'INV-2026-0108', customer: 'Bhilwara Spinners Pvt Ltd', date: '05 Jun 2026', due: '05 Jul 2026', amount: 132000, gst: 23760, total: 155760, status: 'Paid' },
];

const statusBadge = s => {
  if (s === 'Paid') return 'd_success';
  if (s === 'Overdue') return 'd_danger';
  return 'd_warning';
};

const tabs = ['All', 'Unpaid', 'Paid', 'Overdue'];

export default function Invoices() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = invoices.filter(i => activeTab === 'All' || i.status === activeTab);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Invoices</div>
          <div className="d_page_subtitle">Manage customer invoices and payment status</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Invoice</button>
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
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount (₹)</th>
                  <th>GST (₹)</th>
                  <th>Total (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.no}>
                    <td><strong>{i.no}</strong></td>
                    <td>{i.customer}</td>
                    <td>{i.date}</td>
                    <td>{i.due}</td>
                    <td>{i.amount.toLocaleString('en-IN')}</td>
                    <td>{i.gst.toLocaleString('en-IN')}</td>
                    <td><strong>₹{i.total.toLocaleString('en-IN')}</strong></td>
                    <td><span className={`d_badge ${statusBadge(i.status)}`}>{i.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit"><MdDownload /></button>
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
