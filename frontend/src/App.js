import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase/config";
import "./App.css";

// Components
import Header from "./components/Header";
import VideoFeed from "./components/VideoFeed";
import Status from "./components/Status";
import Dashboard from "./components/Dashboard";
import  Login  from "./pages/Login";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import LastAlert from "./pages/LastAlert";
import Landing from "./pages/Landing";

function App() {
  const [drowsy, setDrowsy] = useState(false);
  const [alertMsg, setAlertMsg] = useState("System Ready");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Protected route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Public only route wrapper (e.g. login/signup shouldn't be accessible if logged in)
  const PublicRoute = ({ children }) => {
    if (user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#0f172a",
        color: "#3b82f6",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          border: "4px solid rgba(59, 130, 246, 0.1)",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          borderLeftColor: "#3b82f6",
          animation: "spin 1s linear infinite",
          marginBottom: "16px"
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <span>Loading Application...</span>
      </div>
    );
  }

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
          <Route
            path="/detection"
            element={
              <ProtectedRoute>
                <VideoFeed setDrowsy={setDrowsy} setAlertMsg={setAlertMsg} />
                <Status drowsy={drowsy} alertMsg={alertMsg} />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/last-alert" element={<ProtectedRoute><LastAlert /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
  