// Utility class to synthesize custom alert sounds without external files
class AlarmSynthesizer {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBuzzer() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;
    
    // High-pitched square wave repeating quickly
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    osc.type = "square";
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    osc.frequency.setValueAtTime(1200, this.audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.4);

    osc.onended = () => {
      this.isPlaying = false;
    };
  }

  playGentleAlert() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    // Softer sine wave with a smooth envelope (ding sound)
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8, this.audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 1.2);

    osc.onended = () => {
      this.isPlaying = false;
    };
  }

  playLoudWarning() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    // Intense sawtooth siren
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.audioCtx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime);
    gainNode.gain.setValueAtTime(1, this.audioCtx.currentTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.8);

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.8);

    osc.onended = () => {
      this.isPlaying = false;
    };
  }

  playAlert(presetName) {
    switch(presetName) {
      case "Buzzer":
        this.playBuzzer();
        break;
      case "Gentle Alert":
        this.playGentleAlert();
        break;
      case "Loud Warning":
        this.playLoudWarning();
        break;
      default:
        this.playBuzzer();
    }
  }
}

export const alarmSynth = new AlarmSynthesizer();
