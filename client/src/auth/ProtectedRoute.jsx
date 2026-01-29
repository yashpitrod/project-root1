import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { user, loading, getToken } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState("checking"); 
  // checking | verified | rejected

  useEffect(() => {
    const verify = async () => {
      if (!user) {
        setStatus("rejected");
        return;
      }

      try {
        const token = await getToken();
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          setStatus("rejected");
          return;
        }

        setStatus("verified");
      } catch (err) {
        setStatus("rejected");
      }
    };

    verify();
  }, [user]);

  if (loading || status === "checking") {
    return <div style={{ textAlign: "center", marginTop: "20vh" }}>Loading...</div>;
  }

  if (!user || status === "rejected") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
