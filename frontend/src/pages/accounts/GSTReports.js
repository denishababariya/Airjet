import React, { useState } from 'react';
import { MdDownload, MdVisibility, MdReceiptLong } from 'react-icons/md';

const gstr1Data = [
  { period: 'Jun 2026', sales: 1245000, taxable: 1056780, cgst: 95110, sgst: 95110, igst: 0, total: 190220, status: 'Pending' },
  { period: 'May 2026', sales: 1382000, taxable: 1171186, cgst: 105407, sgst: 105407, igst: 0, total: 210814, status: 'Filed' },
  { period: 'Apr 2026', sales: 1190000, taxable: 1008474, cgst: 90763, sgst: 90763, igst: 0, total: 181526, status: 'Filed' },
  { period: 'Mar 2026', sales: 1560000, taxable: 1322034, cgst: 118983, sgst: 118983, igst: 0, total: 237966, status: 'Filed' },
];

const tabs = ['GSTR-1', 'GSTR-3B', 'GSTR-2A'];

export default function GSTReports() {
  const [activeTab, setActiveTab] = useState('GSTR-1');

  return (
    <div>
      <div className="d_page_header">
        <div>
          <div className="d_page_title">GST Reports</div>
          <div className="d_page_subtitle">GST filing status and tax summary reports</div>
        </div>
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
          {activeTab === 'GSTR-1' && (
            <div className="d_table_wrap">
              <table className="d_table" style={{ minWidth: 750 }}>
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Total Sales (₹)</th>
                    <th>Taxable Value (₹)</th>
                    <th>CGST (₹)</th>
                    <th>SGST (₹)</th>
                    <th>IGST (₹)</th>
                    <th>Total Tax (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gstr1Data.map(r => (
                    <tr key={r.period}>
                      <td><strong>{r.period}</strong></td>
                      <td>₹{r.sales.toLocaleString('en-IN')}</td>
                      <td>₹{r.taxable.toLocaleString('en-IN')}</td>
                      <td>₹{r.cgst.toLocaleString('en-IN')}</td>
                      <td>₹{r.sgst.toLocaleString('en-IN')}</td>
                      <td>₹{r.igst}</td>
                      <td><strong>₹{r.total.toLocaleString('en-IN')}</strong></td>
                      <td><span className={`d_badge ${r.status === 'Filed' ? 'd_success' : 'd_warning'}`}>{r.status}</span></td>
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
          )}
          {activeTab !== 'GSTR-1' && (
            <div className="d_alert d_info" style={{ padding: '1rem', borderRadius: 8 }}>
              {activeTab} data will be loaded from the GST portal. Please sync to view the latest records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
