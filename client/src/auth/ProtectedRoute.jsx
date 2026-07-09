import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner">Loading...</div>; 
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;