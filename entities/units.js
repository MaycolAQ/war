/**
 * Battle of Kursk 1943 - Unidades tácticas (estilo ajedrez)
 * Piezas estáticas en casillas, con estadísticas de mesa.
 */

class Unit {
  constructor(cfg) {
    this.id        = cfg.id;
    this.faction   = cfg.faction;   // 'USSR' | 'GER'
    this.name      = cfg.name;
    this.maxHp     = cfg.maxHp;
    this.hp        = cfg.maxHp;
    this.moveRange = cfg.moveRange;   // casillas que puede moverse
    this.attackRange = cfg.attackRange; // casillas a las que puede disparar
    this.damage    = cfg.damage;      // daño base al atacar

    // Posición en el tablero (casilla, no píxeles)
    this.col = cfg.col;
    this.row = cfg.row;

    // Estado de juego
    this.hasMoved   = false;
    this.hasAttacked = false;
    this.alive      = true;
// Para animación de deslizamiento entre casillas
this.renderX = null;
this.renderY = null;
// Para animación de sacudida al recibir daño
this.shakeTime = 0;
  }

  /** Coloca la unidad en una casilla (col,row) */
  setSquare(col, row) {
    this.col = col;
    this.row = row;
  }

  /** Devuelve el centro en píxeles de la casilla en la que está */
  getPixelCenter(squares) {
    const sq = squares.find(s => s.col === this.col && s.row === this.row);
    if (!sq) return { x: 0, y: 0 };
    return { x: sq.x + sq.size / 2, y: sq.y + sq.size / 2 };
  }

  /** Comprueba si esta unidad puede moverse a (col,row) */
  canMoveTo(col, row, squares, allUnits) {
    if (this.hasMoved || !this.alive) return false;

    // Distancia Manhattan (movimiento ortogonal, como ajedrez)
    const dist = Math.abs(col - this.col) + Math.abs(row - this.row);
    if (dist === 0 || dist > this.moveRange) return false;

    // No puede caer sobre otra unidad
    if (allUnits.some(u => u.alive && u.col === col && u.row === row)) return false;

    // Debe existir la casilla
    return squares.some(s => s.col === col && s.row === row);
  }

  /** Comprueba si esta unidad puede atacar a target */
  canAttack(target) {
    if (this.hasAttacked || !this.alive || !target || !target.alive) return false;
    const dist = Math.abs(target.col - this.col) + Math.abs(target.row - this.row);
    return dist <= this.attackRange && dist > 0;
  }

  /** Aplica daño */
  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.alive = false;
  }

  /** Dibuja el tanque centrado en su casilla */
  draw(ctx, squares) {
  const center = this.getPixelCenter(squares);
  if (this.renderX === null) {
    this.renderX = center.x;
    this.renderY = center.y;
  }
  // Interpolación suave hacia la casilla destino
  this.renderX += (center.x - this.renderX) * 0.22;
  this.renderY += (center.y - this.renderY) * 0.22;
  const x = this.renderX;
  const y = this.renderY;
// Sacudida al recibir daño
let shakeX = 0, shakeY = 0;
if (this.shakeTime > 0) {
  shakeX = (Math.random() - 0.5) * this.shakeTime;
  shakeY = (Math.random() - 0.5) * this.shakeTime;
  this.shakeTime *= 0.85;
  if (this.shakeTime < 0.3) this.shakeTime = 0;
}
    const sq = squares.find(s => s.col === this.col && s.row === this.row);
    const scale = sq ? sq.size / 60 : 1; // se adapta al tamaño de la casilla

    ctx.save();
    ctx.translate(x + shakeX, y + shakeY);
    ctx.scale(scale, scale);

    // Sombra bajo el tanque
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Color según bando
    const isUSSR = this.faction === 'USSR';
    const hullColor   = isUSSR ? '#3f6212' : '#475569';
    const turretColor = isUSSR ? '#4d7c0f' : '#64748b';

    // Orugas
    ctx.fillStyle = '#1c1947';
    ctx.fillRect(-24, 4, 48, 12);

    // Casco
    ctx.fillStyle = hullColor;
    ctx.fillRect(-22, -6, 44, 12);

    // Torreta
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cañón (mira hacia el enemigo)
    ctx.strokeStyle = turretColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(isUSSR ? 22 : -22, -8);
    ctx.stroke();

    // Marca de bando
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isUSSR ? '★' : '✚', 0, 0);

    // Barra de HP encima
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(-20, -30, 40, 4);
    ctx.fillStyle = hpPct > 0.6 ? '#22c55e' : hpPct > 0.3 ? '#eab308' : '#ef4444';
    ctx.fillRect(-20, -30, 40 * hpPct, 4);

    ctx.restore();
  }
}
/** Provoca sacudida al recibir daño */
shake(intensity = 8) {
  this.shakeTime = intensity;
}