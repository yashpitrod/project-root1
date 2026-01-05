import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../auth/firebase";
import { Link } from "react-router-dom";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset link sent to your email.");
    } catch (err) {
      console.error(err);
      setError("Failed to send reset email. Check Gmail address.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">
            Enter your registered Gmail address
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && (
          <div
            className="error-message"
            style={{ background: "#dcfce7", color: "#166534" }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleReset}>
          <div className="form-group">
            <label className="form-label">Gmail Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary">
            Send Reset Link
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
