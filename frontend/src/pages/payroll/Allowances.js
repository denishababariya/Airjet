import React, { useState, useEffect } from 'react';
import { MdAdd, MdEdit, MdDelete, MdMonetizationOn } from 'react-icons/md';
import Modal from '../../components/Modal';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';
import ConfirmDialog from '../../components/ConfirmDialog';
import useConfirm from '../../hooks/useConfirm';

export default function Allowances() {
  const [allowances, setAllowances] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'Fixed', value: '', applicable: 'All Employees', status: 'Active' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const { toasts, toast, removeToast } = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  useEffect(() => {
    // Load from localStorage or use default data
    const savedAllowances = localStorage.getItem('allowances');
    if (savedAllowances) {
      setAllowances(JSON.parse(savedAllowances));
    } else {
      const defaultAllowances = [
        { _id: '1', name: 'House Rent Allowance (HRA)', type: 'Percentage', value: '40%', applicable: 'All Employees', status: 'Active' },
        { _id: '2', name: 'Dearness Allowance (DA)', type: 'Percentage', value: '20%', applicable: 'All Employees', status: 'Active' },
        { _id: '3', name: 'Travel Allowance', type: 'Fixed', value: '₹1,500', applicable: 'All Employees', status: 'Active' },
        { _id: '4', name: 'Medical Allowance', type: 'Fixed', value: '₹1,250', applicable: 'All Employees', status: 'Active' },
        { _id: '5', name: 'Special Allowance', type: 'Fixed', value: '₹2,000', applicable: 'Senior Staff', status: 'Active' },
      ];
      setAllowances(defaultAllowances);
      localStorage.setItem('allowances', JSON.stringify(defaultAllowances));
    }
  }, []);

  const openAdd = () => {
    setForm({ name: '', type: 'Fixed', value: '', applicable: 'All Employees', status: 'Active' });
    setEditId(null);
    setModal(true);
  };

  const openEdit = (allowance) => {
    // Strip symbol when editing to show clean value
    const cleanValue = allowance.value.replace(/[₹%,]/g, '');
    setForm({ ...allowance, value: cleanValue });
    setEditId(allowance._id);
    setModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.value) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Add symbol based on type
    const valueWithSymbol = form.type === 'Fixed' 
      ? `₹${form.value.replace(/[₹%,]/g, '')}` 
      : `${form.value.replace(/[₹%,]/g, '')}%`;

    const formData = { ...form, value: valueWithSymbol };

    if (editId) {
      const updatedAllowances = allowances.map(a => a._id === editId ? { ...formData, _id: editId } : a);
      setAllowances(updatedAllowances);
      localStorage.setItem('allowances', JSON.stringify(updatedAllowances));
      toast.success('Allowance updated successfully');
    } else {
      const newAllowances = [...allowances, { ...formData, _id: Date.now().toString() }];
      setAllowances(newAllowances);
      localStorage.setItem('allowances', JSON.stringify(newAllowances));
      toast.success('Allowance added successfully');
    }
    setModal(false);
  };

  const handleDelete = (id) => {
    confirm({
      title: 'Delete Allowance',
      message: 'Are you sure you want to delete this allowance?',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => {
        closeConfirm();
        const updatedAllowances = allowances.filter(a => a._id !== id);
        setAllowances(updatedAllowances);
        localStorage.setItem('allowances', JSON.stringify(updatedAllowances));
        toast.success('Allowance deleted successfully');
      }
    });
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <div className="d_page_title">Allowances Management</div>
          <div className="d_page_subtitle">Configure salary allowance components</div>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Allowance</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title"><span className="d_card_icon"><MdMonetizationOn /></span>Allowances List</div>
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
                {allowances.length === 0 && <tr className="d_empty"><td colSpan={6}>No allowances configured</td></tr>}
                {allowances.map(a => (
                  <tr key={a._id}>
                    <td><strong>{a.name}</strong></td>
                    <td><span className={`d_badge ${a.type === 'Fixed' ? 'd_info' : 'd_primary'}`}>{a.type}</span></td>
                    <td><strong>{a.value}</strong></td>
                    <td>{a.applicable}</td>
                    <td><span className={`d_badge ${a.status === 'Active' ? 'd_success' : 'd_danger'}`}>{a.status}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(a)}><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(a._id)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Allowance' : 'Add Allowance'} size="md">
        <div className="d_form_group mb-3">
          <label className="d_form_label">Allowance Name <span className="d_req">*</span></label>
          <input 
            className="d_form_control" 
            placeholder="e.g., House Rent Allowance"
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
              placeholder={form.type === 'Percentage' ? 'e.g., 40%' : 'e.g., ₹1,500'}
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
