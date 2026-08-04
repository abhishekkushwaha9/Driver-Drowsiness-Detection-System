import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaExclamationTriangle, 
  FaRegClock, 
  FaCheckCircle, 
  FaCoffee, 
  FaBed, 
  FaWind, 
  FaTrashAlt, 
  FaChevronLeft,
  FaEye,
  FaGrimace,
  FaLocationArrow
} from "react-icons/fa";
import "./LastAlert.css";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

function LastAlert() {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const location = useLocation();

  // Load from localStorage or check for mock query param on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("mock") === "true") {
      setAlert({
        timestamp: new Date().toISOString(),
        status: "critical",
        reasons: ["eyes_closed_prolonged", "yawning"],
        ear: 0.145,
        mar: 0.712,
        pitch: -18.5,
        yaw: 4.2,
        image: "/mock_sleepy_driver.png"
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const q = query(
            collection(db, "detections"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            setAlert({
              timestamp: docData.timestamp?.toDate().toISOString() || new Date().toISOString(),
              status: docData.status,
              reasons: docData.reasons,
              ear: docData.ear,
              mar: docData.mar,
              pitch: docData.pitch,
              yaw: docData.yaw,
              image: docData.image || null
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error fetching last alert from Firestore:", e);
        }
      }

      // Fallback to localStorage if guest user or query has no results
      const localData = localStorage.getItem("napguard_last_alert");
      if (localData) {
        try {
          setAlert(JSON.parse(localData));
        } catch (e) {
          console.error("Error parsing local alert data:", e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [location.search]);

  const clearLastAlert = () => {
    if (window.confirm("Are you sure you want to clear the last alert logs?")) {
      localStorage.removeItem("napguard_last_alert");
      setAlert(null);
    }
  };

  // Thresholds
  const EAR_THRESH = 0.21;
  const MAR_THRESH = 0.6;

  // Helper for formatting date
  const formatDate = (isoStr) => {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    return date.toLocaleString();
  };

  return (
    <div className="last-alert-container">
      <div className="back-link-wrapper">
        <Link to="/detection" className="back-link">
          <FaChevronLeft /> Back to Monitor
        </Link>
      </div>

      <div className="last-alert-header">
        <h2>Last Incident Insight</h2>
        <p>Detailed analysis and telemetry of your last drowsiness/distraction event</p>
      </div>

      {loading ? (
        <div className="no-alert-card">
          <div className="secure-icon animate-pulse-green">🔄</div>
          <h3>Syncing with Firebase...</h3>
          <p>Retrieving your latest driver telemetry reports from the cloud database.</p>
        </div>
      ) : !alert ? (
        <div className="no-alert-card animate-pulse-green">
          <div className="secure-icon">🛡️</div>
          <h3>System Secure</h3>
          <p>No drowsiness or distraction incidents recorded in this session. Safe travels!</p>
          <div className="no-alert-actions">
            <Link to="/detection" className="action-btn-green">
              Start Live Monitoring
            </Link>
            <Link to="/last-alert?mock=true" className="action-btn-demo">
              Preview Demo Telemetry
            </Link>
          </div>
        </div>
      ) : (
        <div className="alert-content-grid">
          {/* Status and Summary Card */}
          <div className="summary-card glass">
            <div className={`status-banner ${alert.status}`}>
              <FaExclamationTriangle className="alert-icon-main" />
              <div>
                <h3>{alert.status === "critical" ? "CRITICAL DROWSINESS" : "DRIVER DISTRACTION WARNING"}</h3>
                <span className="timestamp-badge">
                  <FaRegClock /> {formatDate(alert.timestamp)}
                </span>
              </div>
            </div>

            {/* Captured Incident Frame */}
            {alert.image && (
              <div className="incident-image-container">
                <div className="incident-image-wrapper">
                  <img src={alert.image} alt="Driver status at trigger time" className="incident-image" />
                  <div className={`image-badge-label ${alert.status}`}>
                    {alert.status === "critical" ? "🚨 DROWSINESS TRIGGER" : "⚠️ DISTRACTION TRIGGER"}
                  </div>
                </div>
              </div>
            )}

            <div className="reasons-box">
              <h4>Trigger Reason(s):</h4>
              <div className="reason-tags">
                {alert.reasons && alert.reasons.length > 0 ? (
                  alert.reasons.map((reason, idx) => (
                    <span key={idx} className="reason-tag-alert">
                      {reason.replace(/_/g, " ").toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="reason-tag-alert">GENERAL ALERT</span>
                )}
              </div>
            </div>

            <div className="summary-text-block">
              <p>
                The system detected a change in your facial landmarks indicating potential fatigue or lack of focus. 
                Below is the exact telemetry recorded at that moment.
              </p>
            </div>

            <button className="clear-btn" onClick={clearLastAlert}>
              <FaTrashAlt /> Clear Alert Log
            </button>
          </div>

          {/* Telemetry and Gauges Card */}
          <div className="telemetry-card glass">
            <h3>Incident Telemetry</h3>
            
            <div className="metrics-gauges">
              {/* EAR Metric */}
              <div className="metric-gauge-item">
                <div className="metric-icon-title">
                  <FaEye className="metric-icon color-ear" />
                  <div>
                    <span className="metric-label">Eye Aspect Ratio (EAR)</span>
                    <span className="metric-threshold">Threshold: &lt; {EAR_THRESH}</span>
                  </div>
                </div>
                <div className="gauge-track-container">
                  <div className="gauge-label-value">
                    <span className={alert.ear < EAR_THRESH ? "value-fail" : "value-pass"}>
                      {alert.ear !== undefined ? alert.ear.toFixed(3) : "N/A"}
                    </span>
                    <span>{alert.ear < EAR_THRESH ? "❌ Closed/Drowsy" : "✅ Alert"}</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${alert.ear < EAR_THRESH ? "bg-fail" : "bg-pass"}`}
                      style={{ width: `${Math.min(100, (alert.ear || 0) * 200)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* MAR Metric */}
              <div className="metric-gauge-item">
                <div className="metric-icon-title">
                  <FaGrimace className="metric-icon color-mar" />
                  <div>
                    <span className="metric-label">Mouth Aspect Ratio (MAR)</span>
                    <span className="metric-threshold">Threshold: &gt; {MAR_THRESH}</span>
                  </div>
                </div>
                <div className="gauge-track-container">
                  <div className="gauge-label-value">
                    <span className={alert.mar > MAR_THRESH ? "value-fail" : "value-pass"}>
                      {alert.mar !== undefined ? alert.mar.toFixed(3) : "N/A"}
                    </span>
                    <span>{alert.mar > MAR_THRESH ? "❌ Yawning" : "✅ Normal"}</span>
                  </div>
                  <div className="bar-track">
                    <div 
                      className={`bar-fill ${alert.mar > MAR_THRESH ? "bg-fail" : "bg-pass"}`}
                      style={{ width: `${Math.min(100, (alert.mar || 0) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Head Pose Pitch & Yaw */}
              <div className="metric-gauge-item">
                <div className="metric-icon-title">
                  <FaLocationArrow className="metric-icon color-pose" style={{ transform: `rotate(${alert.yaw || 0}deg)` }} />
                  <div>
                    <span className="metric-label">Head Orientation (Pitch / Yaw)</span>
                    <span className="metric-threshold">Limits: Pitch &lt; -15° | Yaw &gt; ±20°</span>
                  </div>
                </div>
                
                <div className="pose-details-row">
                  <div className="pose-metric-box">
                    <span className="pose-label">Pitch (Look Up/Down)</span>
                    <span className={`pose-value ${alert.pitch < -15 ? "value-fail" : "value-pass"}`}>
                      {alert.pitch !== undefined ? `${alert.pitch}°` : "0.0°"}
                    </span>
                    <span className="pose-sub">
                      {alert.pitch < -15 ? "Looking Down 📱" : "Focused"}
                    </span>
                  </div>
                  
                  <div className="pose-metric-box">
                    <span className="pose-label">Yaw (Look Left/Right)</span>
                    <span className={`pose-value ${Math.abs(alert.yaw || 0) > 20 ? "value-fail" : "value-pass"}`}>
                      {alert.yaw !== undefined ? `${alert.yaw}°` : "0.0°"}
                    </span>
                    <span className="pose-sub">
                      {Math.abs(alert.yaw || 0) > 20 ? "Looking Away 🧭" : "Focused"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="recommendations-card-full glass">
            <h3>Recommended Driver Recovery Actions</h3>
            <p className="recommendations-intro">
              Based on the alert severity <strong>({alert.status?.toUpperCase()})</strong>, we recommend taking the following actions immediately to ensure road safety:
            </p>

            <div className="recovery-cards-grid">
              <div className="recovery-action-card">
                <div className="rec-icon-bg col-coffee">
                  <FaCoffee className="rec-icon" />
                </div>
                <h4>Take a Caffeine Break</h4>
                <p>Pull over and have a coffee or energy drink. Caffeine takes about 15-20 minutes to kick in and can provide short-term alertness.</p>
              </div>

              <div className="recovery-action-card">
                <div className="rec-icon-bg col-sleep">
                  <FaBed className="rec-icon" />
                </div>
                <h4>Power Nap (Recommended)</h4>
                <p>A short 15 to 20-minute power nap is the most effective way to restore driver alertness and reduce sleepiness on long trips.</p>
              </div>

              <div className="recovery-action-card">
                <div className="rec-icon-bg col-air">
                  <FaWind className="rec-icon" />
                </div>
                <h4>Increase Ventilation</h4>
                <p>Roll down the windows or direct cold AC air towards your face. Fresh air and temperature drops help stimulate wakefulness temporary.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LastAlert;
