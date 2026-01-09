// working : 
//     >Submit appointment request with problem description, selected doctor, and time slot.
//     >Receive real-time updates on request status via WebSocket.
//     >View recent requests and health records.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { io } from "socket.io-client";
import '../styles/studentdash.css';
import doctorChampak from '../assets/doctor-champa.jpg';
import doctorSameer from '../assets/doctor-sameer.jpg';
import doctorSoumya from '../assets/doctor-soumya.jpg';
import doctorAnirban from '../assets/blank-profile-picture.jpg';
import doctorSavitri from '../assets/blank-profile-picture.jpg';
import doctorKapil from '../assets/blank-profile-picture.jpg';

//Url to call backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const StudentDashboard = () => {
  // Required State Variables
  const [problem, setProblem] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translated, setTranslated] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [lastVisitDate, setLastVisitDate] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [recentRequest, setRecentRequest] = useState(null);
  // State to track doctor queues (for future use)
  const [doctorQueues, setDoctorQueues] = useState({});

  // Navigation hook
  const navigate = useNavigate();

  // Get user info from localStorage
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const user = JSON.parse(localStorage.getItem("user"));

  // 
  const totalDoctors = doctors.length;
  const availableDoctors = doctors.filter(
    (doc) => doc.availability === "available"
  ).length;
  const isDispensaryOpen = availableDoctors > 0;
  const filteredDoctors = doctors.filter(
    (doc) => doc._id !== user?._id
  );

  // Helper object for dispensary status
  const dispensaryStatus = {
    inQueue: 5,
  };

  //Helper functions for fetching date and time
  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate time slots with 10-minute intervals (9 AM to 6 PM, excluding 12-1 PM lunch and 3-4 PM break)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      // Skip lunch time (12-1 PM) and break time (3-4 PM)
      if (hour === 12 || hour === 15) continue;

      for (let min = 0; min < 60; min += 30) {
        const startHour = hour;
        const startMin = min;
        const endMin = min + 30;
        const endHour = endMin >= 60 ? hour + 1 : hour;
        const actualEndMin = endMin >= 60 ? 0 : endMin;

        // Skip if end time falls into break periods
        if ((endHour === 12) || (endHour === 15 && actualEndMin === 0)) continue;

        const formatTime = (h, m) => {
          const period = h >= 12 ? 'PM' : 'AM';
          const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
          return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
        };

        const slotLabel = `${formatTime(startHour, startMin)} - ${formatTime(endHour, actualEndMin)}`;
        slots.push(slotLabel);
      }
    }
    return slots;
  };
  // Generate time slots
  const timeSlots = generateTimeSlots();

  //useeffet for => fetching requests
  //                computing last visit
  //                syncing localStorage
  //1. for fetching recent request from localStorage
  useEffect(() => {
    const savedRequest = localStorage.getItem("recentRequest");
    if (savedRequest) {
      setRecentRequest(JSON.parse(savedRequest));
    }
  }, []);

  //2. for fetching latest request from server
  useEffect(() => {
    const fetchLatestRequest = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/requests/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.success && data.requests.length > 0) {
          const latest = data.requests[0];

          // ✅ enrich request with doctor name
          const enriched = {
            ...latest,
            doctorName: latest.doctorId?.name || "Doctor",
          };

          setRecentRequest(enriched);
          setAppointmentStatus(enriched.status);
          localStorage.setItem("recentRequest", JSON.stringify(enriched));

          // ✅ compute last approved visit
          const approved = data.requests.find(
            (r) => r.status === "approved"
          );
          if (approved) {
            setLastVisitDate(new Date(approved.createdAt));
          }
        }
      } catch (err) {
        console.error("Failed to fetch latest request:", err);
      }
    };

    fetchLatestRequest();
  }, []);

  //3. for auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  //4. for fetching doctors list
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/doctors`)
      .then(res => res.json())
      .then(data => setDoctors(data))
      .catch(err => console.error("Failed to load doctors", err));
  }, []);

  // Fetch doctor queues whenever doctors list changes
  useEffect(() => {
    if (!doctors.length) return;

    const fetchQueues = async () => {
      const token = localStorage.getItem("token");
      const queueMap = {};

      await Promise.all(
        doctors.map(async (doctor) => {
          try {
            const res = await fetch(
              `${API_BASE_URL}/api/doctors/${doctor._id}/queue`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const data = await res.json();
            queueMap[doctor._id] = data.queue ?? 0;
          } catch {
            queueMap[doctor._id] = 0;
          }
        })
      );

      setDoctorQueues(queueMap);
    };

    fetchQueues();
  }, [doctors]);

  //5. Initialize socket and handle all socket events
  useEffect(() => {
    if (!API_BASE_URL) {
      console.error('API_BASE_URL is not defined');
      return;
    }

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
    });

    // Join socket room when userId is available
    if (userId) {
      socket.emit("join-room", userId);
      console.log("🟢 Student joined socket room:", userId);
    }

    // Listen to doctor status updates
    socket.on("doctor-status-updated", ({ doctorId, availability }) => {
      setDoctors((prevDoctors) =>
        prevDoctors.map((doc) =>
          doc._id === doctorId
            ? { ...doc, availability }
            : doc
        )
      );
    });

    // Listen to request status updates
    socket.on("request-status-updated", ({ requestId, status }) => {
      console.log("📡 Student received status update:", requestId, status);

      setRecentRequest(prev => {
        if (!prev || prev._id !== requestId) return prev;

        const updated = { ...prev, status };

        // ✅ VERY IMPORTANT
        localStorage.setItem("recentRequest", JSON.stringify(updated));

        return updated;
      });

      // ✅ Top banner update
      setAppointmentStatus(status);
    });

    return () => {
      socket.off("doctor-status-updated");
      socket.off("request-status-updated");
      socket.disconnect();
    };
  }, [userId]);

  // -------------------- EVENT HANDLERS --------------------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("recentRequest");
    navigate("/login");
  };

  const handleTranslate = async () => {
    if (!problem.trim() || translated) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: problem }),
      });

      const data = await res.json();

      if (data.success) {
        setTranslatedText(data.translatedText);
        setTranslated(true);
      } else {
        alert("Translation failed");
      }
    } catch (err) {
      console.error(err);
      alert("Translation error");
    }
  };

  const handleSubmit = async () => {
    if (selectedDoctor === user._id) {
      alert("You cannot book appointment with yourself");
      return;
    }

    let textToSend = problem;

    if (!translated) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/translate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: problem }),
        });

        const data = await res.json();
        if (data.success) {
          textToSend = data.translatedText;
          setTranslatedText(data.translatedText);
          setTranslated(true);
        }
      } catch (err) {
        console.error("Auto-translate failed");
      }
    }

    const res = await fetch(`${API_BASE_URL}/api/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problem: textToSend,
        alreadyTranslated: true,
        doctorId: selectedDoctor,
        timeSlot: selectedTimeSlot,
      }),
    });

    const data = await res.json();
    const doctorObj = doctors.find(d => d._id === selectedDoctor);

    const newRequest = {
      _id: data.request._id,
      problem: textToSend,
      doctorId: selectedDoctor,
      doctorName: doctorObj?.name || "Doctor",
      timeSlot: selectedTimeSlot,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setRecentRequest(newRequest);
    localStorage.setItem("recentRequest", JSON.stringify(newRequest));
    setAppointmentStatus("pending");
  };


  // -------------------- UI --------------------
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="header-title">
            <h1>CampusCare</h1>
            <p>Student Health Portal</p>
          </div>
        </div>
        <div className="header-right">
          {/* Profile Icon */}
          <button
            className="profile-icon-btn"
            onClick={() => navigate("/student/profile")}
            title="Profile"
          >
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Logout Button */}
          <button className="logout-text-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Left Column */}
        <div className="left-column">
          {/* Submit Health Request Card */}
          <div className="card health-request-card">
            <div className="card-header">
              <div className="card-icon send-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2>Submit Health Request</h2>
                <p>Describe your problem in any language</p>
              </div>
            </div>

            <div className="form-group">
              <label>Describe Your Problem <span className="label-hint">(Any Language)</span></label>
              <textarea
                className="problem-textarea"
                placeholder="अपनी समस्या यहाँ लिखें... / Write your problem here..."
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={5}
              />
            </div>

            <button className="translate-btn" onClick={handleTranslate}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 5H15M9 3V5M10.048 11.5C11.2034 9.49102 12.8097 7.7729 14.746 6.48L17 5M7 15L10 19L12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 17L17 21L21 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Translate to English
            </button>

            {translatedText && (
              <div className="translated-text">
                {translatedText}
              </div>
            )}

            {/* Doctor Selection */}
            <div className="doctor-selection">
              <label>Select Doctor</label>
              <div className="doctors-grid">
                {filteredDoctors.map((doctor) => (

                  <div
                    key={doctor._id}
                    className={`doctor-card 
    ${doctor.availability !== "available" ? "unavailable" : ""}
    ${selectedDoctor === doctor._id ? "selected" : ""}
  `}
                    onClick={() => {
                      if (doctor.availability === "available") {
                        setSelectedDoctor(doctor._id);
                      }
                    }}
                  >

                    <div className="doctor-image">
                      <img
                        src={
                          doctor.email.includes("champak") ? doctorChampak :
                            doctor.email.includes("sameer") ? doctorSameer :
                              doctor.email.includes("soumyaranjan") ? doctorSoumya :
                                doctor.email.includes("anirban") ? doctorAnirban :
                                  doctor.email.includes("savitri") ? doctorSavitri :
                                    doctorKapil
                        }
                        alt={doctor.name}
                      />
                    </div>

                    <h4>{doctor.name}</h4>

                    <span
                      className={`availability ${doctor.availability === "available"
                        ? "available"
                        : "not-available"
                        }`}
                    >
                      {doctor.availability === "available"
                        ? "Available"
                        : "Unavailable"}
                    </span>
                    <div>
                      queue: {doctorQueues[doctor._id] ?? 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="time-slot-selection">
              <label>Select Time Slot</label>
              <select
                className="time-slot-dropdown"
                value={selectedTimeSlot}
                onChange={(e) => setSelectedTimeSlot(e.target.value)}
              >
                <option value="">Choose a time slot...</option>
                {timeSlots.map((slot, index) => (
                  <option key={index} value={slot}>{slot}</option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!selectedDoctor || !selectedTimeSlot || !problem.trim()}
            >
              Submit Request
            </button>

            {/* Appointment Status */}
            {appointmentStatus && (
              <div className={`appointment-status ${appointmentStatus}`}>
                <div className="status-icon">
                  {appointmentStatus === 'pending' ? (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="status-text">
                  <h4>{appointmentStatus === 'pending' ? 'Pending Approval' : 'Appointment Confirmed!'}</h4>
                  <p>
                    {appointmentStatus === 'pending'
                      ? 'Waiting for doctor confirmation...'
                      : `Your appointment with ${doctors.find(d => d._id === selectedDoctor)?.name} at ${selectedTimeSlot} is confirmed.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="right-column">
          {/* Live Dispensary Status */}
          <div className="card dispensary-card">
            <div className="card-header">
              <div className="card-icon pulse-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2>Live Dispensary Status</h2>
                <p>Real-time updates</p>
              </div>
            </div>

            <div className="status-grid">
              <div className="status-item doctors-status">
                <div className="status-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.8 2.3A.3.3 0 105 2a2 2 0 012 2c0 .28-.12.56-.34.78L5.18 6.26c-.6.6-.94 1.42-.94 2.27v.24c0 .83.68 1.51 1.51 1.51a1.51 1.51 0 001.51-1.51V8.53c0-.42.17-.83.46-1.13l1.48-1.48A2 2 0 009.2 4.1l.14.03a2 2 0 001.88-1.34l.14-.44a.3.3 0 00-.57-.18l-.14.44a1.4 1.4 0 01-1.32.94H9.2a2.6 2.6 0 00-1.84.76L5.88 5.79a2.6 2.6 0 00-.76 1.84v.24a2.11 2.11 0 01-4.22 0v-.24a3.4 3.4 0 011-2.4L3.38 3.75A.6.6 0 003.6 3.3a1.4 1.4 0 011.2-1.4z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 5V3M12 21V19M5 12H3M21 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="status-value">
                  {availableDoctors}/{totalDoctors}
                </div>
                <div className="status-label">Doctors Available</div>
              </div>
            </div>

            <div className="dispensary-status-badge">
              <span className={`status-dot ${isDispensaryOpen ? 'open' : 'closed'}`}></span>
              {isDispensaryOpen ? 'Dispensary Open' : 'Dispensary Closed'}
            </div>
          </div>
          {recentRequest && (
            <div className="card recent-request-card">
              <div className="card-header">
                <h2>Recent Request</h2>
                <p>Latest health request</p>
              </div>

              <div className="recent-request-body">
                <div className="request-row">
                  <span className="label">Problem-</span>
                  <span className="value"> {translatedText}</span>
                </div>

                <div className="request-row">
                  <span className="label">Doctor</span>
                  <span className="value">
                    {recentRequest.doctorName || "—"}
                  </span>
                </div>

                <div className="request-row">
                  <span className="label">Time Slot</span>
                  <span className="time-pill">{recentRequest.timeSlot}</span>
                </div>

                <div className="request-footer">
                  <span className={`status-badge ${recentRequest.status}`}>
                    {recentRequest.status}
                  </span>
                  <span className="request-time">
                    {formatDateTime(recentRequest.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <button
            className="view-history-btn"
            onClick={() => navigate("/student/history")}
          >
            📜 View Request History
          </button>
          {/* Health Records */}
          <div className="card health-records-card">
            <div className="card-header">
              <div className="card-icon health-icon">
                <span>💚</span>
              </div>
              <div>
                <h2>Health Records</h2>
                <p>Your health summary</p>
              </div>
            </div>

            <div className="records-list">
              <div className="record-item">
                <div className="record-icon calendar-icon">
                  📅
                </div>
                <div className="record-info">
                  <span className="record-label">Last Visit Date</span>
                  <span className="record-value">
                    {lastVisitDate ? formatDate(lastVisitDate) : "No visits yet"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;  
