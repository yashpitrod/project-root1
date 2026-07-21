import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "./navbar";
import '../styles/auth.css';
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import campusImg from "../assets/campus.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = useMemo(() => import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000', []);

  const persistAuthSession = useCallback((token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));

    if (userData.role === "doctor") {
      navigate("/doctor", { replace: true });
    } else {
      navigate("/student", { replace: true });
    }
  }, [navigate]);

  const syncUserWithBackend = useCallback(async (userCred, provider = "firebase") => {
    const token = await userCred.user.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ provider }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to sync user");
    }

    const data = await res.json();
    return { token, data };
  }, [API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const { token, data } = await syncUserWithBackend(userCred, "email");
      persistAuthSession(token, data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const { token, data } = await syncUserWithBackend(userCred, "google");
      persistAuthSession(token, data);
    } catch (err) {
      setError(err.message || "Google sign-in failed");
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
                    Only Gmail accounts are supported (including institutional G Suite)
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

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  style={{ marginTop: "12px", background: "#fff", color: "#111827", border: "1px solid #d1d5db" }}
                >
                  {loading ? "Working..." : "Continue with Google"}
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
