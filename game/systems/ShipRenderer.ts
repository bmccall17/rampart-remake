import * as Phaser from "phaser";
import { Ship } from "../types";
import { TILE_SIZE } from "../core/GameConfig";

export class ShipRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = TILE_SIZE) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.graphics = scene.add.graphics();
  }

  /**
   * Render all ships
   */
  renderShips(ships: Ship[], offsetX: number, offsetY: number): void {
    ships.forEach((ship) => {
      if (ship.isAlive) {
        this.renderShip(ship, offsetX, offsetY);
      }
    });
  }

  /**
   * Render a single ship
   */
  renderShip(ship: Ship, offsetX: number, offsetY: number): void {
    const x = offsetX + ship.position.x * this.tileSize;
    const y = offsetY + ship.position.y * this.tileSize;
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;

    // Ship hull (brown/wood color)
    this.graphics.fillStyle(0x8b4513, 1);
    this.graphics.fillRect(
      centerX - this.tileSize / 3,
      centerY - this.tileSize / 4,
      (this.tileSize * 2) / 3,
      this.tileSize / 2
    );

    // Ship hull outline
    this.graphics.lineStyle(2, 0x654321, 1);
    this.graphics.strokeRect(
      centerX - this.tileSize / 3,
      centerY - this.tileSize / 4,
      (this.tileSize * 2) / 3,
      this.tileSize / 2
    );

    // Mast (vertical line)
    this.graphics.lineStyle(3, 0x3d2817, 1);
    this.graphics.lineBetween(
      centerX,
      centerY - this.tileSize / 4,
      centerX,
      centerY - this.tileSize / 2 - 8
    );

    // Sail (white triangle)
    this.graphics.fillStyle(0xeeeeee, 1);
    this.graphics.fillTriangle(
      centerX,
      centerY - this.tileSize / 2 - 8,
      centerX + 10,
      centerY - this.tileSize / 4,
      centerX,
      centerY - this.tileSize / 4
    );

    // Health bar
    this.renderHealthBar(ship, centerX, centerY - this.tileSize / 2 - 12);
  }

  /**
   * Render health bar above ship
   */
  renderHealthBar(ship: Ship, x: number, y: number): void {
    const barWidth = 24;
    const barHeight = 4;
    const healthPercent = ship.health / ship.maxHealth;

    // Background (red)
    this.graphics.fillStyle(0xff0000, 1);
    this.graphics.fillRect(x - barWidth / 2, y, barWidth, barHeight);

    // Health (green)
    this.graphics.fillStyle(0x00ff00, 1);
    this.graphics.fillRect(
      x - barWidth / 2,
      y,
      barWidth * healthPercent,
      barHeight
    );

    // Border
    this.graphics.lineStyle(1, 0x000000, 1);
    this.graphics.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
  }

  /**
   * Clear all rendered ships
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
