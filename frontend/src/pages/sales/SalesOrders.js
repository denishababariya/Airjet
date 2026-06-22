import React from 'react';
import { MdAdd, MdEdit, MdVisibility, MdShoppingBag } from 'react-icons/md';

const orders = [
  { so: 'SO-2026-0088', customer: 'Arvind Limited', orderDate: '19 Jun 2026', delivery: '28 Jun 2026', items: 4, amount: 54200, payment: 'Paid', deliveryStatus: 'Dispatched' },
  { so: 'SO-2026-0087', customer: 'Vardhman Textiles Ltd', orderDate: '18 Jun 2026', delivery: '26 Jun 2026', items: 6, amount: 87500, payment: 'Pending', deliveryStatus: 'Processing' },
  { so: 'SO-2026-0086', customer: 'Welspun India Ltd', orderDate: '16 Jun 2026', delivery: '24 Jun 2026', items: 3, amount: 38900, payment: 'Paid', deliveryStatus: 'Delivered' },
  { so: 'SO-2026-0085', customer: 'Sri Ramakrishna Mills', orderDate: '14 Jun 2026', delivery: '22 Jun 2026', items: 5, amount: 72600, payment: 'Partial', deliveryStatus: 'Delivered' },
  { so: 'SO-2026-0084', customer: 'Bhilwara Spinners Pvt Ltd', orderDate: '12 Jun 2026', delivery: '20 Jun 2026', items: 8, amount: 132000, payment: 'Paid', deliveryStatus: 'Delivered' },
];

const payBadge = s => {
  if (s === 'Paid') return 'd_success';
  if (s === 'Pending') return 'd_danger';
  return 'd_warning';
};

const delivBadge = s => {
  if (s === 'Delivered') return 'd_success';
  if (s === 'Dispatched') return 'd_info';
  return 'd_warning';
};

export default function SalesOrders() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Sales Orders</div>
          <div className="d_page_subtitle">Track all customer sales orders</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Sales Order</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdShoppingBag /></span>Sales Orders List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>SO Number</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Delivery Date</th>
                  <th>Items</th>
                  <th>Amount (₹)</th>
                  <th>Payment Status</th>
                  <th>Delivery Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.so}>
                    <td><strong>{o.so}</strong></td>
                    <td>{o.customer}</td>
                    <td>{o.orderDate}</td>
                    <td>{o.delivery}</td>
                    <td>{o.items}</td>
                    <td>₹{o.amount.toLocaleString('en-IN')}</td>
                    <td><span className={`d_badge ${payBadge(o.payment)}`}>{o.payment}</span></td>
                    <td><span className={`d_badge ${delivBadge(o.deliveryStatus)}`}>{o.deliveryStatus}</span></td>
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
