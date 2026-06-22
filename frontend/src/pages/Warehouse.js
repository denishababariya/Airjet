import React, { useState } from 'react';
import { MdWarehouse, MdAdd, MdEdit, MdDelete, MdSwapHoriz, MdFactCheck } from 'react-icons/md';

const warehouses = [
  { id:'WH-001', name:'Main Warehouse',      location:'Surat - Unit 1',    capacity:5000, used:3420, manager:'Karan Mehta',  status:'Active' },
  { id:'WH-002', name:'Secondary Warehouse', location:'Surat - Unit 2',    capacity:3000, used:1840, manager:'Nikhil Rao',   status:'Active' },
  { id:'WH-003', name:'Transit Store',       location:'Navsari',           capacity:1000, used:210,  manager:'Divya Verma',  status:'Active' },
];

const transfers = [
  { id:'TRF-001', from:'WH-001', to:'WH-002', part:'Reed Valve Assembly', qty:50, date:'20-Jun-2026', status:'Completed' },
  { id:'TRF-002', from:'WH-001', to:'WH-003', part:'Air Jet Nozzle Set',  qty:20, date:'21-Jun-2026', status:'In Transit' },
  { id:'TRF-003', from:'WH-002', to:'WH-001', part:'Main Shaft Bearing',  qty:10, date:'22-Jun-2026', status:'Pending' },
];

const statusClass = { Active:'d_success', Completed:'d_success', 'In Transit':'d_info', Pending:'d_warning', Inactive:'d_danger' };

const Warehouse = () => {
  const [tab, setTab] = useState('warehouses');
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Warehouse Management</h1>
          <p className="d_page_subtitle">Manage warehouses, stock transfers and audits</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Warehouse</button>
      </div>

      <div className="d_tabs mb-3">
        {[['warehouses','Multiple Warehouses'],['transfers','Stock Transfers'],['audits','Stock Audits']].map(([k,v])=>(
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={()=>setTab(k)}>{v}</button>
        ))}
      </div>

      {tab === 'warehouses' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdWarehouse className="d_card_icon" /> Warehouses</h2>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>WH ID</th><th>Warehouse Name</th><th>Location</th><th>Total Capacity</th><th>Used</th><th>Available</th><th>Manager</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {warehouses.map(w=>(
                    <tr key={w.id}>
                      <td><code>{w.id}</code></td><td><strong>{w.name}</strong></td><td>{w.location}</td>
                      <td>{w.capacity}</td><td>{w.used}</td><td><strong>{w.capacity-w.used}</strong></td>
                      <td>{w.manager}</td>
                      <td><span className={`d_badge ${statusClass[w.status]}`}>{w.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'transfers' && (
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdSwapHoriz className="d_card_icon" /> Stock Transfers</h2>
            <button className="d_btn d_btn_primary d_btn_sm"><MdAdd /> New Transfer</button>
          </div>
          <div className="d_card_body p-0">
            <div className="d_table_wrap">
              <table className="d_table">
                <thead><tr><th>Transfer ID</th><th>From</th><th>To</th><th>Part</th><th>Qty</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {transfers.map(t=>(
                    <tr key={t.id}>
                      <td><code>{t.id}</code></td><td>{t.from}</td><td>{t.to}</td><td><strong>{t.part}</strong></td>
                      <td>{t.qty}</td><td>{t.date}</td>
                      <td><span className={`d_badge ${statusClass[t.status]}`}>{t.status}</span></td>
                      <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audits' && (
        <div className="d_card"><div className="d_card_body text-center py-5">
          <div style={{fontSize:48,color:'var(--d-light-border)'}}><MdFactCheck /></div>
          <p className="mt-3" style={{color:'var(--d-text-muted)'}}>No stock audits scheduled.</p>
          <button className="d_btn d_btn_primary mt-2"><MdAdd /> Schedule Audit</button>
        </div></div>
      )}
    </div>
  );
};
export default Warehouse;
