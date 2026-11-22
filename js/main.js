/**
 * Battle of Kursk 1943 - Juego táctico completo con pulido
 */

const canvas = document.getElementById('battlefield');
const ctx    = canvas.getContext('2d');

let W = 0, H = 0;

const board = new Board(8, 8);
let units = [];
let selectedUnit = null;
let validMoves = [];
let attackTargets = [];

let turnoActual = 'USSR';
let estadoPartida = 'jugando';

let particles = [];
let shockwaves = [];
let floatingTexts = [];
const camera = { shake: 0 };

// ====== UTILIDADES ======
function getSquareCenter(col, row) {
  const sq = board.squares.find(s => s.col === col && s.row === row);
  if (!sq) return null;
  return { x: sq.x + sq.size / 2, y: sq.y + sq.size / 2 };
}

// ====== TUTORIAL ======
function cerrarTutorial() {
  const t = document.getElementById('tutorial');
  if (t) t.classList.add('oculto');
}

// ====== RESIZE ======
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = canvas.width  = rect.width  || window.innerWidth;
  H = canvas.height = rect.height || window.innerHeight * 0.75;
}
window.addEventListener('resize', () => { resizeCanvas(); board.layout(W, H); });
resizeCanvas();

// ====== SETUP ======
function setupBoard() {
  board.layout(W, H);

  units = [
    new Unit({
      id: 't34-1', faction: 'USSR', name: 'T-34/76',
      maxHp: 100, moveRange: 2, attackRange: 2, damage: 28,
      col: 1, row: 3
    }),
    new Unit({
      id: 'tiger-1', faction: 'GER', name: 'Tiger I',
      maxHp: 150, moveRange: 1, attackRange: 2, damage: 48,
      col: 6, row: 4
    })
  ];

  turnoActual = 'USSR';
  estadoPartida = 'jugando';
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  particles = [];
  shockwaves = [];
  floatingTexts = [];
  camera.shake = 0;

  const overlay = document.getElementById('fin-partida');
  if (overlay) overlay.classList.add('oculto');

  updateHud();
  actualizarIndicadorTurno();
}

function updateHud() {
  const t34   = units.find(u => u.id === 't34-1');
  const tiger = units.find(u => u.id === 'tiger-1');
  const t34Bar   = document.getElementById('hp-t34');
  const tigerBar = document.getElementById('hp-tiger');
  if (t34 && t34Bar)     t34Bar.style.width   = (t34.hp / t34.maxHp) * 100 + '%';
  if (tiger && tigerBar) tigerBar.style.width = (tiger.hp / tiger.maxHp) * 100 + '%';
}

function actualizarIndicadorTurno() {
  const el = document.getElementById('turn-indicator');
  if (!el) return;
  el.textContent = turnoActual === 'USSR' ? 'TURNO: T-34' : 'TURNO: TIGER';
  el.classList.toggle('turno-ussr', turnoActual === 'USSR');
  el.classList.toggle('turno-ger',  turnoActual === 'GER');
}

// ====== TURNOS ======
function startTurn() {
  units.filter(u => u.alive && u.faction === turnoActual).forEach(u => {
    u.hasMoved = false;
    u.hasAttacked = false;
  });
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  actualizarIndicadorTurno();
  if (turnoActual === 'GER') setTimeout(botTurn, 700);
}

function endTurn() {
  if (estadoPartida === 'fin') return;
  turnoActual = turnoActual === 'USSR' ? 'GER' : 'USSR';
  startTurn();
}

function passTurn() { endTurn(); }
function resetBattle() { setupBoard(); startTurn(); }

// ====== SELECCIÓN ======
function selectUnit(unit) {
  selectedUnit = unit;
  validMoves = [];
  attackTargets = [];
  if (!unit) return;

  if (!unit.hasMoved) {
    for (const sq of board.squares) {
      if (unit.canMoveTo(sq.col, sq.row, board.squares, units)) validMoves.push(sq);
    }
  }
  if (!unit.hasAttacked) {
    for (const u of units) {
      if (u.alive && u.faction !== unit.faction && unit.canAttack(u)) attackTargets.push(u);
    }
  }
}

// ====== ACCIONES ======
function executeMove(unit, col, row) {
  unit.setSquare(col, row);
  unit.hasMoved = true;
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];

  const c = getSquareCenter(col, row);
  if (c && typeof PhysicsEngine !== 'undefined') {
    PhysicsEngine.spawnParticles(particles, c.x, c.y + 10, 10, {
      colors: ['#78716c', '#a8a29e'],
      speedMin: 0.5, speedMax: 2,
      sizeMin: 4, sizeMax: 8,
      decay: 0.03, buoyancy: -0.02
    });
  }
}

function executeAttack(attacker, target) {
  const dmg = Math.round(attacker.damage * (0.8 + Math.random() * 0.4));
  const center = getSquareCenter(target.col, target.row);

  if (typeof BattleAudio !== 'undefined') {
    BattleAudio.playCannonFire(attacker.faction === 'GER');
    setTimeout(() => BattleAudio.playExplosion(true), 120);
  }

  if (center && typeof PhysicsEngine !== 'undefined') {
    const attackerCenter = getSquareCenter(attacker.col, attacker.row);
    if (attackerCenter) {
      const dir = target.col >= attacker.col ? 1 : -1;
      PhysicsEngine.createMuzzleFlash(particles, attackerCenter.x, attackerCenter.y - 20, dir);
    }
    PhysicsEngine.createExplosion(particles, shockwaves, center.x, center.y - 10, 1.1);
    floatingTexts.push({
      x: center.x, y: center.y - 30,
      text: `-${dmg}`, color: '#ef4444', alpha: 1, vy: -0.6
    });
  }

  // Sacudida de la unidad
  if (target.shake) target.shake(10);

  target.takeDamage(dmg);
  attacker.hasAttacked = true;
  camera.shake = 14;

  if (!target.alive) {
    if (center && typeof PhysicsEngine !== 'undefined') {
      PhysicsEngine.createWreck(particles, shockwaves, center.x, center.y - 10);
    }
    camera.shake = 22;
    setTimeout(checkGameOver, 900);
  }

  updateHud();
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
}

function checkGameOver() {
  const ussrAlive = units.some(u => u.alive && u.faction === 'USSR');
  const gerAlive  = units.some(u => u.alive && u.faction === 'GER');
  if (!ussrAlive || !gerAlive) {
    estadoPartida = 'fin';
    finPartida(!ussrAlive ? 'GER' : 'USSR');
  }
}

function finPartida(ganador) {
  const overlay = document.getElementById('fin-partida');
  const titulo  = document.getElementById('titulo-fin');
  const sub     = document.getElementById('subtitulo-fin');
  if (!overlay) return;

  if (ganador === 'USSR') {
    titulo.textContent = '¡VICTORIA SOVIÉTICA!';
    titulo.className = 'victoria-ussr';
    sub.textContent = 'El Tiger ha sido destruido';
  } else {
    titulo.textContent = '¡VICTORIA ALEMANA!';
    titulo.className = 'victoria-ger';
    sub.textContent = 'El T-34 ha sido destruido';
  }
  overlay.classList.remove('oculto');

  // Confeti de partículas
  if (typeof PhysicsEngine !== 'undefined' && W && H) {
    for (let i = 0; i < 30; i++) {
      PhysicsEngine.spawnParticles(particles,
        W / 2 + (Math.random() - 0.5) * W * 0.8,
        H / 2, 2, {
          colors: ganador === 'USSR' ? ['#ef4444', '#fbbf24', '#fef08a'] : ['#94a3b8', '#cbd5e1', '#fef08a'],
          speedMin: 2, speedMax: 6,
          sizeMin: 3, sizeMax: 6,
          decay: 0.008, buoyancy: 0.04
        });
    }
  }
}

// ====== BOT INTELIGENTE ======
function botTurn() {
  if (estadoPartida === 'fin') return;
  const myUnits = units.filter(u => u.alive && u.faction === 'GER');
  const enemies = units.filter(u => u.alive && u.faction === 'USSR');
  if (!myUnits.length || !enemies.length) return;

  const unit = myUnits[0];

  // 1. Prioriza al enemigo más cercano
  const target = enemies.reduce((a, b) =>
    manhattan(unit, a) <= manhattan(unit, b) ? a : b
  );

  // 2. Atacar si puede
  if (unit.canAttack(target)) {
    executeAttack(unit, target);
    setTimeout(endTurn, 900);
    return;
  }

  // 3. Si está débil (<30% HP) y hay 2 enemigos, huir (en este 1v1 no aplica, pero está listo)
  // 4. Moverse hacia el enemigo
  const dx = Math.sign(target.col - unit.col);
  const dy = Math.sign(target.row - unit.row);
  const candidates = [];
  if (Math.abs(target.col - unit.col) > Math.abs(target.row - unit.row)) {
    if (dx !== 0) candidates.push({ col: unit.col + dx, row: unit.row });
    if (dy !== 0) candidates.push({ col: unit.col, row: unit.row + dy });
  } else {
    if (dy !== 0) candidates.push({ col: unit.col, row: unit.row + dy });
    if (dx !== 0) candidates.push({ col: unit.col + dx, row: unit.row });
  }

  let moved = false;
  for (const c of candidates) {
    if (unit.canMoveTo(c.col, c.row, board.squares, units)) {
      executeMove(unit, c.col, c.row);
      moved = true;
      break;
    }
  }

  setTimeout(() => {
    if (unit.canAttack(target)) executeAttack(unit, target);
    setTimeout(endTurn, 700);
  }, moved ? 800 : 200);
}

function manhattan(a, b) {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

// ====== DIBUJO ======
function drawHighlights(ctx) {
  for (const sq of validMoves) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }

  for (const t of attackTargets) {
    const sq = board.squares.find(s => s.col === t.col && s.row === t.row);
    if (!sq) continue;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }

  if (selectedUnit) {
    const sq = board.squares.find(s => s.col === selectedUnit.col && s.row === selectedUnit.row);
    if (sq) {
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 4;
      ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    }
  }
}

function render() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();

  if (camera.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * camera.shake,
                  (Math.random() - 0.5) * camera.shake);
    camera.shake *= 0.85;
  }

  ctx.fillStyle = '#2b3d2b';
  ctx.fillRect(-20, -20, W + 40, H + 40);

  board.draw(ctx, W, H);
  drawHighlights(ctx);

  units.filter(u => !u.alive).forEach(u => {
    if (typeof PhysicsEngine !== 'undefined' && Math.random() < 0.08) {
      const c = getSquareCenter(u.col, u.row);
      if (c) {
        PhysicsEngine.spawnParticles(particles, c.x + (Math.random() - 0.5) * 15, c.y - 15, 1, {
          colors: ['#1e293b', '#334155'],
          speedMin: 0.3, speedMax: 1,
          sizeMin: 4, sizeMax: 8,
          decay: 0.01, buoyancy: -0.05
        });
      }
    }
  });

  units.filter(u => !u.alive).forEach(u => u.draw(ctx, board.squares));
  units.filter(u =>  u.alive).forEach(u => u.draw(ctx, board.squares));

  if (typeof PhysicsEngine !== 'undefined') {
    PhysicsEngine.updateEffects(ctx, particles, shockwaves, floatingTexts);
  }

  ctx.restore();
  requestAnimationFrame(render);
}

// ====== INTERACCIÓN ======
canvas.addEventListener('pointerdown', (e) => {
  if (typeof BattleMusic !== 'undefined' && !BattleMusic.isPlaying) {
    BattleMusic.start('katyusha');
    const btn = document.getElementById('btn-music');
    if (btn) { btn.textContent = '🎵 ON'; btn.classList.add('playing'); }
  }

  if (estadoPartida === 'fin' || turnoActual !== 'USSR') return;

  const rect = canvas.getBoundingClientRect();
  const sq = board.getSquareAt(e.clientX - rect.left, e.clientY - rect.top);
  if (!sq) return;

  const target = attackTargets.find(u => u.col === sq.col && u.row === sq.row);
  if (target && selectedUnit) { executeAttack(selectedUnit, target); return; }

  const moveSq = validMoves.find(s => s.col === sq.col && s.row === sq.row);
  if (moveSq && selectedUnit) { executeMove(selectedUnit, sq.col, sq.row); return; }

  const clicked = units.find(u => u.alive && u.col === sq.col && u.row === sq.row);
  if (clicked && clicked.faction === 'USSR') { selectUnit(clicked); return; }

  selectedUnit = null; validMoves = []; attackTargets = [];
});

// ====== MÚSICA ======
function toggleMusic() {
  if (typeof BattleMusic === 'undefined') return;
  const btn = document.getElementById('btn-music');
  const song = turnoActual === 'USSR' ? 'katyusha' : 'erika';
  const playing = BattleMusic.toggle(song);
  if (btn) {
    btn.textContent = playing ? '🎵 ON' : '🎵 OFF';
    btn.classList.toggle('playing', playing);
  }
}

// ====== ARRANQUE ======
setupBoard();
startTurn();
requestAnimationFrame(render); 