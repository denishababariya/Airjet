import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdSave, MdAdd, MdDelete } from 'react-icons/md';
import { payrollApi } from '../../utils/api';
import ToastContainer from '../../components/Toast';
import useToast from '../../hooks/useToast';

export default function SalaryEdit({ salaryId, onBack, onSave }) {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    basicSalary: 0,
    overtimeHours: 0,
    overtimeRate: 150,
    allowances: [],
    deductions: []
  });
  const [newAllowance, setNewAllowance] = useState({ name: '', amount: 0, description: '' });
  const [newDeduction, setNewDeduction] = useState({ name: '', amount: 0, reason: '' });

  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    if (salaryId) {
      fetchSalaryDetails();
    }
  }, [salaryId]);

  const fetchSalaryDetails = async () => {
    setLoading(true);
    try {
      const res = await payrollApi.getById(salaryId);
      const data = res.data;
      setSalary(data);
      setForm({
        basicSalary: data.basicSalary || 0,
        overtimeHours: data.overtimeHours || 0,
        overtimeRate: data.overtimeRate || 150,
        allowances: data.allowances || [],
        deductions: data.deductions || []
      });
    } catch (error) {
      console.error('Error fetching salary details:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totalAllowance = form.allowances.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const totalDeduction = form.deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    const overtimeAmount = form.overtimeHours * form.overtimeRate;
    const grossSalary = form.basicSalary + totalAllowance + overtimeAmount;
    const netSalary = grossSalary - totalDeduction;
    
    return { totalAllowance, totalDeduction, overtimeAmount, grossSalary, netSalary };
  };

  const handleAddAllowance = () => {
    if (!newAllowance.name || !newAllowance.amount) {
      toast.error('Please fill in allowance name and amount');
      return;
    }
    setForm({
      ...form,
      allowances: [...form.allowances, { ...newAllowance, amount: parseFloat(newAllowance.amount) }]
    });
    setNewAllowance({ name: '', amount: 0, description: '' });
  };

  const handleRemoveAllowance = (index) => {
    setForm({
      ...form,
      allowances: form.allowances.filter((_, i) => i !== index)
    });
  };

  const handleAddDeduction = () => {
    if (!newDeduction.name || !newDeduction.amount) {
      toast.error('Please fill in deduction name and amount');
      return;
    }
    setForm({
      ...form,
      deductions: [...form.deductions, { ...newDeduction, amount: parseFloat(newDeduction.amount) }]
    });
    setNewDeduction({ name: '', amount: 0, reason: '' });
  };

  const handleRemoveDeduction = (index) => {
    setForm({
      ...form,
      deductions: form.deductions.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { totalAllowance, totalDeduction, overtimeAmount, grossSalary, netSalary } = calculateTotals();
      
      await payrollApi.update(salaryId, {
        basicSalary: form.basicSalary,
        overtimeHours: form.overtimeHours,
        overtimeRate: form.overtimeRate,
        overtimeAmount,
        allowances: form.allowances,
        totalAllowance,
        deductions: form.deductions,
        totalDeduction,
        grossSalary,
        netSalary
      });
      
      toast.success('Salary updated successfully');
      if (onSave) onSave(salaryId);
    } catch (error) {
      toast.error(error.displayMessage || 'Failed to update salary');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading salary details...</div>;
  }

  if (!salary) {
    return <div className="text-center py-4">Salary record not found</div>;
  }

  const { totalAllowance, totalDeduction, overtimeAmount, grossSalary, netSalary } = calculateTotals();

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="d_btn d_btn_outline" onClick={onBack}>
            <MdArrowBack /> Back
          </button>
          <div>
            <div className="d_page_title">Edit Salary</div>
            <div className="d_page_subtitle">{salary.employeeName} - {salary.month}</div>
          </div>
        </div>
        <button 
          className="d_btn d_btn_primary" 
          onClick={handleSave}
          disabled={saving || salary.status === 'Paid'}
        >
          {saving ? 'Saving...' : <><MdSave /> Save Changes</>}
        </button>
      </div>

      {salary.status === 'Paid' && (
        <div className="d_card d_danger" style={{ marginBottom: '1.5rem' }}>
          <div className="d_card_body">
            <strong>Warning:</strong> This salary has already been paid. Editing paid salaries is not recommended.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Basic Salary & Overtime */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title">Basic Salary & Overtime</div>
          </div>
          <div className="d_card_body">
            <div className="d_form_group mb-3">
              <label className="d_form_label">Basic Salary (₹)</label>
              <input 
                type="number" 
                className="d_form_control" 
                value={form.basicSalary}
                onChange={e => setForm({...form, basicSalary: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Overtime Hours</label>
                <input 
                  type="number" 
                  className="d_form_control" 
                  value={form.overtimeHours}
                  onChange={e => setForm({...form, overtimeHours: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Overtime Rate (₹/hr)</label>
                <input 
                  type="number" 
                  className="d_form_control" 
                  value={form.overtimeRate}
                  onChange={e => setForm({...form, overtimeRate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
              <strong>Overtime Amount:</strong> ₹{overtimeAmount.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="d_card">
          <div className="d_card_header">
            <div className="d_card_title">Calculation Summary</div>
          </div>
          <div className="d_card_body">
            <div style={{ marginBottom: '0.5rem' }}><strong>Basic Salary:</strong> ₹{form.basicSalary.toLocaleString('en-IN')}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>+ Total Allowances:</strong> ₹{totalAllowance.toLocaleString('en-IN')}</div>
            <div style={{ marginBottom: '0.5rem' }}><strong>+ Overtime Amount:</strong> ₹{overtimeAmount.toLocaleString('en-IN')}</div>
            <div style={{ marginBottom: '0.5rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
              <strong>= Gross Salary:</strong> ₹{grossSalary.toLocaleString('en-IN')}
            </div>
            <div style={{ marginBottom: '0.5rem' }}><strong>- Total Deductions:</strong> ₹{totalDeduction.toLocaleString('en-IN')}</div>
            <div style={{ marginTop: '0.5rem', borderTop: '1px solid #ddd', paddingTop: '0.5rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--d-success)' }}>
              <strong>= Net Salary:</strong> ₹{netSalary.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Allowances */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_header">
          <div className="d_card_title">Allowances</div>
        </div>
        <div className="d_card_body">
          <div className="d_form_row cols-3" style={{ marginBottom: '1rem' }}>
            <div className="d_form_group">
              <label className="d_form_label">Allowance Name</label>
              <input 
                className="d_form_control" 
                placeholder="e.g., HRA"
                value={newAllowance.name}
                onChange={e => setNewAllowance({...newAllowance, name: e.target.value})}
              />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input 
                type="number" 
                className="d_form_control" 
                placeholder="0"
                value={newAllowance.amount}
                onChange={e => setNewAllowance({...newAllowance, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Description</label>
              <input 
                className="d_form_control" 
                placeholder="Optional"
                value={newAllowance.description}
                onChange={e => setNewAllowance({...newAllowance, description: e.target.value})}
              />
            </div>
          </div>
          <button className="d_btn d_btn_outline" onClick={handleAddAllowance}>
            <MdAdd /> Add Allowance
          </button>

          {form.allowances.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Amount (₹)</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.allowances.map((allowance, idx) => (
                    <tr key={idx}>
                      <td>{allowance.name}</td>
                      <td>₹{allowance.amount.toLocaleString('en-IN')}</td>
                      <td>{allowance.description || '-'}</td>
                      <td>
                        <button className="d_icon_btn d_del" onClick={() => handleRemoveAllowance(idx)}>
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Deductions */}
      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">Deductions</div>
        </div>
        <div className="d_card_body">
          <div className="d_form_row cols-3" style={{ marginBottom: '1rem' }}>
            <div className="d_form_group">
              <label className="d_form_label">Deduction Name</label>
              <input 
                className="d_form_control" 
                placeholder="e.g., PF"
                value={newDeduction.name}
                onChange={e => setNewDeduction({...newDeduction, name: e.target.value})}
              />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Amount (₹)</label>
              <input 
                type="number" 
                className="d_form_control" 
                placeholder="0"
                value={newDeduction.amount}
                onChange={e => setNewDeduction({...newDeduction, amount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="d_form_group">
              <label className="d_form_label">Reason</label>
              <input 
                className="d_form_control" 
                placeholder="Optional"
                value={newDeduction.reason}
                onChange={e => setNewDeduction({...newDeduction, reason: e.target.value})}
              />
            </div>
          </div>
          <button className="d_btn d_btn_outline" onClick={handleAddDeduction}>
            <MdAdd /> Add Deduction
          </button>

          {form.deductions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Amount (₹)</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {form.deductions.map((deduction, idx) => (
                    <tr key={idx}>
                      <td>{deduction.name}</td>
                      <td>₹{deduction.amount.toLocaleString('en-IN')}</td>
                      <td>{deduction.reason || '-'}</td>
                      <td>
                        <button className="d_icon_btn d_del" onClick={() => handleRemoveDeduction(idx)}>
                          <MdDelete />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
