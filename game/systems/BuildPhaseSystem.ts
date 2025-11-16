import { Grid } from "../grid/Grid";
import { WallPiece } from "./WallPiece";
import { TileType, Position, Castle } from "../types";
import { createLogger } from "../logging/Logger";

const logger = createLogger("BuildPhaseSystem", true);

export class BuildPhaseSystem {
  private grid: Grid;
  private currentPiece: WallPiece | null = null;
  private nextPiece: WallPiece | null = null;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * Start the build phase with a new piece
   */
  startBuildPhase(): void {
    this.spawnNewPiece();
    logger.event("BuildPhaseStarted", {
      piece: this.currentPiece?.name || "none",
    });
  }

  /**
   * Spawn a new random piece
   */
  spawnNewPiece(): void {
    // Move next piece to current
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      // First piece
      const centerX = Math.floor(this.grid.getWidth() / 2);
      this.currentPiece = WallPiece.createRandom({ x: centerX, y: 0 });
    }

    // Generate next piece
    const centerX = Math.floor(this.grid.getWidth() / 2);
    this.nextPiece = WallPiece.createRandom({ x: centerX, y: 0 });

    logger.info("New piece spawned", {
      current: this.currentPiece.name,
      next: this.nextPiece.name,
    });
  }

  /**
   * Get current piece
   */
  getCurrentPiece(): WallPiece | null {
    return this.currentPiece;
  }

  /**
   * Get next piece (for preview)
   */
  getNextPiece(): WallPiece | null {
    return this.nextPiece;
  }

  /**
   * Move current piece
   */
  movePiece(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false;

    // Try to move
    this.currentPiece.move(dx, dy);

    // Check if valid
    if (!this.isValidPosition(this.currentPiece)) {
      // Revert move
      this.currentPiece.move(-dx, -dy);
      return false;
    }

    return true;
  }

  /**
   * Rotate current piece
   */
  rotatePiece(clockwise: boolean = true): boolean {
    if (!this.currentPiece) return false;

    // Try rotation
    if (clockwise) {
      this.currentPiece.rotateClockwise();
    } else {
      this.currentPiece.rotateCounterClockwise();
    }

    // Check if valid
    if (!this.isValidPosition(this.currentPiece)) {
      // Revert rotation
      if (clockwise) {
        this.currentPiece.rotateCounterClockwise();
      } else {
        this.currentPiece.rotateClockwise();
      }
      return false;
    }

    return true;
  }

  /**
   * Check if a piece position is valid (no collisions)
   */
  isValidPosition(piece: WallPiece): boolean {
    const tiles = piece.getOccupiedTiles();

    for (const tile of tiles) {
      // Check bounds
      if (
        tile.x < 0 ||
        tile.x >= this.grid.getWidth() ||
        tile.y < 0 ||
        tile.y >= this.grid.getHeight()
      ) {
        return false;
      }

      // Check tile type
      const gridTile = this.grid.getTile(tile.x, tile.y);
      if (!gridTile) return false;

      // Can't place on water, existing walls, castles, or debris
      if (
        gridTile.type === TileType.WATER ||
        gridTile.type === TileType.WALL ||
        gridTile.type === TileType.CASTLE ||
        gridTile.type === TileType.DEBRIS ||
        gridTile.type === TileType.CRATER
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place the current piece on the grid
   */
  placePiece(): boolean {
    if (!this.currentPiece) return false;

    if (!this.isValidPosition(this.currentPiece)) {
      logger.warn("Cannot place piece at invalid position");
      return false;
    }

    // Place walls on grid
    const tiles = this.currentPiece.getOccupiedTiles();
    for (const tile of tiles) {
      this.grid.setTile(tile.x, tile.y, TileType.WALL);
    }

    logger.event("PiecePlaced", {
      piece: this.currentPiece.name,
      position: this.currentPiece.position,
      tilesPlaced: tiles.length,
    });

    // Spawn new piece
    this.spawnNewPiece();

    return true;
  }

  /**
   * Validate territories - check if at least one castle is enclosed
   * Uses flood fill algorithm to detect enclosed areas
   */
  validateTerritories(castles: Castle[]): {
    hasValidTerritory: boolean;
    enclosedCastles: Castle[];
  } {
    logger.info("Validating territories");

    const enclosedCastles: Castle[] = [];

    for (const castle of castles) {
      if (this.isCastleEnclosed(castle)) {
        enclosedCastles.push(castle);
        castle.enclosed = true;
      } else {
        castle.enclosed = false;
      }
    }

    const hasValidTerritory = enclosedCastles.length > 0;

    logger.event("TerritoryValidated", {
      totalCastles: castles.length,
      enclosedCastles: enclosedCastles.length,
      valid: hasValidTerritory,
    });

    return {
      hasValidTerritory,
      enclosedCastles,
    };
  }

  /**
   * Check if a castle is enclosed by walls
   * Uses flood fill to see if we can reach the edge of the map
   */
  private isCastleEnclosed(castle: Castle): boolean {
    const visited = new Set<string>();
    const queue: Position[] = [castle.position];
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // If we reached the edge, castle is NOT enclosed
      if (pos.x <= 0 || pos.x >= width - 1 || pos.y <= 0 || pos.y >= height - 1) {
        return false;
      }

      // Check all 4 directions
      const neighbors = [
        { x: pos.x + 1, y: pos.y },
        { x: pos.x - 1, y: pos.y },
        { x: pos.x, y: pos.y + 1 },
        { x: pos.x, y: pos.y - 1 },
      ];

      for (const neighbor of neighbors) {
        const tile = this.grid.getTile(neighbor.x, neighbor.y);
        if (!tile) continue;

        // Walls block the flood fill
        if (tile.type === TileType.WALL) continue;

        // Add to queue if not visited
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    // If we didn't reach the edge, castle is enclosed
    return true;
  }

  /**
   * Reset the build phase
   */
  reset(): void {
    this.currentPiece = null;
    this.nextPiece = null;
  }
}
