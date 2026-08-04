import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { db, auth } from "../firebase/config";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Link } from "react-router-dom";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    lastTime: "Never",
    accuracy: 94
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Drowsiness Detections',
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(244, 67, 54, 0.6)',
    }]
  });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    let unsubscribeSnapshot;

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

      unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
        const detections = querySnapshot.docs.map(doc => doc.data()).sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });

        const total = detections.length;
        const todayCount = detections.filter(d => {
          const dDate = d.timestamp?.toDate();
          const today = new Date();
          return dDate && dDate.toDateString() === today.toDateString();
        }).length;

        const lastTime = detections.length > 0 && detections[0].timestamp
          ? detections[0].timestamp.toDate().toLocaleString()
          : "Never";

        setStats(prev => ({ ...prev, total, today: todayCount, lastTime }));

        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        detections.forEach(d => {
          const date = d.timestamp?.toDate();
          if (date) {
            const day = date.getDay();
            const index = day === 0 ? 6 : day - 1;
            dayCounts[index]++;
          }
        });

        setChartData(prev => ({
          ...prev,
          datasets: [{ ...prev.datasets[0], data: dayCounts }]
        }));

        setLoading(false);
      }, (error) => {
        console.error("Error fetching live dashboard data:", error);
        setLoading(false);
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Driver Statistics Dashboard</h1>
        <p>Your driving safety overview</p>
      </div>

      {!currentUser ? (
        <div className="no-history" style={{ textAlign: 'center', padding: '5rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', marginTop: '2rem' }}>
          <p>Please <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Login or Sign Up</Link> to view your live analytics dashboard.</p>
        </div>
      ) : loading ? (
        <div className="no-history" style={{ textAlign: 'center', padding: '5rem' }}>Loading your data...</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="card-icon">🚨</div>
              <h3>Total Alerts</h3>
              <p className="stat-number">{stats.total}</p>
            </div>

            <div className="stat-card">
              <div className="card-icon">📅</div>
              <h3>Today's Alerts</h3>
              <p className="stat-number">{stats.today}</p>
            </div>

            <div className="stat-card">
              <div className="card-icon">⏱️</div>
              <h3>Last Detection</h3>
              <p className="stat-text">{stats.lastTime}</p>
            </div>

            <div className="stat-card">
              <div className="card-icon">👁️</div>
              <h3>Safety Score</h3>
              <p className="stat-number">{Math.max(0, 100 - (stats.total * 2))}%</p>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="content-card full-width">
              <h3>Weekly Drowsiness Trends</h3>
              <div style={{ height: '300px' }}>
                <Bar
                  data={chartData}
                  options={{
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
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

export default Dashboard;