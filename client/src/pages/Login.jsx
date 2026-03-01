import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import languageText from "../data/languageText";
import "./Register.css";

function Login() {
  const [language, setLanguage] = useState("en");
  const text = languageText[language];
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ 2) Role toggle buttons like Register page
  const [role, setRole] = useState("farmer");

  // ✅ Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotId, setForgotId] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");

  const [userKey, setUserKey] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!loginId || !password) {
      setError(text.loginRequiredError);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId,
          password,
          role, // ✅ MOST IMPORTANT FIX
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("role", data.role || role);
        localStorage.setItem("user", JSON.stringify(data.user));

        if ((data.role || role) === "customer") {
          localStorage.setItem("customer", JSON.stringify(data.user));
          localStorage.removeItem("farmer");
        } else {
          localStorage.setItem("farmer", JSON.stringify(data.user));
          localStorage.removeItem("customer");
        }

        if (data.token) localStorage.setItem("token", data.token);

        if ((data.role || role) === "customer") {
          navigate("/customer-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(data.message || text.invalidCredentials);
      }
    } catch (err) {
      setError(text.serverError);
    }
  };

  // ✅ SEND OTP FOR FORGOT PASSWORD
  const handleSendForgotOtp = async () => {
    setForgotMsg("");

    if (!forgotId.trim()) {
      setForgotMsg("Please enter your registered Mobile or Email.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/send-otp-forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginId: forgotId,
          role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setUserKey(data.userKey || "");
        setForgotMsg("✅ OTP sent to your email. Please check inbox/spam.");
      } else {
        setForgotMsg(data.message || "Failed to send OTP.");
      }
    } catch (err) {
      setForgotMsg("Server error while sending OTP.");
    }
  };

  // ✅ RESET PASSWORD
  const handleResetPassword = async () => {
    setForgotMsg("");

    if (!otp.trim()) return setForgotMsg("Please enter OTP.");
    if (!newPass.trim() || !confirmNewPass.trim())
      return setForgotMsg("Please enter new password.");
    if (newPass !== confirmNewPass) return setForgotMsg("Passwords do not match.");
    if (!userKey) return setForgotMsg("Something went wrong. Please resend OTP.");

    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          otp,
          newPassword: newPass,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setForgotMsg("✅ Password reset successful! Please login now.");

        setOtpSent(false);
        setOtp("");
        setNewPass("");
        setConfirmNewPass("");
        setUserKey("");
      } else {
        setForgotMsg(data.message || "Reset failed.");
      }
    } catch (err) {
      setForgotMsg("Server error while resetting password.");
    }
  };

  return (
    <>
      {/* ✅ 4) fixed extra white under footer using minHeight */}
      <div
        className="register-page"
        style={{ minHeight: "calc(100vh - 120px)" }}
      >
        <div className="register-card">
          {/* 🌍 Language Selector */}
          <div className="register-language">
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
          </div>

          {/* ✅ 3) Title changes properly */}
          <h2 style={{ marginBottom: "10px" }}>
            {role === "farmer" ? text.loginTitle : text.customerLoginTitle}
          </h2>

          {/* ✅ 2) Role buttons same as Register page */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
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

            <button
              type="button"
              onClick={() => setRole("customer")}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border:
                  role === "customer" ? "2px solid #2e7d32" : "1px solid #ddd",
                background: role === "customer" ? "#e8f5e9" : "#fff",
                fontWeight: "900",
                cursor: "pointer",
              }}
            >
              🛒 {text.customerLabel}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <label>{text.loginIdLabel}</label>
            <input
              type="text"
              placeholder={text.loginIdLabel}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />

            <label>{text.password}</label>
            <input
              type="password"
              placeholder={text.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* ✅ Forgot Password */}
            <div style={{ textAlign: "right", marginTop: "-6px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotId(loginId || "");
                  setForgotMsg("");
                  setOtpSent(false);
                  setOtp("");
                  setNewPass("");
                  setConfirmNewPass("");
                  setUserKey("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2e7d32",
                  fontWeight: "700",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "13px",
                }}
              >
                {text.forgotPassword}
              </button>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" className="register-btn">
              {text.loginBtn}
            </button>

            {/* ✅ Register link */}
            <p className="login-note" style={{ marginTop: "14px" }}>
              {text.newUser}{" "}
              <Link to="/register" className="login-link">
                {text.registerLinkText}
              </Link>
            </p>
          </form>
        </div>

        {/* ✅ Forgot Password Modal */}
        {showForgot && (
          <div
            onClick={() => setShowForgot(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 8px 22px rgba(0,0,0,0.15)",
                position: "relative",
              }}
            >
              <button
                onClick={() => setShowForgot(false)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: "#f1f1f1",
                  fontWeight: "900",
                }}
              >
                ✖
              </button>

              <h3 style={{ marginTop: 0, color: "#2e7d32" }}>
                Forgot Password
              </h3>

              <p style={{ marginTop: "6px", color: "#666", fontSize: "14px" }}>
                Enter your registered Mobile number or Email. OTP will be sent to
                your email.
              </p>

              <label style={{ fontWeight: "700", fontSize: "14px" }}>
                Mobile / Email
              </label>
              <input
                type="text"
                value={forgotId}
                onChange={(e) => setForgotId(e.target.value)}
                placeholder="Enter Mobile or Email"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  outline: "none",
                  marginTop: "6px",
                  marginBottom: "12px",
                }}
              />

              {!otpSent ? (
                <button
                  onClick={handleSendForgotOtp}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#2e7d32",
                    color: "#fff",
                    fontWeight: "900",
                    cursor: "pointer",
                  }}
                >
                  📩 Send OTP
                </button>
              ) : (
                <>
                  <label style={{ fontWeight: "700", fontSize: "14px" }}>
                    OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6 digit OTP"
                    maxLength="6"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      outline: "none",
                      marginTop: "6px",
                      marginBottom: "12px",
                    }}
                  />

                  <label style={{ fontWeight: "700", fontSize: "14px" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="New password"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      outline: "none",
                      marginTop: "6px",
                      marginBottom: "12px",
                    }}
                  />

                  <label style={{ fontWeight: "700", fontSize: "14px" }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="Confirm password"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      outline: "none",
                      marginTop: "6px",
                      marginBottom: "12px",
                    }}
                  />

                  <button
                    onClick={handleResetPassword}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "none",
                      background: "#1976d2",
                      color: "#fff",
                      fontWeight: "900",
                      cursor: "pointer",
                    }}
                  >
                    ✅ Verify OTP & Reset Password
                  </button>
                </>
              )}

              {forgotMsg && (
                <p style={{ margin: "12px 0 0", color: "#2e7d32" }}>
                  {forgotMsg}
                </p>
              )}

              <button
                onClick={() => setShowForgot(false)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  fontWeight: "900",
                  cursor: "pointer",
                  marginTop: "12px",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Login;
