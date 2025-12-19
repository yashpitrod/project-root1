import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../auth/Login";
import Register from "../auth/Register";
import StudentDashboard from "./StudentDashboard.jsx";
import DoctorDashboard from "../pages/DoctorDashboard";

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/doctor" element={<DoctorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

