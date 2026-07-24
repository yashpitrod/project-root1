// working : 
//     >Submit appointment request with problem description, selected doctor, and time slot.
//     >Receive real-time updates on request status via WebSocket.
//     >View recent requests and health records.

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { auth } from "../auth/firebase";
import '../styles/studentdash.css';
import ChatBot from "../components/ChatBot";

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
    
    // Triage State from ChatBot
    const [triageData, setTriageData] = useState(null);
    const [bookingMode, setBookingMode] = useState("triage");
    const [lastVisitCondition, setLastVisitCondition] = useState("");

    // State to control appointment banner visibility
    const [showAppointmentBanner, setShowAppointmentBanner] = useState(false);

    // Navigation hook
    const navigate = useNavigate();

    // Get user info from localStorage (set at login; token refreshed before each API call)
    const token = localStorage.getItem("token");
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("user"));
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
    }

    // H-02: Helper to always get a fresh (non-expired) Firebase ID token.
    const getFreshToken = async () => {
        if (auth.currentUser) {
            const fresh = await auth.currentUser.getIdToken();
            localStorage.setItem("token", fresh);
            return fresh;
        }
        return localStorage.getItem("token");
    };

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
    const dispensaryStatus = {};

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
    // N-01: generateTimeSlots is pure — memoize to avoid recomputing every render
    const timeSlots = useMemo(() => generateTimeSlots(), []);

    //useeffet for => fetching requests
    //                computing last visit
    //                syncing localStorage
    //1. for fetching recent request from localStorage
    useEffect(() => {
        const fetchLatestRequest = async () => {
            try {
                const freshToken = await getFreshToken();
                const res = await fetch(`${API_BASE_URL}/api/requests/my`, {
                    headers: { Authorization: `Bearer ${freshToken}` },
                });

                const data = await res.json();

                if (data.success && data.requests.length > 0) {
                    const latest = data.requests[0];
                    const enriched = {
                        ...latest,
                        doctorName: latest.doctorId?.name || "Doctor",
                    };

                    setRecentRequest(enriched);
                    setAppointmentStatus(enriched.status);
                    
                    const approvedReq = data.requests.find(r => r.status === "approved");
                    if (approvedReq) {
                        setLastVisitDate(new Date(approvedReq.createdAt));
                        setLastVisitCondition(approvedReq.triageSummary || approvedReq.originalProblem || "");
                    } else {
                        setLastVisitDate(null);
                        setLastVisitCondition("");
                    }

                    setShowAppointmentBanner(false);
                } else {
                    setRecentRequest(null);
                    setAppointmentStatus(null);
                    setLastVisitDate(null);
                }
            } catch (err) {
                console.error(err);
            }
        };

        if (token) fetchLatestRequest();
    }, [token]);



    //3. for fetching doctors list
    useEffect(() => {
        (async () => {
            const freshToken = await getFreshToken();
            fetch(`${API_BASE_URL}/api/doctors`, {
                headers: { Authorization: `Bearer ${freshToken}` }
            })
                .then(res => res.json())
                .then(data => setDoctors(data))
                .catch(err => console.error("Failed to load doctors", err));
        })();
    }, [token]);

    // Fetch doctor queues whenever doctors list changes
    useEffect(() => {
        if (!doctors.length) return;

        const fetchQueues = async () => {
            // M-03: Removed duplicate localStorage.getItem("token") — use getFreshToken() instead
            const freshToken = await getFreshToken();
            const queueMap = {};

            await Promise.all(
                doctors.map(async (doctor) => {
                    try {
                        const res = await fetch(
                            `${API_BASE_URL}/api/doctors/${doctor._id}/queue`,
                            { headers: { Authorization: `Bearer ${freshToken}` } }
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

        // SK-01: Pass auth token so the server's socket auth middleware accepts the connection
        const socket = io(API_BASE_URL, {
            auth: { token },
        });

        // AU-05: Server now auto-joins the user's room on connection.
        // No need to emit "join-room" — the server uses the verified MongoDB ID.

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

            setRecentRequest(prev => {
                if (!prev || prev._id !== requestId) return prev;

                const updated = { ...prev, status };

                // ✅ VERY IMPORTANT
                localStorage.setItem("recentRequest", JSON.stringify(updated));

                return updated;
            });

            setAppointmentStatus(status);
            setShowAppointmentBanner(true);
        });

        return () => {
            socket.off("doctor-status-updated");
            socket.off("request-status-updated");
            socket.disconnect();
        };
    }, [token]);

    // -------------------- EVENT HANDLERS --------------------
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("recentRequest");
        setShowAppointmentBanner(false);
        navigate("/login");
    };

    const handleTranslate = async () => {
        if (!problem.trim()) return;

        try {
            const freshToken = await getFreshToken();
            const res = await fetch(`${API_BASE_URL}/api/translate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${freshToken}`,
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
        if (selectedDoctor === user?._id) {
            alert("You cannot book appointment with yourself");
            return;
        }

        // SEC-01: Require completed triage session before booking IF in triage mode
        if (bookingMode === "triage" && (!triageData || !triageData.sessionId)) {
            alert("Please complete the triage chat before booking an appointment.");
            return;
        }
        
        if (bookingMode === "quick" && !problem.trim()) {
            alert("Please describe your problem before booking.");
            return;
        }

        try {
            const freshToken = await getFreshToken();
            
            const payload = {
                doctorId: selectedDoctor,
                timeSlot: selectedTimeSlot,
            };
            
            if (bookingMode === "triage") {
                payload.sessionId = triageData.sessionId;
            } else {
                payload.problem = translated ? translatedText : problem;
            }

            const res = await fetch(`${API_BASE_URL}/api/requests`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${freshToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || "Failed to book appointment");
            }

            const data = await res.json();
            const doctorObj = doctors.find(d => d._id === selectedDoctor);

            const newRequest = {
                _id: data.request._id,
                triageSummary: data.request.triageSummary,
                originalProblem: data.request.originalProblem,
                doctorId: selectedDoctor,
                doctorName: doctorObj?.name || "Doctor",
                timeSlot: selectedTimeSlot,
                status: "pending",
                createdAt: new Date().toISOString(),
            };

            // for updating state and localStorage
            setRecentRequest(newRequest);
            setAppointmentStatus("pending");
            setShowAppointmentBanner(true);

            localStorage.setItem("recentRequest", JSON.stringify(newRequest));
            // reset form and clear sessionStorage so a fresh session starts
            setProblem("");
            setTranslated(false);
            setTranslatedText("");
            setSelectedDoctor(null);
            setSelectedTimeSlot("");
            setTriageData(null);
            sessionStorage.removeItem("chatSessionId");

            // Show appointment banner
            setShowAppointmentBanner(true);
        } catch (error) {
            console.error("Submission error:", error);
            alert(error.message || "Failed to submit request. Please try again.");
        }
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
                        <div className="flex gap-4 mb-4 border-b pb-2">
                            <button 
                                className={`px-4 py-2 font-semibold ${bookingMode === 'triage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                onClick={() => setBookingMode('triage')}
                            >
                                AI Triage
                            </button>
                            <button 
                                className={`px-4 py-2 font-semibold ${bookingMode === 'quick' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                                onClick={() => setBookingMode('quick')}
                            >
                                Quick Appointment
                            </button>
                        </div>

                        {bookingMode === "triage" && !triageData && (
                            <ChatBot 
                                token={token} 
                                API_BASE_URL={API_BASE_URL} 
                                onTriageComplete={(sessionId, summary, symptoms, riskScore) => {
                                    setTriageData({ sessionId, summary, symptoms, riskScore });
                                }} 
                            />
                        )}

                        {bookingMode === "quick" && (
                            <div className="mb-6">
                                <label className="block mb-2 font-medium">Describe your problem:</label>
                                <textarea 
                                    className="w-full p-3 border rounded-md" 
                                    rows="4"
                                    placeholder="I have a headache since morning..."
                                    value={problem}
                                    onChange={(e) => setProblem(e.target.value)}
                                    maxLength={2000}
                                />
                                {translated && translatedText && (
                                    <div className="mt-2 p-3 bg-blue-50 text-blue-900 rounded-md text-sm border border-blue-200">
                                        <strong>Translated: </strong> {translatedText}
                                    </div>
                                )}
                                <button className="mt-2 text-sm text-blue-600 font-medium hover:underline" onClick={handleTranslate}>
                                    Translate to English (Optional)
                                </button>
                            </div>
                        )}

                        {((bookingMode === "triage" && triageData) || bookingMode === "quick") && (
                            <>
                                {bookingMode === "triage" && triageData && (
                                <div className="p-6 mb-6 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Triage Summary</h3>
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${triageData.riskScore === 'Critical' ? 'bg-red-100 text-red-700' : triageData.riskScore === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            Risk: {triageData.riskScore}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{triageData.summary}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {triageData.symptoms?.map((sym, idx) => (
                                            <span key={idx} className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                                {sym}
                                            </span>
                                        ))}
                                    </div>
                                    <button 
                                        className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        onClick={() => setTriageData(null)}
                                    >
                                        ← Start over
                                    </button>
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

                                        <div className="doctor-image avatar-initials">
                                            {doctor.name?.split(" ").map(n => n[0]).join("")}
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
                                        <div className="queue-bar">
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
                            className="submit-btn mt-6"
                            onClick={handleSubmit}
                            disabled={!selectedDoctor || !selectedTimeSlot}
                        >
                            Finalize Request
                        </button>
                        </>
                        )}

                        {/* Appointment Status */}
                        {showAppointmentBanner && recentRequest && appointmentStatus && (
                            <div className={`appointment-status ${appointmentStatus}`}>
                                <div className="status-icon">
                                    {appointmentStatus === 'pending' ? (
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" />
                                        </svg>
                                    )}
                                </div>

                                <div className="status-text">
                                    <h4>
                                        {appointmentStatus === "pending"
                                            ? "Pending Approval"
                                            : "Appointment Confirmed!"}
                                    </h4>

                                    <p>
                                        {appointmentStatus === "pending"
                                            ? "Waiting for doctor confirmation..."
                                            : `Your appointment with ${recentRequest.doctorName} at ${recentRequest.timeSlot} is confirmed.`}
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

                    {/* Doctors on Duty Widget */}
                    <div className="card doctors-widget-card">
                        <div className="card-header">
                            <h2>Doctors on Duty</h2>
                        </div>
                        <div className="doctors-widget-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {doctors.slice(0, 4).map(doc => (
                                <div key={doc._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }}>
                                    <div className="avatar-initials" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                        {doc.name?.split(" ").map(n => n[0]).join("")}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{doc.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>Campus Doctor</div>
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '12px', background: doc.availability === 'available' ? '#dcfce7' : '#fee2e2', color: doc.availability === 'available' ? '#166534' : '#991b1b' }}>
                                        {doc.availability === 'available' ? 'Available' : 'Busy'}
                                    </span>
                                </div>
                            ))}
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
                                    <span className="value">{recentRequest.problem}</span>
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
                            {lastVisitCondition && (
                            <div className="record-item" style={{ marginTop: '10px' }}>
                                <div className="record-icon file-icon">
                                    📋
                                </div>
                                <div className="record-info">
                                    <span className="record-label">Diagnosis / Summary</span>
                                    <span className="record-value" style={{ fontSize: '13px', color: '#444' }}>
                                        {lastVisitCondition}
                                    </span>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;  