import React, { useState, useEffect } from 'react';
import {
  MdPerson, MdEmail, MdLocationOn, MdWork,
  MdEdit, MdCalendarToday, MdSecurity, MdSave, MdCameraAlt,
} from 'react-icons/md';
import { usersApi, employeesApi } from '../utils/api';
import { V, validate } from '../utils/validators';

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
      setImageFile(null);
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
        setImageFile(null);
      } else {
        setError(err.displayMessage || 'Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    setError('');
    setImageFile(null);
    setIsEditing(false);
    loadProfile();
  };

  const handleSave = async () => {
    const validationErrors = validate({
      firstName: V.name(formData.firstName, 'First name'),
      lastName: V.name(formData.lastName, 'Last name'),
      email: V.email(formData.email),
      phone: V.phone(formData.phone),
    });
    if (Object.keys(validationErrors).length) {
      setError(Object.values(validationErrors)[0]);
      return;
    }
    try {
      const empId = profile?.employee?._id;
      if (empId) {
        await employeesApi.update(empId, {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phoneNo: formData.phone,
          address: formData.address,
        }, imageFile);
        await loadProfile();
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.displayMessage || 'Failed to save profile');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  if (loading) return <div className="text-center py-5">Loading profile…</div>;

  const stats = [
    { label: 'Employee ID', value: formData.employeeId || '-', icon: <MdPerson />, color: 'var(--d-primary)' },
    { label: 'Join Date', value: formData.joinDate, icon: <MdCalendarToday />, color: 'var(--d-success)' },
    { label: 'Role', value: profile?.role || 'User', icon: <MdSecurity />, color: 'var(--d-warning)' },
    { label: 'Department', value: formData.department || '-', icon: <MdWork />, color: 'var(--d-info)' },
  ];

  const profileImage = profile?.employee?.image || currentUser?.employee?.image || '';
  const profileImageSrc = imagePreview || (profileImage ? `http://localhost:5000${profileImage}` : '');
  const profileInitials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.trim().toUpperCase() || 'AP';

  return (
    <div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Profile Header */}
      <div className="d_card" style={{ marginBottom: '1.5rem' }}>
        <div className="d_card_body" style={{ padding: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            {/* Profile Image */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative' }}>
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Profile"
                    style={{
                      width: 150,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '4px solid var(--d-primary)',
                      boxShadow: '0 4px 20px rgba(0,123,255,0.3)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    border: '4px solid #fff',
                    background: 'linear-gradient(145deg, var(--d-primary), #69aaf5)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(13, 110, 253, 0.24)',
                    fontSize: 42,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}>
                    {profileInitials}
                  </div>
                )}
                {isEditing && (
                  <label style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--d-primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <MdCameraAlt style={{ fontSize: 20 }} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--d-text-main)', marginBottom: '0.5rem' }}>
                {formData.firstName} {formData.lastName}
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--d-text-muted)', marginBottom: '1rem' }}>
                {formData.designation || 'Employee'}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <span className="d_badge d_primary">{profile?.role || 'User'}</span>
                <span className={`d_badge ${profile?.status === 'Active' ? 'd_success' : 'd_danger'}`}>
                  {profile?.status || 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!isEditing ? (
                  <button className="d_btn d_btn_primary" onClick={() => setIsEditing(true)}>
                    <MdEdit /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button className="d_btn d_btn_outline" onClick={handleCancelEdit}>Cancel</button>
                    <button className="d_btn d_btn_primary" onClick={handleSave}>
                      <MdSave /> Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i}>
            <div className="d_card" style={{ borderLeft: `4px solid ${stat.color}`, marginBottom: 0 }}>
              <div className="d_card_body d-flex align-items-center gap-3" style={{ padding: '16px 18px' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: stat.color + '18', color: stat.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {stat.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--d-text-main)', lineHeight: 1.1 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--d-text-muted)', marginTop: 2 }}>{stat.label}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Information Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {/* Personal Information */}
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdPerson className="d_card_icon" /> Personal Information</h2>
          </div>
          <div className="d_card_body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="d_form_group">
                <label className="d_form_label">First Name</label>
                {isEditing ? (
                  <input type="text" className="d_form_control" name="firstName" value={formData.firstName} onChange={handleChange} pattern="[A-Za-z .'-]+" />
                ) : (
                  <div className="d_form_value">{formData.firstName}</div>
                )}
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Last Name</label>
                {isEditing ? (
                  <input type="text" className="d_form_control" name="lastName" value={formData.lastName} onChange={handleChange} pattern="[A-Za-z .'-]+" />
                ) : (
                  <div className="d_form_value">{formData.lastName}</div>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div className="d_form_group">
                <label className="d_form_label">Designation</label>
                <div className="d_form_value">{formData.designation || '-'}</div>
              </div>
              <div className="d_form_group">
                <label className="d_form_label">Work Shift</label>
                <div className="d_form_value">{formData.workShift || '-'}</div>
              </div>
            </div>
            <div className="d_form_group" style={{ marginBottom: '1rem' }}>
              <label className="d_form_label">Address</label>
              {isEditing ? (
                <input type="text" className="d_form_control" name="address" value={formData.address} onChange={handleChange} />
              ) : (
                <div className="d_form_value">{formData.address || '-'}</div>
              )}
            </div>
            {isEditing && (
              <div className="profile_form_actions">
                <button className="d_btn d_btn_outline" onClick={handleCancelEdit}>Cancel</button>
                <button className="d_btn d_btn_primary" onClick={handleSave}><MdSave /> Save Changes</button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdEmail className="d_card_icon" /> Contact Information</h2>
          </div>
          <div className="d_card_body">
            <div className="d_contact_item" style={{ marginBottom: '1rem' }}>
              <div className="d_contact_label">Email</div>
              {isEditing ? (
                <input type="email" className="d_form_control" name="email" value={formData.email} onChange={handleChange} />
              ) : (
                <div className="d_contact_value">{formData.email}</div>
              )}
            </div>
            <div className="d_contact_item" style={{ marginBottom: '1rem' }}>
              <div className="d_contact_label">Phone</div>
              {isEditing ? (
                <input type="text" className="d_form_control" name="phone" value={formData.phone} onChange={handleChange} inputMode="numeric" maxLength={10} />
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

        {/* Account Status */}
        <div className="d_card">
          <div className="d_card_header">
            <h2 className="d_card_title"><MdSecurity className="d_card_icon" /> Account Status</h2>
          </div>
          <div className="d_card_body">
            <div className="d_status_item" style={{ marginBottom: '1rem' }}>
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
  );
};

export default Profile;
