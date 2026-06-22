import React, { useState } from 'react';
import { MdInventory2, MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';

const data = [
  { id:'AJ-RV-001', name:'Reed Valve Assembly',   cat:'Valve',    brand:'AirTex',   model:'AT-200, AT-300',     stock:142, minStock:20, price:'₹500',  status:'In Stock' },
  { id:'AJ-NZ-012', name:'Air Jet Nozzle Set',    cat:'Nozzle',   brand:'JetPro',   model:'JP-100, JP-150',     stock:8,   minStock:15, price:'₹850',  status:'Low Stock' },
  { id:'AJ-WD-034', name:'Weft Detector Sensor',  cat:'Sensor',   brand:'SenseTech',model:'ST-400, ST-500',     stock:97,  minStock:10, price:'₹1200', status:'In Stock' },
  { id:'AJ-SB-007', name:'Main Shaft Bearing',    cat:'Bearing',  brand:'SKF',      model:'All Models',         stock:84,  minStock:25, price:'₹2500', status:'In Stock' },
  { id:'AJ-SC-021', name:'Selvage Cutter Blade',  cat:'Blade',    brand:'CutMaster',model:'CM-200, CM-250',     stock:0,   minStock:30, price:'₹350',  status:'Out of Stock' },
  { id:'AJ-BL-003', name:'Blowing Pipe Assembly', cat:'Air',      brand:'AirTex',   model:'AT-200',             stock:55,  minStock:10, price:'₹680',  status:'In Stock' },
  { id:'AJ-LM-018', name:'Loom Motor 2.2kW',      cat:'Motor',    brand:'Siemens',  model:'Universal',          stock:12,  minStock:5,  price:'₹8500', status:'In Stock' },
  { id:'AJ-FK-009', name:'Feeder Knob Set',        cat:'Feeder',   brand:'JetPro',   model:'JP-100',             stock:3,   minStock:10, price:'₹420',  status:'Low Stock' },
];
const statusClass = {'In Stock':'d_success','Low Stock':'d_warning','Out of Stock':'d_danger'};

const SpareParts = () => {
  const [tab, setTab] = useState('parts');
  const [search, setSearch] = useState('');
  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase()) ||
    p.cat.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Spare Parts Inventory</h1>
          <p className="d_page_subtitle">Manage parts, categories, brands and compatibility</p>
        </div>
        <button className="d_btn d_btn_primary"><MdAdd /> Add Part</button>
      </div>
      <div className="d_tabs mb-3">
        {[['parts','Part Number'],['category','Category'],['brand','Brand'],['models','Compatible Models']].map(([k,v])=>(
          <button key={k} className={`d_tab_btn ${tab===k?'d_active':''}`} onClick={()=>setTab(k)}>{v}</button>
        ))}
      </div>
      <div className="d_card">
        <div className="d_card_header flex-wrap gap-2">
          <h2 className="d_card_title"><MdInventory2 className="d_card_icon" /> Spare Parts ({filtered.length})</h2>
          <div className="d_search_box">
            <MdSearch className="d_search_icon" />
            <input className="d_search_input" placeholder="Search parts..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body p-0">
          <div className="d_table_wrap">
            <table className="d_table">
              <thead><tr><th>Part No.</th><th>Part Name</th><th>Category</th><th>Brand</th><th>Compatible Models</th><th>Stock</th><th>Min Stock</th><th>Unit Price</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(p=>(
                  <tr key={p.id}>
                    <td><code>{p.id}</code></td><td><strong>{p.name}</strong></td><td>{p.cat}</td><td>{p.brand}</td>
                    <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.model}</td>
                    <td><strong>{p.stock}</strong></td><td>{p.minStock}</td><td>{p.price}</td>
                    <td><span className={`d_badge ${statusClass[p.status]}`}>{p.status}</span></td>
                    <td><div className="d_action_btns"><button className="d_icon_btn d_edit"><MdEdit /></button><button className="d_icon_btn d_del"><MdDelete /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SpareParts;
