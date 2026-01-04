import { useEffect, useState, useRef } from "react";
import "../styles/DoctorDashboard.css";
import { io } from "socket.io-client";
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import DashboardStats from "../components/DashboardStats";
import AppointmentCard from "../components/AppointmentCard";

const DoctorDashboard = () => {
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [availability, setAvailability] = useState("available");

  const [settings, setSettings] = useState({
    notifications: true,
    autoConfirm: false,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /* INIT SOCKET */
  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  /* LOAD DOCTOR */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setDoctor(user);
      setAvailability(user.availability || "available");
    }
  }, []);

  /* JOIN ROOM */
  useEffect(() => {
    if (!doctor?._id) return;

    socketRef.current.emit("join-room", doctor._id);
    console.log("Doctor joined room:", doctor._id);
  }, [doctor]);

  /* RECEIVE NEW REQUEST */
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("new-request", ({ request }) => {
      setAppointments(prev => [request, ...prev]);
    });

    return () => {
      socketRef.current?.off("new-request");
    };
  }, []);


  /* FETCH APPOINTMENTS */
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/requests/doctor", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppointments(data.requests);
        }
      });
  }, [token]);

  /* UPDATE STATUS */
  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/requests/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const deleteAppointment = async (id) => {
        const confirmDelete = window.confirm(
          "Are you sure you want to delete this appointment?"
        );

        if (!confirmDelete) return;

        try {
          const res = await fetch(
            `http://localhost:5000/api/requests/${id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
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

  /* AVAILABILITY */
  const toggleAvailability = async () => {
    const newStatus = availability === "available" ? "busy" : "available";

    const res = await fetch("http://localhost:5000/api/doctors/status", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ availability: newStatus }),
    });

    const data = await res.json();
    setAvailability(data.availability);
  };

  const pendingCount = appointments.filter(a => a.status === "pending").length;
  const approvedCount = appointments.filter(a => a.status === "approved").length;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

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
    }, [value]);

    return count;
  };
  const animatedTotal = useCounter(appointments.length);
  const animatedPending = useCounter(pendingCount);
  const animatedApproved = useCounter(approvedCount);

  /* ========================
     UI
  ======================== */
  return (
    <div className="dashboard">
      {/* Sidebar Variables */}
      <Sidebar
        doctor={doctor}
        availability={availability}
        toggleAvailability={toggleAvailability}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        pendingCount={pendingCount}
        handleLogout={handleLogout}
      />
      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="header">
          <div>
            <h1 className="page-title">Appointments Overview</h1>
            <p className="page-subtitle">{today}</p>
          </div>
        </header>

        {activeMenu === "dashboard" && (
          <section className="page dashboard-home">
            <div className="welcome-box">
              <h2>Good day 👨‍⚕️</h2>
              <p>You have {pendingCount} pending appointments today.</p>
            </div>
            <DashboardStats
              total={animatedTotal}
              pending={animatedPending}
              approved={animatedApproved}
            />
          </section>
        )}

        {activeMenu === "appointments" && (
          <section className="page">
            {appointments.map(app => (
              <AppointmentCard
                key={app._id}
                app={app}
                onApprove={() => updateStatus(app._id, "approved")}
                onReject={() => updateStatus(app._id, "rejected")}
              />
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
