import React, { useState } from "react";
import {
  MdPassword,
  MdVisibility,
  MdVisibilityOff,
  MdCheckCircle,
  MdBusiness,
  MdInventory,
  MdAttachMoney,
  MdPeople,
  MdBuild,
  MdLock,
  MdArrowBack,
} from "react-icons/md";

const ChangePassword = ({ setActiveMenu }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const togglePassword = (field) => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const validate = () => {
    const e = {};
    if (!formData.newPassword) e.newPassword = "New password is required";
    if (formData.newPassword.length < 6)
      e.newPassword = "Password must be at least 6 characters";
    if (!formData.confirmPassword)
      e.confirmPassword = "Please confirm your password";
    if (formData.newPassword !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    // Simulate password change API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setActiveMenu && setActiveMenu("Login");
      }, 2000);
    }, 1500);
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

  const strength = passwordStrength(formData.newPassword);

  return (
    <div className="d_login_wrapper">
      <>
        <div className="d_login_card">
          {/* Logo & Header */}
          <div className="d_login_header">
            <div className="d_login_logo">
              <MdBusiness style={{ fontSize: 48, color: "var(--d-primary)" }} />
            </div>
            <h1 className="d_login_title">
              {success ? "Password Changed!" : "Set New Password"}
            </h1>
            <p className="d_login_subtitle">
              {success
                ? "Your password has been successfully updated"
                : "Create a strong password for your account"}
            </p>
          </div>

          {!success ? (
            <>
              {/* Change Password Form */}
              <form onSubmit={handleSubmit} className="d_login_form">
                <div className="d_form_group mb-3">
                  <label className="d_form_label">New Password</label>
                  <div className="d_input_group">
                    <span className="d_input_icon">
                      <MdLock />
                    </span>
                    <input
                      type={showPassword.new ? "text" : "password"}
                      className="d_form_control"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
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
                  <label className="d_form_label">Confirm Password</label>
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
                  {errors.confirmPassword && (
                    <span className="d_error_msg">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                <div className="d_password_tips mb-3">
                  <div className="d_tips_title">Password Requirements:</div>
                  <ul className="d_tips_list">
                    <li
                      className={
                        formData.newPassword.length >= 6 ? "d_tip_valid" : ""
                      }
                    >
                      At least 6 characters
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(formData.newPassword) ? "d_tip_valid" : ""
                      }
                    >
                      At least one uppercase letter
                    </li>
                    <li
                      className={
                        /[0-9]/.test(formData.newPassword) ? "d_tip_valid" : ""
                      }
                    >
                      At least one number
                    </li>
                    <li
                      className={
                        /[^A-Za-z0-9]/.test(formData.newPassword)
                          ? "d_tip_valid"
                          : ""
                      }
                    >
                      At least one special character
                    </li>
                  </ul>
                </div>

                <div className="d-flex justify-content-center">
                  <button
                    type="submit"
                    className="d_btn d_btn_primary"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>

              <div className="d_login_footer">
                <button
                  type="button"
                  className="d_login_link"
                  onClick={() => setActiveMenu && setActiveMenu("Login")}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <MdArrowBack size={16} />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="d_success_message">
                <div className="d_success_icon">
                  <MdCheckCircle />
                </div>
                <h3 className="d_success_title">Password Updated!</h3>
                <p className="d_success_text">
                  Your password has been successfully changed. You can now log
                  in with your new password.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Info Side */}
        <div className="d_login_info">
          <div className="d_info_content">
            <h2>Secure Your Account</h2>
            <p className="d_info_desc">
              Create a strong password to protect your account. A good password
              should be unique and difficult to guess.
            </p>
            <div className="d_info_features">
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdInventory />
                </div>
                <div className="d_feature_text">Strong Encryption</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdAttachMoney />
                </div>
                <div className="d_feature_text">Secure Storage</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdPeople />
                </div>
                <div className="d_feature_text">Privacy Protected</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdBuild />
                </div>
                <div className="d_feature_text">Regular Updates</div>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default ChangePassword;
