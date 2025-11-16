import * as Phaser from "phaser";
import { Projectile } from "../types";
import { TILE_SIZE } from "../core/GameConfig";

export class ProjectileRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = TILE_SIZE) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.graphics = scene.add.graphics();
  }

  /**
   * Render all projectiles
   */
  renderProjectiles(
    projectiles: Projectile[],
    offsetX: number,
    offsetY: number
  ): void {
    projectiles.forEach((projectile) => {
      if (projectile.isActive) {
        this.renderProjectile(projectile, offsetX, offsetY);
      }
    });
  }

  /**
   * Render a single projectile
   */
  renderProjectile(
    projectile: Projectile,
    offsetX: number,
    offsetY: number
  ): void {
    const x = offsetX + projectile.position.x * this.tileSize;
    const y = offsetY + projectile.position.y * this.tileSize;
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;

    // Different colors for player vs enemy projectiles
    const color = projectile.source === "player" ? 0xffaa00 : 0xff0000;

    // Draw cannonball (filled circle)
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(centerX, centerY, 4);

    // Add glow effect
    this.graphics.lineStyle(2, color, 0.5);
    this.graphics.strokeCircle(centerX, centerY, 6);

    // Trail effect (small circles behind)
    const trailX = centerX - projectile.velocity.x * 0.5;
    const trailY = centerY - projectile.velocity.y * 0.5;
    this.graphics.fillStyle(color, 0.3);
    this.graphics.fillCircle(trailX, trailY, 3);
  }

  /**
   * Clear all rendered projectiles
   */
  clear(): void {
    this.graphics.clear();
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    this.graphics.destroy();
  }
}
