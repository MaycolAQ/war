/**
 * BattleMusic — Secuenciador procedural de marchas militares
 * Sintetiza Katyusha y Erika con osciladores, sin archivos de audio.
 */
const BattleMusic = {
  ctx: null,
  isPlaying: false,
  currentSong: null,
  nextNoteTime: 0,
  currentNoteIndex: 0,
  timerID: null,
  lookahead: 25,           // ms
  scheduleAheadTime: 0.15, // s

  // Frecuencias de notas (A4 = 440 Hz, temperamento igual)
  noteMap: {
    'C4':261.63,'C#4':277.18,'D4':293.66,'D#4':311.13,
    'E4':329.63,'F4':349.23,'F#4':369.99,'G4':392.00,
    'G#4':415.30,'A4':440.00,'A#4':466.16,'B4':493.88,
    'C5':523.25,'C#5':554.37,'D5':587.33,'D#5':622.25,
    'E5':659.25,'F5':698.46,'F#5':739.99,'G5':783.99,
    'A5':880.00,'B5':987.77,'C6':1046.50
  },

  melodies: {
    // Katyusha — aproximación en La menor (reconocible)
    katyusha: {
      tempo: 96,
      notes: [
        ['A4',0.5],['A4',0.5],['C5',1],['B4',0.5],['A4',0.5],['G4',0.5],['A4',1],
        ['E4',0.5],['E4',0.5],['A4',1],['G4',0.5],['E4',0.5],['D4',0.5],['E4',1],
        ['A4',0.5],['A4',0.5],['C5',1],['B4',0.5],['A4',0.5],['G4',0.5],['A4',1],
        ['E4',0.5],['E4',0.5],['A4',1],['G4',0.5],['E4',0.5],['D4',0.5],['E4',1],
        ['C5',0.5],['C5',0.5],['E5',1],['D5',0.5],['C5',0.5],['B4',0.5],['C5',1],
        ['A4',0.5],['A4',0.5],['C5',1],['B4',0.5],['A4',0.5],['G4',0.5],['A4',1],
        ['-',1],['-',1]
      ]
    },
    // Erika — aproximación en Mi menor (marcial)
    erika: {
      tempo: 118,
      notes: [
        ['E4',0.5],['E4',0.5],['E4',0.5],['F#4',0.5],['G4',1],['A4',1],
        ['A4',0.5],['G4',0.5],['F#4',0.5],['E4',1],['B4',0.5],['B4',0.5],
        ['B4',0.5],['C5',0.5],['B4',0.5],['A4',0.5],['G4',0.5],['A4',0.5],['B4',1],
        ['E5',0.5],['E5',0.5],['D5',0.5],['C5',0.5],['B4',0.5],['A4',0.5],['G4',1],
        ['F#4',0.5],['G4',0.5],['A4',0.5],['B4',0.5],['E4',1],['E4',1],
        ['-',1],['-',1]
      ]
    }
  },

  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  playNote(freq, startTime, duration, volume = 0.12) {
    const osc    = this.ctx.createOscillator();
    const gain   = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Tono tipo "trompeta marcial": sierra filtrada
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, startTime);
    filter.frequency.exponentialRampToValueAtTime(900, startTime + duration);

    // Envolvente: ataque rápido, sustain, release
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.setValueAtTime(volume, startTime + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  },

  scheduler() {
    const song = this.melodies[this.currentSong];
    if (!song) return;
    const secondsPerBeat = 60 / song.tempo;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      if (this.currentNoteIndex >= song.notes.length) this.currentNoteIndex = 0;
      const [note, beats] = song.notes[this.currentNoteIndex];
      const duration = beats * secondsPerBeat;

      if (note !== '-') {
        this.playNote(this.noteMap[note], this.nextNoteTime, duration * 0.9);
      }
      this.nextNoteTime += duration;
      this.currentNoteIndex++;
    }
  },

  start(songName = 'katyusha') {
    this.init();
    if (this.isPlaying && this.currentSong === songName) return;
    this.stop();
    this.currentSong      = songName;
    this.currentNoteIndex = 0;
    this.nextNoteTime     = this.ctx.currentTime + 0.1;
    this.isPlaying        = true;
    this.timerID = setInterval(() => this.scheduler(), this.lookahead);
  },

  stop() {
    if (this.timerID) { clearInterval(this.timerID); this.timerID = null; }
    this.isPlaying    = false;
    this.currentSong  = null;
  },

  toggle(songName = 'katyusha') {
    if (this.isPlaying) this.stop();
    else this.start(songName);
    return this.isPlaying;
  }
};