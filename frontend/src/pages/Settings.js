import React, { useState } from "react";
import "./Settings.css";
import { alarmSynth } from "../utils/audioTools";

function Settings() {
  const [alarmSound, setAlarmSound] = useState(() => {
    return localStorage.getItem("drowsiness_alarm_sound") || "Buzzer";
  });

  const [earThreshold, setEarThreshold] = useState(() => {
    const saved = localStorage.getItem("ear_threshold");
    return saved !== null ? parseFloat(saved) : 0.21;
  });

  const [marThreshold, setMarThreshold] = useState(() => {
    const saved = localStorage.getItem("mar_threshold");
    return saved !== null ? parseFloat(saved) : 0.60;
  });

  const handleSoundChange = (e) => {
    const newSound = e.target.value;
    setAlarmSound(newSound);
    localStorage.setItem("drowsiness_alarm_sound", newSound);
    
    // Preview the sound
    alarmSynth.playAlert(newSound);
  };

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
    if (window.confirm("Are you sure you want to reset all detection preferences to defaults?")) {
      setAlarmSound("Buzzer");
      setEarThreshold(0.21);
      setMarThreshold(0.60);
      localStorage.setItem("drowsiness_alarm_sound", "Buzzer");
      localStorage.setItem("ear_threshold", 0.21);
      localStorage.setItem("mar_threshold", 0.60);
    }
  };

  return (
    <div className="settings-container">
      <h2>App Settings</h2>
      <div className="settings-card">
        <h3>Detection Preferences</h3>
        <p className="card-description">
          Tune the face aspect ratio sensitivity thresholds and alerts to suit your environment and personal needs.
        </p>

        <div className="setting-item-group">
          <div className="setting-item-header">
            <span>Eye Aspect Ratio (EAR) Threshold</span>
            <span className="value-badge ear-badge">{earThreshold.toFixed(2)}</span>
          </div>
          <div className="setting-item-control">
            <input
              type="range"
              min="0.10"
              max="0.40"
              step="0.01"
              value={earThreshold}
              onChange={handleEarChange}
              className="settings-slider"
            />
          </div>
          <p className="setting-hint">
            Triggers drowsiness alerts when the eye aspect ratio falls below this value (indicating closed eyes).
            A lower threshold requires eyes to be closed longer/more fully, whereas a higher threshold makes detection more sensitive. (Default: 0.21)
          </p>
        </div>

        <div className="setting-item-group">
          <div className="setting-item-header">
            <span>Mouth Aspect Ratio (MAR) Threshold</span>
            <span className="value-badge mar-badge">{marThreshold.toFixed(2)}</span>
          </div>
          <div className="setting-item-control">
            <input
              type="range"
              min="0.30"
              max="0.90"
              step="0.01"
              value={marThreshold}
              onChange={handleMarChange}
              className="settings-slider"
            />
          </div>
          <p className="setting-hint">
            Triggers yawning warnings when the mouth aspect ratio exceeds this value.
            A lower threshold triggers yawning alerts more easily (more sensitive), whereas a higher threshold requires wider yawning to trigger. (Default: 0.60)
          </p>
        </div>

        <div className="setting-item">
          <span>Alarm Sound</span>
          <select value={alarmSound} onChange={handleSoundChange}>
            <option value="Buzzer">Buzzer</option>
            <option value="Gentle Alert">Gentle Alert</option>
            <option value="Loud Warning">Loud Warning</option>
          </select>
        </div>

        <div className="settings-footer">
          <button className="reset-defaults-btn" onClick={handleResetDefaults}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
