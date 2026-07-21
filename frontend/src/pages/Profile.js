import React, { useState, useEffect } from 'react';
import {
  MdPerson, MdEmail, MdLocationOn, MdWork,
  MdEdit, MdCalendarToday, MdSecurity, MdSave,
} from 'react-icons/md';
import { usersApi, employeesApi } from '../utils/api';

const formatDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Profile = ({ currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.getMe();
      setProfile(data);
      const emp = data.employee || {};
      const nameParts = (emp.name || '').split(' ');
      setFormData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: emp.email || '',
        phone: emp.phoneNo || '',
        address: emp.address || '',
        department: emp.department?.title || '',
        designation: emp.designation?.title || '',
        employeeId: emp.id || '',
        joinDate: formatDate(emp.joiningDate || emp.createdAt),
        gender: emp.gender || '',
        workShift: emp.workShift || '',
      });
    } catch (err) {
      if (currentUser?.employee) {
        const emp = currentUser.employee;
        const nameParts = (emp.name || '').split(' ');
        setProfile({ role: currentUser.role, status: 'Active', employee: emp });
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: emp.email || '',
          phone: emp.phoneNo || '',
          address: emp.address || '',
          department: emp.department?.title || '',
          designation: emp.designation?.title || '',
          employeeId: emp.id || '',
          joinDate: formatDate(emp.joiningDate),
          gender: emp.gender || '',
          workShift: emp.workShift || '',
        });
      } else {
        setError(err.displayMessage || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const empId = profile?.employee?._id;
      if (empId) {
        await employeesApi.update(empId, {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phoneNo: formData.phone,
          address: formData.address,
        });
        await loadProfile();
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save profile');
    }
  };

  if (loading) return <div className="text-center py-5">Loading profile…</div>;

  const stats = [
    { label: 'Employee ID', value: formData.employeeId || '-', icon: <MdPerson />, color: 'var(--d-primary)' },
    { label: 'Join Date', value: formData.joinDate, icon: <MdCalendarToday />, color: 'var(--d-success)' },
    { label: 'Role', value: profile?.role || 'User', icon: <MdSecurity />, color: 'var(--d-warning)' },
    { label: 'Department', value: formData.department || '-', icon: <MdWork />, color: 'var(--d-info)' },
  ];

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">My Profile</h1>
          <p className="d_page_subtitle">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button className="d_btn d_btn_primary" onClick={() => setIsEditing(true)}>
            <MdEdit /> Edit Profile
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        {stats.map((stat, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="d_card" style={{ borderLeft: `4px solid ${stat.color}` }}>
              <div className="d_card_body d-flex align-items-center gap-3" style={{ padding: '16px 18px' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: stat.color + '18', color: stat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--d-text-main)', lineHeight: 1.1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--d-text-muted)', marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title"><MdPerson className="d_card_icon" /> Personal Information</h2>
            </div>
            <div className="d_card_body">
              <div className="d_form_row cols-2 mb-3">
                <div className="d_form_group">
                  <label className="d_form_label">First Name</label>
                  {isEditing ? (
                    <input type="text" className="d_form_control" name="firstName" value={formData.firstName} onChange={handleChange} />
                  ) : (
                    <div className="d_form_value">{formData.firstName}</div>
                  )}
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Last Name</label>
                  {isEditing ? (
                    <input type="text" className="d_form_control" name="lastName" value={formData.lastName} onChange={handleChange} />
                  ) : (
                    <div className="d_form_value">{formData.lastName}</div>
                  )}
                </div>
              </div>
              <div className="d_form_row cols-2 mb-3">
                <div className="d_form_group">
                  <label className="d_form_label">Designation</label>
                  <div className="d_form_value">{formData.designation || '-'}</div>
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Work Shift</label>
                  <div className="d_form_value">{formData.workShift || '-'}</div>
                </div>
              </div>
              <div className="d_form_group mb-3">
                <label className="d_form_label">Address</label>
                {isEditing ? (
                  <input type="text" className="d_form_control" name="address" value={formData.address} onChange={handleChange} />
                ) : (
                  <div className="d_form_value">{formData.address || '-'}</div>
                )}
              </div>
              {isEditing && (
                <div className="d_form_actions">
                  <button className="d_btn d_btn_outline" onClick={() => setIsEditing(false)}>Cancel</button>
                  <button className="d_btn d_btn_primary" onClick={handleSave}><MdSave /> Save Changes</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="d_card mb-4">
            <div className="d_card_header">
              <h2 className="d_card_title"><MdEmail className="d_card_icon" /> Contact</h2>
            </div>
            <div className="d_card_body">
              <div className="d_contact_item mb-3">
                <div className="d_contact_label">Email</div>
                {isEditing ? (
                  <input type="email" className="d_form_control" name="email" value={formData.email} onChange={handleChange} />
                ) : (
                  <div className="d_contact_value">{formData.email}</div>
                )}
              </div>
              <div className="d_contact_item mb-3">
                <div className="d_contact_label">Phone</div>
                {isEditing ? (
                  <input type="text" className="d_form_control" name="phone" value={formData.phone} onChange={handleChange} />
                ) : (
                  <div className="d_contact_value">{formData.phone || '-'}</div>
                )}
              </div>
              <div className="d_contact_item">
                <div className="d_contact_label">Location</div>
                <div className="d_contact_value">
                  <MdLocationOn style={{ marginRight: 8, color: 'var(--d-primary)' }} />
                  {formData.address || 'Not set'}
                </div>
              </div>
            </div>
          </div>

          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title"><MdSecurity className="d_card_icon" /> Account Status</h2>
            </div>
            <div className="d_card_body">
              <div className="d_status_item mb-3">
                <div className="d_status_label">Role</div>
                <div className="d_status_value">
                  <span className="d_badge d_primary">{profile?.role || 'User'}</span>
                </div>
              </div>
              <div className="d_status_item">
                <div className="d_status_label">Status</div>
                <div className="d_status_value">
                  <span className={`d_badge ${profile?.status === 'Active' ? 'd_success' : 'd_danger'}`}>
                    {profile?.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
