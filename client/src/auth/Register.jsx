import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

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
  'Biology',
  'Zoology',
  'Botany',
  'Microbiology',
  'Biochemistry',
  'Statistics',
  'Computer Science',
  'Data Science',
  // Arts & Commerce
  'Economics',
  'Psychology',
  'Sociology',
  'Political Science',
  'History',
  'English Literature',
  'Commerce',
  'Business Administration',
  'Accounting & Finance',
  // Medical & Health
  'Pharmacy',
  'Nursing',
  'Physiotherapy',
  'Medical Lab Technology',
  // Others
  'Architecture',
  'Design',
  'Law',
  'Journalism',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear email error when typing
    if (name === 'email') {
      setError('');
    }
  };

  const validateEmail = (email) => {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    return gmailRegex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate Gmail
    if (!validateEmail(formData.email)) {
      setError('Please use a valid Gmail address (@gmail.com)');
      return;
    }
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Placeholder - no actual registration logic
    console.log('Register attempt:', { role, ...formData });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear + i);

  const isDoctor = role === 'doctor';
  const isStudent = role === 'student';

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">🏥</div>
            <div className="auth-logo-text">
              Campus<span>Care</span>
            </div>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join your campus healthcare community</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector */}
        <div className="role-selector">
          <div className="role-option">
            <input
              type="radio"
              id="role-student"
              name="role"
              value="student"
              checked={role === 'student'}
              onChange={() => handleRoleChange('student')}
            />
            <label htmlFor="role-student">
              <span className="role-icon">🎓</span>
              <span className="role-name">Student</span>
            </label>
          </div>
          <div className="role-option">
            <input
              type="radio"
              id="role-staff"
              name="role"
              value="staff"
              checked={role === 'staff'}
              onChange={() => handleRoleChange('staff')}
            />
            <label htmlFor="role-staff">
              <span className="role-icon">👔</span>
              <span className="role-name">Staff</span>
            </label>
          </div>
          <div className="role-option">
            <input
              type="radio"
              id="role-professor"
              name="role"
              value="professor"
              checked={role === 'professor'}
              onChange={() => handleRoleChange('professor')}
            />
            <label htmlFor="role-professor">
              <span className="role-icon">📚</span>
              <span className="role-name">Professor</span>
            </label>
          </div>
          <div className="role-option">
            <input
              type="radio"
              id="role-doctor"
              name="role"
              value="doctor"
              checked={role === 'doctor'}
              onChange={() => handleRoleChange('doctor')}
            />
            <label htmlFor="role-doctor">
              <span className="role-icon">👨‍⚕️</span>
              <span className="role-name">Doctor</span>
            </label>
          </div>
        </div>

        {isDoctor && (
          <div className="info-box">
            <span>ℹ️</span>
            <span>Doctor accounts require email verification before activation.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-input"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Gmail Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="yourname@gmail.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
            <span className="form-hint">Only Gmail accounts are supported</span>
          </div>

          {!isDoctor && (
            <div className="form-group">
              <label htmlFor="branch" className="form-label">
                Branch / Department
              </label>
              <select
                id="branch"
                name="branch"
                className="form-select"
                value={formData.branch}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isStudent && (
            <div className="form-group">
              <label htmlFor="year" className="form-label">
                Expected Graduation Year
              </label>
              <select
                id="year"
                name="year"
                className="form-select"
                value={formData.year}
                onChange={handleInputChange}
                required
              >
                <option value="">Select year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          )}
          {isDoctor && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department" className="form-label">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="specialization" className="form-label">
                  Specialization (Optional)
                </label>
                <input
                  type="text"
                  id="specialization"
                  name="specialization"
                  className="form-input"
                  placeholder="e.g., Sports Medicine"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Create Account
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
