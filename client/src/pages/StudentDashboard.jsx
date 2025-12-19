import React, { useState } from "react";
import "../styles/auth.css";

// ============ DASHBOARD HEADER ============
const DashboardHeader = ({ userName }) => {
  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
              <circle cx="20" cy="10" r="2"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>CampusCare</h1>
            <p>Health Portal</p>
          </div>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <p className="user-name">{userName}</p>
            <span className="user-badge">Student</span>
          </div>
          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

// ============ HEALTH RECORD ============
const HealthRecord = ({ lastVisitDate, totalVisits, commonIssue }) => {
  return (
    <div className="card health-record-card">
      <div className="card-gradient-bar"></div>
      <div className="card-header">
        <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <h3>Health Record</h3>
      </div>
      <div className="card-content">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                <line x1="16" x2="16" y1="2" y2="6"/>
                <line x1="8" x2="8" y1="2" y2="6"/>
                <line x1="3" x2="21" y1="10" y2="10"/>
              </svg>
              <span>Last Visit</span>
            </div>
            <p className="stat-value">{lastVisitDate}</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,7 13.5,15.5 8.5,10.5 2,17"/>
                <polyline points="16,7 22,7 22,13"/>
              </svg>
              <span>Total Visits</span>
            </div>
            <p className="stat-value-large">{totalVisits}</p>
          </div>
          
          <div className="stat-card full-width">
            <div className="stat-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              <span>Most Common Issue</span>
            </div>
            <p className="stat-value-text">{commonIssue || "No recurring issues"}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ HEALTH REQUEST FORM ============
const HealthRequestForm = ({ onSubmit }) => {
  const [problemText, setProblemText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleTranslate = () => {
    if (!problemText.trim()) return;
    setIsTranslating(true);
    setTimeout(() => {
      setTranslatedText(`[Translated to English]: ${problemText}`);
      setShowTranslation(true);
      setIsTranslating(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!problemText.trim()) return;
    onSubmit(problemText, translatedText || problemText);
    setProblemText("");
    setTranslatedText("");
    setShowTranslation(false);
  };

  return (
    <div className="card">
      <div className="card-gradient-bar"></div>
      <div className="card-header">
        <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <h3>Submit Health Request</h3>
      </div>
      <div className="card-content">
        <div className="form-group">
          <label>Describe your problem (any language)</label>
          <textarea
            placeholder="اپنی صحت کا مسئلہ یہاں لکھیں... / Write your health issue here..."
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-outline"
          onClick={handleTranslate}
          disabled={!problemText.trim() || isTranslating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 8 6 6"/>
            <path d="m4 14 6-6 2-3"/>
            <path d="M2 5h12"/>
            <path d="M7 2h1"/>
            <path d="m22 22-5-10-5 10"/>
            <path d="M14 18h6"/>
          </svg>
          {isTranslating ? "Translating..." : "Translate to English"}
        </button>

        {showTranslation && translatedText && (
          <div className="translation-box">
            <p className="translation-label">Translated Text:</p>
            <p className="translation-text">{translatedText}</p>
          </div>
        )}

        <button 
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!problemText.trim()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" x2="11" y1="2" y2="13"/>
            <polygon points="22,2 15,22 11,13 2,9"/>
          </svg>
          Submit Request
        </button>
      </div>
    </div>
  );
};

// ============ TIME SLOT PICKER ============
const doctors = [
  { id: "doc1", name: "Dr. Sharma", available: true, specialty: "General Physician" },
  { id: "doc2", name: "Dr. Patel", available: true, specialty: "General Physician" },
  { id: "doc3", name: "Dr. Khan", available: false, specialty: "General Physician" },
];

const generateTimeSlots = () => {
  const slots = [];
  let id = 1;
  
  // Morning: 9 AM - 12 PM
  for (let hour = 9; hour < 12; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const displayHour = hour;
      const endMin = (min + 15) % 60;
      const endHour = min + 15 >= 60 ? hour + 1 : hour;
      slots.push({
        id: String(id++),
        time: `${displayHour}:${min.toString().padStart(2, '0')} - ${endHour}:${endMin.toString().padStart(2, '0')} AM`,
        available: Math.random() > 0.3,
      });
    }
  }
  
  // Lunch break
  slots.push({ id: String(id++), time: "12:00 - 1:00 PM", available: false, isBreak: true, breakType: "lunch" });
  
  // Afternoon: 1 PM - 3 PM
  for (let hour = 1; hour < 3; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const endMin = (min + 15) % 60;
      const endHour = min + 15 >= 60 ? hour + 1 : hour;
      slots.push({
        id: String(id++),
        time: `${hour}:${min.toString().padStart(2, '0')} - ${endHour}:${endMin.toString().padStart(2, '0')} PM`,
        available: Math.random() > 0.3,
      });
    }
  }
  
  // Tea break
  slots.push({ id: String(id++), time: "3:00 - 4:00 PM", available: false, isBreak: true, breakType: "tea" });
  
  // Evening: 4 PM - 8 PM
  for (let hour = 4; hour < 8; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const endMin = (min + 15) % 60;
      const endHour = min + 15 >= 60 ? hour + 1 : hour;
      slots.push({
        id: String(id++),
        time: `${hour}:${min.toString().padStart(2, '0')} - ${endHour}:${endMin.toString().padStart(2, '0')} PM`,
        available: Math.random() > 0.3,
      });
    }
  }
  
  return slots;
};

const timeSlots = generateTimeSlots();

const TimeSlotPicker = ({ onSelect, selectedSlot, selectedDoctor, appointmentStatus }) => {
  const [localSelectedDoctor, setLocalSelectedDoctor] = useState(selectedDoctor);

  const handleSlotSelect = (slot) => {
    if (localSelectedDoctor && slot.available && !slot.isBreak) {
      onSelect(slot, localSelectedDoctor);
    }
  };

  return (
    <div className="card">
      <div className="card-gradient-bar"></div>
      <div className="card-header">
        <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        <h3>Book Appointment</h3>
      </div>
      <div className="card-content">
        {/* Appointment Status */}
        {selectedSlot && appointmentStatus && (
          <div className={`appointment-status ${appointmentStatus}`}>
            <div className="status-info">
              <p className="status-label">Your Appointment</p>
              <p className="status-time">{selectedSlot.time}</p>
              {selectedDoctor && <p className="status-doctor">{selectedDoctor.name}</p>}
            </div>
            <span className={`status-badge ${appointmentStatus}`}>
              <span className="pulse-dot"></span>
              {appointmentStatus === "confirmed" ? "Confirmed" : "Pending"}
            </span>
          </div>
        )}

        {/* Doctor Selection */}
        <div className="section">
          <p className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Select Doctor
          </p>
          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <button
                key={doctor.id}
                disabled={!doctor.available}
                onClick={() => setLocalSelectedDoctor(doctor)}
                className={`doctor-card ${localSelectedDoctor?.id === doctor.id ? 'selected' : ''} ${!doctor.available ? 'unavailable' : ''}`}
              >
                <div className={`doctor-avatar ${doctor.available ? 'available' : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <p className="doctor-name">{doctor.name}</p>
                <p className={`doctor-status ${doctor.available ? 'available' : 'unavailable'}`}>
                  {doctor.available ? "Available" : "Unavailable"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="section">
          <p className="section-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
            Select Time Slot
            {!localSelectedDoctor && <span className="warning-text">(Select doctor first)</span>}
          </p>
          
          <div className="time-slots-container">
            <div className="time-slots-grid">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available || !localSelectedDoctor || slot.isBreak}
                  onClick={() => handleSlotSelect(slot)}
                  className={`time-slot-btn ${selectedSlot?.id === slot.id ? 'selected' : ''} ${slot.isBreak ? 'break' : ''} ${slot.available && !slot.isBreak ? 'available' : ''}`}
                >
                  {slot.isBreak ? (
                    <span className="break-content">
                      {slot.breakType === "lunch" ? "🍽️ Lunch Break" : "☕ Tea Break"}
                    </span>
                  ) : (
                    <>
                      {selectedSlot?.id === slot.id && "✓ "}
                      {slot.time}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ DISPENSARY STATUS ============
const DispensaryStatus = ({ doctorsAvailable, queueCount, emergencyMessage }) => {
  return (
    <div className="card">
      <div className="card-gradient-bar"></div>
      <div className="card-header">
        <svg className="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        <h3>Live Dispensary Status</h3>
      </div>
      <div className="card-content">
        {emergencyMessage && (
          <div className="emergency-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
            <p>{emergencyMessage}</p>
          </div>
        )}

        <div className="status-grid">
          <div className="status-card">
            <div className="status-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16,11 18,13 22,9"/>
              </svg>
            </div>
            <div>
              <p className="status-number">{doctorsAvailable}</p>
              <p className="status-text">Doctors Available</p>
            </div>
          </div>

          <div className="status-card">
            <div className="status-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="status-number">{queueCount}</p>
              <p className="status-text">In Queue</p>
            </div>
          </div>
        </div>

        <div className="open-status">
          <span className="pulse-dot green"></span>
          <p>Dispensary is currently <span className="open-text">open</span></p>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN DASHBOARD ============
const StudentDashboard = () => {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentStatus, setAppointmentStatus] = useState(null);

  const handleSubmitRequest = (originalText, translatedText) => {
    console.log("Original:", originalText);
    console.log("Translated:", translatedText);
    alert("Health request submitted successfully!");
  };

  const handleSelectSlot = (slot, doctor) => {
    setSelectedSlot(slot);
    setSelectedDoctor(doctor);
    setAppointmentStatus("pending");
    
    // Simulate doctor confirmation
    setTimeout(() => {
      setAppointmentStatus("confirmed");
      alert(`Appointment confirmed with ${doctor.name} at ${slot.time}!`);
    }, 3000);
  };

  return (
    <div className="dashboard">
      <DashboardHeader userName="Ahmed Khan" />
      
      <main className="main-content">
        <div className="page-header">
          <h2>Student Dashboard</h2>
          <p>Manage your health requests and appointments</p>
        </div>

        <div className="dashboard-grid">
          <div className="left-column">
            <HealthRequestForm onSubmit={handleSubmitRequest} />
            <TimeSlotPicker
              onSelect={handleSelectSlot}
              selectedSlot={selectedSlot}
              selectedDoctor={selectedDoctor}
              appointmentStatus={appointmentStatus}
            />
          </div>
          
          <div className="right-column">
            <HealthRecord 
              lastVisitDate="Dec 15, 2025"
              totalVisits={7}
              commonIssue="Headache & Fever"
            />
            <DispensaryStatus
              doctorsAvailable={2}
              queueCount={8}
              emergencyMessage={undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
