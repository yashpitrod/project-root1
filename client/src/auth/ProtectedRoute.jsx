import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "./firebase";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
    if (!firebaseUser) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error();
      setAuthenticated(true);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  });

  return unsubscribe;
}, []);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "20vh" }}>Loading...</div>;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
