import React, { useState } from 'react';
import { MdBuildCircle, MdAdd, MdEdit, MdVisibility } from 'react-icons/md';

const tickets = [
  { id:'SRV-001', customer:'Shree Textile Mills',    machine:'AT-200',  complaint:'Nozzle not firing',         engineer:'Divya Verma', opened:'18-Jun-2026', status:'In Progress', priority:'High' },
  { id:'SRV-002', customer:'National Weaving Works', machine:'JP-150',  complaint:'Abnormal vibration',        engineer:'Nikhil Rao',  opened:'19-Jun-2026', status:'Open',        priority:'Medium' },
  { id:'SRV-003', customer:'Modi Fabric Industries', machine:'ST-400',  complaint:'Weft sensor false alarm',   engineer:'Divya Verma', opened:'20-Jun-2026', status:'Resolved',    priority:'Low' },
  { id:'SRV-004', customer:'Rajlaxmi Textiles',      machine:'CM-200',  complaint:'Cutter blade broken',       engineer:'Unassigned',  opened:'21-Jun-2026', status:'Open',        priority:'High' },
  { id:'SRV-005', customer:'Shree Textile Mills',    machine:'AT-300',  complaint:'Motor overheating',         engineer:'Nikhil Rao',  opened:'22-Jun-2026', status:'In Progress', priority:'Critical' },
];

const statusClass = { Open:'d_warning', 'In Progress':'d_info', Resolved:'d_success', Closed:'d_primary' };
const priorityClass = { Low:'d_success', Medium:'d_info', High:'d_warning', Critical:'d_danger' };

const Service = () => {
  const [tab, setTab] = useState('tickets');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Service Management</h1>
          <p className="d_page_subtitle">Complaints, service tickets, engineers and reports</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> New Ticket</button>
      </div>

      <div className="d_tabs mb-3">
        {[['tickets','Service Tickets'],['complaints','Complaints'],['engineers','Engineer Assignment'],['reports','Service Reports']].map(([k,v])=>(
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={()=>setTab(k)}>{v}</button>
        ))}
      </div>

      {(tab === 'tickets' || tab === 'complaints') && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdBuildCircle className="d_card_icon" /> Service Tickets</h2>
            <div className="d_summary_pills">
              <span className="d_badge d_warning">Open: 2</span>
              <span className="d_badge d_info">In Progress: 2</span>
              <span className="d_badge d_success">Resolved: 1</span>
            </div>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Ticket ID</th><th>Customer</th><th>Machine</th><th>Complaint</th><th>Engineer</th><th>Opened</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {tickets.map(t=>(
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td><td><strong>{t.customer}</strong></td><td><code>{t.machine}</code></td>
                      <td style={{maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.complaint}</td>
                      <td>{t.engineer}</td><td>{t.opened}</td>
                      <td><span className={`d_badge ${priorityClass[t.priority]}`}>{t.priority}</span></td>
                      <td><span className={`d_badge ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_view"><MdVisibility /></button><button className="d_icon_btn d_edit"><MdEdit /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(tab === 'engineers' || tab === 'reports') && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}>🔧</div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>No {tab === 'engineers' ? 'engineer assignments' : 'service reports'} found.</p>
          <button className="d_btn d_btn_primary mt-2"><MdAdd /> Create {tab === 'engineers' ? 'Assignment' : 'Report'}</button>
        </div></div>
      )}
    </div>
  );
};
export default Service;
