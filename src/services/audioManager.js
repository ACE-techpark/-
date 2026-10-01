const cues = { correct: [523, 659, 784], wrong: [260, 180], splash: [160, 100],
  movement: [330, 440], sinking: [160, 120, 80], victory: [523, 659, 784, 1046], countdown: [660] };
class AudioManager {
  constructor() {
    this.context = null;
    this.settings = { master: 0.5, music: 0.3, effects: 0.65, mute: true };
    this.tracks = new Map();
  }
  configure(settings) { this.settings = { ...this.settings, ...settings }; }
  async unlock() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context ||= new AudioContext();
    await this.context.resume();
  }
  // Future assets can register ambience/music here without changing game rules.
  registerTrack(name, url) { this.tracks.set(name, url); }
  play(cue) {
    if (this.settings.mute || !this.context || this.context.state !== 'running') return;
    (cues[cue] || []).forEach((frequency, i) => {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const start = this.context.currentTime + i * 0.13;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(this.settings.master * this.settings.effects * 0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
      oscillator.connect(gain); gain.connect(this.context.destination);
      oscillator.start(start); oscillator.stop(start + 0.23);
    });
  }
}
export const audioManager = new AudioManager();
