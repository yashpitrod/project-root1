import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

const BRANCHES = [
  // Engineering
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Automobile Engineering',
  'Biomedical Engineering',
  'Biotechnology',
  'Environmental Engineering',
  'Industrial Engineering',
  'Instrumentation Engineering',
  'Marine Engineering',
  'Mechatronics',
  'Metallurgical Engineering',
  'Mining Engineering',
  'Petroleum Engineering',
  'Production Engineering',
  'Robotics Engineering',
  'Textile Engineering',
  // Science
  'Physics',
  'Chemistry',
  'Mathematics',
  'Microbiology',
  'Biochemistry',
  'Data Science',
  'Economics',
  'English Literature',
  'Accounting & Finance',
  // Others
  'Architecture',
  'Other',
];

const DEPARTMENTS = [
  'General Medicine',
  'Pediatrics',
  'Dermatology',
  'Psychiatry',
  'Orthopedics',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Dental',
  'Physiotherapy',
];

const Register = () => {
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    branch: '',
    year: '',
    department: '',
    specialization: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setFormData({
      fullName: '',
      email: '',
      branch: '',
      year: '',
      department: '',
      specialization: '',
      password: '',
      confirmPassword: '',
    });
    setError('');
  };

  const verifyDoctorEmail = async (email) => {
    const res = await fetch("http://localhost:5000/api/auth/verify-doctor-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    return data.valid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'email') setError('');
  };

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const {
      email,
      password,
      confirmPassword,
      fullName,
      branch,
      year,
      department,
      specialization,
    } = formData;

    // Validate Gmail
    if (!validateEmail(email)) {
      setError('Please use a valid Gmail address (@gmail.com)');
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      //for checking wheather it is a doctor or not 
      if (role === "doctor") {
        const isValid = await verifyDoctorEmail(email);

        if (!isValid) {
          alert("Unauthorized doctor email");
          return;
        }
      }

      // 🔐 Firebase signup
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const token = await userCred.user.getIdToken();

      // 🧠 Save user in backend
      await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          fullName,
          email,
          branch: role === 'doctor' ? null : branch,
          year: role === 'student' ? year : null,
          department: role === 'doctor' ? department : null,
          specialization: role === 'doctor' ? specialization : null,
        }),
      });

      // ✅ SUCCESS → redirect to login
      alert("Registration successful! Please sign in.");
      navigate("/");

    } catch (err) {
      console.error(err);
      setError(err.message || "Registration failed");
    }
  };


  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear + i);

  const isDoctor = role === 'doctor';
  const isStudent = role === 'student';

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>Create Account</h1>

        {error && <p className="error-message">{error}</p>}

        {/* Role selector */}
        <div className="role-selector">
          {['student', 'staff', 'doctor'].map((r) => (
            <label key={r}>
              <input
                type="radio"
                checked={role === r}
                onChange={() => handleRoleChange(r)}
              />
              {r.toUpperCase()}
            </label>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleInputChange}
            required
          />

          <input
            name="email"
            placeholder="Gmail address"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          {!isDoctor && (
            <select
              name="branch"
              value={formData.branch}
              onChange={handleInputChange}
              required
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}

          {isStudent && (
            <select
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              required
            >
              <option value="">Graduation year</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}

          {isDoctor && (
            <>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <input
                name="specialization"
                placeholder="Specialization (optional)"
                value={formData.specialization}
                onChange={handleInputChange}
              />
            </>
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            required
          />

          <button type="submit">Create Account</button>
        </form>

        <p>
          Already have an account? <Link to="/">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
