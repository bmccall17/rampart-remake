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
   * Render a single projectile with 3D arc effect
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

    // Calculate arc scale: peaks at 0.5 (apex), smaller at 0 and 1
    // Use sine curve for smooth arc: sin(progress * PI) gives 0->1->0
    const arcHeight = Math.sin(projectile.progress * Math.PI);
    const baseRadius = 3;
    const maxRadius = 7;
    const radius = baseRadius + (maxRadius - baseRadius) * arcHeight;

    // Y offset for arc (ball goes "up" then "down")
    const arcYOffset = -arcHeight * 12; // Negative because up is negative Y

    // Different colors for player vs enemy projectiles
    const color = projectile.source === "player" ? 0xffaa00 : 0xff0000;

    // Draw shadow on ground (gets smaller/fainter as ball rises)
    const shadowAlpha = 0.3 * (1 - arcHeight * 0.5);
    const shadowRadius = radius * 0.8;
    this.graphics.fillStyle(0x000000, shadowAlpha);
    this.graphics.fillCircle(centerX, centerY + 2, shadowRadius);

    // Draw cannonball (filled circle) with arc offset
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(centerX, centerY + arcYOffset, radius);

    // Add glow effect (scales with ball)
    this.graphics.lineStyle(2, color, 0.5);
    this.graphics.strokeCircle(centerX, centerY + arcYOffset, radius + 2);

    // Trail effect (small circles behind, follow arc)
    const trailX = centerX - projectile.velocity.x * 0.3;
    const trailY = centerY + arcYOffset - projectile.velocity.y * 0.3;
    this.graphics.fillStyle(color, 0.3);
    this.graphics.fillCircle(trailX, trailY, radius * 0.6);
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
