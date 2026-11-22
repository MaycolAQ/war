/**
 * Battle of Kursk 1943 - Controlador de juego de mesa
 * Estado actual: tablero + piezas en posición inicial (sin turnos aún).
 */

const canvas = document.getElementById('battlefield');
const ctx    = canvas.getContext('2d');

let W = 0, H = 0;

const board = new Board(8, 8);
let units = [];
let selectedUnit = null;

// ====== RESIZE ======
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  W = canvas.width  = rect.width  || window.innerWidth;
  H = canvas.height = rect.height || window.innerHeight * 0.75;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ====== SETUP INICIAL ======
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

  updateHud();
}

// ====== HUD ======
function updateHud() {
  const t34   = units.find(u => u.id === 't34-1');
  const tiger = units.find(u => u.id === 'tiger-1');
  const t34Bar   = document.getElementById('hp-t34');
  const tigerBar = document.getElementById('hp-tiger');
  if (t34 && t34Bar)     t34Bar.style.width   = (t34.hp / t34.maxHp) * 100 + '%';
  if (tiger && tigerBar) tigerBar.style.width = (tiger.hp / tiger.maxHp) * 100 + '%';
}

// ====== DIBUJO ======
function drawHighlight(ctx) {
  if (!selectedUnit) return;
  const sq = board.squares.find(s => s.col === selectedUnit.col && s.row === selectedUnit.row);
  if (!sq) return;
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 3;
  ctx.strokeRect(sq.x + 2, sq.y + 2, sq.size - 4, sq.size - 4);
}

function render() {
  ctx.clearRect(0, 0, W, H);

  // Fondo (fuera del tablero)
  ctx.fillStyle = '#2b3d2b';
  ctx.fillRect(0, 0, W, H);

  // Tablero
  board.draw(ctx, W, H);

  // Highlight de selección
  drawHighlight(ctx);

  // Unidades (primero las muertas para que las vivas queden encima)
  units.filter(u => !u.alive).forEach(u => u.draw(ctx, board.squares));
  units.filter(u =>  u.alive).forEach(u => u.draw(ctx, board.squares));

  requestAnimationFrame(render);
}

// ====== TAP EN EL TABLERO ======
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const sq = board.getSquareAt(px, py);
  if (!sq) return;

  // Por ahora solo selecciona/deselecciona tu propia unidad
  const clickedUnit = units.find(u => u.alive && u.col === sq.col && u.row === sq.row);
  if (clickedUnit && clickedUnit.faction === 'USSR') {
    selectedUnit = clickedUnit;
  } else {
    selectedUnit = null;
  }
});

// ====== ARRANQUE ======
setupBoard();
requestAnimationFrame(render);