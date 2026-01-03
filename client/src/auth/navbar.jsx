import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="auth-navbar">
      <div className="auth-navbar-left">
        <Link to="/" className="auth-navbar-logo">
          🏥 <span>Campus</span>Care
        </Link>
      </div>

      <div className="auth-navbar-right">
        {/* Future use
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link">Register</Link>
        */}
      </div>
    </nav>
  );
};

export default Navbar;
