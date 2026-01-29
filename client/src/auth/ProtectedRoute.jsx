import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from "react";

const ProtectedRoute = ({ children }) => {
  const { user, loading, getToken } = useAuth();
  const location = useLocation();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!user) return;

      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        setVerified(true);
      }
    };

    verify();
  }, [user]);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "20vh" }}>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!verified) {
    return <div style={{ textAlign: "center", marginTop: "20vh" }}>Verifying...</div>;
  }

  return children;
};

export default ProtectedRoute;
