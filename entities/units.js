/*
 * Battle of Kursk 1943 - Unidades tácticas (estilo ajedrez)
 * Piezas estáticas en casillas, con estadísticas de mesa.
 */
class Unit {
  constructor(cfg) {
    this.id = cfg.id;
    this.faction = cfg.faction;
    this.name = cfg.name;
    this.maxHp = cfg.maxHp;
    this.hp = cfg.maxHp;
    this.moveRange = cfg.moveRange;
    this.attackRange = cfg.attackRange;
    this.damage = cfg.damage;
    this.col = cfg.col;
    this.row = cfg.row;
    this.hasMoved = false;
    this.hasAttacked = false;
    this.alive = true;
    this.renderX = null;
    this.renderY = null;
    this.shakeTime = 0;
  }

  setSquare(col, row) {
    this.col = col;
    this.row = row;
  }

  getPixelCenter(squares) {
    const sq = squares.find(s => s.col === this.col && s.row === this.row);
    if (!sq) return { x: 0, y: 0 };
    return { x: sq.x + sq.size / 2, y: sq.y + sq.size / 2 };
  }

  canMoveTo(col, row, squares, allUnits) {
    if (this.hasMoved || !this.alive) return false;
    const dist = Math.abs(col - this.col) + Math.abs(row - this.row);
    if (dist === 0 || dist > this.moveRange) return false;
    if (allUnits.some(u => u.alive && u.col === col && u.row === row)) return false;
    return squares.some(s => s.col === col && s.row === row);
  }

  canAttack(target) {
    if (this.hasAttacked || !this.alive || !target || !target.alive) return false;
    const dist = Math.abs(target.col - this.col) + Math.abs(target.row - this.row);
    return dist <= this.attackRange && dist > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.alive = false;
  }

  shake(intensity = 8) {
    this.shakeTime = intensity;
  }

  draw(ctx, squares) {
    const center = this.getPixelCenter(squares);
    if (this.renderX === null) {
      this.renderX = center.x;
      this.renderY = center.y;
    }
    this.renderX += (center.x - this.renderX) * 0.22;
    this.renderY += (center.y - this.renderY) * 0.22;
    const x = this.renderX;
    const y = this.renderY;
    let shakeX = 0, shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeTime;
      shakeY = (Math.random() - 0.5) * this.shakeTime;
      this.shakeTime *= 0.85;
      if (this.shakeTime < 0.3) this.shakeTime = 0;
    }
    const sq = squares.find(s => s.col === this.col && s.row === this.row);
    const scale = sq ? sq.size / 60 : 1;
    ctx.save();
    ctx.translate(x + shakeX, y + shakeY);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const isUSSR = this.faction === 'USSR';
    const hullColor = isUSSR ? '#39ff14' : '#ff006e';
    const turretColor = isUSSR ? '#b7ff5e' : '#ff78ae';
    ctx.fillStyle = '#090b1a';
    ctx.fillRect(-24, 4, 48, 12);
    ctx.fillStyle = hullColor;
    ctx.fillRect(-22, -6, 44, 12);
    ctx.fillStyle = turretColor;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = turretColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(isUSSR ? 22 : -22, -8);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isUSSR ? '★' : '✚', 0, 0);
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(-20, -30, 40, 4);
    ctx.fillStyle = hpPct > 0.6 ? '#39ff14' : hpPct > 0.3 ? '#ffd60a' : '#ff006e';
    ctx.fillRect(-20, -30, 40 * hpPct, 4);
    ctx.restore();
  }
}
