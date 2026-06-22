import React from 'react';
import { MdAdd, MdEdit, MdDelete, MdRemoveCircle } from 'react-icons/md';

const deductions = [
  { id: 'DED001', name: 'Provident Fund (PF)', type: 'Percentage', value: '12%', applicable: 'All Employees', status: 'Active' },
  { id: 'DED002', name: 'Employee State Insurance (ESI)', type: 'Percentage', value: '0.75%', applicable: 'Salary ≤ ₹21,000', status: 'Active' },
  { id: 'DED003', name: 'Tax Deducted at Source (TDS)', type: 'Percentage', value: 'As per slab', applicable: 'Taxable Income > ₹2.5L', status: 'Active' },
  { id: 'DED004', name: 'Professional Tax', type: 'Fixed', value: '₹200', applicable: 'All Employees', status: 'Active' },
  { id: 'DED005', name: 'Loan Repayment', type: 'Fixed', value: '₹5,000', applicable: 'Loan Account Holders', status: 'Active' },
  { id: 'DED006', name: 'Salary Advance Recovery', type: 'Fixed', value: '₹2,500', applicable: 'Advance Account Holders', status: 'Inactive' },
];

export default function Deductions() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Deductions Management</div>
          <div className="d_page_subtitle">Configure salary deduction components</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Deduction</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdRemoveCircle /></span>Deductions List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Deduction ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Applicable To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map(d => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.name}</td>
                    <td><span className={`d_badge ${d.type === 'Fixed' ? 'd_info' : 'd_warning'}`}>{d.type}</span></td>
                    <td><strong>{d.value}</strong></td>
                    <td>{d.applicable}</td>
                    <td><span className={`d_badge ${d.status === 'Active' ? 'd_success' : 'd_danger'}`}>{d.status}</span></td>
                    <td>
                      <div className="d_action_btns">
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
