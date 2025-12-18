import { Link } from 'react-router-dom';
import '../styles/auth.css';

const StudentDashboard = () => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="dashboard-logo">
          <div className="dashboard-logo-icon">🏥</div>
          <span>Campus<span>Care</span></span>
        </div>
        <nav className="dashboard-nav">
          <Link to="/student" className="nav-link active">Dashboard</Link>
          <Link to="/student" className="nav-link">Appointments</Link>
          <Link to="/student" className="nav-link">Health Records</Link>
          <Link to="/" className="btn-logout">Logout</Link>
        </nav>
      </header>

      <main className="dashboard-content">
        <div className="dashboard-welcome">
          <h1>Welcome back, Student! 👋</h1>
          <p>Here's your health overview for today</p>
        </div>

        <div className="dashboard-grid">
          {/* Queue Status Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon green">📋</div>
            </div>
            <h3 className="card-title">Current Queue Position</h3>
            <div className="card-value">3</div>
            <p className="card-description">Estimated wait: ~15 minutes</p>
            <div className="card-action">
              <button className="card-btn">
                View Queue Status →
              </button>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon blue">📅</div>
            </div>
            <h3 className="card-title">Upcoming Appointments</h3>
            <div className="card-value">2</div>
            <p className="card-description">Next: Dr. Smith - Dec 20, 10:00 AM</p>
            <div className="card-action">
              <button className="card-btn">
                Book Appointment →
              </button>
            </div>
          </div>

          {/* Health Records Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon orange">📁</div>
            </div>
            <h3 className="card-title">Health Records</h3>
            <div className="card-value">5</div>
            <p className="card-description">Last visit: Dec 10, 2024</p>
            <div className="card-action">
              <button className="card-btn">
                View Records →
              </button>
            </div>
          </div>

          {/* Prescriptions Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <div className="card-icon purple">💊</div>
            </div>
            <h3 className="card-title">Active Prescriptions</h3>
            <div className="card-value">1</div>
            <p className="card-description">Refill available: Jan 5, 2025</p>
            <div className="card-action">
              <button className="card-btn">
                View Prescriptions →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
