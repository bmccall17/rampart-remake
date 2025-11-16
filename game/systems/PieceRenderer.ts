import * as Phaser from "phaser";
import { WallPiece } from "./WallPiece";
import { TILE_SIZE } from "../core/GameConfig";

export class PieceRenderer {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private tileSize: number;

  constructor(scene: Phaser.Scene, tileSize: number = TILE_SIZE) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.graphics = scene.add.graphics();
  }

  /**
   * Render a wall piece
   */
  renderPiece(
    piece: WallPiece,
    offsetX: number,
    offsetY: number,
    isGhost: boolean = false
  ): void {
    const shape = piece.getShape();
    const pos = piece.position;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          const x = offsetX + (pos.x + col) * this.tileSize;
          const y = offsetY + (pos.y + row) * this.tileSize;

          if (isGhost) {
            this.drawGhostTile(x, y);
          } else {
            this.drawPieceTile(x, y);
          }
        }
      }
    }
  }

  /**
   * Draw a solid piece tile
   */
  private drawPieceTile(x: number, y: number): void {
    // Fill
    this.graphics.fillStyle(0x8b7355, 0.9); // Wall color
    this.graphics.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

    // Border
    this.graphics.lineStyle(2, 0xa08968, 1);
    this.graphics.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

    // Inner highlight
    this.graphics.lineStyle(1, 0xc0a080, 0.5);
    this.graphics.strokeRect(x + 3, y + 3, this.tileSize - 6, this.tileSize - 6);
  }

  /**
   * Draw a ghost (preview) tile
   */
  private drawGhostTile(x: number, y: number): void {
    // Semi-transparent fill
    this.graphics.fillStyle(0xffffff, 0.15);
    this.graphics.fillRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);

    // Dashed border effect
    this.graphics.lineStyle(2, 0xffffff, 0.4);
    this.graphics.strokeRect(x + 1, y + 1, this.tileSize - 2, this.tileSize - 2);
  }

  /**
   * Render piece preview in a UI box
   */
  renderPreview(
    piece: WallPiece,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number
  ): void {
    const shape = piece.getShape();
    const rows = shape.length;
    const cols = shape[0]?.length || 0;

    // Calculate centering
    const pieceWidth = cols * this.tileSize;
    const pieceHeight = rows * this.tileSize;
    const startX = boxX + (boxWidth - pieceWidth) / 2;
    const startY = boxY + (boxHeight - pieceHeight) / 2;

    // Render each tile
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (shape[row][col] === 1) {
          const x = startX + col * this.tileSize;
          const y = startY + row * this.tileSize;
          this.drawPieceTile(x, y);
        }
      }
    }
  }

  /**
   * Clear all rendered pieces
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
