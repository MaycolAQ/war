/**
 * Battle of Kursk 1943 - Juego táctico por turnos
 * Tablero 8x8, selección, movimiento, ataque y bot GER básico.
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

// ====== SELECCIÓN ======
function selectUnit(unit) {
  selectedUnit = unit;
  validMoves = [];
  attackTargets = [];

  if (!unit || unit.hasMoved === undefined) return;

  // Calcular casillas de movimiento
  if (!unit.hasMoved) {
    for (const sq of board.squares) {
      if (unit.canMoveTo(sq.col, sq.row, board.squares, units)) {
        validMoves.push(sq);
      }
    }
  }

  // Calcular enemigos atacables
  if (!unit.hasAttacked) {
    for (const u of units) {
      if (u.alive && u.faction !== unit.faction && unit.canAttack(u)) {
        attackTargets.push(u);
      }
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
}

function executeAttack(attacker, target) {
  // Daño con variación ±20%
  const dmg = Math.round(attacker.damage * (0.8 + Math.random() * 0.4));
  target.takeDamage(dmg);
  attacker.hasAttacked = true;

  updateHud();

  if (!target.alive) {
    checkGameOver();
  }
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
}

function checkGameOver() {
  const ussrAlive  = units.some(u => u.alive && u.faction === 'USSR');
  const gerAlive   = units.some(u => u.alive && u.faction === 'GER');
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
}

// ====== BOT SIMPLE PARA GER ======
function botTurn() {
  if (estadoPartida === 'fin') return;
  const myUnits = units.filter(u => u.alive && u.faction === 'GER');
  const enemies = units.filter(u => u.alive && u.faction === 'USSR');
  if (!myUnits.length || !enemies.length) return;

  const unit   = myUnits[0];
  const target = enemies[0];

  // 1. ¿Puede atacar ya?
  if (unit.canAttack(target)) {
    executeAttack(unit, target);
    setTimeout(endTurn, 600);
    return;
  }

  // 2. Si no, avanzar un paso hacia el enemigo
  const dx = Math.sign(target.col - unit.col);
  const dy = Math.sign(target.row - unit.row);
  const candidates = [];
  if (dx !== 0) candidates.push({ col: unit.col + dx, row: unit.row });
  if (dy !== 0) candidates.push({ col: unit.col, row: unit.row + dy });

  let moved = false;
  for (const c of candidates) {
    if (unit.canMoveTo(c.col, c.row, board.squares, units)) {
      unit.setSquare(c.col, c.row);
      unit.hasMoved = true;
      moved = true;
      break;
    }
  }

  // 3. Tras moverse, ¿puede atacar?
  setTimeout(() => {
    if (unit.canAttack(target)) {
      executeAttack(unit, target);
    }
    setTimeout(endTurn, 500);
  }, moved ? 600 : 100);
}

// ====== DIBUJO ======
function drawHighlights(ctx) {
  // Casillas de movimiento (azul)
  for (const sq of validMoves) {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }

  // Enemigos atacables (rojo)
  for (const t of attackTargets) {
    const sq = board.squares.find(s => s.col === t.col && s.row === t.row);
    if (!sq) continue;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
  }

  // Casilla seleccionada (dorado)
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

  // Fondo exterior
  ctx.fillStyle = '#2b3d2b';
  ctx.fillRect(0, 0, W, H);

  board.draw(ctx, W, H);
  drawHighlights(ctx);

  units.filter(u => !u.alive).forEach(u => u.draw(ctx, board.squares));
  units.filter(u =>  u.alive).forEach(u => u.draw(ctx, board.squares));

  requestAnimationFrame(render);
}

// ====== INTERACCIÓN TÁCTIL ======
canvas.addEventListener('pointerdown', (e) => {
  if (estadoPartida === 'fin') return;
  if (turnoActual !== 'USSR') return; // El jugador solo actúa en su turno

  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const sq = board.getSquareAt(px, py);
  if (!sq) return;

  // 1. ¿Tocó un enemigo en rango? → Atacar
  const target = attackTargets.find(u => u.col === sq.col && u.row === sq.row);
  if (target && selectedUnit) {
    executeAttack(selectedUnit, target);
    return;
  }

  // 2. ¿Tocó una casilla de movimiento válida? → Mover
  const moveSq = validMoves.find(s => s.col === sq.col && s.row === sq.row);
  if (moveSq && selectedUnit) {
    executeMove(selectedUnit, sq.col, sq.row);
    return;
  }

  // 3. ¿Tocó una unidad propia? → Seleccionar
  const clicked = units.find(u => u.alive && u.col === sq.col && u.row === sq.row);
  if (clicked && clicked.faction === 'USSR') {
    selectUnit(clicked);
    return;
  }

  // 4. Tocó vacío → deseleccionar
  selectedUnit = null;
  validMoves = [];
  attackTargets = [];
});

// ====== ARRANQUE ======
setupBoard();
startTurn();
requestAnimationFrame(render);
function resetBattle() { setupBoard(); startTurn(); }