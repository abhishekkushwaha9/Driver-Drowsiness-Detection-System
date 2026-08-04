import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import "./Statistics.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Statistics() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalAlerts: 0,
    safeScore: 100,
    topReason: "None",
    todayAlerts: 0
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Drowsiness Detections',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: '#3b82f6',
      borderWidth: 1,
      borderRadius: 4
    }]
  });
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
        const data = querySnapshot.docs.map(doc => doc.data()).sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });

        const totalAlerts = data.length;
        const today = new Date().toDateString();
        const todayAlerts = data.filter(d => d.timestamp && d.timestamp.toDate().toDateString() === today).length;
        
        const reasons = data.map(d => d.reasons || []).flat();
        const reasonCounts = reasons.reduce((acc, r) => {
          acc[r] = (acc[r] || 0) + 1;
          return acc;
        }, {});
        
        const topReason = Object.keys(reasonCounts).length > 0 
          ? Object.keys(reasonCounts).reduce((a, b) => reasonCounts[a] > reasonCounts[b] ? a : b)
          : "None";

        // Chart data aggregation
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        data.forEach(d => {
          const date = d.timestamp?.toDate();
          if (date) {
            const day = date.getDay(); // 0 is Sunday
            const index = day === 0 ? 6 : day - 1; // Mon-Sun
            dayCounts[index]++;
          }
        });

        setStats({
          totalSessions: Math.ceil(totalAlerts / 5) + 1,
          totalAlerts: totalAlerts,
          safeScore: Math.max(0, 100 - (totalAlerts * 2)),
          topReason: topReason.replace('_', ' '),
          todayAlerts: todayAlerts
        });

        setChartData(prev => ({
          ...prev,
          datasets: [{ ...prev.datasets[0], data: dayCounts }]
        }));

        setLoading(false);
      }, (error) => {
        console.error("Error fetching live stats:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    });

    return () => authUnsubscribe();
  }, []);

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h2>Driving Safety Analysis</h2>
        <p>Comprehensive breakdown of your monitoring sessions</p>
      </div>
      
      {!currentUser ? (
        <div className="no-history">
          <p>Please <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Login or Sign Up</Link> to view your safety statistics.</p>
        </div>
      ) : loading ? (
        <div className="no-history">Analyzing your data...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🛡️</div>
              <h3>Safety Score</h3>
              <p className="stat-value">{stats.safeScore}%</p>
              <span className="stat-label">Overall performance</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔔</div>
              <h3>Today's Alerts</h3>
              <p className="stat-value">{stats.todayAlerts}</p>
              <span className="stat-label">Detected today</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <h3>Total Alerts</h3>
              <p className="stat-value">{stats.totalAlerts}</p>
              <span className="stat-label">All-time records</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <h3>Common Issue</h3>
              <p className="stat-value" style={{ fontSize: '1.4rem' }}>{stats.topReason}</p>
              <span className="stat-label">Point of concern</span>
            </div>
          </div>

          <div className="chart-section">
            <div className="chart-card">
              <h3>Weekly Incident Trend</h3>
              <div className="chart-wrapper">
                <Bar 
                  data={chartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { 
                      y: { 
                        beginAtZero: true, 
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#6b7280', stepSize: 1 }
                      },
                      x: {
                        grid: { display: false },
                        ticks: { color: '#6b7280' }
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Statistics;
