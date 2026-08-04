import React, { useState } from "react";
import "./Settings.css";

const Settings = () => {
  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    drowsinessSensitivity: 70,
    alarmVolume: 80,
    enableVoiceAlerts: true,
    enableVibration: true,
    autoSaveReports: false,
    detectionFrequency: 30,
    enableGPSLogging: false,
    emergencyContact: "",
    sleepDetection: true,
    distractionDetection: false,
    enableCamera: true,
    alertDuration: 10,
    enableAutoStart: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSave = () => {
    // Here you would typically send the settings to your backend
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      setSettings({
        darkMode: false,
        emailNotifications: true,
        drowsinessSensitivity: 70,
        alarmVolume: 80,
        enableVoiceAlerts: true,
        enableVibration: true,
        autoSaveReports: false,
        detectionFrequency: 30,
        enableGPSLogging: false,
        emergencyContact: "",
        sleepDetection: true,
        distractionDetection: false,
        enableCamera: true,
        alertDuration: 10,
        enableAutoStart: false
      });
      alert("Settings reset to default values.");
    }
  };

  return (
    <div className={`settings-page ${settings.darkMode ? "dark-mode" : ""}`}>
      <div className="settings-header">
        <h2>Driver Drowsiness Detection Settings</h2>
        <p>Configure your driver safety monitoring preferences</p>
      </div>

      <div className="settings-grid">
        {/* Detection Settings Card */}
        <div className="settings-card">
          <h3>Detection Settings</h3>
          
          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Drowsiness Sensitivity</span>
              <span className="value-display">{settings.drowsinessSensitivity}%</span>
            </div>
            <input
              type="range"
              name="drowsinessSensitivity"
              min="0"
              max="100"
              value={settings.drowsinessSensitivity}
              onChange={handleChange}
            />
            <div className="hint">How sensitive the system is to detecting drowsiness</div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Detection Frequency</span>
              <span className="value-display">{settings.detectionFrequency} seconds</span>
            </div>
            <input
              type="range"
              name="detectionFrequency"
              min="5"
              max="60"
              step="5"
              value={settings.detectionFrequency}
              onChange={handleChange}
            />
            <div className="hint">How often the system checks for drowsiness</div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Sleep Detection</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="sleepDetection"
                  checked={settings.sleepDetection}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Distraction Detection</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="distractionDetection"
                  checked={settings.distractionDetection}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Alert Settings Card */}
        <div className="settings-card">
          <h3>Alert Settings</h3>
          
          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Alarm Volume</span>
              <span className="value-display">{settings.alarmVolume}%</span>
            </div>
            <input
              type="range"
              name="alarmVolume"
              min="0"
              max="100"
              value={settings.alarmVolume}
              onChange={handleChange}
            />
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Alert Duration</span>
              <span className="value-display">{settings.alertDuration} seconds</span>
            </div>
            <input
              type="range"
              name="alertDuration"
              min="5"
              max="30"
              step="5"
              value={settings.alertDuration}
              onChange={handleChange}
            />
            <div className="hint">How long alerts remain active</div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Voice Alerts</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="enableVoiceAlerts"
                  checked={settings.enableVoiceAlerts}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Vibration Alerts</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="enableVibration"
                  checked={settings.enableVibration}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings Card */}
        <div className="settings-card">
          <h3>Notification Settings</h3>
          
          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Email Notifications</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-option">
            <span className="setting-label">Emergency Contact</span>
            <input
              type="text"
              name="emergencyContact"
              placeholder="Enter phone number"
              value={settings.emergencyContact}
              onChange={handleChange}
            />
            <div className="hint">Contact to notify in case of severe drowsiness</div>
          </div>
        </div>

        {/* System Settings Card */}
        <div className="settings-card">
          <h3>System Settings</h3>
          
          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Dark Mode</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={settings.darkMode}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Auto-save Detection Reports</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="autoSaveReports"
                  checked={settings.autoSaveReports}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable GPS Logging</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="enableGPSLogging"
                  checked={settings.enableGPSLogging}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="hint">Record location data during alerts</div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Enable Camera</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="enableCamera"
                  checked={settings.enableCamera}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="hint">Allow system to access camera for detection</div>
          </div>

          <div className="setting-option">
            <div className="setting-header-row">
              <span className="setting-label">Auto-start on Device Boot</span>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  name="enableAutoStart"
                  checked={settings.enableAutoStart}
                  onChange={handleChange}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="save-btn" onClick={handleSave}>Save Changes</button>
        <button className="reset-btn" onClick={handleReset}>Reset to Default</button>
      </div>
    </div>
  );
};

export default Settings;