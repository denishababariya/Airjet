import React, { useState } from 'react';
import {
  MdPerson,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdBusiness,
  MdInventory,
  MdAttachMoney,
  MdPeople,
  MdBuild,
} from 'react-icons/md';

const Login = ({ onLogin, setActiveMenu }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value,
    });
    setErrors({ ...errors, [name]: '' });
    setApiError('');
  };

  const validate = () => {
    const e = {};
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = 'Invalid email format';
    if (!formData.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (onLogin) onLogin(data.user);
      if (setActiveMenu) setActiveMenu('dashboard');
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='d-flex align-items-center justify-content-center h-100'>
      <div className="d_login_wrapper">
        <>
          <div className="d_login_card">
            {/* Logo & Header */}
            <div className="d_login_header">
              <div className="d_login_logo">
                <MdBusiness style={{ fontSize: 48, color: 'var(--d-primary)' }} />
              </div>
              <h1 className="d_login_title">Airjet ERP</h1>
              <p className="d_login_subtitle">Spare Parts Management System</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="d_login_form">
              {apiError && (
                <div className="alert alert-danger" role="alert">
                  {apiError}
                </div>
              )}
              <div className="d_form_group mb-3">
                <label className="d_form_label">Email Address</label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdPerson />
                  </span>
                  <input
                    type="email"
                    className="d_form_control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <span className="d_error_msg">{errors.email}</span>
                )}
              </div>

              <div className="d_form_group mb-3">
                <label className="d_form_label">Password</label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdLock />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="d_form_control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="d_password_toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                  </button>
                </div>
                {errors.password && (
                  <span className="d_error_msg">{errors.password}</span>
                )}
              </div>

              <div className="d_login_options mb-3">
                <label className="d_checkbox">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="d_forgot_link"
                  onClick={() => setActiveMenu && setActiveMenu('ForgotPassword')}
                >
                  Forgot Password?
                </button>
              </div>

              <div className="d-flex justify-content-center">
                <button
                  type="submit"
                  className="d_btn d_btn_primary "
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="d_login_footer">
              <div className="d_login_notice">
                <MdBuild style={{ fontSize: 16, color: 'var(--d-primary)', flexShrink: 0 }} />
                <p className="d_login_text">
                  For account registration or access issues, please contact your <strong>System Administrator</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Info Side */}
          <div className="d_login_info">
            <div className="d_info_content">
              <h2>Welcome to Airjet ERP</h2>
              <p className="d_info_desc">
                Streamline your spare parts management with our comprehensive ERP
                solution. Track inventory, manage sales, handle payroll, and more.
              </p>
              <div className="d_info_features">
                <div className="d_feature_item">
                  <div className="d_feature_icon"><MdInventory /></div>
                  <div className="d_feature_text">Inventory Management</div>
                </div>
                <div className="d_feature_item">
                  <div className="d_feature_icon"><MdAttachMoney /></div>
                  <div className="d_feature_text">Sales & Purchases</div>
                </div>
                <div className="d_feature_item">
                  <div className="d_feature_icon"><MdPeople /></div>
                  <div className="d_feature_text">HR & Payroll</div>
                </div>
                <div className="d_feature_item">
                  <div className="d_feature_icon"><MdBuild /></div>
                  <div className="d_feature_text">Service Management</div>
                </div>
              </div>
            </div>
          </div>
        </>
      </div>
    </div>
  );
};

export default Login;
