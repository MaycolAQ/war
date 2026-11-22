/**
 * Battle of Kursk 1943 - Ballistics & Particle Physics Engine v2
 * Ballistics, hit zones, shell trails, wreck fire, and cinematic explosions.
 */

const PhysicsEngine = {
  gravity: 0.065,
  airDrag: 0.996,

  /**
   * Calculates armor penetration vs effective sloped armor.
   */
  calculateBallistics(shell, target, distance) {
    const rangeFalloff = Math.max(0.75, 1 - distance / 1800);
    const actualPen = shell.penetration * rangeFalloff * (0.9 + Math.random() * 0.25);

    const slopeRad = (target.armorSlope * Math.PI) / 180;
    const effectiveArmor = target.armorMm / Math.cos(slopeRad);

    const ricochetChance = target.armorSlope > 40 ? 0.28 : 0.08;
    const isRicochet = actualPen < effectiveArmor && Math.random() < ricochetChance;

    if (isRicochet) {
      return { penetrated: false, ricochet: true, damage: 0 };
    }

    if (actualPen >= effectiveArmor) {
      return {
        penetrated: true,
        ricochet: false,
        damage: Math.round(shell.baseDamage * (1.1 + Math.random() * 0.2))
      };
    } else {
      return {
        penetrated: false,
        ricochet: false,
        damage: Math.round(shell.baseDamage * 0.22)
      };
    }
  },

  /**
   * Spawns dynamic smoke, fire, or metallic sparks
   */
  spawnParticles(particles, x, y, count, options = {}) {
    const {
      colors = ['#fb923c', '#94a3b8'],
      speedMin = 1,
      speedMax = 5,
      sizeMin = 3,
      sizeMax = 10,
      decay = 0.02,
      buoyancy = -0.03,
      spreadAngle = Math.PI * 2,
      baseAngle = 0
    } = options;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: sizeMin + Math.random() * (sizeMax - sizeMin),
        alpha: 1,
        decay: decay * (0.8 + Math.random() * 0.4),
        buoyancy,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  },

  /**
   * Multi-layered explosion with shockwave, fireball, and dark smoke
   */
  createExplosion(particles, shockwaves, x, y, scale = 1) {
    shockwaves.push({
      x, y,
      radius: 4,
      maxRadius: 55 * scale,
      alpha: 0.9,
      lineWidth: 4 * scale
    });

    this.spawnParticles(particles, x, y, Math.round(24 * scale), {
      colors: ['#fef08a', '#f97316', '#ef4444'],
      speedMin: 1.5 * scale, speedMax: 6 * scale,
      sizeMin: 5 * scale, sizeMax: 13 * scale,
      decay: 0.032,
      buoyancy: -0.05
    });

    this.spawnParticles(particles, x, y - 4, Math.round(18 * scale), {
      colors: ['#1e293b', '#334155', '#0f172a'],
      speedMin: 0.8 * scale, speedMax: 3.5 * scale,
      sizeMin: 8 * scale, sizeMax: 18 * scale,
      decay: 0.014,
      buoyancy: -0.06
    });
  },

  /**
   * Metallic sparks when a shell bounces off sloped armor
   */
  createRicochet(particles, floatingTexts, shell) {
    this.spawnParticles(particles, shell.x, shell.y, 20, {
      colors: ['#fef08a', '#ffffff', '#fb923c'],
      speedMin: 4, speedMax: 10,
      sizeMin: 2, sizeMax: 4,
      decay: 0.04,
      buoyancy: 0.08,
      baseAngle: -Math.PI / 2,
      spreadAngle: Math.PI * 0.7
    });

    floatingTexts.push({
      x: shell.x,
      y: shell.y - 16,
      text: 'RICOCHET!',
      color: '#fde047',
      alpha: 1,
      vy: -0.8
    });
  },

  /**
   * Muzzle flash on firing
   */
  createMuzzleFlash(particles, x, y, direction) {
    particles.push({
      x, y,
      vx: direction * 0.3,
      vy: 0,
      size: 14,
      alpha: 1,
      decay: 0.18,
      buoyancy: 0,
      color: '#fef9c3'
    });
    this.spawnParticles(particles, x, y, 10, {
      colors: ['#fb923c', '#f97316', '#fde047'],
      speedMin: 2, speedMax: 7,
      sizeMin: 3, sizeMax: 7,
      decay: 0.09,
      buoyancy: -0.02,
      baseAngle: direction > 0 ? 0 : Math.PI,
      spreadAngle: 0.6
    });
  },

  /**
   * ✨ NUEVO: Estela de humo que deja el proyectil en su trayectoria
   */
  createShellTrail(particles, shell) {
    shell._trailTick = (shell._trailTick || 0) + 1;
    if (shell._trailTick % 3 !== 0) return;

    particles.push({
      x: shell.x - shell.vx * 0.4,
      y: shell.y - shell.vy * 0.4,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.1,
      size: 2 + Math.random() * 2,
      alpha: 0.55,
      decay: 0.045,
      buoyancy: -0.03,
      color: Math.random() < 0.3 ? '#fef08a' : '#94a3b8'
    });
  },

  /**
   * ✨ NUEVO: Fuego persistente que arde sobre un tanque destruido
   */
  createWreckFire(particles, x, y) {
    this.spawnParticles(particles, x, y, 20, {
      colors: ['#fef08a', '#f97316', '#ef4444', '#dc2626'],
      speedMin: 0.8, speedMax: 3.5,
      sizeMin: 6, sizeMax: 14,
      decay: 0.007,
      buoyancy: -0.1,
      baseAngle: -Math.PI / 2,
      spreadAngle: Math.PI * 0.8
    });
  },

  /**
   * ✨ MEJORADO: Wreck con explosión triple (impacto + cocción de munición)
   */
  createWreck(particles, shockwaves, x, y) {
    // 1. Explosión principal
    this.createExplosion(particles, shockwaves, x, y, 1.6);

    // 2. Chispas metálicas de la torreta
    this.spawnParticles(particles, x, y - 25, 24, {
      colors: ['#fef08a', '#fb923c', '#94a3b8'],
      speedMin: 3, speedMax: 9,
      sizeMin: 2, sizeMax: 5,
      decay: 0.035,
      buoyancy: 0.06,
      baseAngle: -Math.PI / 2,
      spreadAngle: Math.PI * 0.9
    });

    // 3. Columna de humo negro inicial
    this.spawnParticles(particles, x, y - 15, 30, {
      colors: ['#0f172a', '#1e293b', '#334155'],
      speedMin: 0.4, speedMax: 2.5,
      sizeMin: 10, sizeMax: 22,
      decay: 0.008,
      buoyancy: -0.08
    });

    // 4. Fuego persistente
    this.createWreckFire(particles, x, y - 10);

    // 5. Cocción de munición (explosiones secundarias retardadas)
    setTimeout(() => {
      this.createExplosion(particles, shockwaves, x + (Math.random() - 0.5) * 15, y - 10, 1.0);
      this.createWreckFire(particles, x, y - 10);
    }, 350);

    setTimeout(() => {
      this.createExplosion(particles, shockwaves, x + (Math.random() - 0.5) * 20, y - 10, 0.7);
    }, 750);
  },

  /**
   * Updates all active projectiles and resolves armor collisions
   */
  updateShells(ctx, state, shells, particles, shockwaves, craters, floatingTexts, callbacks) {
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.vx *= this.airDrag;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += this.gravity;

      // ✨ NUEVO: Estela de humo
      this.createShellTrail(particles, s);

      // Tracer trail
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Glowing AP Shell tip
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(s.x, s.y, 3.2, 0, Math.PI * 2);
      ctx.fill();

      const target = s.owner === 't34' ? state.tiger : state.t34;
      const hitWidth = target === state.tiger ? 44 : 36;

      const tankTopY = state.groundY - 70;
      if (target.hp > 0 &&
          Math.abs(s.x - target.x) < hitWidth &&
          s.y > tankTopY && s.y < state.groundY) {

        const distance = Math.abs(s.startX - target.x);
        const result = this.calculateBallistics(s, target, distance);

        if (result.ricochet) {
          this.createRicochet(particles, floatingTexts, s);
          if (callbacks.onRicochet) callbacks.onRicochet();
          s.vy = -Math.abs(s.vy) * 2.8 - 3;
          s.vx *= -0.45;
          s.owner = 'deflected';
          continue;
        }

        // ✨ NUEVO: Hit zone (torreta vs casco)
        const hitHeight = target.y - s.y;
        const isTurretHit = hitHeight > 25;
        const isHullHit   = hitHeight < 12;
        const zoneMult = isTurretHit ? 1.35 : (isHullHit ? 0.75 : 1.0);
        result.damage = Math.round(result.damage * zoneMult);

        target.hp = Math.max(0, target.hp - result.damage);
        this.createExplosion(particles, shockwaves, s.x, s.y, result.penetrated ? 1.25 : 0.75);

        // 🔥 Humo de daño (<40% HP)
        if (target.hp > 0 && target.hp < target.maxHp * 0.4 && Math.random() < 0.6) {
          this.spawnParticles(particles, target.x + (Math.random() - 0.5) * 15,
                              target.y - 25, 2, {
            colors: ['#1e293b', '#334155'],
            speedMin: 0.2, speedMax: 1,
            sizeMin: 5, sizeMax: 10,
            decay: 0.015,
            buoyancy: -0.06
          });
        }

        // ✨ NUEVO: Fuego vivo (<20% HP)
        if (target.hp > 0 && target.hp < target.maxHp * 0.2 && Math.random() < 0.5) {
          this.spawnParticles(particles, target.x + (Math.random() - 0.5) * 12,
                              target.y - 28, 2, {
            colors: ['#fef08a', '#f97316', '#ef4444'],
            speedMin: 0.3, speedMax: 1.5,
            sizeMin: 4, sizeMax: 9,
            decay: 0.012,
            buoyancy: -0.08
          });
        }

        // Texto del daño con zona
        let damageText;
        if (result.penetrated) {
          damageText = isTurretHit ? `TURRET! -${result.damage}` :
                       isHullHit   ? `HULL -${result.damage}` :
                                     `PENETRATION -${result.damage}`;
        } else {
          damageText = isTurretHit ? `TURRET HIT -${result.damage}` : `ARMOR HIT -${result.damage}`;
        }

        floatingTexts.push({
          x: s.x,
          y: s.y - 18,
          text: damageText,
          color: result.penetrated ? (isTurretHit ? '#fbbf24' : '#ef4444') : '#cbd5e1',
          alpha: 1,
          vy: -0.7
        });

        if (callbacks.onHit) callbacks.onHit(result.penetrated);
        shells.splice(i, 1);
        continue;
      }

      if (s.y >= state.groundY) {
        this.createExplosion(particles, shockwaves, s.x, state.groundY, 0.65);
        craters.push(s.x);
        shells.splice(i, 1);
        continue;
      }

      if (s.x < -100 || s.x > state.width + 100) {
        shells.splice(i, 1);
      }
    }
  },

  /**
   * Updates and renders particles, shockwaves, and tactical floating indicators
   */
  updateEffects(ctx, particles, shockwaves, floatingTexts) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.18;
      sw.alpha -= 0.045;
      ctx.strokeStyle = `rgba(254, 215, 170, ${Math.max(0, sw.alpha)})`;
      ctx.lineWidth = sw.lineWidth;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (sw.alpha <= 0) shockwaves.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.buoyancy;
      p.vx *= 0.97;
      p.alpha -= p.decay;
      p.size *= 1.015;

      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      if (p.alpha <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;

    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.018;
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      if (ft.alpha <= 0) floatingTexts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }
};