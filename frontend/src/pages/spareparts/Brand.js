import React from 'react';
import { MdAdd, MdEdit, MdDelete, MdBrandingWatermark } from 'react-icons/md';

const brands = [
  { id: 'BR001', name: 'Picanol', country: 'Belgium', contact: 'info@picanol.be', parts: 78, status: 'Active' },
  { id: 'BR002', name: 'Tsudakoma', country: 'Japan', contact: 'sales@tsudakoma.co.jp', parts: 54, status: 'Active' },
  { id: 'BR003', name: 'Toyota Industries', country: 'Japan', contact: 'textile@toyota-industries.com', parts: 61, status: 'Active' },
  { id: 'BR004', name: 'Dornier', country: 'Germany', contact: 'spares@lindauer-dornier.com', parts: 42, status: 'Active' },
  { id: 'BR005', name: 'Staubli', country: 'Switzerland', contact: 'textile@staubli.com', parts: 35, status: 'Active' },
  { id: 'BR006', name: 'Grob Horgen', country: 'Switzerland', contact: 'contact@grob-horgen.ch', parts: 18, status: 'Inactive' },
];

export default function Brand() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Brands</div>
          <div className="d_page_subtitle">Manage spare part manufacturers and brands</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Brand</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBrandingWatermark /></span>Brands List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Brand ID</th>
                  <th>Brand Name</th>
                  <th>Country</th>
                  <th>Contact</th>
                  <th>Total Parts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(b => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td><strong>{b.name}</strong></td>
                    <td>{b.country}</td>
                    <td>{b.contact}</td>
                    <td><span className="d_badge d_primary">{b.parts}</span></td>
                    <td><span className={`d_badge ${b.status === 'Active' ? 'd_success' : 'd_danger'}`}>{b.status}</span></td>
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
