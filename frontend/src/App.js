import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  const [drowsy, setDrowsy] = useState(false);
  const [alertMsg, setAlertMsg] = useState("System Ready");

  const basename = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/'
    : '/Driver-Drowsiness-Detection-System';

  return (
    <Router basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Header />
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/detection" replace />} />
          <Route
            path="/detection"
            element={
              <>
                <VideoFeed setDrowsy={setDrowsy} setAlertMsg={setAlertMsg} />
                <Status drowsy={drowsy} alertMsg={alertMsg} />
              </>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/last-alert" element={<LastAlert />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
  