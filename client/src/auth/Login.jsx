import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch user data");
      }

      const data = await res.json();

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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div className="auth-logo-text">
              Campus<span>Care</span>
            </div>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your healthcare portal</p>
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
            <span className="form-hint">Only Gmail accounts are supported</span>
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
        </form>

        <div className="auth-footer">
          New here?{' '}
          <Link to="/register" className="auth-link">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
