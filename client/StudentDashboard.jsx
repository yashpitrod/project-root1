import React, { useState } from "react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [problem, setProblem] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [status, setStatus] = useState("Pending");

  // Fake translate function (backend/Gemini later)
  const handleTranslate = () => {
    if (!problem) {
      alert("Please enter your problem first");
      return;
    }
    setTranslatedText("Translated English: " + problem);
  };

  const handleSubmit = () => {
    if (!date || !timeSlot || !translatedText) {
      alert("Fill all details");
      return;
    }
    setStatus("Pending");
    alert("Health request submitted successfully");
  };

  return (
    <div className="dashboard-container">
      <h2 className="title">Student Dashboard</h2>

      {/* A. Health Request */}
      <div className="card">
        <h3>Submit Health Request</h3>
        <textarea
          placeholder="Describe your problem (any language)"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
        />

        <button className="secondary-btn" onClick={handleTranslate}>
          Translate to English
        </button>

        {translatedText && (
          <div className="translated-box">{translatedText}</div>
        )}
      </div>

      {/* B. Time Slot */}
      <div className="card">
        <h3>Choose Time Slot</h3>

        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

        <label>Time Slot</label>
        <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)}>
          <option value="">Select</option>
          <option>10:00 - 10:15</option>
          <option>10:15 - 10:30</option>
          <option>10:30 - 10:45</option>
        </select>

        <button className="primary-btn" onClick={handleSubmit}>
          Submit Request
        </button>
      </div>

      {/* C. Status */}
      <div className="card">
        <h3>Doctor Approval Status</h3>
        <p className={`status ${status.toLowerCase()}`}>
          {status}
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;
