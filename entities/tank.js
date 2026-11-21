/**
 * Battle of Kursk 1943 - Armored Vehicle Base Class
 * Handles movement, wheel rotation, gun elevation, barrel & chassis recoil, and historical rendering.
 */

class Tank {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.faction = config.faction; // 'USSR' or 'GER'
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.direction = config.direction || 1; // 1 = facing right (USSR), -1 = facing left (GER)

    // Historical & Combat Specs
    this.maxHp = config.maxHp || 100;
    this.hp = this.maxHp;
    this.speed = config.speed || 0.4;
    this.armorMm = config.armorMm || 45;
    this.armorSlope = config.armorSlope || 0;
    this.penetration = config.penetration || 90;
    this.baseDamage = config.baseDamage || 30;
    this.reloadTime = config.reloadTime || 2500;
    this.lastFireTime = 0;

    // Visual & Mechanical Animation State
    this.hullColor = config.hullColor || '#3f6212';
    this.turretColor = config.turretColor || '#4d7c0f';
    this.barrelLength = config.barrelLength || 48;
    this.gunAngle = 0; // Elevation angle in radians
    this.targetGunAngle = -0.08;
    this.barrelRecoil = 0; // Barrel sliding back inside mantlet
    this.chassisRecoil = 0; // Whole hull rocking back
    this.wheelPhase = 0; // Track & road-wheel animation angle
    this.suspensionBounce = 0;
  }

  /**
   * Advances the tank across the terrain and animates tracks & suspension
   */
  move(targetX, groundY) {
    this.y = groundY;
    if (this.hp <= 0) return false;

    const distanceToStop = Math.abs(targetX - this.x);
    if (distanceToStop > 4) {
      this.x += this.direction * this.speed;
      this.wheelPhase += this.direction * this.speed * 0.18;
      this.suspensionBounce = Math.sin(this.wheelPhase * 2) * 0.7;
      return true; // Tank is actively moving
    } else {
      this.suspensionBounce *= 0.85;
      return false;
    }
  }

  /**
   * Smoothly aims the main cannon elevation toward an enemy coordinate
   */
  aimAt(enemyX, enemyY) {
    if (this.hp <= 0) return;
    const dx = Math.abs(enemyX - this.x);
    // Slight ballistic arc compensation based on distance
    const arcLift = Math.min(0.24, dx * 0.00028);
    this.targetGunAngle = -arcLift;
    this.gunAngle += (this.targetGunAngle - this.gunAngle) * 0.08;
  }

  /**
   * Triggers cannon fire, applies dual recoil (barrel + hull), and returns shell spawn data
   */
  fire(now = Date.now()) {
    if (this.hp <= 0) return null;
    if (now - this.lastFireTime < 450) return null; // Minimum mechanical safety lock

    this.lastFireTime = now;
    const isHeavy = this.faction === 'GER';

    // Apply realistic recoil impulses
    this.barrelRecoil = isHeavy ? 11 : 8;
    this.chassisRecoil = isHeavy ? 7 : 5;

    const muzzlePos = this.getMuzzlePosition();
    const shellSpeed = isHeavy ? 14.5 : 11.8;

    return {
      owner: this.id,
      startX: this.x,
      x: muzzlePos.x,
      y: muzzlePos.y,
      vx: Math.cos(this.gunAngle) * shellSpeed * this.direction,
      vy: Math.sin(this.gunAngle) * shellSpeed,
      penetration: this.penetration,
      baseDamage: this.baseDamage,
      isHeavy
    };
  }

  /**
   * Calculates exact world coordinates of the cannon tip
   */
  getMuzzlePosition() {
    const pivotX = this.x - this.chassisRecoil * this.direction;
    const pivotY = this.y - (this.faction === 'GER' ? 38 : 33) + this.suspensionBounce;
    const effectiveLength = this.barrelLength - this.barrelRecoil;

    return {
      x: pivotX + Math.cos(this.gunAngle) * effectiveLength * this.direction,
      y: pivotY + Math.sin(this.gunAngle) * effectiveLength
    };
  }

  /**
   * Updates recoil recovery every frame
   */
  update() {
    this.barrelRecoil *= 0.86;
    this.chassisRecoil *= 0.84;
  }

  /**
   * Renders the tank onto the 2D Canvas
   */
  draw(ctx) {
    ctx.save();
    const drawX = this.x - this.chassisRecoil * this.direction;
    const drawY = this.y + this.suspensionBounce;

    // Darken armor if destroyed
    const isDead = this.hp <= 0;
    const hullFill = isDead ? '#1c1917' : this.hullColor;
    const turretFill = isDead ? '#292524' : this.turretColor;

    if (this.faction === 'USSR') {
      this.drawSovietTank(ctx, drawX, drawY, hullFill, turretFill, isDead);
    } else {
      this.drawGermanTank(ctx, drawX, drawY, hullFill, turretFill, isDead);
    }

    ctx.restore();
  }

  drawSovietTank(ctx, x, y, hullFill, turretFill, isDead) {
    // 1. Caterpillar Tracks & Road Wheels
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(x - 38, y - 14, 76, 14, 6);
    ctx.fill();

    // Animated Christie Suspension Wheels
    ctx.fillStyle = '#334155';
    for (let i = -28; i <= 28; i += 14) {
      ctx.beginPath();
      ctx.arc(x + i, y - 7, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Iconic Sloped Hull (T-34)
    ctx.fillStyle = hullFill;
    ctx.beginPath();
    ctx.moveTo(x - 36, y - 14);
    ctx.lineTo(x - 28, y - 27);
    ctx.lineTo(x + 26, y - 27);
    ctx.lineTo(x + 40, y - 14);
    ctx.closePath();
    ctx.fill();

    // Red Star Emblem
    if (!isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x - 4, y - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Rotating/Elevating 76mm Cannon Barrel
    ctx.save();
    ctx.translate(x + 12, y - 33);
    ctx.rotate(this.gunAngle);
    ctx.fillStyle = turretFill;
    ctx.fillRect(-this.barrelRecoil, -2.2, this.barrelLength, 4.4);
    ctx.restore();

    // 4. Cast Turret
    ctx.fillStyle = turretFill;
    ctx.beginPath();
    ctx.roundRect(x - 15, y - 39, 32, 13, 5);
    ctx.fill();
  }

  drawGermanTank(ctx, x, y, hullFill, turretFill, isDead) {
    // 1. Wide Heavy Tracks & Interleaved Wheels
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(x - 46, y - 16, 92, 16, 5);
    ctx.fill();

    ctx.fillStyle = '#334155';
    for (let i = -34; i <= 34; i += 13.5) {
      ctx.beginPath();
      ctx.arc(x + i, y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Heavy Boxy Hull (Tiger I)
    ctx.fillStyle = hullFill;
    ctx.fillRect(x - 44, y - 32, 88, 17);

    // Balkenkreuz (German Cross Emblem)
    if (!isDead) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(x + 4, y - 26, 7, 2);
      ctx.fillRect(x + 6.5, y - 28.5, 2, 7);
    }

    // 3. Heavy 88mm KwK 36 Cannon with Muzzle Brake
    ctx.save();
    ctx.translate(x - 16, y - 38);
    ctx.rotate(-this.gunAngle); // Mirrored direction
    ctx.fillStyle = turretFill;
    const barrelLen = this.barrelLength;
    ctx.fillRect(-(barrelLen - this.barrelRecoil), -2.5, barrelLen, 5);
    // Double-baffle Muzzle Brake
    ctx.fillRect(-(barrelLen + 5 - this.barrelRecoil), -4.2, 6, 8.4);
    ctx.restore();

    // 4. Heavy Turret & Commander Cupola
    ctx.fillStyle = turretFill;
    ctx.fillRect(x - 20, y - 46, 42, 15);
    ctx.fillRect(x - 4, y - 50, 12, 4); // Cupola
  }
}
