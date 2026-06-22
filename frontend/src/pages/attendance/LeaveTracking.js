import React, { useState } from 'react';
import { MdEdit, MdDelete, MdVisibility, MdEventNote } from 'react-icons/md';

const leaves = [
  { id: 'LV001', emp: 'Kavita Singh', type: 'Annual', from: '20 Jun 2026', to: '22 Jun 2026', days: 3, reason: 'Family function', status: 'Approved' },
  { id: 'LV002', emp: 'Deepak Rao', type: 'Sick', from: '15 Jun 2026', to: '16 Jun 2026', days: 2, reason: 'Fever and cold', status: 'Approved' },
  { id: 'LV003', emp: 'Mahesh Pandey', type: 'Casual', from: '25 Jun 2026', to: '25 Jun 2026', days: 1, reason: 'Personal work', status: 'Pending' },
  { id: 'LV004', emp: 'Pooja Tiwari', type: 'Sick', from: '18 Jun 2026', to: '19 Jun 2026', days: 2, reason: 'Medical treatment', status: 'Approved' },
  { id: 'LV005', emp: 'Harish Bhat', type: 'Annual', from: '10 Jun 2026', to: '12 Jun 2026', days: 3, reason: 'Vacation', status: 'Rejected' },
  { id: 'LV006', emp: 'Sunita Verma', type: 'Casual', from: '28 Jun 2026', to: '28 Jun 2026', days: 1, reason: 'Bank work', status: 'Pending' },
];

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

  const filtered = leaves.filter(l => {
    if (activeTab === 'All Leaves') return true;
    if (activeTab === 'Pending Approval') return l.status === 'Pending';
    if (activeTab === 'Approved') return l.status === 'Approved';
    if (activeTab === 'Rejected') return l.status === 'Rejected';
    return true;
  });

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Leave Tracking</div>
          <div className="d_page_subtitle">Manage and monitor employee leave requests</div>
        </div>
        <button className="d_btn d_btn_primary"><MdEventNote /> Apply Leave</button>
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
                  <th>Leave ID</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From Date</th>
                  <th>To Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
