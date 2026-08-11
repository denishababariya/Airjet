import React, { useState, useEffect } from 'react';
import { MdCorporateFare, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import ToastContainer from '../components/Toast';
import useToast from '../hooks/useToast';
import useConfirm from '../hooks/useConfirm';
import { departmentsApi, employeesApi } from '../utils/api';
import { V, validate } from '../utils/validators';

const blank = { name: '', head: '', description: '', status: 'Active' };

const Department = () => {
  const [data, setData]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState(blank);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { toasts, toast, removeToast }       = useToast();
  const { confirmState, confirm, closeConfirm } = useConfirm();

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentsApi.getAll(),
        employeesApi.getAll(),
      ]);
      setData(deptRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openAdd  = () => { setForm(blank); setEditId(null); setErrors({}); setModal(true); };
  const openEdit = (dep) => {
    setForm({
      name: dep.title || dep.name || '',
      head: dep.head?._id || dep.head || '',
      description: dep.description || '',
      status: dep.isActive ? 'Active' : 'Inactive',
    });
    setEditId(dep._id);
    setErrors({});
    setModal(true);
  };

  // Filter employees: when editing, show only employees from the same department
  const filteredEmployees = editId 
    ? employees.filter(e => (e.department?._id || e.department) === editId)
    : employees;

  const validateForm = () => validate({
    name: V.title(form.name, 'Department name'),
  });

  const handleSave = async () => {
    const e = validateForm();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.name.trim(),
        isActive: form.status === 'Active',
        head: form.head || undefined,
      };
      if (editId) await departmentsApi.update(editId, payload);
      else await departmentsApi.create(payload);
      setModal(false);
      toast.success(editId ? 'Department updated successfully!' : 'Department added successfully!');
      fetchDepartments();
    } catch (err) {
      toast.error(err.displayMessage || 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    confirm({
      title: 'Delete Department',
      message: `Delete department "${name}"? This may affect employees assigned to it.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        closeConfirm();
        try {
          await departmentsApi.remove(id);
          toast.success('Department deleted.');
          fetchDepartments();
        } catch (err) {
          toast.error(err.displayMessage || 'Failed to delete department');
        }
      },
    });
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => { setForm(p => ({ ...p, [field]: e.target.value })); setErrors(p => ({ ...p, [field]: '' })); },
  });

  const Err = ({ field }) => errors[field]
    ? <span className="d_field_error">{errors[field]}</span> : null;

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog {...confirmState} onCancel={closeConfirm} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Department</h1>
          <p className="d_page_subtitle">Manage company departments</p>
        </div>
        <button className="d_btn d_btn_primary" onClick={openAdd}><MdAdd /> Add Department</button>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <h2 className="d_card_title"><MdCorporateFare className="d_card_icon" /> Departments ({data.length})</h2>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading departments…</div>
          ) : (
          <div className="d_table_wrap">
            <table className="d_table">
              <thead>
                <tr><th>Dept ID</th><th>Department Name</th><th>Head</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr className="d_empty"><td colSpan={5}>No departments found.</td></tr>}
                {data.map(d => (
                  <tr key={d._id}>
                    <td><code>{d.id}</code></td>
                    <td><strong>{d.title || d.name}</strong></td>
                    <td>{d.head?.name || '-'}</td>
                    <td><span className={`d_badge ${d.isActive ? 'd_success' : 'd_danger'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="d_action_btns">
                        <button className="d_icon_btn d_edit" onClick={() => openEdit(d)} title="Edit"><MdEdit /></button>
                        <button className="d_icon_btn d_del" onClick={() => handleDelete(d._id, d.title || d.name)} title="Delete"><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Edit Department' : 'Add Department'} size="md">
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Department Name <span className="d_req">*</span></label>
            <input className="d_form_control" placeholder="e.g. Sales" {...f('name')} />
            <Err field="name" />
          </div>
          <div className="d_form_group">
            <label className="d_form_label">Department Head</label>
            <select className="d_form_control" {...f('head')}>
              <option value="">Select Employee</option>
              {filteredEmployees.map(e => <option key={e._id} value={e._id}>{String(e.name)}</option>)}
            </select>
          </div>
        </div>
        <div className="d_form_row cols-2">
          <div className="d_form_group">
            <label className="d_form_label">Status</label>
            <select className="d_form_control" {...f('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
        <div className="d_form_actions">
          <button className="d_btn d_btn_outline" onClick={() => setModal(false)}>Cancel</button>
          <button className="d_btn d_btn_primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editId ? 'Update Department' : 'Save Department'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Department;
