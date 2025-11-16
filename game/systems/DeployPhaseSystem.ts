import { Grid } from "../grid/Grid";
import { TileType, Position, Castle, Cannon } from "../types";
import { createLogger } from "../logging/Logger";

const logger = createLogger("DeployPhaseSystem", true);

export class DeployPhaseSystem {
  private grid: Grid;
  private cannons: Cannon[] = [];
  private availableCannonCount: number = 0;
  private enclosedTerritories: Set<string> = new Set();

  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * Start the deploy phase
   */
  startDeployPhase(enclosedCastles: Castle[]): void {
    // Calculate available cannons based on enclosed castles
    this.availableCannonCount = enclosedCastles.reduce((count, castle) => {
      return count + (castle.isHome ? 2 : 1);
    }, 0);

    // Calculate enclosed territories (flood fill from each castle)
    this.calculateEnclosedTerritories(enclosedCastles);

    logger.event("DeployPhaseStarted", {
      availableCannons: this.availableCannonCount,
      enclosedCastles: enclosedCastles.length,
    });
  }

  /**
   * Calculate all tiles that are inside enclosed territories
   */
  private calculateEnclosedTerritories(enclosedCastles: Castle[]): void {
    this.enclosedTerritories.clear();

    for (const castle of enclosedCastles) {
      const territoryTiles = this.getEnclosedTerritory(castle.position);
      territoryTiles.forEach((tile) => {
        this.enclosedTerritories.add(`${tile.x},${tile.y}`);
      });
    }

    logger.info("Enclosed territories calculated", {
      totalTiles: this.enclosedTerritories.size,
    });
  }

  /**
   * Get all tiles within an enclosed territory (flood fill)
   */
  private getEnclosedTerritory(startPos: Position): Position[] {
    const visited = new Set<string>();
    const queue: Position[] = [startPos];
    const territory: Position[] = [];

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = `${pos.x},${pos.y}`;

      if (visited.has(key)) continue;
      visited.add(key);
      territory.push(pos);

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

    return territory;
  }

  /**
   * Check if a position is valid for cannon placement
   */
  isValidCannonPosition(pos: Position): boolean {
    // Must be within grid bounds
    const tile = this.grid.getTile(pos.x, pos.y);
    if (!tile) return false;

    // Must be on land (not water, wall, castle, etc.)
    if (tile.type !== TileType.LAND && tile.type !== TileType.EMPTY) {
      return false;
    }

    // Must be inside an enclosed territory
    const key = `${pos.x},${pos.y}`;
    if (!this.enclosedTerritories.has(key)) {
      return false;
    }

    // Can't place cannon where another cannon already exists
    if (this.cannons.some((c) => c.position.x === pos.x && c.position.y === pos.y)) {
      return false;
    }

    return true;
  }

  /**
   * Place a cannon at a position
   */
  placeCannon(pos: Position): boolean {
    // Check if we have cannons available
    if (this.cannons.length >= this.availableCannonCount) {
      logger.warn("Cannot place cannon: no cannons available");
      return false;
    }

    // Check if position is valid
    if (!this.isValidCannonPosition(pos)) {
      logger.warn("Cannot place cannon: invalid position", { pos });
      return false;
    }

    // Create cannon
    const cannon: Cannon = {
      id: `cannon_${Date.now()}_${Math.random()}`,
      position: { ...pos },
      angle: 0,
    };

    this.cannons.push(cannon);

    logger.event("CannonPlaced", {
      position: pos,
      totalCannons: this.cannons.length,
      remaining: this.availableCannonCount - this.cannons.length,
    });

    return true;
  }

  /**
   * Remove a cannon at a position
   */
  removeCannon(pos: Position): boolean {
    const index = this.cannons.findIndex(
      (c) => c.position.x === pos.x && c.position.y === pos.y
    );

    if (index === -1) {
      return false;
    }

    this.cannons.splice(index, 1);
    logger.info("Cannon removed", { pos, remaining: this.cannons.length });
    return true;
  }

  /**
   * Get all placed cannons
   */
  getCannons(): Cannon[] {
    return [...this.cannons];
  }

  /**
   * Get available cannon count
   */
  getAvailableCannonCount(): number {
    return this.availableCannonCount;
  }

  /**
   * Get remaining cannons to place
   */
  getRemainingCannonCount(): number {
    return Math.max(0, this.availableCannonCount - this.cannons.length);
  }

  /**
   * Check if a tile is inside enclosed territory
   */
  isInsideTerritory(pos: Position): boolean {
    const key = `${pos.x},${pos.y}`;
    return this.enclosedTerritories.has(key);
  }

  /**
   * Clear all cannons
   */
  clearCannons(): void {
    this.cannons = [];
    logger.info("All cannons cleared");
  }

  /**
   * Reset the deploy phase
   */
  reset(): void {
    this.cannons = [];
    this.availableCannonCount = 0;
    this.enclosedTerritories.clear();
  }

  /**
   * Finalize deployment - transfer cannons to grid
   */
  finalizeDeployment(): Cannon[] {
    logger.event("DeploymentFinalized", {
      cannonsPlaced: this.cannons.length,
      available: this.availableCannonCount,
    });

    return [...this.cannons];
  }
}
