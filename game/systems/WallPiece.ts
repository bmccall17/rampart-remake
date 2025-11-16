import { Position } from "../types";

export type PieceShape = number[][];

/**
 * Wall piece shapes (Tetris-like polyominos)
 * 1 = filled, 0 = empty
 * Each shape is defined in a 2D array
 */
export const PIECE_SHAPES: { [key: string]: PieceShape } = {
  // 1x1 single block
  SINGLE: [[1]],

  // 1x2 domino (horizontal)
  DOMINO_H: [[1, 1]],

  // 2x1 domino (vertical)
  DOMINO_V: [[1], [1]],

  // 1x3 straight line
  LINE_3: [[1, 1, 1]],

  // 1x4 straight line
  LINE_4: [[1, 1, 1, 1]],

  // 2x2 square
  SQUARE: [
    [1, 1],
    [1, 1],
  ],

  // L-shape (3x2)
  L_SHAPE: [
    [1, 0],
    [1, 0],
    [1, 1],
  ],

  // Reverse L-shape
  L_REVERSE: [
    [0, 1],
    [0, 1],
    [1, 1],
  ],

  // T-shape
  T_SHAPE: [
    [1, 1, 1],
    [0, 1, 0],
  ],

  // Z-shape
  Z_SHAPE: [
    [1, 1, 0],
    [0, 1, 1],
  ],

  // S-shape (reverse Z)
  S_SHAPE: [
    [0, 1, 1],
    [1, 1, 0],
  ],

  // Plus sign
  PLUS: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0],
  ],

  // 2x3 rectangle
  RECT_2x3: [
    [1, 1, 1],
    [1, 1, 1],
  ],

  // Corner piece
  CORNER: [
    [1, 1],
    [1, 0],
  ],
};

/**
 * Get all piece shape names
 */
export const PIECE_NAMES = Object.keys(PIECE_SHAPES);

/**
 * Wall piece class with rotation and position
 */
export class WallPiece {
  private shape: PieceShape;
  private currentRotation: number = 0;
  public position: Position;
  public name: string;

  constructor(shapeName: string, startPosition: Position) {
    if (!PIECE_SHAPES[shapeName]) {
      throw new Error(`Unknown piece shape: ${shapeName}`);
    }

    this.name = shapeName;
    this.shape = PIECE_SHAPES[shapeName];
    this.position = { ...startPosition };
  }

  /**
   * Get the current shape (with rotation applied)
   */
  getShape(): PieceShape {
    let rotated = this.shape;

    for (let i = 0; i < this.currentRotation; i++) {
      rotated = this.rotateShapeClockwise(rotated);
    }

    return rotated;
  }

  /**
   * Get the original shape (no rotation)
   */
  getOriginalShape(): PieceShape {
    return this.shape;
  }

  /**
   * Rotate the piece clockwise
   */
  rotateClockwise(): void {
    this.currentRotation = (this.currentRotation + 1) % 4;
  }

  /**
   * Rotate the piece counter-clockwise
   */
  rotateCounterClockwise(): void {
    this.currentRotation = (this.currentRotation + 3) % 4;
  }

  /**
   * Get current rotation (0-3)
   */
  getRotation(): number {
    return this.currentRotation;
  }

  /**
   * Set rotation directly
   */
  setRotation(rotation: number): void {
    this.currentRotation = rotation % 4;
  }

  /**
   * Move the piece
   */
  move(dx: number, dy: number): void {
    this.position.x += dx;
    this.position.y += dy;
  }

  /**
   * Set position directly
   */
  setPosition(x: number, y: number): void {
    this.position.x = x;
    this.position.y = y;
  }

  /**
   * Get all occupied tiles (absolute grid positions)
   */
  getOccupiedTiles(): Position[] {
    const tiles: Position[] = [];
    const shape = this.getShape();

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {
          tiles.push({
            x: this.position.x + col,
            y: this.position.y + row,
          });
        }
      }
    }

    return tiles;
  }

  /**
   * Get dimensions of current shape
   */
  getDimensions(): { width: number; height: number } {
    const shape = this.getShape();
    return {
      width: shape[0]?.length || 0,
      height: shape.length,
    };
  }

  /**
   * Clone this piece
   */
  clone(): WallPiece {
    const clone = new WallPiece(this.name, { ...this.position });
    clone.setRotation(this.currentRotation);
    return clone;
  }

  /**
   * Rotate a shape matrix 90 degrees clockwise
   */
  private rotateShapeClockwise(shape: PieceShape): PieceShape {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated: PieceShape = [];

    for (let col = 0; col < cols; col++) {
      const newRow: number[] = [];
      for (let row = rows - 1; row >= 0; row--) {
        newRow.push(shape[row][col]);
      }
      rotated.push(newRow);
    }

    return rotated;
  }

  /**
   * Get a random piece shape name
   */
  static getRandomPieceName(): string {
    return PIECE_NAMES[Math.floor(Math.random() * PIECE_NAMES.length)];
  }

  /**
   * Create a random piece at a given position
   */
  static createRandom(position: Position): WallPiece {
    const shapeName = WallPiece.getRandomPieceName();
    return new WallPiece(shapeName, position);
  }
}
