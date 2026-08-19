import React, { useState, useEffect, useRef } from "react";
import "./VideoFeed.css";
import io from "socket.io-client";
import { auth, db } from "../firebase/config";
import { collection, addDoc, serverTimestamp, doc, setDoc, increment } from "firebase/firestore";
import { alarmSynth } from "../utils/audioTools";

function VideoFeed({ setDrowsy, setAlertMsg, setCurrentEar, setCurrentMar }) {
  const [isDetectionActive, setIsDetectionActive] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState("normal");
  const [performanceMetrics, setPerformanceMetrics] = useState({ fps: 0, latency: 0 });
  const [showOverlay, setShowOverlay] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const lastDrowsyTime = useRef(0);
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const drowsyCounter = useRef(0);
  const latestFrameRef = useRef(null);

  // Track Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      userRef.current = u; // Keep ref updated
      console.log("Auth state changed, user:", u ? u.uid : "None");
    });
    return () => unsubscribe();
  }, []);

  // Initialize Socket.IO
  useEffect(() => {
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? "http://127.0.0.1:5000"
      : "https://driver-drowsiness-detection-system-production.up.railway.app";
    socketRef.current = io(backendUrl, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("Connected to backend socket");
    });

    socketRef.current.on("response", (data) => {
      const receiveTime = Date.now();
      if (data.error) {
        console.error("Backend error:", data.error);
        return;
      }

      setFaceDetected(data.face_detected);
      
      // Calculate Latency and FPS
      if (data.timestamp) {
        const latency = receiveTime - data.timestamp;
        setPerformanceMetrics(prev => {
          const now = Date.now();
          const fps = 1000 / (now - (socketRef.current.lastResponseTime || now - 200));
          socketRef.current.lastResponseTime = now;
          return { fps: Math.round(fps * 10) / 10, latency };
        });
      }
      
      if (!data.face_detected) {
        setDetectionStatus("inactive");
        setAlertMsg("Waiting for Face...");
        drowsyCounter.current = 0;
        setDrowsy(false);
        if (setCurrentEar) setCurrentEar(0);
        if (setCurrentMar) setCurrentMar(0);
      } else {
        if (setCurrentEar && data.ear !== undefined) setCurrentEar(data.ear);
        if (setCurrentMar && data.mar !== undefined) setCurrentMar(data.mar);
        
        if (data.drowsy || data.warning) {
          drowsyCounter.current += 1;
          // Require 3 consecutive frames (~600ms) to trigger alert
          if (drowsyCounter.current >= 3) {
            const type = data.drowsy ? "critical" : "warning";
            const icon = data.drowsy ? "🚨" : "⚠️";
            const label = data.drowsy ? "DROWSY" : "WARNING";
            
            setDetectionStatus(type);
            setAlertMsg(`${icon} ${label}! [${data.reasons.join(", ")}]`);
            setDrowsy(data.drowsy); // Usually triggers the loud alarm
            handleDetectionEvent(data, type, latestFrameRef.current);
          }
        } else {
          drowsyCounter.current = 0;
          setDetectionStatus("normal");
          setAlertMsg("✅ Driver Alert & Focused");
          setDrowsy(false);
        }
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [setDrowsy, setAlertMsg, setCurrentEar, setCurrentMar]);

  // Handle Drowsy Detection (Alarm + Firestore + local frame save)
  const handleDetectionEvent = async (data, type, frameImage) => {
    // Play alarm sounds
    if (type === "critical") {
      const selectedSound = localStorage.getItem("drowsiness_alarm_sound") || "Buzzer";
      alarmSynth.playAlert(selectedSound);
    } else if (type === "warning") {
      const selectedSound = localStorage.getItem("warning_alarm_sound") || "Gentle Alert";
      alarmSynth.playAlert(selectedSound);
    }

    // Save to localStorage for the guest/recent display page
    const alertData = {
      timestamp: new Date().toISOString(),
      status: type,
      reasons: data.reasons,
      ear: data.ear,
      mar: data.mar,
      pitch: data.pitch || 0,
      yaw: data.yaw || 0,
      image: frameImage
    };
    localStorage.setItem("napguard_last_alert", JSON.stringify(alertData));

    // Save to Firestore every 3 seconds to avoid spamming
    const now = Date.now();
    const currentUser = userRef.current;
    
    if (currentUser && now - lastDrowsyTime.current > 3000) {
      lastDrowsyTime.current = now;
      console.log(`%c Saving ${type.toUpperCase()} event for user: ${currentUser.uid}`, 'background: #222; color: #bada55');
      
      try {
        const detectionData = {
          userId: currentUser.uid,
          timestamp: serverTimestamp(),
          status: type,
          reasons: data.reasons,
          ear: data.ear,
          mar: data.mar,
          pitch: data.pitch || 0,
          yaw: data.yaw || 0,
          image: frameImage
        };

        await addDoc(collection(db, "detections"), detectionData);

        // Also update the statistics collection for the user
        const statsRef = doc(db, "statistics", currentUser.uid);
        await setDoc(statsRef, {
          userId: currentUser.uid,
          totalAlerts: increment(1),
          lastDetectionTime: serverTimestamp(),
          lastReason: data.reasons.join(", ")
        }, { merge: true });

        console.log("✅ Detection successfully saved to Firestore");
      } catch (e) {
        console.error("❌ Firestore Save Error:", e);
      }
    } else if (!currentUser) {
      console.warn("⚠️ Detection occurred but NO USER is logged in. Please login to save data.");
    }
  };

  // Start/Stop Camera
  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    if (isDetectionActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [isDetectionActive]);

  // Frame Capture Loop
  useEffect(() => {
    let intervalId;

    if (isDetectionActive && socketRef.current) {
      intervalId = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const videoWidth = videoRef.current.videoWidth;
          const videoHeight = videoRef.current.videoHeight;
          
          let targetWidth = 640;
          let targetHeight = 480;

          if (videoWidth && videoHeight) {
            const maxDim = 640;
            if (videoWidth > videoHeight) {
              if (videoWidth > maxDim) {
                targetWidth = maxDim;
                targetHeight = Math.round((videoHeight * maxDim) / videoWidth);
              } else {
                targetWidth = videoWidth;
                targetHeight = videoHeight;
              }
            } else {
              if (videoHeight > maxDim) {
                targetHeight = maxDim;
                targetWidth = Math.round((videoWidth * maxDim) / videoHeight);
              } else {
                targetWidth = videoWidth;
                targetHeight = videoHeight;
              }
            }
          }

          if (canvasRef.current.width !== targetWidth || canvasRef.current.height !== targetHeight) {
            canvasRef.current.width = targetWidth;
            canvasRef.current.height = targetHeight;
          }

          const context = canvasRef.current.getContext("2d");
          context.drawImage(videoRef.current, 0, 0, targetWidth, targetHeight);
          const imageData = canvasRef.current.toDataURL("image/jpeg", 0.5);
          latestFrameRef.current = imageData;
          
          const earThreshVal = localStorage.getItem("ear_threshold");
          const marThreshVal = localStorage.getItem("mar_threshold");
          const earThresh = earThreshVal !== null ? parseFloat(earThreshVal) : 0.21;
          const marThresh = marThreshVal !== null ? parseFloat(marThreshVal) : 0.60;
          
          socketRef.current.emit("image", {
            image: imageData,
            timestamp: Date.now(),
            ear_threshold: earThresh,
            mar_threshold: marThresh
          });
        }
      }, 200); // 5 FPS
    }

    return () => clearInterval(intervalId);
  }, [isDetectionActive]);

  return (
    <div className="video-monitor">
      <div className="monitor-header">
        <h3>Live Driver Monitoring</h3>
        <div className="header-controls">
          <button 
            className={`detection-btn ${isDetectionActive ? 'active' : ''}`}
            onClick={() => setIsDetectionActive(!isDetectionActive)}
          >
            <span className="detection-indicator"></span>
            {isDetectionActive ? 'Stop Detection' : 'Start Detection'}
          </button>
          <button className="overlay-btn" onClick={() => setShowOverlay(!showOverlay)}>
            {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
          </button>
        </div>
      </div>
      
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="video-feed"
          style={{ transform: "scaleX(-1)" }} // Mirror effect
        />
        <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
        
        {showOverlay && (
          <div className="video-overlay">
            <div className="overlay-top">
              <div className={`status-indicator ${detectionStatus} ${!isDetectionActive ? 'inactive' : ''}`}>
                {!isDetectionActive && "🔴 System Inactive"}
                {isDetectionActive && !faceDetected && "🟠 Searching for Face..."}
                {isDetectionActive && faceDetected && detectionStatus === "normal" && "✅ Driver Alert"}
                {isDetectionActive && faceDetected && detectionStatus === "warning" && "⚠️ Distraction or Pre-Drowsiness!"}
                {isDetectionActive && faceDetected && detectionStatus === "critical" && "🚨 Drowsiness Detected!"}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="video-controls">
        <div className="system-status">
          <div className={`detection-status ${isDetectionActive ? 'active' : 'inactive'}`}>
            <span className="status-dot"></span>
            Detection: {isDetectionActive ? 'ACTIVE' : 'INACTIVE'}
          </div>
          {isDetectionActive && (
            <div className="metrics-display">
              <span className="metric-item">FPS: <strong>{performanceMetrics.fps}</strong></span>
              <span className="metric-item">Latency: <strong>{performanceMetrics.latency}ms</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoFeed;