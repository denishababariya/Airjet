import React from 'react';
import { MdAdd, MdEdit, MdDelete, MdMonetizationOn } from 'react-icons/md';

const allowances = [
  { id: 'AL001', name: 'House Rent Allowance (HRA)', type: 'Percentage', value: '40%', applicable: 'All Employees', status: 'Active' },
  { id: 'AL002', name: 'Dearness Allowance (DA)', type: 'Percentage', value: '20%', applicable: 'All Employees', status: 'Active' },
  { id: 'AL003', name: 'Travel Allowance', type: 'Fixed', value: '₹1,500', applicable: 'All Employees', status: 'Active' },
  { id: 'AL004', name: 'Medical Allowance', type: 'Fixed', value: '₹1,250', applicable: 'All Employees', status: 'Active' },
  { id: 'AL005', name: 'Special Allowance', type: 'Fixed', value: '₹2,000', applicable: 'Senior Staff', status: 'Active' },
  { id: 'AL006', name: 'Performance Bonus', type: 'Percentage', value: '10%', applicable: 'Sales & Service Teams', status: 'Inactive' },
];

export default function Allowances() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Allowances Management</div>
          <div className="d_page_subtitle">Configure salary allowance components</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Allowance</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Allowances List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Allowance ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Applicable To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allowances.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.name}</td>
                    <td><span className={`d_badge ${a.type === 'Fixed' ? 'd_info' : 'd_primary'}`}>{a.type}</span></td>
                    <td><strong>{a.value}</strong></td>
                    <td>{a.applicable}</td>
                    <td><span className={`d_badge ${a.status === 'Active' ? 'd_success' : 'd_danger'}`}>{a.status}</span></td>
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
