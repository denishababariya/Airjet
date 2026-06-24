import React, { useState } from "react";
import {
  MdNotifications,
  MdPalette,
  MdSecurity,
  MdSave,
  MdMonitor,
  MdEmail,
  MdPassword,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
} from "react-icons/md";

const Settings = () => {
  const [formData, setFormData] = useState({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: true,
    language: "en",
    theme: "light",
    twoFactor: false,
    sessionTimeout: "30",
    autoLogout: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = () => {
    // Save settings to backend
    alert("Settings saved successfully!");
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordErrors({ ...passwordErrors, [e.target.name]: "" });
  };

  const togglePassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const validatePassword = () => {
    const e = {};
    if (!passwordData.currentPassword)
      e.currentPassword = "Current password is required";
    if (!passwordData.newPassword) e.newPassword = "New password is required";
    if (passwordData.newPassword.length < 6)
      e.newPassword = "Password must be at least 6 characters";
    if (!passwordData.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    if (passwordData.newPassword !== passwordData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length) {
      setPasswordErrors(validationErrors);
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 3000);
  };

  const passwordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
    const colors = [
      "",
      "var(--d-danger)",
      "var(--d-warning)",
      "var(--d-info)",
      "var(--d-success)",
      "var(--d-success)",
    ];
    return { strength, label: labels[strength], color: colors[strength] };
  };

  const strength = passwordStrength(passwordData.newPassword);

  return (
    <div>
      <div className="d_page_header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h1 className="d_page_title">Settings</h1>
          <p className="d_page_subtitle">
            Manage your account preferences and system settings
          </p>
        </div>
        <button className="d_btn d_btn_primary" onClick={handleSave}>
          <MdSave /> Save Changes
        </button>
      </div>

      <div className="row g-4">
        {/* Account Preferences */}
        <div className="col-12 col-lg-6">
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdEmail className="d_card_icon" /> Account Preferences
              </h2>
            </div>
            <div className="d_card_body">
              <div className="d_pref_item mb-3">
                <div className="d_pref_label">Primary Email</div>
                <div className="d_pref_value">superadmin@airjet.com</div>
              </div>

              <div className="d_pref_item mb-3">
                <div className="d_pref_label">Backup Email</div>
                <div className="d_pref_value">Not set</div>
              </div>

              <div className="d_pref_item mb-3">
                <div className="d_pref_label">Phone Number</div>
                <div className="d_pref_value">+91 98765 43210</div>
              </div>

              <div className="d_pref_item">
                <div className="d_pref_label">Account Created</div>
                <div className="d_pref_value">01-Jan-2020</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Change Password */}
        <div className="col-12 col-lg-6">
          <div className="d_card">
            <div className="d_card_header">
              <h2 className="d_card_title">
                <MdPassword className="d_card_icon" /> Change Password
              </h2>
            </div>
            <div className="d_card_body">
              {passwordSuccess && (
                <div className="d_alert d_success mb-3">
                  <MdCheckCircle
                    style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <strong>Success!</strong> Your password has been changed
                    successfully.
                  </div>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="d_form_group mb-3">
                  <label className="d_form_label">
                    Current Password <span className="d_req">*</span>
                  </label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.current ? "text" : "password"}
                      className="d_form_control"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword("current")}
                    >
                      {showPassword.current ? (
                        <MdVisibilityOff />
                      ) : (
                        <MdVisibility />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="d_error_msg">
                      {passwordErrors.currentPassword}
                    </span>
                  )}
                </div>

                <div className="d_form_group mb-3">
                  <label className="d_form_label">
                    New Password <span className="d_req">*</span>
                  </label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      className="d_form_control"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword("new")}
                    >
                      {showPassword.new ? (
                        <MdVisibilityOff />
                      ) : (
                        <MdVisibility />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <span className="d_error_msg">
                      {passwordErrors.newPassword}
                    </span>
                  )}
                  {passwordData.newPassword && (
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
                      <span
                        className="d_strength_label"
                        style={{ color: strength.color }}
                      >
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="d_form_group mb-3">
                  <label className="d_form_label">
                    Confirm New Password <span className="d_req">*</span>
                  </label>
                  <div className="d_input_group">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      className="d_form_control"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="d_password_toggle"
                      onClick={() => togglePassword("confirm")}
                    >
                      {showPassword.confirm ? (
                        <MdVisibilityOff />
                      ) : (
                        <MdVisibility />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <span className="d_error_msg">
                      {passwordErrors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="d_password_tips mb-3">
                  <div className="d_tips_title">Password Requirements:</div>
                  <ul className="d_tips_list">
                    <li
                      className={
                        passwordData.newPassword.length >= 6
                          ? "d_tip_valid"
                          : ""
                      }
                    >
                      At least 6 characters
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(passwordData.newPassword)
                          ? "d_tip_valid"
                          : ""
                      }
                    >
                      At least one uppercase letter
                    </li>
                    <li
                      className={
                        /[0-9]/.test(passwordData.newPassword)
                          ? "d_tip_valid"
                          : ""
                      }
                    >
                      At least one number
                    </li>
                    <li
                      className={
                        /[^A-Za-z0-9]/.test(passwordData.newPassword)
                          ? "d_tip_valid"
                          : ""
                      }
                    >
                      At least one special character
                    </li>
                  </ul>
                </div>

                <div className="d_form_actions">
                  <button
                    type="button"
                    className="d_btn d_btn_outline"
                    onClick={() =>
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      })
                    }
                  >
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

export default Settings;
