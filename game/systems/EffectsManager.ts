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
   * Create ship explosion effect at grid position
   */
  createShipExplosion(gridX: number, gridY: number, offsetX: number, offsetY: number): void {
    const screenX = offsetX + gridX * this.TILE_SIZE + this.TILE_SIZE / 2;
    const screenY = offsetY + gridY * this.TILE_SIZE + this.TILE_SIZE / 2;

    const particles: Particle[] = [];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 50 + Math.random() * 80;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800 + Math.random() * 400,
        maxLife: 800 + Math.random() * 400,
        color: Math.random() > 0.5 ? 0xff6600 : 0xff3300, // Orange/red
        size: 3 + Math.random() * 4,
      });
    }

    // Add some sparks (small fast particles)
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 100;

      particles.push({
        x: screenX,
        y: screenY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 200,
        maxLife: 300 + Math.random() * 200,
        color: 0xffff00, // Yellow sparks
        size: 1 + Math.random() * 2,
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
