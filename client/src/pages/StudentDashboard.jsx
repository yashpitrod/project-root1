import { useState } from "react";
import '../styles/studentdash.css';
import doctorChampak from '../assets/doctor-champa.jpg';
import doctorSameer from '../assets/doctor-sameer.jpg';
import doctorSoumya from '../assets/doctor-soumya.jpg';
import doctorAnirban from '../assets/blank-profile-picture.jpg';
import doctorSavitri from '../assets/blank-profile-picture.jpg';
import doctorKapil from '../assets/blank-profile-picture.jpg';



const StudentDashboard = () => {
  const [problem, setProblem] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [translated, setTranslated] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState(null);

  const token = localStorage.getItem("token");

  const doctors = [
    {
      id: 1,
      name: 'Dr. Champak Bhattacharyya',
      image: doctorChampak,
      available: true,
      gender: 'male',
      email: 'champak.bhattacharyya@gmail.com'
    },
    {
      id: 2,
      name: 'Dr. Sameer Patnaik',
      image: doctorSameer,
      available: true,
      gender: 'male',
      email: 'sameer.patnaik@gmail.com'
    },
    {
      id: 3,
      name: 'Dr. Soumyaranjan Behera',
      image: doctorSoumya,
      available: false,
      gender: 'male',
      email: 'soumyaranjan.behera@gmail.com'
    },
    {
      id: 4,
      name: 'Dr. Anirban Ghosh',
      image: doctorAnirban,
      available: true,
      gender: 'male',
      email: 'anirban.ghosh@gmail.com'
    },
    {
      id: 5,
      name: 'Dr. Savitri Munda',
      image: doctorSavitri,
      available: true,
      gender: 'female',
      email: 'savitri.munda@gmail.com'
    },
    {
      id: 6,
      name: 'Dr. Kapil Meena',
      image: doctorKapil,
      available: true,
      gender: 'male',
      email: 'kapil.meena@gmail.com'
    }
  ];


  const healthRecord = {
    lastVisit: '15 Dec 2024',
    totalVisits: 7,
  };

  const dispensaryStatus = {
    doctorsAvailable: 2,
    totalDoctors: 4,
    inQueue: 5,
    isOpen: true,
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

  const timeSlots = generateTimeSlots();

  const handleTranslate = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: problem }),
      });

      const data = await res.json();

      if (data.success) {
        setTranslatedText(data.translatedText);
        setTranslated(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    const textToSend = translated ? translatedText : problem;

    await fetch("http://localhost:5000/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        problem: textToSend,
        alreadyTranslated: translated,
        doctorId: selectedDoctor,
        timeSlot: selectedTimeSlot,
      }),
    });

    setAppointmentStatus("pending");
  };

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
          <div className="user-badge">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>Student</span>
          </div>
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
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={`doctor-card ${selectedDoctor === doctor.id ? 'selected' : ''} ${!doctor.available ? 'unavailable' : ''}`}
                    onClick={() => doctor.available && setSelectedDoctor(doctor.id)}
                  >
                    <div className="doctor-image">
                      <img src={doctor.image} alt={doctor.name} />
                    </div>
                    <h4>{doctor.name}</h4>
                    <span className={`availability ${doctor.available ? 'available' : 'not-available'}`}>
                      {doctor.available ? 'Available' : 'Unavailable'}
                    </span>
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
                      : `Your appointment with ${doctors.find(d => d.id === selectedDoctor)?.name} at ${selectedTimeSlot} is confirmed.`}
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
                <div className="status-value">{dispensaryStatus.doctorsAvailable}/{dispensaryStatus.totalDoctors}</div>
                <div className="status-label">Doctors Available</div>
              </div>
              <div className="status-item queue-status">
                <div className="status-item-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M23 21V19C22.9986 17.177 21.765 15.5857 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="status-value">{dispensaryStatus.inQueue}</div>
                <div className="status-label">In Queue</div>
              </div>
            </div>

            <div className="dispensary-status-badge">
              <span className={`status-dot ${dispensaryStatus.isOpen ? 'open' : 'closed'}`}></span>
              {dispensaryStatus.isOpen ? 'Dispensary Open' : 'Dispensary Closed'}
            </div>
          </div>

          {/* Health Records */}
          <div className="card health-records-card">
            <div className="card-header">
              <div className="card-icon heart-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.19169 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L4.22 13.45L12 21.23L19.78 13.45L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6054C22.3095 9.93789 22.4518 9.22248 22.4518 8.5C22.4518 7.77752 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h2>Health Records</h2>
                <p>Your health summary</p>
              </div>
            </div>

            <div className="records-list">
              <div className="record-item">
                <div className="record-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="record-info">
                  <span className="record-label">Last Visit Date</span>
                  <span className="record-value">{healthRecord.lastVisit}</span>
                </div>
              </div>
              <div className="record-item">
                <div className="record-icon">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
                    <path d="M9 12H15M9 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="record-info">
                  <span className="record-label">Total Visits</span>
                  <span className="record-value">{healthRecord.totalVisits} visits</span>
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
