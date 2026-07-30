import React, { useState, useEffect } from 'react';
import { MdMonetizationOn, MdAccessTime, MdSearch, MdFilterList, MdAdd } from 'react-icons/md';
import { attendanceApi, employeesApi } from '../../utils/api';
import Modal from '../../components/Modal';

const OvertimeCalculation = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: '',
    date: '',
    extraHours: '',
    rate: '',
    amount: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.getOvertime({ month, year });
      setRecords(res.data.records || []);
    } catch (err) {
      console.error('Failed to fetch overtime records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    employeesApi.getAll().then(res => setEmployees(res.data)).catch(() => {});
  }, []);

  const handleCalculateAmount = () => {
    if (form.extraHours && form.rate) {
      const hours = parseFloat(form.extraHours);
      const rate = parseFloat(form.rate);
      const amount = hours * rate;
      setForm({ ...form, amount: amount.toFixed(2) });
    }
  };

  const handleEmployeeChange = (e) => {
    const employeeId = e.target.value;
    const employee = employees.find(emp => emp._id === employeeId);
    if (employee && employee.salary) {
      // Calculate hourly rate from monthly salary (assuming 26 working days, 8 hours per day)
      const monthlySalary = parseFloat(employee.salary);
      const hourlyRate = (monthlySalary / 26 / 8).toFixed(2);
      // Overtime rate is usually 1.5x or 2x the regular rate
      const overtimeRate = (hourlyRate * 1.5).toFixed(2);
      setForm({ ...form, employeeId, rate: overtimeRate });
    } else {
      setForm({ ...form, employeeId, rate: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeId || !form.date || !form.extraHours || !form.rate) return;
    setSubmitting(true);
    try {
      const overtimeMinutes = parseFloat(form.extraHours) * 60;
      await attendanceApi.createOvertime({
        employeeId: form.employeeId,
        date: form.date,
        extraHours: form.extraHours,
        rate: form.rate,
        amount: form.amount,
        overtimeMinutes: overtimeMinutes
      });
      setShowModal(false);
      setForm({ employeeId: '', date: '', extraHours: '', rate: '', amount: '' });
      fetchRecords();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create overtime record');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMinutes = records.reduce((sum, r) => sum + (r.overtimeMinutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);
  const totalAmount = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Overtime Calculation</h1>
          <p className="d_page_subtitle">Monthly overtime summary</p>
        </div>
        <div className="d-flex gap-2">
          <select
            className="d_form_control"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            className="d_form_control"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button className="d_btn d_btn_primary" onClick={fetchRecords}>
            <MdFilterList /> Apply
          </button>
          <button className="d_btn d_btn_success" onClick={() => { setForm({ employeeId: '', date: '', extraHours: '', rate: '', amount: '' }); setShowModal(true); }}>
            <MdAdd /> Add Overtime
          </button>
        </div>
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => { setShowModal(false); setForm({ employeeId: '', date: '', extraHours: '', rate: '', amount: '' }); }} title="Add Overtime Record" size="md">
          <form onSubmit={handleSubmit}>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Employee <span className="d_req">*</span></label>
                <select
                  className="d_form_control"
                  value={form.employeeId}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.id}) - ₹{emp.salary}/month</option>
                  ))}
                </select>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Date <span className="d_req">*</span></label>
                <input
                  type="date"
                  className="d_form_control"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="d_form_row cols-2">
              <div className="d_form_group">
                <label className="d_form_label">Extra Hours <span className="d_req">*</span></label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="4"
                  className="d_form_control"
                  value={form.extraHours}
                  onChange={e => {
                    const value = parseFloat(e.target.value);
                    if (value >= 1 && value <= 4) {
                      setForm({...form, extraHours: e.target.value});
                      handleCalculateAmount();
                    }
                  }}
                  onBlur={handleCalculateAmount}
                  required
                  placeholder="e.g. 2"
                />
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Hourly Rate (₹) <span className="d_req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  className="d_form_control"
                  value={form.rate}
                  onChange={e => {
                    setForm({...form, rate: e.target.value});
                    handleCalculateAmount();
                  }}
                  onBlur={handleCalculateAmount}
                  required
                  placeholder="Auto-calculated from salary"
                />
              </div>
            </div>
            <div className="d_form_row">
              <div className="d_form_group">
                <label className="d_form_label">Amount (₹) <span className="d_req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  className="d_form_control"
                  value={form.amount}
                  onChange={e => setForm({...form, amount: e.target.value})}
                  required
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', fontWeight: 600 }}
                />
              </div>
            </div>
            <div className="d_form_actions">
              <button type="button" className="d_btn d_btn_outline" onClick={() => { setShowModal(false); setForm({ employeeId: '', date: '', extraHours: '', rate: '', amount: '' }); }}>Cancel</button>
              <button type="submit" className="d_btn d_btn_primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Overtime'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: '#22c55e' }}>₹{totalAmount.toLocaleString('en-IN')}</div>
                  <div className="d_stat_label">Total OT Amount</div>
                </div>
                <div className="d_stat_icon" style={{ color: '#22c55e', backgroundColor: '#f0fdf4', fontSize: 32, padding: 8, borderRadius: 8 }}><MdMonetizationOn /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: 'var(--d-accent)' }}>{totalHours} hrs</div>
                  <div className="d_stat_label">Total OT Hours</div>
                </div>
                <div className="d_stat_icon" style={{ color: 'var(--d-accent)', backgroundColor: '#fefce8', fontSize: 32, padding: 8, borderRadius: 8 }}><MdAccessTime /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="d_card h-100">
            <div className="d_card_body">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="d_stat_value" style={{ color: 'var(--d-primary)' }}>{records.length}</div>
                  <div className="d_stat_label">Employees</div>
                </div>
                <div className="d_stat_icon" style={{ color: 'var(--d-primary)', backgroundColor: '#eff6ff', fontSize: 32, padding: 8, borderRadius: 8 }}><MdAccessTime /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d_card">
        <div className="d_card_header">
          <div className="d_card_title">
            <span className="d_card_icon"><MdAccessTime /></span>
            Overtime Details
          </div>
        </div>
        <div className="d_card_body p-0">
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-4 text-muted">No overtime records found</div>
          ) : (
            <div className="d_table_wrap">
              <table className="d_table">
                <thead>
                  <tr>
                    <th>Emp ID</th>
                    <th>Name</th>
                    <th>Date</th>
                    <th>OT Minutes</th>
                    <th>OT Hours</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r._id}>
                      <td><code>{r.empId}</code></td>
                      <td>
                        <div className="d-flex align-items-center">
                          {r.employeeId?.image ? (
                            <img src={r.employeeId.image} alt={r.emp} className="d_table_avatar me-2" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div className="d-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 32, height: 32, fontSize: 12 }}>
                              {r.emp?.charAt(0)}
                            </div>
                          )}
                          {r.emp}
                        </div>
                      </td>
                      <td>{r.date}</td>
                      <td>{r.overtimeMinutes || 0} min</td>
                      <td>{((r.overtimeMinutes || 0) / 60).toFixed(2)}</td>
                      <td>₹{parseFloat(r.rate || 0).toFixed(2)}/hr</td>
                      <td><strong>₹{parseFloat(r.amount || 0).toLocaleString('en-IN')}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'right', fontWeight: 600 }}>Total Amount</td>
                    <td><strong>₹{totalAmount.toLocaleString('en-IN')}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OvertimeCalculation;
