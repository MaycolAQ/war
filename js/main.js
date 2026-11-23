/* Battle of Kursk 1943 - Juego táctico por turnos */
const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');
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
let impactFlashes = [];
let battleActive = false;
let renderFrameId = null;
const camera = { shake: 0 };

// El CSS nuevo es adicional: la campaña conserva su hoja de estilos original.
const arcadeStyles = document.createElement('link');
arcadeStyles.rel = 'stylesheet';
arcadeStyles.href = 'css/arcade.css';
document.head.appendChild(arcadeStyles);
const backButton = document.getElementById('back-to-campaign');
if (backButton) backButton.innerHTML = '← <span>VOLVER AL MAPA</span>';

function getSquareCenter(col, row) {
  const sq = board.squares.find(s => s.col === col && s.row === row);
  if (!sq) return null;
  return { x: sq.x + sq.size / 2, y: sq.y + sq.size / 2 };
}

function cerrarTutorial() {
  const t = document.getElementById('tutorial');
  if (t) t.classList.add('oculto');
}

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  const rect = container.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  W = canvas.width = Math.round(rect.width);
  H = canvas.height = Math.round(rect.height);
  board.layout(W, H);
}
window.addEventListener('resize', () => {
  if (battleActive) resizeCanvas();
});

function setupBoard() {
  board.layout(W, H);
  units = [
    new Unit({ id: 't34-1', faction: 'USSR', name: 'T-34/76', maxHp: 100, moveRange: 2, attackRange: 2, damage: 28, col: 1, row: 3 }),
    new Unit({ id: 'tiger-1', faction: 'GER', name: 'Tiger I', maxHp: 150, moveRange: 1, attackRange: 2, damage: 48, col: 6, row: 4 })
  ];
  turnoActual = 'USSR';
  estadoPartida = 'jugando';
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  particles = [];
  shockwaves = [];
  floatingTexts = [];
  impactFlashes = [];
  camera.shake = 0;
  const overlay = document.getElementById('fin-partida');
  if (overlay) overlay.classList.add('oculto');
  updateHud();
  actualizarIndicadorTurno();
}

function updateHud() {
  const t34 = units.find(u => u.id === 't34-1');
  const tiger = units.find(u => u.id === 'tiger-1');
  const t34Bar = document.getElementById('hp-t34');
  const tigerBar = document.getElementById('hp-tiger');
  if (t34 && t34Bar) t34Bar.style.width = (t34.hp / t34.maxHp) * 100 + '%';
  if (tiger && tigerBar) tigerBar.style.width = (tiger.hp / tiger.maxHp) * 100 + '%';
}

function actualizarIndicadorTurno() {
  const el = document.getElementById('turn-indicator');
  if (!el) return;
  el.textContent = turnoActual === 'USSR' ? 'TURNO: T-34' : 'TURNO: TIGER';
  el.classList.toggle('turno-ussr', turnoActual === 'USSR');
  el.classList.toggle('turno-ger', turnoActual === 'GER');
}

function startTurn() {
  units.filter(u => u.alive && u.faction === turnoActual).forEach(u => {
    u.hasMoved = false;
    u.hasAttacked = false;
  });
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  actualizarIndicadorTurno();
  if (battleActive && turnoActual === 'GER') setTimeout(botTurn, 700);
}
function endTurn() {
  if (!battleActive || estadoPartida === 'fin') return;
  turnoActual = turnoActual === 'USSR' ? 'GER' : 'USSR';
  startTurn();
}
function passTurn() { endTurn(); }
function resetBattle() { setupBoard(); startTurn(); }

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

function executeMove(unit, col, row) {
  unit.setSquare(col, row);
  unit.hasMoved = true;
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  const c = getSquareCenter(col, row);
  if (c && typeof PhysicsEngine !== 'undefined') {
    PhysicsEngine.spawnParticles(particles, c.x, c.y + 10, 12, {
      colors: ['#00e5ff', '#39ff14', '#a8a29e'], speedMin: 0.5, speedMax: 2,
      sizeMin: 3, sizeMax: 7, decay: 0.035, buoyancy: -0.02
    });
  }
}

function executeAttack(attacker, target) {
  const dmg = Math.round(attacker.damage * (0.8 + Math.random() * 0.4));
  const center = getSquareCenter(target.col, target.row);
  if (center) impactFlashes.push({ col: target.col, row: target.row, until: performance.now() + 100 });
  if (typeof BattleAudio !== 'undefined') {
    BattleAudio.playCannonFire(attacker.faction === 'GER');
    setTimeout(() => BattleAudio.playExplosion(true), 120);
  }
  if (center && typeof PhysicsEngine !== 'undefined') {
    const attackerCenter = getSquareCenter(attacker.col, attacker.row);
    if (attackerCenter) PhysicsEngine.createMuzzleFlash(particles, attackerCenter.x, attackerCenter.y - 20, target.col >= attacker.col ? 1 : -1);
    PhysicsEngine.createExplosion(particles, shockwaves, center.x, center.y - 10, 1.1);
    floatingTexts.push({ x: center.x, y: center.y - 30, text: `-${dmg}`, color: '#ff006e', alpha: 1, vy: -0.6 });
  }
  if (target.shake) target.shake(10);
  target.takeDamage(dmg);
  attacker.hasAttacked = true;
  camera.shake = 14;
  if (!target.alive) {
    if (center && typeof PhysicsEngine !== 'undefined') PhysicsEngine.createWreck(particles, shockwaves, center.x, center.y - 10);
    camera.shake = 22;
    setTimeout(checkGameOver, 900);
  }
  updateHud();
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
}

function checkGameOver() {
  if (!battleActive) return;
  const ussrAlive = units.some(u => u.alive && u.faction === 'USSR');
  const gerAlive = units.some(u => u.alive && u.faction === 'GER');
  if (!ussrAlive || !gerAlive) {
    estadoPartida = 'fin';
    finPartida(!ussrAlive ? 'GER' : 'USSR');
  }
}
function finPartida(ganador) {
  const overlay = document.getElementById('fin-partida');
  const titulo = document.getElementById('titulo-fin');
  const sub = document.getElementById('subtitulo-fin');
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
  if (typeof PhysicsEngine !== 'undefined' && W && H) {
    for (let i = 0; i < 30; i++) PhysicsEngine.spawnParticles(particles, W / 2 + (Math.random() - 0.5) * W * 0.8, H / 2, 2, {
      colors: ganador === 'USSR' ? ['#ff006e', '#ffd60a', '#fef08a'] : ['#00e5ff', '#cbd5e1', '#fef08a'],
      speedMin: 2, speedMax: 6, sizeMin: 3, sizeMax: 6, decay: 0.008, buoyancy: 0.04
    });
  }
}

function botTurn() {
  if (!battleActive || estadoPartida === 'fin') return;
  const myUnits = units.filter(u => u.alive && u.faction === 'GER');
  const enemies = units.filter(u => u.alive && u.faction === 'USSR');
  if (!myUnits.length || !enemies.length) return;
  const unit = myUnits[0];
  const target = enemies.reduce((a, b) => manhattan(unit, a) <= manhattan(unit, b) ? a : b);
  if (unit.canAttack(target)) {
    executeAttack(unit, target);
    setTimeout(endTurn, 900);
    return;
  }
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
    if (!battleActive || estadoPartida === 'fin') return;
    if (unit.canAttack(target)) executeAttack(unit, target);
    setTimeout(endTurn, 700);
  }, moved ? 800 : 200);
}
function manhattan(a, b) { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); }

function drawHighlights(context) {
  for (const sq of validMoves) {
    context.fillStyle = 'rgba(0, 229, 255, .35)';
    context.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    context.strokeStyle = '#00e5ff';
    context.lineWidth = 2;
    context.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }
  for (const t of attackTargets) {
    const sq = board.squares.find(s => s.col === t.col && s.row === t.row);
    if (!sq) continue;
    context.fillStyle = 'rgba(255, 0, 110, .42)';
    context.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    context.strokeStyle = '#ff006e';
    context.lineWidth = 3;
    context.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }
  if (selectedUnit) {
    const sq = board.squares.find(s => s.col === selectedUnit.col && s.row === selectedUnit.row);
    if (sq) {
      context.strokeStyle = '#ffd60a';
      context.lineWidth = 4;
      context.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    }
  }
}

function render() {
  if (!battleActive) { renderFrameId = null; return; }
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  if (camera.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * camera.shake, (Math.random() - 0.5) * camera.shake);
    camera.shake *= 0.85;
  }
  ctx.fillStyle = '#090b1a';
  ctx.fillRect(-20, -20, W + 40, H + 40);
  board.draw(ctx, W, H);
  drawHighlights(ctx);
  const now = performance.now();
  impactFlashes = impactFlashes.filter(flash => flash.until > now);
  for (const flash of impactFlashes) {
    const sq = board.squares.find(s => s.col === flash.col && s.row === flash.row);
    if (sq) { ctx.fillStyle = '#fff'; ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4); }
  }
  units.filter(u => !u.alive).forEach(u => u.draw(ctx, board.squares));
  units.filter(u => u.alive).forEach(u => u.draw(ctx, board.squares));
  if (typeof PhysicsEngine !== 'undefined') PhysicsEngine.updateEffects(ctx, particles, shockwaves, floatingTexts);
  ctx.restore();
  renderFrameId = requestAnimationFrame(render);
}

function activateBattle() {
  battleActive = true;
  document.body.classList.add('battle-active');
  // Wait for the campaign's display transition and CSS layout before measuring canvas.
  requestAnimationFrame(() => {
    resizeCanvas();
    setupBoard();
    startTurn();
    if (renderFrameId === null) renderFrameId = requestAnimationFrame(render);
  });
}
function deactivateBattle() {
  battleActive = false;
  document.body.classList.remove('battle-active');
  if (renderFrameId !== null) cancelAnimationFrame(renderFrameId);
  renderFrameId = null;
}

// Campaign owns visibility and persistence. Capture its navigation controls and only
// attach battle lifecycle work after its own click handler has completed.
document.addEventListener('click', event => {
  const id = event.target.closest('button')?.id;
  if (id === 'launch-mission') setTimeout(activateBattle, 0);
  if (id === 'back-to-campaign' || id === 'battle-result-back') setTimeout(deactivateBattle, 0);
}, true);

canvas.addEventListener('pointerdown', e => {
  if (!battleActive || estadoPartida === 'fin' || turnoActual !== 'USSR') return;
  if (typeof BattleMusic !== 'undefined' && !BattleMusic.isPlaying) {
    BattleMusic.start('katyusha');
    const btn = document.getElementById('btn-music');
    if (btn) { btn.textContent = '🎵 ON'; btn.classList.add('playing'); }
  }
  const rect = canvas.getBoundingClientRect();
  const sq = board.getSquareAt(e.clientX - rect.left, e.clientY - rect.top);
  if (!sq) return;
  const target = attackTargets.find(u => u.col === sq.col && u.row === sq.row);
  if (target && selectedUnit) { executeAttack(selectedUnit, target); return; }
  const moveSq = validMoves.find(s => s.col === sq.col && s.row === sq.row);
  if (moveSq && selectedUnit) { executeMove(selectedUnit, sq.col, sq.row); return; }
  const clicked = units.find(u => u.alive && u.col === sq.col && u.row === sq.row);
  if (clicked && clicked.faction === 'USSR') { selectUnit(clicked); return; }
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
});

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
