/**
 * Battle of Kursk 1943 - Main Controller
 * Handles Game Loop, Dynamic Camera (Shake & Zoom), and MP4/WebM Video Recorder
 */

const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');

// Global Viewport & Camera State
const camera = {
  x: 0,
  y: 0,
  zoom: 1,
  targetZoom: 1,
  shake: 0
};

let W = 0;
let H = 0;
let groundY = 0;

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = canvas.width = rect.width;
  H = canvas.height = rect.height;
  groundY = H * 0.74;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Procedural Web Audio (Built-in fallback until js/audio.js is loaded) ---
let audioCtx = null;
function playExplosionSound(isHeavy = false) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const duration = isHeavy ? 0.9 : 0.55;
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * (isHeavy ? 0.25 : 0.15)));
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(isHeavy ? 260 : 400, audioCtx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + duration);

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(isHeavy ? 0.9 : 0.65, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  noise.start();
}

// --- Battlefield Entities & State ---
let shells = [];
let particles = [];
let craters = [];

const state = {
  t34: { x: 0, hp: 100, maxHp: 100, recoil: 0, speed: 0.45, color: '#3f6212', turret: '#4d7c0f' },
  tiger: { x: 0, hp: 140, maxHp: 140, recoil: 0, speed: -0.22, color: '#475569', turret: '#64748b' }
};

function updateHud() {
  const t34Bar = document.getElementById('hp-t34');
  const tigerBar = document.getElementById('hp-tiger');
  if (t34Bar) t34Bar.style.width = Math.max(0, (state.t34.hp / state.t34.maxHp) * 100) + '%';
  if (tigerBar) tigerBar.style.width = Math.max(0, (state.tiger.hp / state.tiger.maxHp) * 100) + '%';
}

function resetBattle() {
  state.t34.x = W * 0.18;
  state.t34.hp = state.t34.maxHp;
  state.tiger.x = W * 0.82;
  state.tiger.hp = state.tiger.maxHp;
  shells = [];
  particles = [];
  craters = [];
  camera.targetZoom = 1;
  camera.shake = 0;
  updateHud();
}
resetBattle();

function spawnParticles(x, y, count, colorList, speedScale = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 4 + 1) * speedScale;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: Math.random() * 8 + 3,
      alpha: 1,
      decay: Math.random() * 0.025 + 0.015,
      color: colorList[Math.floor(Math.random() * colorList.length)]
    });
  }
}

// --- Combat & Camera Triggers ---
function fireTank(who) {
  const isT34 = who === 't34';
  const shooter = isT34 ? state.t34 : state.tiger;
  if (shooter.hp <= 0) return;

  shooter.recoil = isT34 ? 10 : 14;
  camera.shake = isT34 ? 7 : 12;
  camera.targetZoom = 1.05; // Cinematic micro-zoom on shot
  setTimeout(() => { camera.targetZoom = 1.0; }, 350);

  playExplosionSound(!isT34);

  const dir = isT34 ? 1 : -1;
  const muzzleX = shooter.x + dir * (isT34 ? 62 : 76);
  const muzzleY = groundY - (isT34 ? 32 : 38);

  shells.push({
    owner: who,
    x: muzzleX,
    y: muzzleY,
    vx: dir * (isT34 ? 11.5 : 14.5),
    vy: -1.4,
    damage: isT34 ? 28 : 45
  });

  spawnParticles(muzzleX, muzzleY, 18, ['#fb923c', '#facc15', '#94a3b8'], 1.2);
}

// Touch / Click on canvas focuses camera zoom briefly
canvas.addEventListener('pointerdown', () => {
  camera.targetZoom = camera.targetZoom > 1.02 ? 1.0 : 1.15;
});

// Auto-combat loop for hands-free video recording
setInterval(() => {
  if (state.t34.hp > 0 && state.tiger.hp > 0) {
    Math.random() > 0.45 ? fireTank('t34') : fireTank('tiger');
  }
}, 2600);

// --- Rendering Routines ---
function drawEnvironment() {
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0, '#0f172a');
  sky.addColorStop(0.55, '#334155');
  sky.addColorStop(1, '#78350f');
  ctx.fillStyle = sky;
  ctx.fillRect(-50, -50, W + 100, groundY + 50);

  // Horizon battle fires
  ctx.fillStyle = 'rgba(234, 88, 12, 0.25)';
  ctx.beginPath();
  ctx.arc(W * 0.3, groundY, 70, Math.PI, 0);
  ctx.arc(W * 0.72, groundY, 90, Math.PI, 0);
  ctx.fill();

  // Russian Steppe Ground
  ctx.fillStyle = '#1c1917';
  ctx.fillRect(-50, groundY, W + 100, H - groundY + 100);
  ctx.fillStyle = '#292524';
  ctx.fillRect(-50, groundY, W + 100, 8);

  // Impact Craters
  craters.forEach(cx => {
    ctx.fillStyle = '#0c0a09';
    ctx.beginPath();
    ctx.ellipse(cx, groundY + 4, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawT34(t) {
  if (t.hp <= 0) return;
  const x = t.x - t.recoil;
  ctx.fillStyle = '#090d16';
  ctx.beginPath(); ctx.roundRect(x - 38, groundY - 14, 76, 14, 6); ctx.fill();

  ctx.fillStyle = t.color;
  ctx.beginPath();
  ctx.moveTo(x - 35, groundY - 14);
  ctx.lineTo(x - 28, groundY - 26);
  ctx.lineTo(x + 26, groundY - 26);
  ctx.lineTo(x + 38, groundY - 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = t.turret;
  ctx.beginPath(); ctx.roundRect(x - 14, groundY - 38, 32, 13, 5); ctx.fill();
  ctx.fillRect(x + 18, groundY - 34, 44, 4);
}

function drawTiger(t) {
  if (t.hp <= 0) return;
  const x = t.x + t.recoil;
  ctx.fillStyle = '#090d16';
  ctx.beginPath(); ctx.roundRect(x - 46, groundY - 16, 92, 16, 5); ctx.fill();

  ctx.fillStyle = t.color;
  ctx.fillRect(x - 44, groundY - 31, 88, 16);

  ctx.fillStyle = t.turret;
  ctx.fillRect(x - 20, groundY - 45, 42, 15);
  ctx.fillRect(x - 76, groundY - 40, 56, 5);
  ctx.fillRect(x - 80, groundY - 42, 6, 9);
}

// --- Main Game Loop ---
function gameLoop() {
  ctx.save();

  // Smooth Camera Zoom & Screen Shake
  camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;
  ctx.translate(W / 2, H / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-W / 2, -H / 2);

  if (camera.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * camera.shake, (Math.random() - 0.5) * camera.shake);
    camera.shake *= 0.85;
  }

  drawEnvironment();

  // Tank Advancement
  if (state.t34.hp > 0 && state.t34.x < W * 0.34) {
    state.t34.x += state.t34.speed;
    if (Math.random() < 0.25) spawnParticles(state.t34.x - 35, groundY - 2, 1, ['#57534e'], 0.4);
  }
  if (state.tiger.hp > 0 && state.tiger.x > W * 0.66) {
    state.tiger.x += state.tiger.speed;
    if (Math.random() < 0.25) spawnParticles(state.tiger.x + 40, groundY - 2, 1, ['#57534e'], 0.4);
  }

  state.t34.recoil *= 0.84;
  state.tiger.recoil *= 0.84;

  drawT34(state.t34);
  drawTiger(state.tiger);

  // Shells Physics & Collision
  for (let i = shells.length - 1; i >= 0; i--) {
    const s = shells[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.06;

    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.arc(s.x, s.y, 3.2, 0, Math.PI * 2); ctx.fill();

    const target = s.owner === 't34' ? state.tiger : state.t34;
    if (target.hp > 0 && Math.abs(s.x - target.x) < 38 && s.y > groundY - 45) {
      target.hp -= s.damage;
      camera.shake = 16;
      camera.targetZoom = 1.1;
      setTimeout(() => { camera.targetZoom = 1.0; }, 400);

      playExplosionSound(true);
      spawnParticles(s.x, s.y, 38, ['#ef4444', '#f97316', '#facc15', '#1e293b'], 1.6);
      craters.push(s.x);
      updateHud();
      shells.splice(i, 1);
      continue;
    }

    if (s.y >= groundY || s.x < 0 || s.x > W) {
      spawnParticles(s.x, groundY, 12, ['#78716c', '#f97316'], 0.8);
      shells.splice(i, 1);
    }
  }

  // Burning Wreck Smoke
  [state.t34, state.tiger].forEach(t => {
    if (t.hp <= 0 && Math.random() < 0.35) {
      spawnParticles(t.x, groundY - 22, 1, ['#1e293b', '#475569', '#ea580c'], 0.5);
    }
  });

  // Particles Render
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= p.decay;
    p.size *= 1.015;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    if (p.alpha <= 0) particles.splice(i, 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// --- Video Recorder (Auto-detects MP4 or WebM for Mobile Compatibility) ---
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function getSupportedMimeType() {
  const types = [
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm'
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

function toggleRecording() {
  const btn = document.getElementById('rec-btn');
  if (!isRecording) {
    recordedChunks = [];
    const mimeType = getSupportedMimeType();
    const stream = canvas.captureStream(30);

    mediaRecorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const isMp4 = mimeType.includes('mp4');
      const ext = isMp4 ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });

