import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import "./History.css";

function History() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "detections"),
        where("userId", "==", user.uid)
      );
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });
        setDetections(data);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching live history:", error);
        setLoading(false);
      });

      // We attach the data unsubscribe to be cleaned up
      return () => unsubscribe();
    });

    return () => authUnsubscribe();
  }, []);

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Detection History</h2>
        <p>Review your previous monitoring sessions and alerts</p>
      </div>

      {!currentUser ? (
        <div className="no-history">
          <p>Please <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Login or Sign Up</Link> to view your history records.</p>
        </div>
      ) : loading ? (
        <div className="no-history">Loading history records...</div>
      ) : detections.length > 0 ? (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Details</th>
                <th>Metrics</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((item) => {
                const date = item.timestamp?.toDate() || new Date();
                return (
                  <tr key={item.id}>
                    <td>{date.toLocaleDateString()}</td>
                    <td>{date.toLocaleTimeString()}</td>
                    <td>
                      <span className={`status-${item.status?.toLowerCase()}`}>
                        {item.status?.toUpperCase() || 'ALERT'}
                      </span>
                    </td>
                    <td>
                      <div className="reasons-list">
                        {item.reasons && item.reasons.length > 0 ? (
                          item.reasons.map((r, i) => (
                            <span key={i} className="reason-tag">{r.replace('_', ' ')}</span>
                          ))
                        ) : (
                          <span className="reason-tag">Incident</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="metrics-text">
                        EAR: {item.ear?.toFixed(2) || 'N/A'} | MAR: {item.mar?.toFixed(2) || 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-history">
          <p>No detection history found yet. Start driving safely!</p>
        </div>
      )}
    </div>
  );
}

export default History;
