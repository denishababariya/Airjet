import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdRemoveCircle } from 'react-icons/md';
import Modal from '../../components/Modal';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Deductions() {
  const [deductions, setDeductions] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Fixed', value: '', applicable: 'All Employees', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    // In a real implementation, fetch from API
    setDeductions([
      { _id: '1', name: 'Provident Fund (PF)', type: 'Percentage', value: '12%', applicable: 'All Employees', status: 'Active' },
      { _id: '2', name: 'Employee State Insurance (ESI)', type: 'Percentage', value: '0.75%', applicable: 'Salary ≤ ₹21,000', status: 'Active' },
      { _id: '3', name: 'Professional Tax', type: 'Fixed', value: '₹200', applicable: 'All Employees', status: 'Active' },
      { _id: '4', name: 'Loan Repayment', type: 'Fixed', value: '₹5,000', applicable: 'Loan Account Holders', status: 'Active' },
    ]);
  }, []);

  const openAdd = () => {
    setForm({ name: '', type: 'Fixed', value: '', applicable: 'All Employees', status: 'Active' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (deduction) => {
    setForm({ ...deduction });
    setEditId(deduction._id);
    setModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editId) {
      setDeductions(deductions.map(d => d._id === editId ? { ...form, _id: editId } : d));
      toast.success('Deduction updated successfully');
    } else {
      setDeductions([...deductions, { ...form, _id: Date.now().toString() }]);
      toast.success('Deduction added successfully');
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete Deduction',
      message: 'Are you sure you want to delete this deduction?',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        closeConfirm();
        setDeductions(deductions.filter(d => d._id !== id));
        toast.success('Deduction deleted successfully');
      }
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Deductions Management</div>
          <div className="d_page_subtitle">Configure salary deduction components</div>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Deduction</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdRemoveCircle /></span>Deductions List</div>
        </div>
        <div className="d_card_body">
          <div className="d_table_wrap">
            <table className="d_table" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Applicable To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 && <tr className="d_empty"><td colSpan={6}>No deductions configured</td></tr>}
                {deductions.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.name}</strong></td>
                    <td><span className={`d_badge ${d.type === 'Fixed' ? 'd_info' : 'd_warning'}`}>{d.type}</span></td>
                    <td><strong>{d.value}</strong></td>
                    <td>{d.applicable}</td>
                    <td><span className={`d_badge ${d.status === 'Active' ? 'd_success' : 'd_danger'}`}>{d.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(d)}><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(d._id)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Deduction' : 'Add Deduction'} size="md">
        <div className="d_form_group mb-3">
          <label className="d_form_label">Deduction Name <span className="d_req">*</span></label>
          <input 
            className="d_form_control" 
            placeholder="e.g., Provident Fund"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
          />
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Type</label>
            <select 
              className="d_form_control" 
              value={form.type}
              onChange={e => setForm({...form, type: e.target.value})}
            >
              <option value="Fixed">Fixed</option>
              <option value="Percentage">Percentage</option>
            </select>
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Value <span className="d_req">*</span></label>
            <input 
              className="d_form_control" 
              placeholder={form.type === 'Percentage' ? 'e.g., 12%' : 'e.g., ₹200'}
              value={form.value}
              onChange={e => setForm({...form, value: e.target.value})}
            />
          </div>
        </div>
        <div className="d_form_group mb-3">
          <label className="d_form_label">Applicable To</label>
          <input 
            className="d_form_control" 
            placeholder="e.g., All Employees"
            value={form.applicable}
            onChange={e => setForm({...form, applicable: e.target.value})}
          />
        </div>
        <div className="d_form_group mb-3">
          <label className="d_form_label">Status</label>
          <select 
            className="d_form_control" 
            value={form.status}
            onChange={e => setForm({...form, status: e.target.value})}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave}>{editId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>
    </div>
  );
}
