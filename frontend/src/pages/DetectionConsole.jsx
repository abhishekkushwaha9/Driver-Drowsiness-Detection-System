import React, { useState } from "react";
import VideoFeed from "../components/VideoFeed";
import Status from "../components/Status";
import "./DetectionConsole.css";
import { FaSlidersH, FaEye, FaGrimace, FaUndoAlt } from "react-icons/fa";

function DetectionConsole() {
  const [drowsy, setDrowsy] = useState(false);
  const [alertMsg, setAlertMsg] = useState("System Ready");
  const [currentEar, setCurrentEar] = useState(0);
  const [currentMar, setCurrentMar] = useState(0);

  const [earThreshold, setEarThreshold] = useState(() => {
    const saved = localStorage.getItem("ear_threshold");
    return saved !== null ? parseFloat(saved) : 0.21;
  });

  const [marThreshold, setMarThreshold] = useState(() => {
    const saved = localStorage.getItem("mar_threshold");
    return saved !== null ? parseFloat(saved) : 0.60;
  });

  const handleEarChange = (e) => {
    const newEar = parseFloat(e.target.value);
    setEarThreshold(newEar);
    localStorage.setItem("ear_threshold", newEar);
  };

  const handleMarChange = (e) => {
    const newMar = parseFloat(e.target.value);
    setMarThreshold(newMar);
    localStorage.setItem("mar_threshold", newMar);
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all calibration thresholds to defaults?")) {
      setEarThreshold(0.21);
      setMarThreshold(0.60);
      localStorage.setItem("ear_threshold", 0.21);
      localStorage.setItem("mar_threshold", 0.60);
    }
  };

  return (
    <div className="console-container">
      <div className="console-header">
        <h2>NapGuard Safety Console</h2>
        <p>Real-time computer vision driver state tracking and sensitivity calibration</p>
      </div>

      <div className="console-layout">
        {/* Live Camera Stream */}
        <div className="console-main">
          <VideoFeed 
            setDrowsy={setDrowsy} 
            setAlertMsg={setAlertMsg} 
            setCurrentEar={setCurrentEar} 
            setCurrentMar={setCurrentMar} 
          />
        </div>

        {/* Telemetry and Settings Panel */}
        <div className="console-sidebar">
          {/* Live Alert Status Card */}
          <Status drowsy={drowsy} alertMsg={alertMsg} />

          {/* Calibration Settings Card */}
          <div className="calibration-card">
            <div className="calibration-card-header">
              <FaSlidersH className="card-header-icon" />
              <div>
                <h3>Sensitivity Calibration</h3>
                <p>Fine-tune thresholds for eye and mouth aspect ratios</p>
              </div>
            </div>

            {/* Eye Aspect Ratio (EAR) Controls */}
            <div className="calibration-group">
              <div className="calibration-group-title">
                <FaEye className="group-icon text-ear" />
                <span>Eye Aspect Ratio (EAR) Threshold</span>
                <span className="badge badge-ear">{earThreshold.toFixed(2)}</span>
              </div>

              {/* Real-time telemetry gauge */}
              <div className="telemetry-gauge">
                <div className="gauge-info">
                  <span>Live EAR: <strong className={currentEar > 0 && currentEar < earThreshold ? "value-warn" : "value-safe"}>
                    {currentEar > 0 ? currentEar.toFixed(3) : "Searching..."}
                  </strong></span>
                  {currentEar > 0 && currentEar < earThreshold && (
                    <span className="gauge-status-tag tag-warn">🚨 Eyes Closed</span>
                  )}
                </div>
                <div className="gauge-track">
                  <div 
                    className={`gauge-fill ${currentEar > 0 && currentEar < earThreshold ? "bg-warn" : "bg-safe"}`}
                    style={{ width: `${Math.min(100, currentEar * 250)}%` }}
                  ></div>
                  <div 
                    className="gauge-marker"
                    style={{ left: `${earThreshold * 250}%` }}
                    title="Alert Threshold"
                  ></div>
                </div>
              </div>

              <div className="slider-control">
                <input
                  type="range"
                  min="0.10"
                  max="0.40"
                  step="0.01"
                  value={earThreshold}
                  onChange={handleEarChange}
                  className="calibration-slider slider-ear"
                />
                <div className="slider-limits">
                  <span>0.10 (Less sensitive)</span>
                  <span>0.40 (More sensitive)</span>
                </div>
              </div>
              <p className="calibration-hint">
                Triggers drowsiness alert when driver's eye aspect ratio drops below threshold. Default: 0.21.
              </p>
            </div>

            {/* Mouth Aspect Ratio (MAR) Controls */}
            <div className="calibration-group">
              <div className="calibration-group-title">
                <FaGrimace className="group-icon text-mar" />
                <span>Mouth Aspect Ratio (MAR) Threshold</span>
                <span className="badge badge-mar">{marThreshold.toFixed(2)}</span>
              </div>

              {/* Real-time telemetry gauge */}
              <div className="telemetry-gauge">
                <div className="gauge-info">
                  <span>Live MAR: <strong className={currentMar > marThreshold ? "value-warn" : "value-safe"}>
                    {currentMar > 0 ? currentMar.toFixed(3) : "Searching..."}
                  </strong></span>
                  {currentMar > marThreshold && (
                    <span className="gauge-status-tag tag-warn">⚠️ Yawning Detected</span>
                  )}
                </div>
                <div className="gauge-track">
                  <div 
                    className={`gauge-fill ${currentMar > marThreshold ? "bg-warn" : "bg-safe"}`}
                    style={{ width: `${Math.min(100, currentMar * 100)}%` }}
                  ></div>
                  <div 
                    className="gauge-marker"
                    style={{ left: `${marThreshold * 100}%` }}
                    title="Alert Threshold"
                  ></div>
                </div>
              </div>

              <div className="slider-control">
                <input
                  type="range"
                  min="0.30"
                  max="0.90"
                  step="0.01"
                  value={marThreshold}
                  onChange={handleMarChange}
                  className="calibration-slider slider-mar"
                />
                <div className="slider-limits">
                  <span>0.30 (More sensitive)</span>
                  <span>0.90 (Less sensitive)</span>
                </div>
              </div>
              <p className="calibration-hint">
                Triggers yawning alerts when driver's mouth aspect ratio exceeds threshold. Default: 0.60.
              </p>
            </div>

            <div className="calibration-footer">
              <button className="btn-reset" onClick={handleResetDefaults}>
                <FaUndoAlt /> Reset Thresholds
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DetectionConsole;
