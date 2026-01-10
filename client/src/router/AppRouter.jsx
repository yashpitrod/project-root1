import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../auth/Login';
import Register from '../auth/Register';
import StudentDashboard from '../pages/StudentDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';
import StudentProfile from '../pages/StudentProfile';
import RequestHistory from "../pages/RequestHistory";
import ForgotPassword from "../auth/ForgotPassword";
import ProtectedRoute from '../auth/ProtectedRoute';
import NotFound from '../pages/NotFound';

const AppRouter = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/history" element={<ProtectedRoute><RequestHistory /></ProtectedRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* ✅ fallback */}
        <Route path="*" element={<NotFound />} />
    </Routes>
    </BrowserRouter >
  );
};

export default AppRouter;