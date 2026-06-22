import React, { useState } from 'react';
import { MdAdd, MdEdit, MdVisibility, MdShoppingCart } from 'react-icons/md';

const orders = [
  { po: 'PO-2026-0041', supplier: 'Picanol Spare Parts India', date: '18 Jun 2026', items: 8, amount: 124500, delivery: '28 Jun 2026', status: 'In Transit' },
  { po: 'PO-2026-0040', supplier: 'Tsudakoma Components Hub', date: '15 Jun 2026', items: 5, amount: 87200, delivery: '25 Jun 2026', status: 'Received' },
  { po: 'PO-2026-0039', supplier: 'Toyota Industries Parts Centre', date: '12 Jun 2026', items: 12, amount: 215000, delivery: '22 Jun 2026', status: 'Received' },
  { po: 'PO-2026-0038', supplier: 'Dornier Loom Parts Distributor', date: '10 Jun 2026', items: 3, amount: 45600, delivery: '30 Jun 2026', status: 'Pending' },
  { po: 'PO-2026-0037', supplier: 'Sulzer Rüti Spare Parts Co', date: '05 Jun 2026', items: 6, amount: 98000, delivery: '15 Jun 2026', status: 'Cancelled' },
];

const statusBadge = s => {
  if (s === 'Received') return 'd_success';
  if (s === 'Cancelled') return 'd_danger';
  if (s === 'In Transit') return 'd_info';
  return 'd_warning';
};

const tabs = ['All', 'Pending', 'Received', 'In Transit', 'Cancelled'];

export default function PurchaseOrders() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = orders.filter(o => activeTab === 'All' || o.status === activeTab);

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Purchase Orders</div>
          <div className="d_page_subtitle">Manage purchase orders for airjet loom spare parts</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New PO</button>
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
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Order Date</th>
                  <th>Items Count</th>
                  <th>Total Amount (₹)</th>
                  <th>Expected Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.po}>
                    <td><strong>{o.po}</strong></td>
                    <td>{o.supplier}</td>
                    <td>{o.date}</td>
                    <td>{o.items}</td>
                    <td>₹{o.amount.toLocaleString('en-IN')}</td>
                    <td>{o.delivery}</td>
                    <td><span className={`d_badge ${statusBadge(o.status)}`}>{o.status}</span></td>
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
