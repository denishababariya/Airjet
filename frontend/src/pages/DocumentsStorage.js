import React from 'react';
import { MdFolder, MdUploadFile, MdDownload, MdDelete, MdVisibility } from 'react-icons/md';

const data = [
  { id: 'DOC001', emp: 'Rajesh Kumar',  type: 'Aadhar Card',    uploaded: '10-Jan-2024', size: '420 KB', status: 'Verified' },
  { id: 'DOC002', emp: 'Rajesh Kumar',  type: 'PAN Card',       uploaded: '10-Jan-2024', size: '310 KB', status: 'Verified' },
  { id: 'DOC003', emp: 'Priya Sharma',  type: 'Aadhar Card',    uploaded: '12-Jan-2024', size: '390 KB', status: 'Verified' },
  { id: 'DOC004', emp: 'Priya Sharma',  type: 'Degree Cert',    uploaded: '12-Jan-2024', size: '1.2 MB', status: 'Pending' },
  { id: 'DOC005', emp: 'Amit Patel',    type: 'Offer Letter',   uploaded: '15-Jan-2024', size: '210 KB', status: 'Verified' },
  { id: 'DOC006', emp: 'Karan Mehta',   type: 'Experience Cert',uploaded: '18-Jan-2024', size: '540 KB', status: 'Pending' },
];

const statusClass = { Verified: 'd_success', Pending: 'd_warning', Rejected: 'd_danger' };

const DocumentsStorage = () => (
  <div>
    <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
      <div>
        <h1 className="d_page_title">Documents Storage</h1>
        <p className="d_page_subtitle">Employee documents repository</p>
      </div>
      <button className="d_btn d_btn_primary"><MdUploadFile /> Upload Document</button>
    </div>
    <div className="d_card">
      <div className="d_card_header">
        <h2 className="d_card_title"><MdFolder className="d_card_icon" /> All Documents</h2>
      </div>
      <div className="d_card_body p-0">
        <div className="d_table_wrap">
          <table className="d_table">
            <thead>
              <tr><th>Doc ID</th><th>Employee</th><th>Document Type</th><th>Upload Date</th><th>File Size</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td><code>{d.id}</code></td>
                  <td><strong>{d.emp}</strong></td>
                  <td>{d.type}</td>
                  <td>{d.uploaded}</td>
                  <td>{d.size}</td>
                  <td><span className={`d_badge ${statusClass[d.status]}`}>{d.status}</span></td>
                  <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button><button className="d_icon_btn d_edit"><MdDownload /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
export default DocumentsStorage;
