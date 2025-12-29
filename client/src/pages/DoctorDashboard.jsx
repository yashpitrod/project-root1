import { useEffect, useState } from "react";
import "../styles/DoctorDashboard.css";

const DoctorDashboard = () => {
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [available, setAvailable] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [settings, setSettings] = useState({
    notifications: true,
    autoConfirm: false
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/requests/doctor", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setAppointments(data));
  }, []);

  const updateStatus = (id, status) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id ? { ...a, status } : a))
    );
  };

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const approvedCount = appointments.filter(a => a.status === "approved").length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">🩺</div>
          <h2>CampusCare</h2>
          <p className="logo-sub">Doctor Portal</p>
        </div>

        <div className="doctor-info">
          <div className="avatar">AS</div>
          <h3>{doctorName}</h3>
          <p className="specialty">Senior Cardiologist</p>

          <div
            className={`status-badge ${available ? "online" : "offline"}`}
            onClick={() => setAvailable(!available)}
          >
            ● {available ? "Available" : "Unavailable"}
          </div>
        </div>

        <nav className="menu">
          <button
            className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveMenu("dashboard")}
          >
            📊 Dashboard
          </button>

          <button
            className={`menu-item ${activeMenu === "appointments" ? "active" : ""}`}
            onClick={() => setActiveMenu("appointments")}
          >
            📅 Appointments
            {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
          </button>

          <button
            className={`menu-item ${activeMenu === "patients" ? "active" : ""}`}
            onClick={() => setActiveMenu("patients")}
          >
            👥 Patients
          </button>

          <button
            className={`menu-item ${activeMenu === "settings" ? "active" : ""}`}
            onClick={() => setActiveMenu("settings")}
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            className={`availability-toggle ${available ? "on" : "off"}`}
            onClick={() => setAvailable(!available)}
          >
            {available ? "● Go Offline" : "● Go Online"}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="header">
          <div>
            <h1>Welcome, Doctor</h1>
            <p className="date">{today}</p>
          </div>

          <div className="stats">
            <div>
              <strong>{appointments.length}</strong>
              <span>Appointments</span>
            </div>
            <div>
              <strong>{pendingCount}</strong>
              <span>Pending</span>
            </div>
            <div>
              <strong>{approvedCount}</strong>
              <span>Approved</span>
            </div>
          </div>
        </header>

        {activeMenu === "dashboard" && (
          <section className="page">
            <h2>Good day 👨‍⚕️</h2>
            <p>You have {pendingCount} pending appointments today.</p>
          </section>
        )}

        {activeMenu === "appointments" && (
          <section className="page">
            {appointments.map(app => (
              <div key={app.id} className="appointment-card">
                <div>
                  <h4>{app.name}</h4>
                  <p>{app.issue}</p>
                  <small>{app.time}</small>
                </div>

                <div className="actions">
                  {app.status === "pending" ? (
                    <>
                      <button
                        className="btn approve"
                        onClick={() => updateStatus(app.id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn reject"
                        onClick={() => updateStatus(app.id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`tag ${app.status}`}>
                      {app.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {activeMenu === "settings" && (
          <section className="page">
            <h2>Settings</h2>

            <label className="setting">
              <span>Email Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => toggleSetting("notifications")}
              />
            </label>

            <label className="setting">
              <span>Auto Confirm Appointments</span>
              <input
                type="checkbox"
                checked={settings.autoConfirm}
                onChange={() => toggleSetting("autoConfirm")}
              />
            </label>
          </section>
        )}

      </main>
    </div>
  );
};

export default DoctorDashboard;
