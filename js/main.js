/**
 * Battle of Kursk 1943 - Unified Main Controller
 */

const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');

const camera = {
  zoom: 1,
  targetZoom: 1,
  shake: 0
};

let W = 0;
let H = 0;
let baseGroundY = 0;

const terrain = new SteppeTerrain();
let unitsCatalog = [];
let t34 = null;
let tiger = null;

let shells = [];
let particles = [];
let shockwaves = [];
let floatingTexts = [];
let lastTime = 0;

// ===== SISTEMA DE TURNOS (ajedrez) =====
let turnoActual = 't34'; // 't34' o 'tiger'

function actualizarIndicadorTurno() {
  const el = document.getElementById('turn-indicator');
  if (el) {
    el.textContent = turnoActual === 't34' ? 'TURNO: T-34' : 'TURNO: TIGER';
    el.classList.toggle('turno-ussr', turnoActual === 't34');
    el.classList.toggle('turno-ger',  turnoActual === 'tiger');
  }
  const btnT34   = document.getElementById('btn-fire-t34');
  const btnTiger = document.getElementById('btn-fire-tiger');
  if (btnT34)   btnT34.disabled   = (turnoActual !== 't34');
  if (btnTiger) btnTiger.disabled = (turnoActual !== 'tiger');
}

function passTurn() {
  turnoActual = turnoActual === 't34' ? 'tiger' : 't34';
  actualizarIndicadorTurno();
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = canvas.width = rect.width || window.innerWidth;
  H = canvas.height = rect.height || window.innerHeight * 0.75;
  baseGroundY = H * 0.74;
  terrain.generate(W, baseGroundY);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

async function initBattle() {
  try {
    const res = await fetch('data/kursk-units.json');
    const data = await res.json();
    unitsCatalog = data.units || [];
  } catch (e) {
    unitsCatalog = [];
  }
  resetBattle();
}

function getUnitConfig(id, fallback) {
  const found = unitsCatalog.find(u => u.id === id);
  return found ? { ...found.engineStats, name: found.name, faction: found.faction } : fallback;
}

function resetBattle() {
  const ussrCfg = getUnitConfig('t34_76', {
    name: 'T-34/76', faction: 'USSR', maxHp: 100, speed: 0.48,
    armorMm: 45, armorSlope: 60, penetration: 92, baseDamage: 28,
    reloadTime: 2200, barrelLength: 44, hullColor: '#3f6212', turretColor: '#4d7c0f'
  });

  const gerCfg = getUnitConfig('tiger_1', {
    name: 'Tiger I', faction: 'GER', maxHp: 150, speed: 0.22,
    armorMm: 100, armorSlope: 10, penetration: 145, baseDamage: 48,
    reloadTime: 3100, barrelLength: 56, hullColor: '#475569', turretColor: '#64748b'
  });

  t34 = new Tank({ ...ussrCfg, id: 't34', x: W * 0.16, y: baseGroundY, direction: 1 });
  tiger = new Tank({ ...gerCfg, id: 'tiger', x: W * 0.84, y: baseGroundY, direction: -1 });

  shells = [];
  particles = [];
  shockwaves = [];
  floatingTexts = [];
  terrain.generate(W, baseGroundY);
  camera.targetZoom = 1;
  camera.shake = 0;
  updateHud();
}

function updateHud() {
  if (!t34 || !tiger) return;
  const t34Bar = document.getElementById('hp-t34');
  const tigerBar = document.getElementById('hp-tiger');
  if (t34Bar) t34Bar.style.width = Math.max(0, (t34.hp / t34.maxHp) * 100) + '%';
  if (tigerBar) tigerBar.style.width = Math.max(0, (tiger.hp / tiger.maxHp) * 100) + '%';
}

function fireTank(who) {
  if (!t34 || !tiger) return;
  if (who !== turnoActual) return; // ❌ No es tu turno
  if (typeof BattleAudio !== 'undefined') BattleAudio.startEngines();

  const shooter = who === 't34' ? t34 : tiger;
  const shell = shooter.fire(Date.now());
  if (!shell) return;

  shells.push(shell);
  if (typeof BattleAudio !== 'undefined') BattleAudio.playCannonFire(shell.isHeavy);

  camera.shake = shell.isHeavy ? 12 : 7;
  camera.targetZoom = 1.06;
  setTimeout(() => { camera.targetZoom = 1.0; }, 350);

    PhysicsEngine.spawnParticles(particles, shell.x, shell.y, 18, {
    colors: ['#fef08a', '#fb923c', '#94a3b8'],
    speedMin: 1.5,
    speedMax: 6,
    sizeMin: 3,
    sizeMax: 9,
    decay: 0.035,
    baseAngle: shell.vx > 0 ? 0 : Math.PI,
    spreadAngle: 0.75
  });

  // 🔁 Al disparar, termina tu turno (deja ver el proyectil volar)
  setTimeout(() => passTurn(), 900);
}

canvas.addEventListener('pointerdown', () => {
  if (typeof BattleAudio !== 'undefined') BattleAudio.startEngines();
  camera.targetZoom = camera.targetZoom > 1.02 ? 1.0 : 1.15;
});


function gameLoop(timestamp) {
  lastTime = timestamp;

  ctx.save();

  camera.zoom += (camera.targetZoom - camera.zoom) * 0.1;
  ctx.translate(W / 2, H / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-W / 2, -H / 2);

  if (camera.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * camera.shake, (Math.random() - 0.5) * camera.shake);
    camera.shake *= 0.85;
  }

  terrain.draw(ctx, W, H, baseGroundY, timestamp);

  if (t34 && tiger) {
    const t34Ground = terrain.getHeightAt(t34.x, baseGroundY);
    const tigerGround = terrain.getHeightAt(tiger.x, baseGroundY);

    // 🚫 Sin auto-movimiento: los tanques se quedan donde están.
// El jugador los moverá con taps en el siguiente paso.
const t34Moving = false;
const tigerMoving = false;

    if (t34Moving && Math.random() < 0.25) {
      PhysicsEngine.spawnParticles(particles, t34.x - 32, t34Ground - 2, 1, {
        colors: ['#57534e'], speedMin: 0.3, speedMax: 1.2, sizeMin: 3, sizeMax: 6, decay: 0.02
      });
    }
    if (tigerMoving && Math.random() < 0.25) {
      PhysicsEngine.spawnParticles(particles, tiger.x + 38, tigerGround - 2, 1, {
        colors: ['#57534e'], speedMin: 0.3, speedMax: 1.2, sizeMin: 3, sizeMax: 6, decay: 0.02
      });
    }

    t34.aimAt(tiger.x, tiger.y);
    tiger.aimAt(t34.x, t34.y);

    t34.update();
    tiger.update();

    t34.draw(ctx);
    tiger.draw(ctx);

    const battleState = { t34, tiger, groundY: baseGroundY, width: W };
    PhysicsEngine.updateShells(
      ctx, battleState, shells, particles, shockwaves, terrain.craters, floatingTexts,
      {
        onHit: (penetrated) => {
          camera.shake = penetrated ? 16 : 8;
          camera.targetZoom = penetrated ? 1.1 : 1.04;
          setTimeout(() => { camera.targetZoom = 1.0; }, 400);
          if (typeof BattleAudio !== 'undefined') BattleAudio.playExplosion(penetrated);
          updateHud();
        },
        onRicochet: () => {
          camera.shake = 5;
          if (typeof BattleAudio !== 'undefined') BattleAudio.playRicochet();
        }
      }
    );

    [t34, tiger].forEach(unit => {
      if (unit.hp <= 0 && Math.random() < 0.35) {
        PhysicsEngine.spawnParticles(particles, unit.x, unit.y - 22, 1, {
          colors: ['#1e293b', '#475569', '#ea580c'],
          speedMin: 0.4, speedMax: 1.5, sizeMin: 5, sizeMax: 11, decay: 0.015, buoyancy: -0.05
        });
      }
    });
  }

  PhysicsEngine.updateEffects(ctx, particles, shockwaves, floatingTexts);

  ctx.restore();
  requestAnimationFrame(gameLoop);
}

let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;

function getSupportedMimeType() {
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function toggleRecording() {
  const btn = document.getElementById('rec-btn');
  if (!isRecording) {
    recordedChunks = [];
    const mimeType = getSupportedMimeType();
    const stream = canvas.captureStream(30);
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kursk-1943-battle.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorder.start();
    isRecording = true;
    btn.textContent = '■ STOP & SAVE';
    btn.classList.add('recording');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.textContent = '● REC VIDEO';
    btn.classList.remove('recording');
  }
}

initBattle().then(() => {
  actualizarIndicadorTurno();
  requestAnimationFrame(gameLoop);
});
.turn-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.85rem;
  letter-spacing: 1px;
  border: 2px solid #c9a227;
  background: #1a1a1a;
  color: #f0e6c8;
  transition: all 0.25s ease;
}
.turn-badge.turno-ussr { border-color: #ef4444; color: #fca5a5; }
.turn-badge.turno-ger  { border-color: #94a3b8; color: #cbd5e1; }

.btn-pass {
  background: #c9a227;
  color: #1a1a1a;
  font-weight: bold;
  border: 2px solid #f0e6c8;
  padding: 10px 16px;
  border-radius: 8px;
}
.btn-pass:active { transform: scale(0.96); }

#controls button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  filter: grayscale(0.7);
}
