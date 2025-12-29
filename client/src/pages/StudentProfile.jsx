import "../styles/studentProfile.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const StudentProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
    }
  }, [token, user, navigate]);

  if (!token || !user) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>Student Profile</h2>

        <div className="profile-row">
          <span>Name</span>
          <p>{user.name}</p>
        </div>

        <div className="profile-row">
          <span>Email</span>
          <p>{user.email}</p>
        </div>

        <div className="profile-row">
          <span>Role</span>
          <p>{user.role}</p>
        </div>

        <button className="back-btn" onClick={() => navigate("/student")}>
          ← Back to Dashboard
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
