import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

const DoctorDashboard = () => {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">🏥</div>
          <span>Campus<span>Care</span></span>
        </div>
        <nav className="dashboard-nav">
          <Link to="/doctor" className="nav-link active">Dashboard</Link>
          <Link to="/doctor" className="nav-link">Patients</Link>
          <Link to="/doctor" className="nav-link">Schedule</Link>
          <Link to="/" className="btn-logout">Logout</Link>
        </nav>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Good morning, Dr. Smith! 👨‍⚕️</h1>
          <p>Here's your practice overview for today</p>
        </div>

        <div className="dashboard-grid">
          {/* Availability Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon green">✅</div>
              <span className={`status-badge ${isAvailable ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {isAvailable ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <h3 className="card-title">Your Availability</h3>
            <p className="card-description" style={{ marginBottom: '16px' }}>
              Toggle your availability status for students
            </p>
            <div className="toggle-container">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                {isAvailable ? 'Currently accepting patients' : 'Not accepting patients'}
              </span>
            </div>
          </div>

          {/* Queue Count Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon blue">👥</div>
            </div>
            <h3 className="card-title">Patients in Queue</h3>
            <div className="card-value">7</div>
            <p className="card-description">Average wait time: ~20 minutes</p>
            <div className="card-action">
              <button className="card-btn">
                Manage Queue →
              </button>
            </div>
          </div>

          {/* Today's Appointments Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon orange">📅</div>
            </div>
            <h3 className="card-title">Today's Appointments</h3>
            <div className="card-value">12</div>
            <p className="card-description">4 completed, 8 remaining</p>
            <div className="card-action">
              <button className="card-btn">
                View Schedule →
              </button>
            </div>
          </div>

          {/* Patients Seen Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon purple">📊</div>
            </div>
            <h3 className="card-title">This Week</h3>
            <div className="card-value">45</div>
            <p className="card-description">Patients seen this week</p>
            <div className="card-action">
              <button className="card-btn">
                View Reports →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
