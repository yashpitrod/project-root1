import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RequestHistory.css";

const RequestHistory = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/requests/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success) {
          setRequests(data.requests);
        }
      } catch (err) {
        console.error("Failed to fetch request history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Request History</h1>
        <button className="back-btn" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </button>
      </div>

      {loading ? (
        <p className="loading-text">Loading history...</p>
      ) : requests.length === 0 ? (
        <p className="empty-text">No requests found.</p>
      ) : (
        <div className="history-grid">
          {requests.map((req) => (
            <div key={req._id} className="history-card glass">
              <div className="history-card-header">
                <span className={`status-pill ${req.status}`}>
                  {req.status}
                </span>
                <span className="history-date">
                  {formatDate(req.createdAt)}
                </span>
              </div>

              <p className="history-problem">{req.problem}</p>

              <div className="history-meta">
                <span>👨‍⚕️ {req.doctorId?.name || "Doctor"}</span>
                <span>⏰ {req.timeSlot}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequestHistory;
