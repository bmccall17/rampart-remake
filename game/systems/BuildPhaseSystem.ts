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
    logger.info("🎯 startBuildPhase() called!");
    this.spawnNewPiece();
    logger.event("BuildPhaseStarted", {
      piece: this.currentPiece?.name || "none",
      pieceExists: this.currentPiece !== null,
    });

    if (!this.currentPiece) {
      logger.error("❌ CRITICAL: Piece is NULL after spawnNewPiece()!");
    } else {
      logger.info("✅ Piece spawned successfully:", {
        name: this.currentPiece.name,
        position: this.currentPiece.position,
      });
    }
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
    if (!this.currentPiece) {
      logger.warn("⚠️ getCurrentPiece() called but currentPiece is NULL!");
    }
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
    if (!this.currentPiece) {
      logger.warn("Move failed: No current piece available");
      return false;
    }

    const oldPos = { x: this.currentPiece.position.x, y: this.currentPiece.position.y };

    // Try to move
    this.currentPiece.move(dx, dy);
    const newPos = { x: this.currentPiece.position.x, y: this.currentPiece.position.y };

    // Check if valid
    const validationResult = this.getValidationFailureReason(this.currentPiece);
    if (validationResult.isValid) {
      logger.info("Piece moved successfully", {
        piece: this.currentPiece.name,
        from: oldPos,
        to: newPos,
        direction: { dx, dy },
      });
      return true;
    } else {
      // Revert move
      this.currentPiece.move(-dx, -dy);
      logger.warn("Move blocked", {
        piece: this.currentPiece.name,
        attemptedPosition: newPos,
        direction: { dx, dy },
        reason: validationResult.reason,
        details: validationResult.details,
      });
      return false;
    }
  }

  /**
   * Rotate current piece
   */
  rotatePiece(clockwise: boolean = true): boolean {
    if (!this.currentPiece) {
      logger.warn("Rotate failed: No current piece available");
      return false;
    }

    const oldRotation = (this.currentPiece as any).currentRotation || 0;

    // Try rotation
    if (clockwise) {
      this.currentPiece.rotateClockwise();
    } else {
      this.currentPiece.rotateCounterClockwise();
    }

    const newRotation = (this.currentPiece as any).currentRotation || 0;

    // Check if valid
    const validationResult = this.getValidationFailureReason(this.currentPiece);
    if (validationResult.isValid) {
      logger.info("Piece rotated successfully", {
        piece: this.currentPiece.name,
        position: this.currentPiece.position,
        fromRotation: oldRotation,
        toRotation: newRotation,
        clockwise,
      });
      return true;
    } else {
      // Revert rotation
      if (clockwise) {
        this.currentPiece.rotateCounterClockwise();
      } else {
        this.currentPiece.rotateClockwise();
      }
      logger.warn("Rotation blocked", {
        piece: this.currentPiece.name,
        position: this.currentPiece.position,
        attemptedRotation: newRotation,
        clockwise,
        reason: validationResult.reason,
        details: validationResult.details,
      });
      return false;
    }
  }

  /**
   * Check if a piece position is valid (no collisions)
   */
  isValidPosition(piece: WallPiece): boolean {
    return this.getValidationFailureReason(piece).isValid;
  }

  /**
   * Get detailed reason why a piece position is invalid
   */
  private getValidationFailureReason(piece: WallPiece): {
    isValid: boolean;
    reason?: string;
    details?: any;
  } {
    const tiles = piece.getOccupiedTiles();

    for (const tile of tiles) {
      // Check bounds
      if (tile.x < 0) {
        return {
          isValid: false,
          reason: "Out of bounds (left edge)",
          details: { tile, bounds: { minX: 0 } },
        };
      }
      if (tile.x >= this.grid.getWidth()) {
        return {
          isValid: false,
          reason: "Out of bounds (right edge)",
          details: { tile, bounds: { maxX: this.grid.getWidth() - 1 } },
        };
      }
      if (tile.y < 0) {
        return {
          isValid: false,
          reason: "Out of bounds (top edge)",
          details: { tile, bounds: { minY: 0 } },
        };
      }
      if (tile.y >= this.grid.getHeight()) {
        return {
          isValid: false,
          reason: "Out of bounds (bottom edge)",
          details: { tile, bounds: { maxY: this.grid.getHeight() - 1 } },
        };
      }

      // Check tile type
      const gridTile = this.grid.getTile(tile.x, tile.y);
      if (!gridTile) {
        return {
          isValid: false,
          reason: "Grid tile not found",
          details: { tile },
        };
      }

      // Can't place on water, existing walls, castles, or debris
      if (gridTile.type === TileType.WATER) {
        return {
          isValid: false,
          reason: "Cannot place on water",
          details: { tile, tileType: "WATER" },
        };
      }
      if (gridTile.type === TileType.WALL) {
        return {
          isValid: false,
          reason: "Cannot place on existing wall",
          details: { tile, tileType: "WALL" },
        };
      }
      if (gridTile.type === TileType.CASTLE) {
        return {
          isValid: false,
          reason: "Cannot place on castle",
          details: { tile, tileType: "CASTLE" },
        };
      }
      if (gridTile.type === TileType.DEBRIS) {
        return {
          isValid: false,
          reason: "Cannot place on debris",
          details: { tile, tileType: "DEBRIS" },
        };
      }
      if (gridTile.type === TileType.CRATER) {
        return {
          isValid: false,
          reason: "Cannot place on crater",
          details: { tile, tileType: "CRATER" },
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Place the current piece on the grid
   */
  placePiece(): boolean {
    if (!this.currentPiece) {
      logger.warn("Place failed: No current piece available");
      return false;
    }

    const validationResult = this.getValidationFailureReason(this.currentPiece);
    if (!validationResult.isValid) {
      logger.warn("Cannot place piece at invalid position", {
        piece: this.currentPiece.name,
        position: this.currentPiece.position,
        reason: validationResult.reason,
        details: validationResult.details,
      });
      return false;
    }

    // Place walls on grid
    const tiles = this.currentPiece.getOccupiedTiles();
    const tilesChanged: Array<{pos: Position; oldType: TileType; newType: TileType}> = [];

    for (const tile of tiles) {
      const oldType = this.grid.getTile(tile.x, tile.y)?.type || TileType.EMPTY;
      this.grid.setTile(tile.x, tile.y, TileType.WALL);
      tilesChanged.push({
        pos: tile,
        oldType,
        newType: TileType.WALL,
      });
    }

    logger.event("PiecePlaced", {
      piece: this.currentPiece.name,
      position: this.currentPiece.position,
      tilesPlaced: tiles.length,
      tileChanges: tilesChanged,
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
    logger.warn("🔄 BuildPhaseSystem.reset() called - clearing pieces!");
    this.currentPiece = null;
    this.nextPiece = null;
  }
}
