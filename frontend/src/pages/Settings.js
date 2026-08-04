import React, { useState, useEffect } from "react";
import "./Settings.css";
import { alarmSynth } from "../utils/audioTools";

function Settings() {
  const [alarmSound, setAlarmSound] = useState(() => {
    return localStorage.getItem("drowsiness_alarm_sound") || "Buzzer";
  });

  const handleSoundChange = (e) => {
    const newSound = e.target.value;
    setAlarmSound(newSound);
    localStorage.setItem("drowsiness_alarm_sound", newSound);
    
    // Preview the sound
    alarmSynth.playAlert(newSound);
  };

  return (
    <div className="settings-container">
      <h2>App Settings</h2>
      <div className="settings-card">
        <h3>Detection Preferences</h3>
        <div className="setting-item">
          <span>Sensitivity Threshold</span>
          <input type="range" min="0" max="1" step="0.01" defaultValue="0.21" />
        </div>
        <div className="setting-item">
          <span>Alarm Sound</span>
          <select value={alarmSound} onChange={handleSoundChange}>
            <option value="Buzzer">Buzzer</option>
            <option value="Gentle Alert">Gentle Alert</option>
            <option value="Loud Warning">Loud Warning</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default Settings;
