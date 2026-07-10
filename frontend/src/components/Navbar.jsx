import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
import { useState } from "react";

const links = [
  { to: "/",          label: "🧠 Tracker"   },
  { to: "/problems",  label: "📋 Problems"  },
  { to: "/dashboard", label: "📊 Dashboard" },
  { to: "/roadmap",   label: "🗺️ Roadmap"   },
  { to: "/friends",   label: "👥 Friends"   },
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
        <div className="navbar-brand">
          <span className="navbar-icon">⚡</span>
          <div>
            <div className="navbar-title">DSA Revision Tracker</div>
            <div className="navbar-sub">Spaced Repetition Scheduler</div>
          </div>
        </div>

        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>      
        <nav
          className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}
        >
          <div className="navbar-nav-links">
            {user && links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                end={to === "/"}
                className={({ isActive }) =>
                  ["nav-link", isActive ? "nav-link--active" : ""].join(" ").trim()
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
          
          <div className="navbar-user-section">
            {user ? (
              <>
                <span style={{ color: "var(--text-sec)", fontSize: "0.9rem" }}>
                  Hello, <strong>{user.username}</strong>
                </span>
                <button onClick={handleLogout} className="p-btn-rem" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", background: "var(--surface-light)", color: "var(--text)" }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="nav-link">Login</NavLink>
                <NavLink to="/register" className="p-btn-rem" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", textDecoration: "none" }}>Register</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
