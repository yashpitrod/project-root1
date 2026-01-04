import "../styles/AppointmentCard.css";

const AppointmentCard = ({ app, onApprove, onReject }) => {
  return (
    <div className="appointment-card-modern">
      <div className="left">
        <img src="/avatar.png" alt="patient" />
        <div>
          <h4>{app.studentId?.name}</h4>
          <p>{app.studentId?.email}</p>
          <span>{app.timeSlot}</span>
        </div>
      </div>

      <div className="right">
        {app.status === "pending" ? (
          <>
            <button className="reject" onClick={onReject}>Reject</button>
            <button className="approve" onClick={onApprove}>Accept</button>
          </>
        ) : (
          <span className={`status ${app.status}`}>{app.status}</span>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;
