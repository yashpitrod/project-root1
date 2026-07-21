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
                  style={{ marginTop: "12px", background: "#fff", color: "#111827", border: "1px solid #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
                >
                  <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.25H12v4.26h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.33 2.98-7.53Z" />
                      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.58A10 10 0 0 0 12 22Z" />
                      <path fill="#FBBC05" d="M6.41 13.9a6.02 6.02 0 0 1 0-3.8V7.52H3.07a10 10 0 0 0 0 8.76l3.34-2.38Z" />
                      <path fill="#EA4335" d="M12 6.04c1.47 0 2.79.5 3.83 1.49l2.87-2.87A9.96 9.96 0 0 0 12 2a10 10 0 0 0-8.93 5.52l3.34 2.58C7.2 7.8 9.4 6.04 12 6.04Z" />
                    </svg>
                  </span>
                  <span>{loading ? "Working..." : "Continue with Google"}</span>
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
