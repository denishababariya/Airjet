import React from 'react';
import { MdAdd, MdEdit, MdDelete, MdCategory } from 'react-icons/md';

const categories = [
  { id: 'CAT001', name: 'Nozzle & Air System', desc: 'Main nozzles, sub nozzles, relay nozzles and air supply components', parts: 42, status: 'Active' },
  { id: 'CAT002', name: 'Reed & Sley', desc: 'Reed profiles, sley swords, sley rail and sley drive components', parts: 28, status: 'Active' },
  { id: 'CAT003', name: 'Shedding & Heald', desc: 'Heald frames, heald wires, cam followers and shedding cam sets', parts: 35, status: 'Active' },
  { id: 'CAT004', name: 'Bearing & Drive', desc: 'Warp beam bearings, take-up bearings and main drive components', parts: 56, status: 'Active' },
  { id: 'CAT005', name: 'Tension & Let-off', desc: 'Warp tension sensors, tension springs, let-off servo motors', parts: 19, status: 'Active' },
  { id: 'CAT006', name: 'Electrical & Sensors', desc: 'Weft feeders, weft sensors, broken end detectors and control cards', parts: 31, status: 'Inactive' },
];

export default function Category() {
  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">Part Categories</div>
          <div className="d_page_subtitle">Manage spare parts classification categories</div>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Category</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdCategory /></span>Categories List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Cat ID</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Total Parts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><strong>{c.name}</strong></td>
                    <td style={{ maxWidth: 300, fontSize: '0.88rem', color: 'var(--d-text-muted)' }}>{c.desc}</td>
                    <td><span className="d_badge d_primary">{c.parts}</span></td>
                    <td><span className={`d_badge ${c.status === 'Active' ? 'd_success' : 'd_danger'}`}>{c.status}</span></td>
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
