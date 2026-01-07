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
    // Spawn in center of grid (valid playable area)
    const centerX = Math.floor(this.grid.getWidth() / 2);
    const centerY = Math.floor(this.grid.getHeight() / 2);

    // Move next piece to current
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
      // Reposition to center since next piece was also at center
      this.currentPiece.move(0, 0); // Reset to ensure position is set
    } else {
      // First piece - spawn at center
      this.currentPiece = WallPiece.createRandom({ x: centerX, y: centerY });
    }

    // Generate next piece at center position
    this.nextPiece = WallPiece.createRandom({ x: centerX, y: centerY });

    logger.info("New piece spawned", {
      current: this.currentPiece.name,
      currentPos: this.currentPiece.position,
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
   * Set piece position directly (for mouse click-to-move)
   * Allows movement over invalid tiles, only blocks at grid bounds
   */
  setPosition(x: number, y: number): boolean {
    if (!this.currentPiece) {
      logger.warn("SetPosition failed: No current piece available");
      return false;
    }

    const oldPos = { x: this.currentPiece.position.x, y: this.currentPiece.position.y };
    const dx = x - oldPos.x;
    const dy = y - oldPos.y;

    // Move to the target position
    this.currentPiece.move(dx, dy);
    const newPos = { x: this.currentPiece.position.x, y: this.currentPiece.position.y };

    // Only check bounds - allow movement over invalid tiles
    const boundsCheck = this.checkBounds(this.currentPiece);
    if (boundsCheck.inBounds) {
      logger.info("Piece position set successfully", {
        piece: this.currentPiece.name,
        from: oldPos,
        to: newPos,
      });
      return true;
    } else {
      // Revert move - only if out of bounds
      this.currentPiece.move(-dx, -dy);
      logger.warn("SetPosition blocked (out of bounds)", {
        piece: this.currentPiece.name,
        attemptedPosition: newPos,
        reason: boundsCheck.reason,
      });
      return false;
    }
  }

  /**
   * Move current piece (allows movement over invalid tiles, only blocks at grid bounds)
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

    // Only check bounds - allow movement over invalid tiles
    const boundsCheck = this.checkBounds(this.currentPiece);
    if (boundsCheck.inBounds) {
      logger.info("Piece moved successfully", {
        piece: this.currentPiece.name,
        from: oldPos,
        to: newPos,
        direction: { dx, dy },
      });
      return true;
    } else {
      // Revert move - only if out of bounds
      this.currentPiece.move(-dx, -dy);
      logger.warn("Move blocked (out of bounds)", {
        piece: this.currentPiece.name,
        attemptedPosition: newPos,
        direction: { dx, dy },
        reason: boundsCheck.reason,
      });
      return false;
    }
  }

  /**
   * Check if piece is within grid bounds (doesn't check tile validity)
   */
  private checkBounds(piece: WallPiece): { inBounds: boolean; reason?: string } {
    const tiles = piece.getOccupiedTiles();

    for (const tile of tiles) {
      if (tile.x < 0) {
        return { inBounds: false, reason: "Out of bounds (left edge)" };
      }
      if (tile.x >= this.grid.getWidth()) {
        return { inBounds: false, reason: "Out of bounds (right edge)" };
      }
      if (tile.y < 0) {
        return { inBounds: false, reason: "Out of bounds (top edge)" };
      }
      if (tile.y >= this.grid.getHeight()) {
        return { inBounds: false, reason: "Out of bounds (bottom edge)" };
      }
    }

    return { inBounds: true };
  }

  /**
   * Get list of invalid tile positions for current piece (for rendering feedback)
   */
  getInvalidTiles(): Position[] {
    if (!this.currentPiece) return [];

    const invalidTiles: Position[] = [];
    const tiles = this.currentPiece.getOccupiedTiles();

    for (const tile of tiles) {
      const gridTile = this.grid.getTile(tile.x, tile.y);
      if (!gridTile) continue;

      // Check if this tile would be invalid for placement
      if (
        gridTile.type === TileType.WATER ||
        gridTile.type === TileType.WALL ||
        gridTile.type === TileType.CASTLE ||
        gridTile.type === TileType.DEBRIS ||
        gridTile.type === TileType.CRATER
      ) {
        invalidTiles.push(tile);
      }
    }

    return invalidTiles;
  }

  /**
   * Rotate current piece (allows rotation over invalid tiles, only blocks at grid bounds)
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

    // Only check bounds - allow rotation over invalid tiles
    const boundsCheck = this.checkBounds(this.currentPiece);
    if (boundsCheck.inBounds) {
      logger.info("Piece rotated successfully", {
        piece: this.currentPiece.name,
        position: this.currentPiece.position,
        fromRotation: oldRotation,
        toRotation: newRotation,
        clockwise,
      });
      return true;
    } else {
      // Revert rotation - only if out of bounds
      if (clockwise) {
        this.currentPiece.rotateCounterClockwise();
      } else {
        this.currentPiece.rotateClockwise();
      }
      logger.warn("Rotation blocked (out of bounds)", {
        piece: this.currentPiece.name,
        position: this.currentPiece.position,
        attemptedRotation: newRotation,
        clockwise,
        reason: boundsCheck.reason,
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
    territoryTiles: Position[];
    enclosingWalls: Position[];
  } {
    logger.info("Validating territories");

    const enclosedCastles: Castle[] = [];
    const allTerritoryTiles: Position[] = [];
    const allEnclosingWalls: Position[] = [];
    const seenTerritoryKeys = new Set<string>();
    const seenWallKeys = new Set<string>();

    for (const castle of castles) {
      const result = this.getEnclosedTerritoryInfo(castle);
      if (result.isEnclosed) {
        enclosedCastles.push(castle);
        castle.enclosed = true;

        // Add territory tiles (deduplicated)
        for (const tile of result.territoryTiles) {
          const key = `${tile.x},${tile.y}`;
          if (!seenTerritoryKeys.has(key)) {
            seenTerritoryKeys.add(key);
            allTerritoryTiles.push(tile);
          }
        }

        // Add enclosing wall tiles (deduplicated)
        for (const wall of result.enclosingWalls) {
          const key = `${wall.x},${wall.y}`;
          if (!seenWallKeys.has(key)) {
            seenWallKeys.add(key);
            allEnclosingWalls.push(wall);
          }
        }
      } else {
        castle.enclosed = false;
      }
    }

    const hasValidTerritory = enclosedCastles.length > 0;

    logger.event("TerritoryValidated", {
      totalCastles: castles.length,
      enclosedCastles: enclosedCastles.length,
      territoryTiles: allTerritoryTiles.length,
      enclosingWalls: allEnclosingWalls.length,
      valid: hasValidTerritory,
    });

    return {
      hasValidTerritory,
      enclosedCastles,
      territoryTiles: allTerritoryTiles,
      enclosingWalls: allEnclosingWalls,
    };
  }

  /**
   * Get detailed info about an enclosed territory around a castle
   */
  private getEnclosedTerritoryInfo(castle: Castle): {
    isEnclosed: boolean;
    territoryTiles: Position[];
    enclosingWalls: Position[];
  } {
    const visited = new Set<string>();
    const queue: Position[] = [castle.position];
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();
    const territoryTiles: Position[] = [];
    const enclosingWalls: Position[] = [];
    const wallsFound = new Set<string>();

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // If we reached the edge, castle is NOT enclosed
      if (pos.x <= 0 || pos.x >= width - 1 || pos.y <= 0 || pos.y >= height - 1) {
        return { isEnclosed: false, territoryTiles: [], enclosingWalls: [] };
      }

      // This tile is part of the territory
      territoryTiles.push({ x: pos.x, y: pos.y });

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

        // Walls block the flood fill - track them as enclosing walls
        if (tile.type === TileType.WALL) {
          const wallKey = `${neighbor.x},${neighbor.y}`;
          if (!wallsFound.has(wallKey)) {
            wallsFound.add(wallKey);
            enclosingWalls.push({ x: neighbor.x, y: neighbor.y });
          }
          continue;
        }

        // Add to queue if not visited
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        if (!visited.has(neighborKey)) {
          queue.push(neighbor);
        }
      }
    }

    // If we didn't reach the edge, castle is enclosed
    return { isEnclosed: true, territoryTiles, enclosingWalls };
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
