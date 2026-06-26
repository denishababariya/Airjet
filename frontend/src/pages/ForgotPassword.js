import React, { useState } from "react";
import {
  MdEmail,
  MdArrowBack,
  MdCheckCircle,
  MdBusiness,
  MdInventory,
  MdAttachMoney,
  MdPeople,
  MdBuild,
  MdLock,
} from "react-icons/md";

const ForgotPassword = ({ setActiveMenu }) => {
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success
  const [resendTimer, setResendTimer] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({ ...errors, [name]: "" });
  };

  const validateEmail = () => {
    const e = {};
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Invalid email format";
    return e;
  };

  const validateOTP = () => {
    const e = {};
    if (!formData.otp.trim()) e.otp = "OTP is required";
    else if (formData.otp.length !== 6) e.otp = "OTP must be 6 digits";
    return e;
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateEmail();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    // Simulate API call to send OTP
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      startResendTimer();
    }, 1500);
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateOTP();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    // Simulate API call to verify OTP
    setTimeout(() => {
      setLoading(false);
      setActiveMenu && setActiveMenu("ChangePassword");
    }, 1500);
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    // Simulate API call to resend OTP
    setTimeout(() => {
      setLoading(false);
      startResendTimer();
    }, 1000);
  };

  const startResendTimer = () => {
    setResendTimer(30);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

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
              {step === 1 ? "Forgot Password?" : step === 2 ? "Enter OTP" : "Success"}
            </h1>
            <p className="d_login_subtitle">
              {step === 1
                ? "Enter your email to receive OTP"
                : step === 2
                ? `Enter the 6-digit code sent to ${formData.email}`
                : "OTP Verified Successfully"}
            </p>
          </div>

          {/* Step 1: Email Input */}
          {step === 1 && (
            <>
              <form onSubmit={handleEmailSubmit} className="d_login_form">
                <div className="d_form_group mb-3">
                  <label className="d_form_label">Email Address</label>
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

                <div className="d-flex justify-content-center">
                  <button
                    type="submit"
                    className="d_btn d_btn_primary"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
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
          )}

          {/* Step 2: OTP Input */}
          {step === 2 && (
            <>
              <form onSubmit={handleOTPSubmit} className="d_login_form">
                <div className="d_form_group mb-3">
                  <label className="d_form_label">Enter OTP</label>
                  <div className="d_otp_container">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        className="d_otp_input"
                        maxLength={1}
                        value={formData.otp[index] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!/^\d*$/.test(value)) return;
                          const newOtp = formData.otp.split("");
                          newOtp[index] = value;
                          setFormData({
                            ...formData,
                            otp: newOtp.join(""),
                          });
                          setErrors({ ...errors, otp: "" });
                          // Auto-focus next input
                          if (value && index < 5) {
                            const inputs = document.querySelectorAll(".d_otp_input");
                            inputs[index + 1].focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !formData.otp[index] && index > 0) {
                            const inputs = document.querySelectorAll(".d_otp_input");
                            inputs[index - 1].focus();
                          }
                        }}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <span className="d_error_msg">{errors.otp}</span>
                  )}
                </div>

                <div className="d_resend_otp mb-3">
                  <button
                    type="button"
                    className="d_resend_link"
                    onClick={handleResendOTP}
                    disabled={resendTimer > 0 || loading}
                  >
                    {resendTimer > 0
                      ? `Resend OTP in ${resendTimer}s`
                      : "Resend OTP"}
                  </button>
                </div>

                <div className="d-flex justify-content-center">
                  <button
                    type="submit"
                    className="d_btn d_btn_primary"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                </div>
              </form>

              <div className="d_login_footer">
                <button
                  type="button"
                  className="d_login_link"
                  onClick={() => setStep(1)}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <MdArrowBack size={16} />
                  Change Email
                </button>
              </div>
            </>
          )}
        </div>

        {/* Info Side */}
        <div className="d_login_info">
          <div className="d_info_content">
            <h2>
              {step === 1
                ? "Password Recovery"
                : step === 2
                ? "OTP Verification"
                : "Verified"}
            </h2>
            <p className="d_info_desc">
              {step === 1
                ? "Don't worry, it happens to the best of us. Enter your email address and we'll send you an OTP to verify your identity."
                : step === 2
                ? "Enter the 6-digit OTP sent to your email. This ensures the security of your account."
                : "Your identity has been verified. You can now reset your password."}
            </p>
            <div className="d_info_features">
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdInventory />
                </div>
                <div className="d_feature_text">Secure Recovery</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdAttachMoney />
                </div>
                <div className="d_feature_text">Quick Reset</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdPeople />
                </div>
                <div className="d_feature_text">24/7 Support</div>
              </div>
              <div className="d_feature_item">
                <div className="d_feature_icon">
                  <MdBuild />
                </div>
                <div className="d_feature_text">Account Security</div>
              </div>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default ForgotPassword;
