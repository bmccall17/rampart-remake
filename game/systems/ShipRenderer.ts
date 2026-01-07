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
   * Render a single ship with type-specific appearance
   */
  renderShip(ship: Ship, offsetX: number, offsetY: number): void {
    const x = offsetX + ship.position.x * this.tileSize;
    const y = offsetY + ship.position.y * this.tileSize;
    const centerX = x + this.tileSize / 2;
    const centerY = y + this.tileSize / 2;

    // Get ship type-specific colors and scale
    const { hullColor, sailColor, scale } = this.getShipTypeStyle(ship.shipType);

    const hullWidth = (this.tileSize * 2 / 3) * scale;
    const hullHeight = (this.tileSize / 2) * scale;

    // Ship hull
    this.graphics.fillStyle(hullColor, 1);
    this.graphics.fillRect(
      centerX - hullWidth / 2,
      centerY - hullHeight / 2,
      hullWidth,
      hullHeight
    );

    // Ship hull outline
    this.graphics.lineStyle(2, this.darkenColor(hullColor), 1);
    this.graphics.strokeRect(
      centerX - hullWidth / 2,
      centerY - hullHeight / 2,
      hullWidth,
      hullHeight
    );

    // Mast (vertical line)
    const mastHeight = 8 * scale;
    this.graphics.lineStyle(2 * scale, 0x3d2817, 1);
    this.graphics.lineBetween(
      centerX,
      centerY - hullHeight / 2,
      centerX,
      centerY - hullHeight / 2 - mastHeight
    );

    // Sail
    const sailSize = 8 * scale;
    this.graphics.fillStyle(sailColor, 1);
    this.graphics.fillTriangle(
      centerX,
      centerY - hullHeight / 2 - mastHeight,
      centerX + sailSize,
      centerY - hullHeight / 2,
      centerX,
      centerY - hullHeight / 2
    );

    // Health bar
    this.renderHealthBar(ship, centerX, centerY - hullHeight / 2 - mastHeight - 4);
  }

  /**
   * Get visual style for each ship type
   */
  private getShipTypeStyle(shipType: string): { hullColor: number; sailColor: number; scale: number } {
    switch (shipType) {
      case "scout":
        // Small, light colored, fast
        return { hullColor: 0xa0522d, sailColor: 0xffff99, scale: 0.8 };
      case "destroyer":
        // Large, dark, menacing
        return { hullColor: 0x2f1810, sailColor: 0x990000, scale: 1.3 };
      case "frigate":
      default:
        // Medium, standard brown
        return { hullColor: 0x8b4513, sailColor: 0xeeeeee, scale: 1.0 };
    }
  }

  /**
   * Darken a color for outlines
   */
  private darkenColor(color: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * 0.7);
    const g = Math.floor(((color >> 8) & 0xff) * 0.7);
    const b = Math.floor((color & 0xff) * 0.7);
    return (r << 16) | (g << 8) | b;
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
