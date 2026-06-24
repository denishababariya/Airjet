import React, { useState } from 'react';
import { MdPassword, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const togglePassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const validate = () => {
    const e = {};
    if (!formData.currentPassword) e.currentPassword = 'Current password is required';
    if (!formData.newPassword) e.newPassword = 'New password is required';
    if (formData.newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) e.confirmPassword = 'Please confirm your password';
    if (formData.newPassword !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    // Simulate password change
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 3000);
  };

  const passwordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'var(--d-danger)', 'var(--d-warning)', 'var(--d-info)', 'var(--d-success)', 'var(--d-success)'];
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const strength = passwordStrength(formData.newPassword);

  return (
    <div>
      <div className="d_page_header">
        <h1 className="d_page_title">Change Password</h1>
        <p className="d_page_subtitle">Update your password to keep your account secure</p>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdPassword className="d_card_icon" /> Password Settings
              </h2>
            </div>
            <div className="d_card_body">
              {success && (
                <div className="d_alert d_success mb-3">
                  <MdCheckCircle style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <strong>Success!</strong> Your password has been changed successfully.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="d_form_group mb-3">
                  <label className="d_form_label">Current Password <span className="d_req">*</span></label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.current ? 'text' : 'password'}
                      className="d_form_control"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword('current')}
                    >
                      {showPassword.current ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <span className="d_error_msg">{errors.currentPassword}</span>
                  )}
                </div>

                <div className="d_form_group mb-3">
                  <label className="d_form_label">New Password <span className="d_req">*</span></label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.new ? 'text' : 'password'}
                      className="d_form_control"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword('new')}
                    >
                      {showPassword.new ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <span className="d_error_msg">{errors.newPassword}</span>
                  )}
                  {formData.newPassword && (
                    <div className="d_password_strength mb-2">
                      <div className="d_strength_bar">
                        <div
                          className="d_strength_fill"
                          style={{
                            width: `${(strength.strength / 5) * 100}%`,
                            background: strength.color,
                          }}
                        />
                      </div>
                      <span className="d_strength_label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="d_form_group mb-3">
                  <label className="d_form_label">Confirm New Password <span className="d_req">*</span></label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.confirm ? 'text' : 'password'}
                      className="d_form_control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword('confirm')}
                    >
                      {showPassword.confirm ? <MdVisibilityOff /> : <MdVisibility />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="d_error_msg">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="d_password_tips mb-3">
                  <div className="d_tips_title">Password Requirements:</div>
                  <ul className="d_tips_list">
                    <li className={formData.newPassword.length >= 6 ? 'd_tip_valid' : ''}>
                      At least 6 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.newPassword) ? 'd_tip_valid' : ''}>
                      At least one uppercase letter
                    </li>
                    <li className={/[0-9]/.test(formData.newPassword) ? 'd_tip_valid' : ''}>
                      At least one number
                    </li>
                    <li className={/[^A-Za-z0-9]/.test(formData.newPassword) ? 'd_tip_valid' : ''}>
                      At least one special character
                    </li>
                  </ul>
                </div>

                <div className="d_form_actions">
                  <button type="button" className="d_btn d_btn_outline" onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}>
                    Cancel
                  </button>
                  <button type="submit" className="d_btn d_btn_primary">
                    <MdPassword /> Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
