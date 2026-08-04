import React, { useState, useEffect } from "react";
import "./Header.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  FaTachometerAlt,
  FaBell,
  FaCog,
  FaBars,
  FaTimes,
  FaUser,
  FaHistory,
  FaVideo,
  FaChartBar
} from "react-icons/fa";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user data from Firestore
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutConfirm(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close menu and dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // If clicking outside mobile menu, close it
      if (menuOpen && !e.target.closest('.nav-items') && !e.target.closest('.menu-toggle')) {
        setMenuOpen(false);
      }
      // If clicking completely outside the profile wrapper, close dropdown
      if (!e.target.closest('.user-profile-wrapper')) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Handle detection page navigation or redirect
  const isActivePath = (path) => {
    if (path === "/detection") {
      return location.pathname === "/" || location.pathname === "/detection";
    }
    return location.pathname === path;
  };

  const handleUserClick = () => {
    navigate("/login");
  };

  return (
    <>
    <header className="header">
      <div className="header-content">
        {/* Logo + Title */}
        <div className="logo-container" onClick={() => navigate("/detection")} style={{ cursor: "pointer" }}>
          <div className="logo">🚗</div>
          <div className="title-container">
            <h1>NapGuard</h1>
            <p>Real-time monitoring for safer driving</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`nav-items ${menuOpen ? "nav-open" : ""}`}>
          <ul>
                {/* Dashboard Tab (Points to Detection) */}
                <li>
                  <Link
                    to="/detection"
                    className={`nav-item ${
                      isActivePath("/detection") ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaVideo className="nav-icon" />
                    <span className="nav-text">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/last-alert"
                    className={`nav-item ${
                      isActivePath("/last-alert") ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaBell className="nav-icon" />
                    <span className="nav-text">Last Alert</span>
                  </Link>
                </li>
            {user && (
              <>
                <li>
                  <Link
                    to="/statistics"
                    className={`nav-item ${
                      isActivePath("/statistics") ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaChartBar className="nav-icon" />
                    <span className="nav-text">Statistics</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/history"
                    className={`nav-item ${
                      isActivePath("/history") ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaHistory className="nav-icon" />
                    <span className="nav-text">Detection History</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/settings"
                    className={`nav-item ${
                      isActivePath("/settings") ? "active" : ""
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <FaCog className="nav-icon" />
                    <span className="nav-text">Settings</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="header-controls">
          {user ? (
            <div className="user-profile-wrapper" onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
              <div className="user-section">
                <div className="login-icon-circle" style={{ width: '32px', height: '32px' }}>
                  <FaUser className="user-icon" style={{ fontSize: '0.9rem' }} />
                </div>
                <div className="user-info-bubble">
                  <span className="user-display-name">{userData?.name || user.email.split('@')[0]}</span>
                </div>
              </div>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <span className="profile-dropdown-email">{user.email}</span>
                  </div>
                  <button className="dropdown-logout-btn" onClick={handleLogoutClick}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="login-section" onClick={handleUserClick} title="Click to login">
              <div className="login-icon-circle">
                <FaUser className="user-icon" />
              </div>
              <span className="login-label">Login</span>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="menu-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <div className="header-wave">      </div>
    </header>

      {showLogoutConfirm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(5px)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#ffffff", padding: "30px", borderRadius: "16px", width: "90%", maxWidth: "400px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", textAlign: "center", fontFamily: "sans-serif" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#0f172a", fontSize: "1.5rem", fontWeight: "bold" }}>Confirm Logout</h3>
            <p style={{ margin: "0 0 25px 0", color: "#475569", fontSize: "1rem" }}>Are you sure you want to log out of your account?</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <button onClick={() => setShowLogoutConfirm(false)} style={{ padding: "12px 24px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#334155", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                Cancel
              </button>
              <button onClick={confirmLogout} style={{ padding: "12px 24px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;