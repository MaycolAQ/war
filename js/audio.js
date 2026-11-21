/**
 * Battle of Kursk 1943 - Procedural Web Audio Synthesizer
 * Generates tank engines, metallic track clanking, cannon fire, explosions, and ricochets without MP3 files.
 */

const BattleAudio = {
  ctx: null,
  engineOsc: null,
  engineGain: null,
  trackTimer: null,
  isEngineRunning: false,

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  /**
   * Starts continuous low-frequency diesel engine rumble & periodic metallic track clank
   */
  startEngines() {
    this.init();
    if (this.isEngineRunning) return;

    // 1. Diesel Engine Rumble (Sawtooth + Lowpass Filter)
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(34, this.ctx.currentTime); // Deep V-2 / Maybach rumble

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(95, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();

    // 2. Rhythmic Steel Tracks Clanking
    this.trackTimer = setInterval(() => {
      if (this.ctx && this.ctx.state === 'running') {
        this.playTrackClank();
      }
    }, 220);

    this.isEngineRunning = true;
  },

  stopEngines() {
    if (this.engineOsc) {
      try { this.engineOsc.stop(); } catch (e) {}
      this.engineOsc = null;
    }
    if (this.trackTimer) {
      clearInterval(this.trackTimer);
      this.trackTimer = null;
    }
    this.isEngineRunning = false;
  },

  /**
   * Short metallic click/clank simulating steel caterpillar treads rolling
   */
  playTrackClank() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 45, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.045);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },

  /**
   * Cannon Shot: High-pressure muzzle blast + sub-bass punch
   * @param {boolean} isHeavy - True for Tiger I 88mm, False for T-34 76mm
   */
  playCannonFire(isHeavy = false) {
    this.init();
    const now = this.ctx.currentTime;
    const duration = isHeavy ? 0.85 : 0.6;

    // 1. Sub-bass punch (Cannon recoil thump)
    const punchOsc = this.ctx.createOscillator();
    punchOsc.type = 'sine';
    punchOsc.frequency.setValueAtTime(isHeavy ? 110 : 140, now);
    punchOsc.frequency.exponentialRampToValueAtTime(28, now + 0.25);

    const punchGain = this.ctx.createGain();
    punchGain.gain.setValueAtTime(isHeavy ? 0.85 : 0.65, now);
    punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    punchOsc.connect(punchGain);
    punchGain.connect(this.ctx.destination);
    punchOsc.start(now);
    punchOsc.stop(now + 0.3);

    // 2. White noise blast (Propellant crack)
    this.playFilteredNoise(duration, isHeavy ? 340 : 520, isHeavy ? 0.85 : 0.65);
  },

  /**
   * Armor Impact / Tank Explosion
   */
  playExplosion(isPenetration = true) {
    this.init();
    const duration = isPenetration ? 1.1 : 0.45;
    const cutoff = isPenetration ? 240 : 650;
    const volume = isPenetration ? 0.9 : 0.45;
    this.playFilteredNoise(duration, cutoff, volume);
  },

  /**
   * High-pitched metallic whine when a shell bounces off sloped armor
   */
  playRicochet() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';

    // Classic metallic deflection pitch sweep
    const startFreq = 1800 + Math.random() * 500;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.32);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  },

  /**
   * Helper: Generates filtered white noise bursts
   */
  playFilteredNoise(duration, startFreq, volume) {
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * (duration * 0.28)));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(35, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }
};
