/**
 * Tank pieces used by the turn-based board game.
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
    const square = squares.find((item) => item.col === this.col && item.row === this.row);
    return square ? { x: square.x + square.size / 2, y: square.y + square.size / 2 } : { x: 0, y: 0 };
  }

  canMoveTo(col, row, squares, allUnits) {
    if (this.hasMoved || !this.alive) return false;
    const distance = Math.abs(col - this.col) + Math.abs(row - this.row);
    if (distance < 1 || distance > this.moveRange) return false;
    if (allUnits.some((unit) => unit.alive && unit.col === col && unit.row === row)) return false;
    return squares.some((square) => square.col === col && square.row === row);
  }

  canAttack(target) {
    if (this.hasAttacked || !this.alive || !target || !target.alive || target.faction === this.faction) return false;
    const distance = Math.abs(target.col - this.col) + Math.abs(target.row - this.row);
    return distance > 0 && distance <= this.attackRange;
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
    this.renderX += (center.x - this.renderX) * 0.24;
    this.renderY += (center.y - this.renderY) * 0.24;
    const square = squares.find((item) => item.col === this.col && item.row === this.row);
    const scale = square ? square.size / 60 : 1;
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeTime > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeTime;
      shakeY = (Math.random() - 0.5) * this.shakeTime;
      this.shakeTime *= 0.82;
      if (this.shakeTime < 0.3) this.shakeTime = 0;
    }

    ctx.save();
    ctx.translate(this.renderX + shakeX, this.renderY + shakeY);
    ctx.scale(scale, scale);
    const isSoviet = this.faction === 'USSR';
    const body = isSoviet ? '#66813e' : '#71808b';
    const detail = isSoviet ? '#a8bd68' : '#bdc8ce';

    // Tracks and hull make each unit clearly recognizable as a tank, even on mobile.
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(0, 13, 27, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#252b27';
    ctx.beginPath();
    ctx.roundRect(-26, -1, 52, 19, 5);
    ctx.fill();
    ctx.fillStyle = '#7b8176';
    for (let x = -20; x <= 16; x += 9) {
      ctx.beginPath();
      ctx.arc(x, 8, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-21, -8);
    ctx.lineTo(14, -8);
    ctx.lineTo(22, 1);
    ctx.lineTo(19, 8);
    ctx.lineTo(-19, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = detail;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Turret and cannon point toward the opposing side.
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, -8, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = detail;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(isSoviet ? 4 : -4, -9);
    ctx.lineTo(isSoviet ? 27 : -27, -9);
    ctx.stroke();
    ctx.fillStyle = isSoviet ? '#f0d26c' : '#e8b8a8';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isSoviet ? '★' : '✚', 0, -5);

    const health = this.hp / this.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,.75)';
    ctx.fillRect(-21, -28, 42, 5);
    ctx.fillStyle = health > 0.6 ? '#65cf72' : health > 0.3 ? '#e6bb43' : '#ef5350';
    ctx.fillRect(-21, -28, 42 * health, 5);
    ctx.restore();
  }
}
