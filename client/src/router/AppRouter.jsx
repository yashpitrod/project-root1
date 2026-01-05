import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../auth/Login';
import Register from '../auth/Register';
import StudentDashboard from '../pages/StudentDashboard';
import DoctorDashboard from '../pages/DoctorDashboard';
import StudentProfile from '../pages/StudentProfile';
import RequestHistory from "../pages/RequestHistory";
import ForgotPassword from "../auth/ForgotPassword";

const AppRouter = () => {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/history" element={<RequestHistory />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;