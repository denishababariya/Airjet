import React, { useState } from 'react';
import {
  MdPerson, MdEmail, MdLocationOn, MdWork,
  MdEdit, MdCalendarToday, MdSecurity, MdSave,
} from 'react-icons/md';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@airjet.com',
    phone: '+91 98765 43210',
    department: 'Administration',
    designation: 'Super Administrator',
    employeeId: 'SA001',
    joinDate: '01-Jan-2020',
    location: 'Head Office, Ahmedabad',
    bio: 'Managing the entire Airjet ERP system with 5+ years of experience.',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const stats = [
    { label: 'Total Logins', value: '1,247', icon: <MdPerson />, color: 'var(--d-primary)' },
    { label: 'Last Login', value: 'Today, 9:30 AM', icon: <MdCalendarToday />, color: 'var(--d-success)' },
    { label: 'Active Sessions', value: '2', icon: <MdSecurity />, color: 'var(--d-warning)' },
    { label: 'Department', value: 'Admin', icon: <MdWork />, color: 'var(--d-info)' },
  ];

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">My Profile</h1>
          <p className="d_page_subtitle">Manage your personal information and account settings</p>
        </div>
        {!isEditing && (
          <button className="d_btn d_btn_primary" onClick={() => setIsEditing(true)}>
            <MdEdit /> Edit Profile
          </button>
        )}
      </div>

      {/* Stats Cards */}
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
        {/* Profile Information Card */}
        <div className="col-12 col-lg-8">
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdPerson className="d_card_icon" /> Personal Information
              </h2>
            </div>
            <div className="d_card_body">
              <div className="d_form_row cols-2 mb-3">
                <div className="d_form_group">
                  <label className="d_form_label">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="d_form_control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="d_form_value">{formData.firstName}</div>
                  )}
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="d_form_control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="d_form_value">{formData.lastName}</div>
                  )}
                </div>
              </div>

              <div className="d_form_row cols-2 mb-3">
                <div className="d_form_group">
                  <label className="d_form_label">Employee ID</label>
                  <div className="d_form_value">
                    <code>{formData.employeeId}</code>
                  </div>
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Join Date</label>
                  <div className="d_form_value">{formData.joinDate}</div>
                </div>
              </div>

              <div className="d_form_row cols-2 mb-3">
                <div className="d_form_group">
                  <label className="d_form_label">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="d_form_control"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="d_form_value">{formData.department}</div>
                  )}
                </div>
                <div className="d_form_group">
                  <label className="d_form_label">Designation</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="d_form_control"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  ) : (
                    <div className="d_form_value">{formData.designation}</div>
                  )}
                </div>
              </div>

              <div className="d_form_group mb-3">
                <label className="d_form_label">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="d_form_control"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="d_form_value">{formData.location}</div>
                )}
              </div>

              <div className="d_form_group mb-3">
                <label className="d_form_label">Bio</label>
                {isEditing ? (
                  <textarea
                    className="d_form_control"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                  />
                ) : (
                  <div className="d_form_value">{formData.bio}</div>
                )}
              </div>

              {isEditing && (
                <div className="d_form_actions">
                  <button className="d_btn d_btn_outline" onClick={handleCancel}>Cancel</button>
                  <button className="d_btn d_btn_primary" onClick={handleSave}>
                    <MdSave /> Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Card */}
        <div className="col-12 col-lg-4">
          <div className="d_card mb-4">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdEmail className="d_card_icon" /> Contact Information
              </h2>
            </div>
            <div className="d_card_body">
              <div className="d_contact_item mb-3">
                <div className="d_contact_label">Email</div>
                {isEditing ? (
                  <input
                    type="email"
                    className="d_form_control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="d_contact_value">{formData.email}</div>
                )}
              </div>

              <div className="d_contact_item mb-3">
                <div className="d_contact_label">Phone</div>
                {isEditing ? (
                  <input
                    type="text"
                    className="d_form_control"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="d_contact_value">{formData.phone}</div>
                )}
              </div>

              <div className="d_contact_item">
                <div className="d_contact_label">Location</div>
                <div className="d_contact_value">
                  <MdLocationOn style={{ marginRight: 8, color: 'var(--d-primary)' }} />
                  {formData.location}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdSecurity className="d_card_icon" /> Account Status
              </h2>
            </div>
            <div className="d_card_body">
              <div className="d_status_item mb-3">
                <div className="d_status_label">Account Type</div>
                <div className="d_status_value">
                  <span className="d_badge d_primary">Super Admin</span>
                </div>
              </div>

              <div className="d_status_item mb-3">
                <div className="d_status_label">Status</div>
                <div className="d_status_value">
                  <span className="d_badge d_success">Active</span>
                </div>
              </div>

              <div className="d_status_item mb-3">
                <div className="d_status_label">2FA Enabled</div>
                <div className="d_status_value">
                  <span className="d_badge d_warning">No</span>
                </div>
              </div>

              <div className="d_status_item">
                <div className="d_status_label">Last Password Change</div>
                <div className="d_status_value">15-Jun-2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
