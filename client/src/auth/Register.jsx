import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../auth/firebase";
import campusImg from "../assets/campus.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const Register = () => {
  const navigate = useNavigate();
  //Loading state can be used to show a spinner during registration
  const [loading, setLoading] = useState(false);
  //For success messages
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });

  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Please use a valid Gmail address (@gmail.com)");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // No email verification, just send user info to backend
      const token = await userCred.user.getIdToken(true);
      await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          role: formData.role,
        }),
      });
      // 🔥 NOW FETCH USER + REDIRECT
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("token", token);

      navigate(data.role === "doctor" ? "/doctor" : "/student");

      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🔹 TOP NAVBAR */}
      <Navbar />

      {/* 🔹 MAIN AUTH LAYOUT */}
      <div className="auth-container">
        <div className="auth-layout">

          {/* 🔹 LEFT BIG DIV */}
          <div className="auth-left">

            {/* 🔹 BACKGROUND IMAGE */}
            <img
              src={campusImg}
              alt="Campus illustration"
              className="auth-left-image"
            />

            <div className="ribbon ribbon-green">
              <div className="ribbon-track">
                <span>CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • </span>
                <span>CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • </span>
              </div>
            </div>

            <div className="ribbon ribbon-white">
              <div className="ribbon-track">
                <span>CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • </span>
                <span>CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • CampusCare • </span>
              </div>
            </div>


            {/* 🔹 TEXT CONTENT */}
            <div className="auth-left-content">
              <h1>CampusCare</h1>
              <p>
                CampusCare is a unified digital healthcare platform designed
                exclusively for campus life. From students to staff and doctors,
                it simplifies appointments, health requests, and medical support
                within your institution.
              </p>
            </div>

          </div>

          {/* 🔹 RIGHT SIDE (REGISTER CARD) */}
          <div className="auth-right">
            <div className="auth-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <div className="auth-logo-icon">🏥</div>
                  <div className="auth-logo-text">
                    Campus<span>Care</span>
                  </div>
                </div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-subtitle">
                  Join your campus healthcare system
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="success-message">
                  <span>✅</span> {success}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    name="fullName"
                    placeholder="Your name"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="you@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    className="form-input"
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              <div className="auth-footer">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

};

export default Register;
