import React, { useState } from "react";
import {
  MdPerson,
  MdLock,
  MdEmail,
  MdPhone,
  MdBusiness,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";

const Register = ({ onRegister, setActiveMenu }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === "agreeTerms" ? checked : value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName.trim()) e.firstName = "First name is required";
    if (!formData.lastName.trim()) e.lastName = "Last name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Invalid email format";
    if (!formData.phone.trim()) e.phone = "Phone number is required";
    if (!formData.password) e.password = "Password is required";
    if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!formData.agreeTerms) e.agreeTerms = "You must agree to the terms";
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
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (onRegister) onRegister(formData);
      if (setActiveMenu) setActiveMenu('dashboard');
    }, 1000);
  };

  return (
    <div className="d_login_wrapper">
      <>
        <div className="d_login_card d_register_card">
          {/* Logo & Header */}
          <div className="d_login_header">
            <div className="d_login_logo">
              <MdBusiness style={{ fontSize: 48, color: "var(--d-primary)" }} />
            </div>
            <h1 className="d_login_title">Create Account</h1>
            <p className="d_login_subtitle">Join Airjet ERP today</p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="d_login_form">
            <div className="d_form_row cols-2 mb-3">
              <div className="d_form_group">
                <label className="d_form_label">
                  First Name <span className="d_req">*</span>
                </label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdPerson />
                  </span>
                  <input
                    type="text"
                    className="d_form_control"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <span className="d_error_msg">{errors.firstName}</span>
                )}
              </div>

              <div className="d_form_group">
                <label className="d_form_label">
                  Last Name <span className="d_req">*</span>
                </label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdPerson />
                  </span>
                  <input
                    type="text"
                    className="d_form_control"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <span className="d_error_msg">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="d_form_group mb-3">
              <label className="d_form_label">
                Email Address <span className="d_req">*</span>
              </label>
              <div className="d_input_group">
                <span className="d_input_icon">
                  <MdEmail />
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
              <label className="d_form_label">
                Phone Number <span className="d_req">*</span>
              </label>
              <div className="d_input_group">
                <span className="d_input_icon">
                  <MdPhone />
                </span>
                <input
                  type="tel"
                  className="d_form_control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                />
              </div>
              {errors.phone && (
                <span className="d_error_msg">{errors.phone}</span>
              )}
            </div>

            <div className="d_form_row cols-2 mb-3">
              <div className="d_form_group">
                <label className="d_form_label">
                  Password <span className="d_req">*</span>
                </label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdLock />
                  </span>
                  <input
                    type={showPassword.password ? "text" : "password"}
                    className="d_form_control"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create password"
                  />
                  <button
                    type="button"
                    className="d_password_toggle"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        password: !showPassword.password,
                      })
                    }
                  >
                    {showPassword.password ? (
                      <MdVisibilityOff />
                    ) : (
                      <MdVisibility />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="d_error_msg">{errors.password}</span>
                )}
              </div>

              <div className="d_form_group">
                <label className="d_form_label">
                  Confirm Password <span className="d_req">*</span>
                </label>
                <div className="d_input_group">
                  <span className="d_input_icon">
                    <MdLock />
                  </span>
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    className="d_form_control"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="d_password_toggle"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm: !showPassword.confirm,
                      })
                    }
                  >
                    {showPassword.confirm ? (
                      <MdVisibilityOff />
                    ) : (
                      <MdVisibility />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="d_error_msg">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="d_form_group mb-3">
              <label className="d_checkbox">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <span>
                  I agree to the{" "}
                  <button type="button" className="d_link">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button type="button" className="d_link">
                    Privacy Policy
                  </button>
                </span>
              </label>
              {errors.agreeTerms && (
                <span className="d_error_msg">{errors.agreeTerms}</span>
              )}
            </div>

            <div className="d-flex justify-content-center">
              <button
                type="submit"
                className="d_btn d_btn_primary"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="d_login_footer">
            <p className="d_login_text">
              Already have an account?{" "}
              <button
                type="button"
                className="d_login_link"
                onClick={() => setActiveMenu && setActiveMenu("Login")}
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Info Side */}
        <div className="d_login_info">
          <div className="d_info_content">
            <h2>Start Your Journey</h2>
            <p className="d_info_desc">
              Create your account to access powerful tools for managing your
              spare parts business. Get started in minutes.
            </p>
            <div className="d_info_features">
              <div className="d_feature_item">
                <div className="d_feature_icon">🚀</div>
                <div className="d_feature_text">Quick Setup</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">📊</div>
                <div className="d_feature_text">Real-time Analytics</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">🔒</div>
                <div className="d_feature_text">Secure & Reliable</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">💬</div>
                <div className="d_feature_text">24/7 Support</div>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default Register;
