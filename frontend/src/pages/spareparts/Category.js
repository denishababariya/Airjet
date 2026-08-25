import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdCategory } from 'react-icons/md';

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Part Categories</div>
          <div className="d_page_subtitle">Manage spare parts classification categories</div>
        </div>
        <button className="d_btn d_btn_primary" onClick={() => window.location.href = '/spare-parts?tab=category'}><MdAdd /> Add Category</button>
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-4">Loading…</td></tr>
                ) : categories.length === 0 ? (
                  <tr className="d_empty"><td colSpan={5}>No categories found.</td></tr>
                ) : categories.map(c => (
                  <tr key={c._id || c.id}>
                    <td><code>{String(c._id || c.id)}</code></td>
                    <td><strong>{String(c.name)}</strong></td>
                    <td style={{ maxWidth: 300, fontSize: '0.88rem', color: 'var(--d-text-muted)' }}>{String(c.description || c.desc || '-')}</td>
                    <td><span className={`d_badge ${c.status === 'Active' ? 'd_success' : 'd_danger'}`}>{String(c.status)}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => window.location.href = `/spare-parts?tab=category&edit=${c._id || c.id}`}><MdEdit /></button>
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
