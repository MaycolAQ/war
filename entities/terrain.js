/**
 * Battle of Kursk 1943 - Procedural Russian Steppe Terrain (Prokhorovka Sector)
 * Renders sky, distant battle smoke plumes, undulating steppe, anti-tank hedgehogs, trenches, mud, and craters.
 */

class SteppeTerrain {
  constructor() {
    this.craters = [];
    this.hedgehogs = [];
    this.trenches = [];
    this.mudPatches = [];
    this.smokePlumes = [];
    this.grassBlades = [];
    this.initialized = false;
  }

  /**
   * Generates procedural battlefield features adapted to the current screen width
   */
  generate(width, groundY) {
    this.craters = [];

    // 1. Defensive Soviet Trenches (Mid-field)
    this.trenches = [
      { x: width * 0.44, width: 34, depth: 7 },
      { x: width * 0.56, width: 28, depth: 6 }
    ];

    // 2. Steel Anti-Tank Hedgehogs (Czech Hedgehogs)
    this.hedgehogs = [
      { x: width * 0.41, size: 11 },
      { x: width * 0.49, size: 12 },
      { x: width * 0.59, size: 10 }
    ];

    // 3. Churning Mud & Scorched Earth Patches
    this.mudPatches = [
      { x: width * 0.22, w: 65 },
      { x: width * 0.50, w: 90 },
      { x: width * 0.76, w: 70 }
    ];

    // 4. Distant Horizon Burning Wreck Smoke Plumes
    this.smokePlumes = [
      { x: width * 0.16, height: 110, drift: 0.4 },
      { x: width * 0.48, height: 145, drift: 0.6 },
      { x: width * 0.81, height: 125, drift: 0.5 }
    ];

    // 5. Dry July Steppe Grass Tufts
    this.grassBlades = [];
    const count = Math.floor(width / 14);
    for (let i = 0; i < count; i++) {
      this.grassBlades.push({
        x: Math.random() * width,
        h: 3 + Math.random() * 5,
        lean: (Math.random() - 0.5) * 4
      });
    }

    this.initialized = true;
  }

  /**
   * Adds a permanent artillery crater when a shell hits the ground
   */
  addCrater(x) {
    this.craters.push({
      x,
      radiusX: 11 + Math.random() * 7,
      radiusY: 3.5 + Math.random() * 1.5
    });
    // Keep maximum 35 craters for smooth 60fps mobile performance
    if (this.craters.length > 35) {
      this.craters.shift();
    }
  }

  /**
   * Returns exact ground elevation at a given X (creates subtle steppe undulation)
   */
  getHeightAt(x, baseGroundY) {
    return baseGroundY + Math.sin(x * 0.008) * 3.5;
  }

  /**
   * Renders the full Prokhorovka battlefield environment
   */
  draw(ctx, width, height, baseGroundY, time = 0) {
    if (!this.initialized) {
      this.generate(width, baseGroundY);
    }

    // 1. Dramatic Kursk Summer Sky (Smoke & Fire Haze)
    const sky = ctx.createLinearGradient(0, 0, 0, baseGroundY);
    sky.addColorStop(0, '#1e3a5f');    // azul cielo
sky.addColorStop(0.5, '#64748b');  // gris azulado
sky.addColorStop(0.85, '#d97706'); // naranja
sky.addColorStop(1, '#f59e0b');    // ámbar brillante
    ctx.fillStyle = sky;
    ctx.fillRect(-60, -60, width + 120, baseGroundY + 60);

    // 2. Distant Horizon Smoke Plumes & Artillery Glow
    this.drawHorizonEffects(ctx, baseGroundY, time);

    // 3. Distant Rolling Steppe Hills
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(-60, baseGroundY);
    for (let x = -60; x <= width + 60; x += 30) {
      const hillY = baseGroundY - 14 - Math.sin(x * 0.006 + 1.2) * 8 - Math.cos(x * 0.015) * 4;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(width + 60, baseGroundY);
    ctx.closePath();
    ctx.fill();

    // 4. Main Foreground Steppe Earth & Subsoil
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(-60, height + 100);
    for (let x = -60; x <= width + 60; x += 20) {
      ctx.lineTo(x, this.getHeightAt(x, baseGroundY));
    }
    ctx.lineTo(width + 60, height + 100);
    ctx.closePath();
    ctx.fill();

    // Topsoil & Mud Layer
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = -60; x <= width + 60; x += 20) {
      const y = this.getHeightAt(x, baseGroundY);
      if (x === -60) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 5. Heavy Mud Patches
    this.mudPatches.forEach(m => {
      const y = this.getHeightAt(m.x, baseGroundY);
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.ellipse(m.x, y + 3, m.w / 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Soviet Defensive Trenches (Sandbags & Dugout)
    this.trenches.forEach(tr => {
      const y = this.getHeightAt(tr.x, baseGroundY);
      // Trench pit
      ctx.fillStyle = '#090d16';
      ctx.fillRect(tr.x - tr.width / 2, y - 1, tr.width, tr.depth);
      // Parapet sandbags
      ctx.fillStyle = '#57534e';
      ctx.beginPath();
      ctx.roundRect(tr.x - tr.width / 2 - 4, y - 4, 10, 4, 2);
      ctx.roundRect(tr.x + tr.width / 2 - 6, y - 4, 10, 4, 2);
      ctx.fill();
    });

    // 7. Scorched Steppe Grass Tufts
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 1.2;
    this.grassBlades.forEach(g => {
      const y = this.getHeightAt(g.x, baseGroundY);
      const sway = Math.sin(time * 0.002 + g.x * 0.05) * 1.5;
      ctx.beginPath();
      ctx.moveTo(g.x, y);
      ctx.lineTo(g.x + g.lean + sway, y - g.h);
      ctx.stroke();
    });

    // 8. Shell Craters
    this.craters.forEach(c => {
      const y = this.getHeightAt(c.x, baseGroundY);
      ctx.fillStyle = '#0c0a09';
      ctx.beginPath();
      ctx.ellipse(c.x, y + 2, c.radiusX, c.radiusY, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 9. Steel Anti-Tank Hedgehogs
    this.hedgehogs.forEach(h => {
      const y = this.getHeightAt(h.x, baseGroundY);
      this.drawHedgehog(ctx, h.x, y, h.size);
    });
  }

  drawHorizonEffects(ctx, baseGroundY, time) {
    this.smokePlumes.forEach((p, idx) => {
      // Burning glow at horizon base
      const glow = ctx.createRadialGradient(p.x, baseGroundY, 2, p.x, baseGroundY, 55);
      glow.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
      glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, baseGroundY, 55, Math.PI, 0);
      ctx.fill();

      // Rising dark smoke column
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      for (let step = 0; step < 5; step++) {
        const offsetX = Math.sin(time * 0.001 + idx + step) * (8 + step * 3);
        const offsetY = step * (p.height / 5);
        const radius = 12 + step * 6;
        ctx.beginPath();
        ctx.arc(p.x + offsetX, baseGroundY - offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  drawHedgehog(ctx, x, y, size) {
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    // Crossed steel I-beams
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y - size * 1.5);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x - size, y - size * 1.5);
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - size * 1.6);
    ctx.stroke();
  }
}
