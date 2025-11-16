import * as Phaser from "phaser";
import { Cannon, Position } from "../types";
import { TILE_SIZE } from "../core/GameConfig";

export class CannonRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = TILE_SIZE) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.graphics = scene.add.graphics();
  }

  /**
   * Render all cannons
   */
  renderCannons(
    cannons: Cannon[],
    offsetX: number,
    offsetY: number
  ): void {
    cannons.forEach((cannon) => {
      this.renderCannon(cannon.position, offsetX, offsetY);
    });
  }

  /**
   * Render a single cannon
   */
  renderCannon(
    pos: Position,
    offsetX: number,
    offsetY: number
  ): void {
    const x = offsetX + pos.x * this.tileSize;
    const y = offsetY + pos.y * this.tileSize;
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;

    // Cannon base (circle)
    this.graphics.fillStyle(0x2c2c2c, 1);
    this.graphics.fillCircle(centerX, centerY, this.tileSize / 3);

    // Cannon base border
    this.graphics.lineStyle(2, 0x4a4a4a, 1);
    this.graphics.strokeCircle(centerX, centerY, this.tileSize / 3);

    // Cannon barrel
    this.graphics.fillStyle(0x1a1a1a, 1);
    this.graphics.fillRect(
      centerX - 3,
      centerY - this.tileSize / 3,
      6,
      this.tileSize / 3
    );

    // Cannon barrel tip
    this.graphics.fillStyle(0x0a0a0a, 1);
    this.graphics.fillRect(
      centerX - 2,
      centerY - this.tileSize / 3 - 4,
      4,
      4
    );
  }

  /**
   * Render cannon placement preview (ghost)
   */
  renderCannonPreview(
    pos: Position,
    offsetX: number,
    offsetY: number,
    isValid: boolean
  ): void {
    const x = offsetX + pos.x * this.tileSize;
    const y = offsetY + pos.y * this.tileSize;
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;

    const color = isValid ? 0x00ff00 : 0xff0000;
    const alpha = 0.4;

    // Preview circle
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillCircle(centerX, centerY, this.tileSize / 3);

    // Preview border
    this.graphics.lineStyle(2, color, 0.8);
    this.graphics.strokeCircle(centerX, centerY, this.tileSize / 3);
  }

  /**
   * Highlight valid cannon placement tiles
   */
  highlightValidTiles(
    validPositions: Position[],
    offsetX: number,
    offsetY: number
  ): void {
    validPositions.forEach((pos) => {
      const x = offsetX + pos.x * this.tileSize;
      const y = offsetY + pos.y * this.tileSize;

      // Subtle highlight
      this.graphics.fillStyle(0xffaa00, 0.15);
      this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

      // Border
      this.graphics.lineStyle(1, 0xffaa00, 0.3);
      this.graphics.strokeRect(x, y, this.tileSize, this.tileSize);
    });
  }

  /**
   * Clear all rendered cannons
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
