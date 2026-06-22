import React from 'react';
import { MdAdd, MdEdit, MdDelete, MdPrecisionManufacturing } from 'react-icons/md';

const models = [
  { id: 'MDL001', model: 'Picanol Omni Plus 800', manufacturer: 'Picanol', yearFrom: 2010, yearTo: 2020, parts: 145, status: 'Active' },
  { id: 'MDL002', model: 'Picanol OptiMax-i', manufacturer: 'Picanol', yearFrom: 2018, yearTo: 2026, parts: 162, status: 'Active' },
  { id: 'MDL003', model: 'Tsudakoma ZAX9100', manufacturer: 'Tsudakoma', yearFrom: 2012, yearTo: 2022, parts: 118, status: 'Active' },
  { id: 'MDL004', model: 'Toyota JAT810', manufacturer: 'Toyota Industries', yearFrom: 2015, yearTo: 2026, parts: 134, status: 'Active' },
  { id: 'MDL005', model: 'Dornier AWS Airjet', manufacturer: 'Dornier', yearFrom: 2008, yearTo: 2018, parts: 97, status: 'Active' },
  { id: 'MDL006', model: 'Sulzer Rüti R9500', manufacturer: 'Sulzer', yearFrom: 2000, yearTo: 2012, parts: 74, status: 'Inactive' },
];

export default function CompatibleModels() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Compatible Machine Models</div>
          <div className="d_page_subtitle">Manage airjet loom models and their compatible spare parts</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Model</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdPrecisionManufacturing /></span>Machine Models</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Model ID</th>
                  <th>Machine Model</th>
                  <th>Manufacturer</th>
                  <th>Year From</th>
                  <th>Year To</th>
                  <th>Compatible Parts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td><strong>{m.model}</strong></td>
                    <td>{m.manufacturer}</td>
                    <td>{m.yearFrom}</td>
                    <td>{m.yearTo}</td>
                    <td><span className="d_badge d_accent">{m.parts}</span></td>
                    <td><span className={`d_badge ${m.status === 'Active' ? 'd_success' : 'd_danger'}`}>{m.status}</span></td>
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
