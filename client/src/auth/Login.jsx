import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "./navbar";
import '../styles/auth.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../auth/firebase";
import campusImg from "../assets/campus.png";


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  //Url to call backend API
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please use a valid Gmail address (@gmail.com)');
      return;
    }

    try {
      // 1️⃣ Firebase login
      const userCred = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await userCred.user.getIdToken();
      localStorage.setItem("token", token);

      // 2️⃣ Get role from backend
      let res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If user not registered, auto-register
      if (res.status === 404 || res.status === 401) {
        await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "student" }),
        });

        res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch user data");
      }

      const data = await res.json();

      /* ✅ STORE USER FOR PROFILE PAGE */
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("userId", data._id);

      // 3️⃣ Role-based redirect (backend decides)
      if (data.role === "doctor") navigate("/doctor");
      else if (data.role === "staff") navigate("/staff");
      else if (data.role === "admin") navigate("/admin");
      else navigate("/student");

    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password");
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


          {/* 🔹 RIGHT SIDE (LOGIN CARD) */}
          <div className="auth-right">
            <div className="auth-card">
              <div className="auth-header">
                <div className="auth-logo">
                  <div className="auth-logo-icon">🏥</div>
                  <div className="auth-logo-text">
                    Campus<span>Care</span>
                  </div>
                </div>
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">
                  Sign in to access your healthcare portal
                </p>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Gmail Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="form-input"
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                    autoComplete="email"
                  />
                  <span className="form-hint">
                    Only Gmail accounts are supported
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Sign In
                </button>
                <div className="auth-footer" style={{ marginTop: "12px" }}>
                  <Link to="/forgot-password" className="auth-link">
                    Forgot password?
                  </Link>
                </div>
              </form>

              <div className="auth-footer">
                New here?{' '}
                <Link to="/register" className="auth-link">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

};

export default Login;
