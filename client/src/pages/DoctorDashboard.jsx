import { useEffect, useState, useRef } from "react";
import "../styles/DoctorDashboard.css";
import { io } from "socket.io-client";
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate } from "react-router-dom";

const useCounter = (value, duration = 800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return count;
};

const DoctorDashboard = () => {
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // H-02: Helper to always get a fresh (non-expired) Firebase ID token.
  // Firebase tokens expire after 60 min; getIdToken() refreshes automatically.
  const getFreshToken = async () => {
    if (auth.currentUser) {
      const fresh = await auth.currentUser.getIdToken();
      localStorage.setItem("token", fresh); // keep localStorage in sync for socket
      return fresh;
    }
    return localStorage.getItem("token");
  };

  const token = localStorage.getItem("token"); // used only for initial socket auth

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [availability, setAvailability] = useState("available");
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);

  //Url to call backend API
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const [settings, setSettings] = useState({
    notifications: true,
    autoConfirm: false,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // AUD-01: Persistent AudioContext ref — created once, resumed on first user gesture.
  // Browser autoplay policy blocks AudioContext until a user interaction occurs.
  // By creating it here and resuming on the first click/key/touch, we ensure the
  // audio alert works even if the emergency event arrives while the tab is idle.
  const audioCtxRef = useRef(null);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    // Create AudioContext once
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtxRef.current = new AudioCtx();
    }

    // Unlock on first user gesture (click, keydown, or touch anywhere on the page)
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().then(() => {
          audioUnlockedRef.current = true;
        }).catch(() => {});
      } else {
        audioUnlockedRef.current = true;
      }
      // Remove listeners after first unlock — only needed once
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Helper: play emergency tone using the persistent AudioContext
  const playEmergencyTone = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Attempt resume in case it's still suspended (no user gesture yet).
    // This will silently fail on a truly uninteracted tab — visual banner is the fallback.
    const play = () => {
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } catch (e) {
        console.warn("Emergency audio tone failed:", e);
      }
    };

    if (ctx.state === "suspended") {
      ctx.resume().then(play).catch(() => {
        console.warn("AudioContext could not be resumed (no user gesture). Visual alert is still showing.");
      });
    } else {
      play();
    }
  };

  /* INIT SOCKET & LISTENERS */
  useEffect(() => {
    // SK-01: Pass auth token so the server's socket auth middleware accepts the connection
    socketRef.current = io(`${API_BASE_URL}`, {
      auth: { token },
    });

    // AU-05: Server now auto-joins the user's room on connection.
    // No need to emit "join-room" — the server uses the verified MongoDB ID.

    const socket = socketRef.current;

    socket.on("new-request", async () => {
      try {
        const freshToken = await getFreshToken();
        const res = await fetch(`${API_BASE_URL}/api/requests/doctor`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          setAppointments(data.requests);
        }
      } catch (err) {
        console.error("Failed to refresh doctor requests:", err);
      }
    });

    socket.on("emergency-alert", ({ message, request }) => {
      setEmergencyAlerts((prev) => [...prev, { id: Date.now(), message, request }]);
      // Browser notification (works if permission was previously granted)
      if (Notification.permission === "granted") {
        new Notification("🚨 Emergency Triage Alert", { body: message });
      }
      // AUD-01: Play tone via the persistent, pre-unlocked AudioContext
      playEmergencyTone();
    });

    return () => {
      socket.off("new-request");
      socket.off("emergency-alert");
      socket.disconnect();
    };
  }, [token]);

  /* LOAD DOCTOR */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      let user = null;
      try {
        user = JSON.parse(storedUser); // M-01: guard against corrupt localStorage
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
      if (user) {
        setDoctor(user);
        setAvailability(user.availability || "available");
      }
    }
  }, []);

  /* FETCH APPOINTMENTS */
  useEffect(() => {
    if (!token) return;

    (async () => {
      const freshToken = await getFreshToken();
      fetch(`${API_BASE_URL}/api/requests/doctor`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setAppointments(data.requests);
        })
        .catch(err => console.error("Failed to load appointments:", err));
    })();
  }, [token]);

  /* UPDATE STATUS */
  const updateStatus = async (id, status) => {
    try {
      const freshToken = await getFreshToken();
      const res = await fetch(
        `${API_BASE_URL}/api/requests/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${freshToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Server error:", text);
        return;
      }

      const data = await res.json();

      if (data.success) {
        setAppointments(prev =>
          prev.map(a =>
            a._id === id ? { ...a, status: data.request.status } : a
          )
        );
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // To delete appointment
  const deleteAppointment = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmDelete) return;

    try {
      const freshToken = await getFreshToken();
      const res = await fetch(
        `${API_BASE_URL}/api/requests/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${freshToken}` },
        }
      );

      const data = await res.json();

      if (data.success) {
        setAppointments(prev => prev.filter(app => app._id !== id));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  /* AVAILABILITY */
  const toggleAvailability = async () => {
    try {
      const newStatus = availability === "available" ? "busy" : "available";
      const freshToken = await getFreshToken();
      const res = await fetch(`${API_BASE_URL}/api/doctors/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ availability: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const data = await res.json();
      setAvailability(data.availability);
    } catch (error) {
      console.error("Availability toggle error:", error);
      alert("Failed to change availability. Please try again.");
    }
  };

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const approvedCount = appointments.filter(a => a.status === "approved").length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const animatedTotal = useCounter(appointments.length);
  const animatedPending = useCounter(pendingCount);
  const animatedApproved = useCounter(approvedCount);

  /* ========================
     UI
  ======================== */
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
          <div className="avatar">
            {doctor?.name?.split(" ").map(n => n[0]).join("")}
          </div>
          <h3 className="doctor-name">{doctor?.name || "Doctor Name"}</h3>
          <p className="specialty">Campus Doctor</p>

          <div
            className={`status-badge ${availability === "available" ? "online" : "offline"}`}
            onClick={toggleAvailability}
          >
            ● {availability === "available" ? "Available" : "Unavailable"}
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
            className={`menu-item ${activeMenu === "settings" ? "active" : ""}`}
            onClick={() => setActiveMenu("settings")}
          >
            ⚙️ Settings
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            ⏻ Logout
          </button>
        </nav>

        <div
          className={`status-badge ${availability === "available" ? "online" : "offline"}`}
          onClick={toggleAvailability}
          style={{ margin: "10px", cursor: "pointer", fontWeight: "bold", textAlign: "center" }}
        >
          ● {availability === "available" ? "Go Offline" : "Go Online"}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="header">
          <div>
            <h1>Welcome, Doctor</h1>
            <p className="date">{today}</p>
          </div>
        </header>

        {/* Emergency Alerts Section */}
        {emergencyAlerts.length > 0 && (
          <div className="emergency-alerts-container" style={{ margin: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {emergencyAlerts.map((alert) => (
              <div key={alert.id} className="emergency-alert-banner" style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: "15px", borderRadius: "8px", position: "relative" }}>
                <h4 style={{ color: "#b91c1c", margin: "0 0 5px 0" }}>⚠️ {alert.message}</h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#7f1d1d" }}>
                  A student has submitted a <strong>Critical</strong> health request. Please review your pending appointments immediately.
                </p>
                <button 
                  onClick={() => setEmergencyAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  style={{ position: "absolute", right: "10px", top: "10px", background: "transparent", border: "none", cursor: "pointer", fontSize: "16px" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {activeMenu === "dashboard" && (
          <section className="page dashboard-home">
            <div className="welcome-box">
              <h2>Good day 👨‍⚕️</h2>
              <p>You have {pendingCount} pending appointments today.</p>
            </div>

            <div className="stats-cards">
              <div className="stat-card">
                <h3>{animatedTotal}</h3>
                <p>Total Appointments</p>
              </div>

              <div className="stat-card">
                <h3>{animatedPending}</h3>
                <p>Pending</p>
              </div>

              <div className="stat-card">
                <h3>{animatedApproved}</h3>
                <p>Approved</p>
              </div>
            </div>
          </section>
        )}

        {activeMenu === "appointments" && (
          <section className="page">
            {appointments.map(app => (
              <div key={app._id} className="appointment-card modern" style={{ borderLeft: app.riskScore === 'Critical' ? '5px solid #ef4444' : app.riskScore === 'High' ? '5px solid #f97316' : '5px solid #e2e8f0' }}>
                <div className="appointment-main">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{app.studentId?.name}</h4>
                    {app.riskScore && (
                      <span className={`status-pill ${app.riskScore.toLowerCase()}`} style={{ 
                        background: app.riskScore === 'Critical' ? '#fee2e2' : app.riskScore === 'High' ? '#ffedd5' : '#f0fdf4',
                        color: app.riskScore === 'Critical' ? '#b91c1c' : app.riskScore === 'High' ? '#c2410c' : '#15803d',
                        padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold'
                      }}>
                        Risk: {app.riskScore}
                      </span>
                    )}
                  </div>
                  <p className="problem">
                    <strong>Triage Summary:</strong> {app.triageSummary}
                  </p>

                  {app.extractedSymptoms && app.extractedSymptoms.length > 0 && (
                    <div style={{ marginTop: '8px', marginBottom: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {app.extractedSymptoms.map((sym, i) => (
                        <span key={i} style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', border: '1px solid #cbd5e1' }}>{sym}</span>
                      ))}
                    </div>
                  )}

                  {app.originalProblem && app.originalProblem !== app.triageSummary && (
                    <p className="problem original">
                      <strong>Raw Input:</strong> {app.originalProblem}
                    </p>
                  )}
                  <span className="time">{app.timeSlot}</span>
                </div>

                <div className="appointment-actions">
                  {app.status === "pending" ? (
                    <>
                      <button
                        className="btn approve"
                        onClick={() => updateStatus(app._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn reject"
                        onClick={() => updateStatus(app._id, "rejected")}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`status-pill ${app.status}`}>
                      {app.status}
                    </span>
                  )}

                  <span
                    className="delete-icon"
                    onClick={() => deleteAppointment(app._id)}
                    title="Delete appointment"
                  >
                    🗑️
                  </span>
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
