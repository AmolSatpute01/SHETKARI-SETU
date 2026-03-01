import { useState } from "react";
import { useNavigate } from "react-router-dom";
import languageText from "../data/languageText";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("en");
  const text = languageText[language];

  // ✅ Role selection
  const [role, setRole] = useState("farmer");

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
  };

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile" && !/^\d*$/.test(value)) return;
    setFormData({ ...formData, [name]: value });
  };

  const isValidPassword = (password) => {
    return password.length >= 6;
  };

  // ✅ SEND OTP
  const handleSendOtp = async () => {
    setError("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (formData.mobile.length !== 10) {
      setError(text.mobileError);
      return;
    }
    if (!formData.email.trim()) {
      setError("Email is required for OTP verification.");
      return;
    }
    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address (example@gmail.com)");
      return;
    }
    if (!isValidPassword(formData.password)) {
      setError(text.passwordRule);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(text.passwordMismatch);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/send-otp-register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            mobile: formData.mobile,
            email: formData.email,
            password: formData.password,
            role,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOtpSent(true);
        setSuccessMsg("✅ OTP sent to your email!");
      } else {
        setError(data.message || "OTP sending failed. Please try again.");
      }
    } catch (err) {
      setError("Backend not reachable. Please start server and try again.");
    }
  };

  // ✅ VERIFY OTP + REGISTER
  const handleVerifyOtpAndRegister = async () => {
    setError("");
    setSuccessMsg("");

    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp-register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mobile: formData.mobile,
            otp,
            role,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
      } else {
        setError(data.message || "OTP verification failed");
      }
    } catch (err) {
      setError("Server error during OTP verification");
    }
  };

  return (
    <>
      <div className="register-page">
        <div className="register-card" style={{ position: "relative" }}>
          
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "#f0f0f0",
              color: "#2e7d32",
              border: "1px solid #ccc",
              padding: "5px 10px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              outline: "none",
              fontSize: "12px"
            }}
          >
            <option value="en">English</option>
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
          </select>

          {isSubmitted ? (
            <div className="success-box">
              <h2>{text.registrationSuccess} 🎉</h2>
              <p>{text.successMessage}</p>
              <button
                className="register-btn"
                onClick={() => navigate("/login")}
              >
                {text.loginBtn}
              </button>
            </div>
          ) : (
            <>
              {/* ✅ FIXED: Dynamic Title for both roles */}
              <h2>
                {role === "farmer"
                  ? text.registerTitle
                  : text.customerRegisterTitle}
              </h2>

              {!otpSent && (
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  {/* ✅ FIXED: Farmer Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setRole("farmer")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: role === "farmer" ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: role === "farmer" ? "#e8f5e9" : "#fff",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    👨‍🌾 {text.farmerLabel}
                  </button>

                  {/* ✅ FIXED: Customer Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setRole("customer")}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "10px",
                      border: role === "customer" ? "2px solid #2e7d32" : "1px solid #ddd",
                      background: role === "customer" ? "#e8f5e9" : "#fff",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    🛒 {text.customerLabel}
                  </button>
                </div>
              )}

              <form onSubmit={(e) => e.preventDefault()}>
                <label>{text.fullName} *</label>
                <input
                  type="text"
                  name="name"
                  placeholder={text.fullName}
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={otpSent}
                />

                <label>{text.mobileNumber} *</label>
                <input
                  type="text"
                  name="mobile"
                  placeholder={text.mobileNumber}
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength="10"
                  required
                  disabled={otpSent}
                />

                {/* ✅ FIXED: Email Label and Placeholder */}
                <label>{text.emailLabel} *</label>
                <input
                  type="email"
                  name="email"
                  placeholder={text.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={otpSent}
                  required
                />

                <label>{text.password} *</label>
                <input
                  type="password"
                  name="password"
                  placeholder={text.password}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={otpSent}
                />

                <label>{text.confirmPassword} *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder={text.confirmPassword}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={otpSent}
                />

                {otpSent && (
                  <>
                    <label>Enter OTP *</label>
                    <input
                      type="text"
                      placeholder="Enter 6 digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength="6"
                      required
                    />
                  </>
                )}

                {error && <p className="error-text">{error}</p>}
                {successMsg && (
                  <p style={{ color: "#2e7d32", fontWeight: "800" }}>
                    {successMsg}
                  </p>
                )}

                {!otpSent ? (
                  /* ✅ FIXED: Send OTP Button Text */
                  <button
                    type="button"
                    className="register-btn"
                    onClick={handleSendOtp}
                  >
                    📩 {text.sendOtp}
                  </button>
                ) : (
                  /* ✅ FIXED: Verify OTP Button Text */
                  <button
                    type="button"
                    className="register-btn"
                    onClick={handleVerifyOtpAndRegister}
                  >
                    ✅ {text.verifyOtp}
                  </button>
                )}

                <p className="login-note">
                  {text.alreadyRegistered}{" "}
                  <span
                    className="login-link"
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/login")}
                  >
                    {text.loginLinkText}
                  </span>
                </p>

                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "13px",
                    color: "#666",
                    textAlign: "center",
                    lineHeight: "1.6",
                  }}
                >
                  {text.helpdeskLine}{" "}
                  <span
                    onClick={() => navigate("/helpdesk")}
                    style={{
                      color: "#2e7d32",
                      fontWeight: "900",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    {text.helpdeskWord}
                  </span>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Register;