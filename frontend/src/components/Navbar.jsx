import { NavLink, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import { useState } from "react";

const icons = {
  tracker: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  problems: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  roadmap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>,
  friends: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  logo: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
};

const links = [
  { to: "/",          label: "Tracker",   icon: icons.tracker },
  { to: "/problems",  label: "Problems",  icon: icons.problems },
  { to: "/dashboard", label: "Dashboard", icon: icons.dashboard },
  { to: "/roadmap",   label: "Roadmap",   icon: icons.roadmap },
  { to: "/friends",   label: "Friends",   icon: icons.friends },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div>
            <div className="navbar-title">DSA Revision Tracker</div>
            <div className="navbar-sub">Spaced Repetition Scheduler</div>
          </div>
        </Link>

        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="navbar-menu"
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? icons.close : icons.menu}
        </button>      
        
        <nav
          id="navbar-menu"
          className={`navbar-menu ${menuOpen ? "is-open" : ""}`}
        >
          <div className="navbar-nav-links">
            {user && links.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                end={to === "/"}
                className={({ isActive }) =>
                  ["nav-link", isActive ? "nav-link--active" : ""].join(" ").trim()
                }
              >
                {icon} {label}
              </NavLink>
            ))}
          </div>
          
          <div className="navbar-user-section">
            {user ? (
              <>
                <span className="user-greeting">
                  Hello, <strong>{user.username}</strong>
                </span>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: "6px 12px", fontSize: "13px" }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</NavLink>
                <NavLink to="/register" className="btn btn-primary" onClick={() => setMenuOpen(false)} style={{ width: "auto", padding: "6px 12px" }}>Register</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
