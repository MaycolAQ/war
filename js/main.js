/**
 * Batalla táctica por turnos: movimiento y disparo sobre un tablero 8x8.
 */
const canvas = document.getElementById('battlefield');
const ctx = canvas.getContext('2d');
let W = 0;
let H = 0;
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

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  // The canvas starts inside a hidden screen. Keep its old dimensions until it is visible.
  if (rect.width < 1 || rect.height < 1) return;
  W = Math.round(rect.width);
  H = Math.round(rect.height);
  canvas.width = W;
  canvas.height = H;
  board.layout(W, H);
}
window.resizeBattlefield = resizeCanvas;
window.addEventListener('resize', resizeCanvas);

function getSquareCenter(col, row) {
  const square = board.squares.find((item) => item.col === col && item.row === row);
  return square ? { x: square.x + square.size / 2, y: square.y + square.size / 2 } : null;
}

function cerrarTutorial() {
  const tutorial = document.getElementById('tutorial');
  if (tutorial) tutorial.classList.add('oculto');
}

function setupBoard() {
  resizeCanvas();
  if (!W || !H) {
    W = canvas.width = window.innerWidth;
    H = canvas.height = Math.round(window.innerHeight * 0.72);
  }
  board.layout(W, H);

  const mission = window.CAMPAIGN_MISSION;
  const soviet = mission ? {
    id: 't34-1', faction: 'USSR', name: mission.soviet, maxHp: mission.maxHp,
    moveRange: mission.moveRange, attackRange: mission.attackRange, damage: mission.damage,
    col: mission.positions.soviet[0], row: mission.positions.soviet[1]
  } : {
    id: 't34-1', faction: 'USSR', name: 'T-34/76', maxHp: 100,
    moveRange: 2, attackRange: 2, damage: 28, col: 1, row: 3
  };
  const german = mission ? {
    id: 'tiger-1', faction: 'GER', name: mission.german, maxHp: mission.enemyHp,
    moveRange: mission.enemyMove, attackRange: mission.enemyAttack, damage: mission.enemyDamage,
    col: mission.positions.german[0], row: mission.positions.german[1]
  } : {
    id: 'tiger-1', faction: 'GER', name: 'Tiger I', maxHp: 150,
    moveRange: 1, attackRange: 2, damage: 48, col: 6, row: 4
  };

  units = [new Unit(soviet), new Unit(german)];
  turnoActual = 'USSR';
  estadoPartida = 'jugando';
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  particles = [];
  shockwaves = [];
  floatingTexts = [];
  camera.shake = 0;

  const finishOverlay = document.getElementById('fin-partida');
  if (finishOverlay) finishOverlay.classList.add('oculto');
  updateHud();
  actualizarIndicadorTurno();
}

function updateHud() {
  const soviet = units.find((unit) => unit.faction === 'USSR');
  const german = units.find((unit) => unit.faction === 'GER');
  const sovietBar = document.getElementById('hp-t34');
  const germanBar = document.getElementById('hp-tiger');
  if (soviet && sovietBar) sovietBar.style.width = `${(soviet.hp / soviet.maxHp) * 100}%`;
  if (german && germanBar) germanBar.style.width = `${(german.hp / german.maxHp) * 100}%`;
}

function actualizarIndicadorTurno() {
  const indicator = document.getElementById('turn-indicator');
  if (!indicator) return;
  const active = turnoActual === 'USSR' ? 'SOVIÉTICO' : 'ALEMÁN';
  indicator.textContent = `TURNO: ${active}`;
  indicator.classList.toggle('turno-ussr', turnoActual === 'USSR');
  indicator.classList.toggle('turno-ger', turnoActual === 'GER');
}

function startTurn() {
  units.filter((unit) => unit.alive && unit.faction === turnoActual).forEach((unit) => {
    unit.hasMoved = false;
    unit.hasAttacked = false;
  });
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
  actualizarIndicadorTurno();
  if (turnoActual === 'GER') window.setTimeout(botTurn, 700);
}

function endTurn() {
  if (estadoPartida === 'fin') return;
  turnoActual = turnoActual === 'USSR' ? 'GER' : 'USSR';
  startTurn();
}
function passTurn() { endTurn(); }
function resetBattle() { setupBoard(); startTurn(); }

function selectUnit(unit) {
  selectedUnit = unit;
  validMoves = [];
  attackTargets = [];
  if (!unit || !unit.alive) return;

  if (!unit.hasMoved) {
    validMoves = board.squares.filter((square) =>
      unit.canMoveTo(square.col, square.row, board.squares, units)
    );
  }
  if (!unit.hasAttacked) {
    attackTargets = units.filter((target) =>
      target.alive && target.faction !== unit.faction && unit.canAttack(target)
    );
  }
}

function executeMove(unit, col, row) {
  unit.setSquare(col, row);
  unit.hasMoved = true;
  const center = getSquareCenter(col, row);
  if (center && typeof PhysicsEngine !== 'undefined') {
    PhysicsEngine.spawnParticles(particles, center.x, center.y + 10, 10, {
      colors: ['#78716c', '#a8a29e'], speedMin: 0.5, speedMax: 2,
      sizeMin: 4, sizeMax: 8, decay: 0.03, buoyancy: -0.02
    });
  }
  // Keep the unit selected after moving so an in-range enemy is immediately highlighted.
  selectUnit(unit);
}

function executeAttack(attacker, target) {
  if (!attacker.canAttack(target)) return;
  const damage = Math.round(attacker.damage * (0.8 + Math.random() * 0.4));
  const center = getSquareCenter(target.col, target.row);
  if (typeof BattleAudio !== 'undefined') {
    BattleAudio.playCannonFire(attacker.faction === 'GER');
    window.setTimeout(() => BattleAudio.playExplosion(true), 120);
  }
  if (center && typeof PhysicsEngine !== 'undefined') {
    const attackerCenter = getSquareCenter(attacker.col, attacker.row);
    if (attackerCenter) PhysicsEngine.createMuzzleFlash(particles, attackerCenter.x, attackerCenter.y - 20, target.col >= attacker.col ? 1 : -1);
    PhysicsEngine.createExplosion(particles, shockwaves, center.x, center.y - 10, 1.1);
    floatingTexts.push({ x: center.x, y: center.y - 30, text: `-${damage}`, color: '#ef4444', alpha: 1, vy: -0.6 });
  }
  if (target.shake) target.shake(10);
  target.takeDamage(damage);
  attacker.hasAttacked = true;
  camera.shake = 14;
  if (!target.alive) {
    if (center && typeof PhysicsEngine !== 'undefined') PhysicsEngine.createWreck(particles, shockwaves, center.x, center.y - 10);
    camera.shake = 22;
    window.setTimeout(checkGameOver, 500);
  }
  updateHud();
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
}

function checkGameOver() {
  const sovietsAlive = units.some((unit) => unit.alive && unit.faction === 'USSR');
  const germansAlive = units.some((unit) => unit.alive && unit.faction === 'GER');
  if (!sovietsAlive || !germansAlive) {
    estadoPartida = 'fin';
    finPartida(sovietsAlive ? 'USSR' : 'GER');
  }
}

function finPartida(winner) {
  const overlay = document.getElementById('fin-partida');
  const title = document.getElementById('titulo-fin');
  const subtitle = document.getElementById('subtitulo-fin');
  if (!overlay) return;
  if (winner === 'USSR') {
    title.textContent = '¡VICTORIA SOVIÉTICA!';
    title.className = 'victoria-ussr';
    subtitle.textContent = 'El tanque enemigo ha sido destruido. Sector asegurado.';
  } else {
    title.textContent = '¡VICTORIA ALEMANA!';
    title.className = 'victoria-ger';
    subtitle.textContent = 'Tu tanque ha sido destruido. Puedes reintentar la misión.';
  }
  overlay.classList.remove('oculto');
  if (winner === 'USSR' && typeof PhysicsEngine !== 'undefined' && W && H) {
    for (let i = 0; i < 30; i++) PhysicsEngine.spawnParticles(particles, W / 2 + (Math.random() - 0.5) * W * 0.8, H / 2, 2, {
      colors: ['#ef4444', '#fbbf24', '#fef08a'], speedMin: 2, speedMax: 6,
      sizeMin: 3, sizeMax: 6, decay: 0.008, buoyancy: 0.04
    });
  }
}

function manhattan(a, b) { return Math.abs(a.col - b.col) + Math.abs(a.row - b.row); }

function botTurn() {
  if (estadoPartida === 'fin') return;
  const enemy = units.find((unit) => unit.alive && unit.faction === 'GER');
  const targets = units.filter((unit) => unit.alive && unit.faction === 'USSR');
  if (!enemy || !targets.length) return;
  const target = targets.reduce((nearest, unit) => manhattan(enemy, unit) < manhattan(enemy, nearest) ? unit : nearest);
  if (enemy.canAttack(target)) {
    executeAttack(enemy, target);
    window.setTimeout(endTurn, 800);
    return;
  }

  const candidates = board.squares
    .filter((square) => enemy.canMoveTo(square.col, square.row, board.squares, units))
    .sort((a, b) => manhattan({ col: a.col, row: a.row }, target) - manhattan({ col: b.col, row: b.row }, target));
  if (candidates.length) executeMove(enemy, candidates[0].col, candidates[0].row);
  window.setTimeout(() => {
    if (estadoPartida !== 'fin' && enemy.alive && target.alive && enemy.canAttack(target)) executeAttack(enemy, target);
    window.setTimeout(endTurn, 650);
  }, candidates.length ? 650 : 200);
}

function drawHighlights(context) {
  validMoves.forEach((square) => {
    context.fillStyle = 'rgba(56,189,248,.42)';
    context.fillRect(square.x + 2, square.y + 2, square.size - 4, square.size - 4);
    context.strokeStyle = 'rgba(56,189,248,.95)';
    context.lineWidth = 2;
    context.strokeRect(square.x + 2, square.y + 2, square.size - 4, square.size - 4);
  });
  attackTargets.forEach((target) => {
    const square = board.squares.find((item) => item.col === target.col && item.row === target.row);
    if (!square) return;
    context.fillStyle = 'rgba(239,68,68,.48)';
    context.fillRect(square.x + 2, square.y + 2, square.size - 4, square.size - 4);
    context.strokeStyle = '#ff5147';
    context.lineWidth = 3;
    context.strokeRect(square.x + 2, square.y + 2, square.size - 4, square.size - 4);
  });
  if (selectedUnit) {
    const square = board.squares.find((item) => item.col === selectedUnit.col && item.row === selectedUnit.row);
    if (square) {
      context.strokeStyle = '#f2c95c';
      context.lineWidth = 4;
      context.strokeRect(square.x + 2, square.y + 2, square.size - 4, square.size - 4);
    }
  }
}

function render() {
  if (canvas.width && canvas.height) {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (camera.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * camera.shake, (Math.random() - 0.5) * camera.shake);
      camera.shake *= 0.85;
    }
    ctx.fillStyle = '#2b3d2b';
    ctx.fillRect(0, 0, W, H);
    board.draw(ctx, W, H);
    drawHighlights(ctx);
    units.filter((unit) => !unit.alive).forEach((unit) => unit.draw(ctx, board.squares));
    units.filter((unit) => unit.alive).forEach((unit) => unit.draw(ctx, board.squares));
    if (typeof PhysicsEngine !== 'undefined') PhysicsEngine.updateEffects(ctx, particles, shockwaves, floatingTexts);
    ctx.restore();
  }
  requestAnimationFrame(render);
}

canvas.addEventListener('pointerdown', (event) => {
  if (typeof BattleMusic !== 'undefined' && !BattleMusic.isPlaying) {
    BattleMusic.start('katyusha');
    const musicButton = document.getElementById('btn-music');
    if (musicButton) musicButton.textContent = 'MÚSICA · ON ♫';
  }
  if (estadoPartida === 'fin' || turnoActual !== 'USSR') return;
  const rect = canvas.getBoundingClientRect();
  const square = board.getSquareAt(event.clientX - rect.left, event.clientY - rect.top);
  if (!square) return;

  const target = attackTargets.find((unit) => unit.col === square.col && unit.row === square.row);
  if (target && selectedUnit) { executeAttack(selectedUnit, target); return; }
  const move = validMoves.find((item) => item.col === square.col && item.row === square.row);
  if (move && selectedUnit) { executeMove(selectedUnit, square.col, square.row); return; }
  const clicked = units.find((unit) => unit.alive && unit.col === square.col && unit.row === square.row);
  if (clicked && clicked.faction === 'USSR') { selectUnit(clicked); return; }
  // Tapping an enemy out of range leaves the selected tank and its legal moves visible.
  if (clicked && clicked.faction === 'GER') return;
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
});

function toggleMusic() {
  if (typeof BattleMusic === 'undefined') return;
  const button = document.getElementById('btn-music');
  const song = turnoActual === 'USSR' ? 'katyusha' : 'erika';
  const playing = BattleMusic.toggle(song);
  if (button) button.textContent = playing ? 'MÚSICA · ON ♫' : 'MÚSICA · OFF ♫';
}

setupBoard();
startTurn();
requestAnimationFrame(render);
