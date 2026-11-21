/**
 * Battle of Kursk 1943 - Ballistics & Particle Physics Engine
 * Handles projectile trajectory, sloped armor penetration, ricochets, smoke, and explosions.
 */

const PhysicsEngine = {
  gravity: 0.065,
  airDrag: 0.996,

  /**
   * Calculates armor penetration vs effective sloped armor.
   * T-34 has 45mm sloped at 60° (~90mm effective).
   * Tiger I has 100mm vertical armor.
   */
  calculateBallistics(shell, target, distance) {
    // Penetration drops slightly with distance
    const rangeFalloff = Math.max(0.75, 1 - distance / 1800);
    const actualPen = shell.penetration * rangeFalloff * (0.9 + Math.random() * 0.25);

    // Effective armor calculation: armor / cos(slopeAngle)
    const slopeRad = (target.armorSlope * Math.PI) / 180;
    const effectiveArmor = target.armorMm / Math.cos(slopeRad);

    // High-angle sloped armor has a chance to cause a ricochet
    const ricochetChance = target.armorSlope > 40 ? 0.28 : 0.08;
    const isRicochet = actualPen < effectiveArmor && Math.random() < ricochetChance;

    if (isRicochet) {
      return { penetrated: false, ricochet: true, damage: 0 };
    }

    if (actualPen >= effectiveArmor) {
      // Full penetration (critical internal damage)
      return {
        penetrated: true,
        ricochet: false,
        damage: Math.round(shell.baseDamage * (1.1 + Math.random() * 0.2))
      };
    } else {
      // Non-penetration spalling / track damage
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
      buoyancy = -0.03, // Negative = smoke rises
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
   * Generates a multi-layered explosion with shockwave ring, fireball, and dark smoke
   */
  createExplosion(particles, shockwaves, x, y, scale = 1) {
    // Shockwave ring
    shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 55 * scale,
      alpha: 0.9,
      lineWidth: 4 * scale
    });

    // Core Fireball
    this.spawnParticles(particles, x, y, Math.round(24 * scale), {
      colors: ['#fef08a', '#f97316', '#ef4444'],
      speedMin: 1.5 * scale,
      speedMax: 6 * scale,
      sizeMin: 5 * scale,
      sizeMax: 13 * scale,
      decay: 0.032,
      buoyancy: -0.05
    });

    // Heavy Black Diesel/Cordite Smoke
    this.spawnParticles(particles, x, y - 4, Math.round(18 * scale), {
      colors: ['#1e293b', '#334155', '#0f172a'],
      speedMin: 0.8 * scale,
      speedMax: 3.5 * scale,
      sizeMin: 8 * scale,
      sizeMax: 18 * scale,
      decay: 0.014,
      buoyancy: -0.06
    });
  },

  /**
   * Generates metallic sparks when a shell bounces off sloped armor
   */
  createRicochet(particles, floatingTexts, shell) {
    this.spawnParticles(particles, shell.x, shell.y, 20, {
      colors: ['#fef08a', '#ffffff', '#fb923c'],
      speedMin: 4,
      speedMax: 10,
      sizeMin: 2,
      sizeMax: 4,
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
   * Updates all active projectiles and resolves armor collisions
   */
  updateShells(ctx, state, shells, particles, shockwaves, craters, floatingTexts, callbacks) {
    for (let i = shells.length - 1; i >= 0; i--) {
      const s = shells[i];
      s.vx *= this.airDrag;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += this.gravity;

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

      // Check Tank Collision
      if (target.hp > 0 && Math.abs(s.x - target.x) < hitWidth && s.y > state.groundY - 44) {
        const distance = Math.abs(s.startX - target.x);
        const result = this.calculateBallistics(s, target, distance);

        if (result.ricochet) {
          this.createRicochet(particles, floatingTexts, s);
          if (callbacks.onRicochet) callbacks.onRicochet();
          // Deflect shell upward
          s.vy = -Math.abs(s.vy) * 2.8 - 3;
          s.vx *= -0.45;
          s.owner = 'deflected';
          continue;
        }

        target.hp = Math.max(0, target.hp - result.damage);
        this.createExplosion(particles, shockwaves, s.x, s.y, result.penetrated ? 1.25 : 0.75);

        floatingTexts.push({
          x: s.x,
          y: s.y - 18,
          text: result.penetrated ? `PENETRATION -${result.damage}` : `ARMOR HIT -${result.damage}`,
          color: result.penetrated ? '#ef4444' : '#cbd5e1',
          alpha: 1,
          vy: -0.7
        });

        if (callbacks.onHit) callbacks.onHit(result.penetrated);
        shells.splice(i, 1);
        continue;
      }

      // Ground Impact
      if (s.y >= state.groundY) {
        this.createExplosion(particles, shockwaves, s.x, state.groundY, 0.65);
        craters.push(s.x);
        shells.splice(i, 1);
        continue;
      }

      // Out of bounds
      if (s.x < -100 || s.x > state.width + 100) {
        shells.splice(i, 1);
      }
    }
  },

  /**
   * Updates and renders particles, shockwaves, and tactical floating indicators
   */
  updateEffects(ctx, particles, shockwaves, floatingTexts) {
    // Shockwaves
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

    // Smoke & Fire Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.buoyancy; // Smoke rises naturally
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

    // Tactical Combat Text (RICOCHET / PENETRATION)
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
