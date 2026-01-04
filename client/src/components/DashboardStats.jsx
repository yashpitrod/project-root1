import "../styles/DashboardStats.css";

const DashboardStats = ({ total, pending, approved }) => {
  return (
    <div className="stats-grid">

      <div className="stat-card image-card">
        <div className="stat-image">
          <img src="/stat1.png" alt="total" />
        </div>
        <h3>{total}</h3>
        <p>Total Appointments</p>
      </div>

      <div className="stat-card image-card">
        <div className="stat-image">
          <img src="/stat2.png" alt="pending" />
        </div>
        <h3>{pending}</h3>
        <p>Pending Requests</p>
      </div>

      <div className="stat-card image-card">
        <div className="stat-image">
          <img src="/stat3.png" alt="approved" />
        </div>
        <h3>{approved}</h3>
        <p>Approved</p>
      </div>

    </div>
  );
};

export default DashboardStats;
