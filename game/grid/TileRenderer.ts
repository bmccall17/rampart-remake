import * as Phaser from "phaser";
import { TileType, Position } from "../types";
import { TILE_SIZE } from "../core/GameConfig";

// Color scheme for different tile types
export const TILE_COLORS = {
  [TileType.EMPTY]: 0x0f3460,      // Dark blue (background)
  [TileType.LAND]: 0x6b8e23,       // Olive green
  [TileType.WATER]: 0x1e5f8c,      // Ocean blue
  [TileType.WALL]: 0x8b7355,       // Stone brown
  [TileType.CASTLE]: 0x4a4a4a,     // Dark gray (base for castle)
  [TileType.CRATER]: 0x3d3d3d,     // Very dark gray
  [TileType.DEBRIS]: 0x5a5a5a,     // Medium gray
  [TileType.CANNON]: 0x2c2c2c,     // Near black
};

// Slightly lighter colors for borders/highlights
export const TILE_BORDER_COLORS = {
  [TileType.EMPTY]: 0x16213e,
  [TileType.LAND]: 0x7fa02e,
  [TileType.WATER]: 0x2a7ab8,
  [TileType.WALL]: 0xa08968,
  [TileType.CASTLE]: 0x6a6a6a,
  [TileType.CRATER]: 0x2a2a2a,
  [TileType.DEBRIS]: 0x4a4a4a,
  [TileType.CANNON]: 0x1a1a1a,
};

// Territory colors
export const TERRITORY_COLOR = 0x00ff00;        // Bright green for enclosed territory
export const TERRITORY_BORDER_COLOR = 0xffff00; // Yellow for territory border

export class TileRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private territoryGraphics: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = TILE_SIZE) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.graphics = scene.add.graphics();
    this.territoryGraphics = scene.add.graphics();
    this.territoryGraphics.setDepth(5); // Above tiles but below UI
  }

  /**
   * Render a single tile at the given grid coordinates
   */
  renderTile(
    gridX: number,
    gridY: number,
    type: TileType,
    offsetX: number = 0,
    offsetY: number = 0
  ): void {
    const x = offsetX + gridX * this.tileSize;
    const y = offsetY + gridY * this.tileSize;

    switch (type) {
      case TileType.LAND:
        this.drawLandTile(x, y);
        break;
      case TileType.WATER:
        this.drawWaterTile(x, y);
        break;
      case TileType.WALL:
        this.drawWallTile(x, y);
        break;
      case TileType.CASTLE:
        this.drawCastleTile(x, y);
        break;
      case TileType.CRATER:
        this.drawCraterTile(x, y);
        break;
      case TileType.DEBRIS:
        this.drawDebrisTile(x, y);
        break;
      case TileType.EMPTY:
      default:
        this.drawEmptyTile(x, y);
        break;
    }
  }

  private drawEmptyTile(x: number, y: number): void {
    this.graphics.fillStyle(TILE_COLORS[TileType.EMPTY], 1);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);
  }

  private drawLandTile(x: number, y: number): void {
    // Base land color
    this.graphics.fillStyle(TILE_COLORS[TileType.LAND], 1);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Add subtle texture with lighter border
    this.graphics.lineStyle(1, TILE_BORDER_COLORS[TileType.LAND], 0.3);
    this.graphics.strokeRect(x, y, this.tileSize, this.tileSize);

    // Add some texture dots
    this.graphics.fillStyle(TILE_BORDER_COLORS[TileType.LAND], 0.2);
    this.graphics.fillCircle(x + this.tileSize / 4, y + this.tileSize / 4, 2);
    this.graphics.fillCircle(
      x + (3 * this.tileSize) / 4,
      y + (3 * this.tileSize) / 4,
      2
    );
  }

  private drawWaterTile(x: number, y: number): void {
    // Base water color
    this.graphics.fillStyle(TILE_COLORS[TileType.WATER], 1);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Add wave effect
    this.graphics.fillStyle(TILE_BORDER_COLORS[TileType.WATER], 0.3);
    this.graphics.fillRect(x, y + this.tileSize - 4, this.tileSize, 2);
    this.graphics.fillRect(x, y + this.tileSize / 2, this.tileSize, 1);
  }

  private drawWallTile(x: number, y: number): void {
    // Base wall color
    this.graphics.fillStyle(TILE_COLORS[TileType.WALL], 1);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Stone brick pattern
    this.graphics.lineStyle(2, TILE_BORDER_COLORS[TileType.WALL], 0.8);
    this.graphics.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

    // Horizontal mortar line
    this.graphics.lineStyle(1, 0x4a4a4a, 0.6);
    this.graphics.lineBetween(
      x,
      y + this.tileSize / 2,
      x + this.tileSize,
      y + this.tileSize / 2
    );
  }

  private drawCastleTile(x: number, y: number): void {
    // Castle base
    this.graphics.fillStyle(TILE_COLORS[TileType.CASTLE], 1);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Castle turret outline
    this.graphics.lineStyle(2, TILE_BORDER_COLORS[TileType.CASTLE], 1);
    this.graphics.strokeRect(
      x + this.tileSize / 4,
      y + this.tileSize / 4,
      this.tileSize / 2,
      this.tileSize / 2
    );

    // Battlements
    const battlementWidth = this.tileSize / 6;
    this.graphics.fillStyle(0x6a6a6a, 1);
    this.graphics.fillRect(x + 4, y + 4, battlementWidth, 4);
    this.graphics.fillRect(
      x + this.tileSize - 4 - battlementWidth,
      y + 4,
      battlementWidth,
      4
    );
  }

  private drawCraterTile(x: number, y: number): void {
    // Damaged land base
    this.graphics.fillStyle(TILE_COLORS[TileType.LAND], 0.6);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Crater impact
    this.graphics.fillStyle(TILE_COLORS[TileType.CRATER], 1);
    this.graphics.fillCircle(
      x + this.tileSize / 2,
      y + this.tileSize / 2,
      this.tileSize / 3
    );

    // Crater rim
    this.graphics.lineStyle(2, 0x2a2a2a, 0.8);
    this.graphics.strokeCircle(
      x + this.tileSize / 2,
      y + this.tileSize / 2,
      this.tileSize / 3
    );
  }

  private drawDebrisTile(x: number, y: number): void {
    // Damaged land base
    this.graphics.fillStyle(TILE_COLORS[TileType.LAND], 0.7);
    this.graphics.fillRect(x, y, this.tileSize, this.tileSize);

    // Debris chunks
    this.graphics.fillStyle(TILE_COLORS[TileType.DEBRIS], 1);
    this.graphics.fillRect(x + 4, y + 6, 8, 6);
    this.graphics.fillRect(x + this.tileSize - 10, y + 12, 6, 8);
    this.graphics.fillRect(x + 14, y + this.tileSize - 8, 10, 5);
  }

  /**
   * Clear all rendered graphics
   */
  clear(): void {
    this.graphics.clear();
  }

  /**
   * Clear territory overlay
   */
  clearTerritory(): void {
    this.territoryGraphics.clear();
  }

  /**
   * Render enclosed territory with green overlay and border
   * @param territoryTiles - All tiles inside the enclosed territory
   * @param wallTiles - The wall tiles that form the enclosure
   * @param offsetX - X offset for rendering
   * @param offsetY - Y offset for rendering
   */
  renderTerritory(
    territoryTiles: Position[],
    wallTiles: Position[],
    offsetX: number,
    offsetY: number
  ): void {
    // Create sets for quick lookup
    const territorySet = new Set(territoryTiles.map(t => `${t.x},${t.y}`));
    const wallSet = new Set(wallTiles.map(t => `${t.x},${t.y}`));

    // Draw green overlay on territory tiles
    this.territoryGraphics.fillStyle(TERRITORY_COLOR, 0.3);
    for (const tile of territoryTiles) {
      const x = offsetX + tile.x * this.tileSize;
      const y = offsetY + tile.y * this.tileSize;
      this.territoryGraphics.fillRect(x, y, this.tileSize, this.tileSize);
    }

    // Draw border around the enclosing walls
    // For each wall tile, check if it's adjacent to territory and draw border on that edge
    this.territoryGraphics.lineStyle(3, TERRITORY_BORDER_COLOR, 1);

    for (const wall of wallTiles) {
      const x = offsetX + wall.x * this.tileSize;
      const y = offsetY + wall.y * this.tileSize;

      // Check each direction - draw border on edges adjacent to territory
      const neighbors = [
        { dx: 0, dy: -1, edge: 'top' },    // Above
        { dx: 0, dy: 1, edge: 'bottom' },  // Below
        { dx: -1, dy: 0, edge: 'left' },   // Left
        { dx: 1, dy: 0, edge: 'right' },   // Right
      ];

      for (const { dx, dy, edge } of neighbors) {
        const neighborKey = `${wall.x + dx},${wall.y + dy}`;
        // Draw border if neighbor is territory (not wall)
        if (territorySet.has(neighborKey) && !wallSet.has(neighborKey)) {
          switch (edge) {
            case 'top':
              this.territoryGraphics.lineBetween(x, y, x + this.tileSize, y);
              break;
            case 'bottom':
              this.territoryGraphics.lineBetween(x, y + this.tileSize, x + this.tileSize, y + this.tileSize);
              break;
            case 'left':
              this.territoryGraphics.lineBetween(x, y, x, y + this.tileSize);
              break;
            case 'right':
              this.territoryGraphics.lineBetween(x + this.tileSize, y, x + this.tileSize, y + this.tileSize);
              break;
          }
        }
      }
    }

    // Also draw outer border of walls (edges not adjacent to territory)
    this.territoryGraphics.lineStyle(2, 0xffd700, 0.8); // Gold color for outer edge
    for (const wall of wallTiles) {
      const x = offsetX + wall.x * this.tileSize;
      const y = offsetY + wall.y * this.tileSize;

      const neighbors = [
        { dx: 0, dy: -1, edge: 'top' },
        { dx: 0, dy: 1, edge: 'bottom' },
        { dx: -1, dy: 0, edge: 'left' },
        { dx: 1, dy: 0, edge: 'right' },
      ];

      for (const { dx, dy, edge } of neighbors) {
        const neighborKey = `${wall.x + dx},${wall.y + dy}`;
        // Draw outer border if neighbor is NOT a wall and NOT territory
        if (!wallSet.has(neighborKey) && !territorySet.has(neighborKey)) {
          switch (edge) {
            case 'top':
              this.territoryGraphics.lineBetween(x, y, x + this.tileSize, y);
              break;
            case 'bottom':
              this.territoryGraphics.lineBetween(x, y + this.tileSize, x + this.tileSize, y + this.tileSize);
              break;
            case 'left':
              this.territoryGraphics.lineBetween(x, y, x, y + this.tileSize);
              break;
            case 'right':
              this.territoryGraphics.lineBetween(x + this.tileSize, y, x + this.tileSize, y + this.tileSize);
              break;
          }
        }
      }
    }
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    this.graphics.destroy();
    this.territoryGraphics.destroy();
  }
}
