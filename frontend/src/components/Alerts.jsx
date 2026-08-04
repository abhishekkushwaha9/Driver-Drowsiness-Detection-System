import React, { useState, useEffect } from "react";
import "./Alerts.css";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Alerts = () => {
  const [filter, setFilter] = useState("all");
  const [muteAll, setMuteAll] = useState(false);
  const [alertsData, setAlertsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAlertsData([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "detections"),
        where("userId", "==", user.uid)
      );

      unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => {
            const timeA = a.timestamp?.toMillis() || 0;
            const timeB = b.timestamp?.toMillis() || 0;
            return timeB - timeA;
          })
          .map(docData => {
            const date = docData.timestamp?.toDate() || new Date();
            
            const type = docData.status || "critical";
            let title = "Drowsiness Detected!";
            let baseMsg = "signs of drowsiness";
            
            // Format reasons to be more readable
            const formattedReasons = (docData.reasons || [])
              .map(r => r.replace(/_/g, ' '))
              .join(', ') || "Unknown reason";

            if (type === "warning") {
              if (formattedReasons.includes("distracted")) {
                title = "Driver Distraction!";
                baseMsg = "distracted behavior";
              } else {
                title = "Driver Warning";
                baseMsg = "warning signs";
              }
            }
            
            return {
              id: docData.id,
              type: type,
              title: title,
              message: `System detected ${baseMsg}: ${formattedReasons}.`,
              time: date.toLocaleString(),
              read: false,
              actionRequired: type === "critical"
            };
          });
        
        setAlertsData(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching alerts:", error);
        setLoading(false);
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const filteredAlerts = filter === "all" 
    ? alertsData 
    : alertsData.filter(alert => alert.type === filter);

  const unreadCount = alertsData.filter(alert => !alert.read).length;
  const criticalCount = alertsData.filter(alert => alert.type === "critical" && !alert.read).length;

  const markAsRead = (id) => {
    // In a real app, update Firestore status
    console.log(`Marking alert ${id} as read`);
  };

  const clearAll = () => {
    console.log("Clearing all alerts");
  };

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div className="header-content">
          <h1>Alerts & Notifications</h1>
          <p>Monitor system alerts and driver notifications</p>
        </div>
        <div className="alert-stats">
          <div className="stat-item">
            <span className="stat-count">{unreadCount}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="stat-item critical">
            <span className="stat-count">{criticalCount}</span>
            <span className="stat-label">Critical</span>
          </div>
        </div>
      </div>

      <div className="alerts-controls">
        <div className="filter-buttons">
          <button 
            className={filter === "all" ? "active" : ""} 
            onClick={() => setFilter("all")}
          >
            All Alerts
          </button>
          <button 
            className={filter === "critical" ? "active" : ""} 
            onClick={() => setFilter("critical")}
          >
            Critical
          </button>
          <button 
            className={filter === "warning" ? "active" : ""} 
            onClick={() => setFilter("warning")}
          >
            Warnings
          </button>
          <button 
            className={filter === "info" ? "active" : ""} 
            onClick={() => setFilter("info")}
          >
            Info
          </button>
        </div>
        
        <div className="action-buttons">
          <button className="mute-btn" onClick={() => setMuteAll(!muteAll)}>
            {muteAll ? "🔔 Unmute All" : "🔕 Mute All"}
          </button>
          <button className="clear-btn" onClick={clearAll}>
            Clear All
          </button>
        </div>
      </div>

      <div className="alerts-list">
        {loading ? (
          <div className="no-alerts">
            <p>Loading your alerts...</p>
          </div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <div 
              key={alert.id} 
              className={`alert ${alert.type} ${alert.read ? "read" : "unread"}`}
            >
              <div className="alert-icon">
                {alert.type === "critical" && "🚨"}
                {alert.type === "warning" && "⚠️"}
                {alert.type === "info" && "ℹ️"}
                {alert.type === "success" && "✅"}
              </div>
              
              <div className="alert-content">
                <div className="alert-header">
                  <h3>{alert.title}</h3>
                  <span className="alert-time">{alert.time}</span>
                </div>
                <p>{alert.message}</p>
                
                {alert.actionRequired && (
                  <div className="action-required">
                    <span>Action Required</span>
                  </div>
                )}
              </div>
              
              <div className="alert-actions">
                {!alert.read && (
                  <button 
                    className="mark-read-btn"
                    onClick={() => markAsRead(alert.id)}
                  >
                    Mark as Read
                  </button>
                )}
                <button className="more-options">⋯</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-alerts">
            <div className="no-alerts-icon">📋</div>
            <h3>No alerts found</h3>
            <p>You're all caught up! No {filter !== "all" ? filter : ""} alerts to display.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;