import React from "react";
import { Link } from "react-router-dom";
import { 
  FaVideo, 
  FaEye, 
  FaGrimace, 
  FaChartBar, 
  FaShieldAlt, 
  FaRoad, 
  FaCheck,
  FaArrowRight
} from "react-icons/fa";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge animate-pulse-badge">
          <span>🛡️ Next-Gen Driver Safety Console</span>
        </div>
        <h1 className="hero-title">
          NapGuard AI Detection
        </h1>
        <p className="hero-subtitle">
          Real-time computerized vision tracking drowsiness, yawns, and distraction patterns using local neural processing to prevent road accidents.
        </p>
        <div className="hero-actions">
          <Link to="/detection" className="btn-primary-glow">
            Launch Detection Console <FaArrowRight />
          </Link>
          <Link to="/last-alert?mock=true" className="btn-secondary-glass">
            Preview Telemetry Demo
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="features-section">
        <h2 className="section-title">Computer Vision Metrics</h2>
        <div className="features-grid">
          <div className="feature-card glass">
            <div className="icon-wrapper bg-eye">
              <FaEye className="feature-icon text-eye" />
            </div>
            <h3>Eye Aspect Ratio (EAR)</h3>
            <p>Monitors driver blink frequencies and prolonged eye closure states using 12 custom mesh vectors to detect micro-sleep incidents.</p>
          </div>

          <div className="feature-card glass">
            <div className="icon-wrapper bg-yawn">
              <FaGrimace className="feature-icon text-yawn" />
            </div>
            <h3>Mouth Aspect Ratio (MAR)</h3>
            <p>Evaluates vertical lip distance ratios to detect yawning. Triggers pre-drowsiness warning states dynamically.</p>
          </div>

          <div className="feature-card glass">
            <div className="icon-wrapper bg-pose">
              <FaRoad className="feature-icon text-pose" />
            </div>
            <h3>Head Orientation (Yaw/Pitch)</h3>
            <p>Calculates head tilt and direction coordinates. Triggers alerts when driver is looking down at a mobile device or away from the road.</p>
          </div>

          <div className="feature-card glass">
            <div className="icon-wrapper bg-cloud">
              <FaChartBar className="feature-icon text-cloud" />
            </div>
            <h3>Cloud Analytics Sync</h3>
            <p>Integrates directly with Firebase Firestore to log incidents, metrics, and captured trigger screenshots for post-drive review.</p>
          </div>
        </div>
      </section>

      {/* Overview Stats Panel */}
      <section className="stats-section glass">
        <div className="stats-header">
          <h2>NapGuard Core Performance</h2>
          <p>Highly optimized models running client-side at maximum efficiency</p>
        </div>
        <div className="landing-stats-grid">
          <div className="landing-stat-box">
            <span className="stat-num">&lt; 150ms</span>
            <span className="stat-desc">Processing Latency</span>
          </div>
          <div className="landing-stat-box">
            <span className="stat-num">5 FPS</span>
            <span className="stat-desc">Inference Frequency</span>
          </div>
          <div className="landing-stat-box">
            <span className="stat-num">94.8%</span>
            <span className="stat-desc">Model Accuracy</span>
          </div>
          <div className="landing-stat-box">
            <span className="stat-num">100%</span>
            <span className="stat-desc">Privacy Protected</span>
          </div>
        </div>
      </section>

      {/* Tech Stack Banner */}
      <section className="tech-stack-section">
        <h4>Powered by Open-Source Technology Stack</h4>
        <div className="tech-logos">
          <div className="tech-logo">React</div>
          <div className="tech-logo">Flask</div>
          <div className="tech-logo">Socket.IO</div>
          <div className="tech-logo">MediaPipe</div>
          <div className="tech-logo">OpenCV</div>
        </div>
      </section>
    </div>
  );
}

export default Landing;
