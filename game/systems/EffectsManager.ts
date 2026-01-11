/**
 * EffectsManager - Visual effects for explosions, impacts, and splashes
 * Uses simple sprite-based animations for performance
 */
import * as Phaser from "phaser";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

interface Effect {
  particles: Particle[];
  startTime: number;
}

export class EffectsManager {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private effects: Effect[] = [];
  private readonly TILE_SIZE: number;

  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene;
    this.TILE_SIZE = tileSize;
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(800); // Above most game elements
  }

  /**
   * Create critical hit effect - bright flash and extra particles
   */
  createCriticalHit(gridX: number, gridY: number, offsetX: number, offsetY: number): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const particles: Particle[] = [];

    // Bright white/yellow flash ring expanding outward
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 80 + Math.random() * 40;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 100,
        maxLife: 300 + Math.random() * 100,
        color: Math.random() > 0.5 ? 0xffffff : 0xffff00, // White/yellow
        size: 4 + Math.random() * 3,
      });
    }

    // Extra bright sparks
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 80;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 200 + Math.random() * 100,
        maxLife: 200 + Math.random() * 100,
        color: 0xffffaa, // Bright yellow-white
        size: 2 + Math.random() * 2,
      });
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });
  }

  /**
   * Get explosion scale based on ship type
   */
  private getExplosionScale(shipType: string): { particleCount: number; sparkCount: number; speedMult: number; sizeMult: number; lifeMult: number } {
    switch (shipType) {
      case "scout":
        return { particleCount: 12, sparkCount: 6, speedMult: 0.8, sizeMult: 0.7, lifeMult: 0.7 };
      case "frigate":
        return { particleCount: 20, sparkCount: 10, speedMult: 1.0, sizeMult: 1.0, lifeMult: 1.0 };
      case "destroyer":
        return { particleCount: 30, sparkCount: 15, speedMult: 1.2, sizeMult: 1.3, lifeMult: 1.2 };
      case "boss":
        return { particleCount: 50, sparkCount: 30, speedMult: 1.5, sizeMult: 1.8, lifeMult: 1.5 };
      default:
        return { particleCount: 20, sparkCount: 10, speedMult: 1.0, sizeMult: 1.0, lifeMult: 1.0 };
    }
  }

  /**
   * Create ship explosion effect at grid position
   * Effect size varies by ship type
   */
  createShipExplosion(gridX: number, gridY: number, offsetX: number, offsetY: number, shipType: string = "frigate"): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const scale = this.getExplosionScale(shipType);
    const particles: Particle[] = [];

    // Main explosion particles
    for (let i = 0; i < scale.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / scale.particleCount + Math.random() * 0.5;
      const speed = (50 + Math.random() * 80) * scale.speedMult;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (800 + Math.random() * 400) * scale.lifeMult,
        maxLife: (800 + Math.random() * 400) * scale.lifeMult,
        color: Math.random() > 0.5 ? 0xff6600 : 0xff3300, // Orange/red
        size: (3 + Math.random() * 4) * scale.sizeMult,
      });
    }

    // Add some sparks (small fast particles)
    for (let i = 0; i < scale.sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (100 + Math.random() * 100) * scale.speedMult;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: (300 + Math.random() * 200) * scale.lifeMult,
        maxLife: (300 + Math.random() * 200) * scale.lifeMult,
        color: 0xffff00, // Yellow sparks
        size: (1 + Math.random() * 2) * scale.sizeMult,
      });
    }

    // Add debris particles for larger ships (falling wood/metal pieces)
    if (shipType === "destroyer" || shipType === "boss") {
      const debrisCount = shipType === "boss" ? 15 : 8;
      for (let i = 0; i < debrisCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 40;

        particles.push({
          x: screenX + (Math.random() - 0.5) * 20,
          y: screenY + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30, // Initial upward velocity
          life: 1200 + Math.random() * 600,
          maxLife: 1200 + Math.random() * 600,
          color: Math.random() > 0.5 ? 0x8b4513 : 0x3d2817, // Brown wood colors
          size: 4 + Math.random() * 4,
        });
      }
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });

    // For boss, add a secondary delayed explosion
    if (shipType === "boss") {
      setTimeout(() => {
        this.createSecondaryExplosion(screenX, screenY);
      }, 150);
    }
  }

  /**
   * Create secondary explosion for boss death
   */
  private createSecondaryExplosion(screenX: number, screenY: number): void {
    const particles: Particle[] = [];

    // Secondary burst
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 100;

      particles.push({
        x: screenX + (Math.random() - 0.5) * 30,
        y: screenY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 600 + Math.random() * 400,
        maxLife: 600 + Math.random() * 400,
        color: Math.random() > 0.3 ? 0xff8800 : 0xffcc00, // Bright orange/yellow
        size: 4 + Math.random() * 5,
      });
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });
  }

  /**
   * Create wall fire effect - bursts into flames with debris
   */
  createWallFire(gridX: number, gridY: number, offsetX: number, offsetY: number): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const particles: Particle[] = [];

    // Flame particles rising upward
    for (let i = 0; i < 20; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Upward with slight spread
      const speed = 40 + Math.random() * 60;

      particles.push({
        x: screenX + (Math.random() - 0.5) * 12,
        y: screenY,
        vx: Math.cos(angle) * speed * 0.3,
        vy: Math.sin(angle) * speed,
        life: 600 + Math.random() * 400,
        maxLife: 600 + Math.random() * 400,
        color: Math.random() > 0.5 ? 0xff6600 : Math.random() > 0.5 ? 0xffcc00 : 0xff3300, // Orange/yellow/red
        size: 3 + Math.random() * 4,
      });
    }

    // Sparks shooting outward
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30, // Upward bias
        life: 300 + Math.random() * 200,
        maxLife: 300 + Math.random() * 200,
        color: 0xffff00, // Yellow sparks
        size: 1 + Math.random() * 2,
      });
    }

    // Wall debris
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;

      particles.push({
        x: screenX + (Math.random() - 0.5) * 10,
        y: screenY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        life: 800 + Math.random() * 400,
        maxLife: 800 + Math.random() * 400,
        color: Math.random() > 0.5 ? 0x808080 : 0x606060, // Gray stone debris
        size: 3 + Math.random() * 3,
      });
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });
  }

  /**
   * Create terrain impact effect at grid position
   */
  createTerrainImpact(gridX: number, gridY: number, offsetX: number, offsetY: number): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const particles: Particle[] = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.3;
      const speed = 30 + Math.random() * 40;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20, // Slight upward bias
        life: 400 + Math.random() * 200,
        maxLife: 400 + Math.random() * 200,
        color: Math.random() > 0.5 ? 0x8b4513 : 0x654321, // Brown/dirt colors
        size: 2 + Math.random() * 3,
      });
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });
  }

  /**
   * Create water splash effect at grid position
   */
  createWaterSplash(gridX: number, gridY: number, offsetX: number, offsetY: number): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const particles: Particle[] = [];
    const particleCount = 15;

    // Water droplets going up and out
    for (let i = 0; i < particleCount; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8; // Upward spread
      const speed = 40 + Math.random() * 60;

      particles.push({
        x: screenX + (Math.random() - 0.5) * 10,
        y: screenY,
        vx: Math.cos(angle) * speed * 0.5,
        vy: Math.sin(angle) * speed,
        life: 500 + Math.random() * 300,
        maxLife: 500 + Math.random() * 300,
        color: Math.random() > 0.3 ? 0x4488ff : 0x88ccff, // Blue/light blue
        size: 2 + Math.random() * 3,
      });
    }

    // Ripple ring particles (expand outward horizontally)
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * 30,
        vy: Math.sin(angle) * 15, // Flattened vertical
        life: 600,
        maxLife: 600,
        color: 0x88ccff,
        size: 2,
      });
    }

    this.effects.push({
      particles,
      startTime: this.scene.time.now,
    });
  }

  /**
   * Update and render all effects
   */
  update(delta: number): void {
    this.graphics.clear();

    const deltaSeconds = delta / 1000;
    const gravity = 80; // Pixels per second squared

    // Update each effect
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const effect = this.effects[i];
      let hasLivingParticles = false;

      for (const particle of effect.particles) {
        if (particle.life <= 0) continue;

        // Update position
        particle.x += particle.vx * deltaSeconds;
        particle.y += particle.vy * deltaSeconds;

        // Apply gravity
        particle.vy += gravity * deltaSeconds;

        // Update life
        particle.life -= delta;

        if (particle.life > 0) {
          hasLivingParticles = true;

          // Calculate alpha based on remaining life
          const alpha = Math.max(0, particle.life / particle.maxLife);

          // Draw particle
          this.graphics.fillStyle(particle.color, alpha);
          this.graphics.fillCircle(particle.x, particle.y, particle.size * alpha);
        }
      }

      // Remove dead effects
      if (!hasLivingParticles) {
        this.effects.splice(i, 1);
      }
    }
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.effects = [];
    this.graphics.clear();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.graphics.destroy();
  }
}
