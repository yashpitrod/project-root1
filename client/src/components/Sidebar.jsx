import "../styles/Sidebar.css";

const Sidebar = ({
  doctor,
  availability,
  toggleAvailability,
  activeMenu,
  setActiveMenu,
  pendingCount,
  handleLogout,
}) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">🩺</div>
        <h2>CampusCare</h2>
        <p className="logo-sub">Doctor Portal</p>
      </div>

      <div className="doctor-info">
        <div className="avatar">
          {doctor?.name?.split(" ").map(n => n[0]).join("")}
        </div>
        <h3>{doctor?.name}</h3>

        <div
          className={`status-badge ${availability === "available" ? "online" : "offline"}`}
          onClick={toggleAvailability}
        >
          ● {availability === "available" ? "Available" : "Unavailable"}
        </div>
      </div>

      <nav className="menu">
        <button className={`menu-item ${activeMenu === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveMenu("dashboard")}
        >
          📊 Dashboard
        </button>

        <button className={`menu-item ${activeMenu === "appointments" ? "active" : ""}`}
          onClick={() => setActiveMenu("appointments")}
        >
          📅 Appointments
          {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
        </button>

        <button className={`menu-item ${activeMenu === "settings" ? "active" : ""}`}
          onClick={() => setActiveMenu("settings")}
        >
          ⚙️ Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>⏻ Logout</button>
      </div>
    </aside>
  );
};

export default Sidebar;
