import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdVisibility, MdSearch, MdBuild } from 'react-icons/md';
import { sparePartsApi } from '../../utils/api';

const statusClass = { 'Available': 'd_success', 'Low Stock': 'd_warning', 'Out of Stock': 'd_danger', 'Discontinued': 'd_danger' };

export default function PartNumber() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  const fetchParts = async () => {
    setLoading(true);
    try {
      const { data: list } = await sparePartsApi.getAll();
      setData(list);
    } catch (err) {
      console.error('Failed to load spare parts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchParts();
    fetchCategories();
  }, []);

  const filtered = data.filter(p =>
    (p.partNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.partName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Part Number Master</div>
          <div className="d_page_subtitle">Manage airjet loom spare part numbers and details</div>
        </div>
        <button className="d_btn d_btn_primary" onClick={() => window.location.href = '/spare-parts'}><MdAdd /> Add Part</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdBuild /></span>Parts List</div>
          <div className="d_search_box">
            <span className="d_search_icon"><MdSearch /></span>
            <input className="d_search_input" placeholder="Search part no., name, category..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Part No.</th>
                  <th>Part Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th>Stock</th>
                  <th>Unit Price (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-4">Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr className="d_empty"><td colSpan={8}>No parts found.</td></tr>
                ) : filtered.map(p => (
                  <tr key={p._id}>
                    <td><strong><code>{String(p.partNumber)}</code></strong></td>
                    <td>{String(p.partName)}</td>
                    <td><span className="d_badge d_info">{String(p.category)}</span></td>
                    <td>{String(p.brand)}</td>
                    <td><strong>{String(p.quantity)}</strong></td>
                    <td>₹{(p.unitPrice || 0).toLocaleString('en-IN')}</td>
                    <td><span className={`d_badge ${statusClass[p.status] || 'd_info'}`}>{String(p.status)}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_view"><MdVisibility /></button>
                        <button className="d_icon_btn d_edit" onClick={() => window.location.href = `/spare-parts?edit=${p._id}`}><MdEdit /></button>
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
