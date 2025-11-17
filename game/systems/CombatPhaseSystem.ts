import { Grid } from "../grid/Grid";
import { TileType, Position, Ship, Cannon, Projectile } from "../types";
import { createLogger } from "../logging/Logger";

const logger = createLogger("CombatPhaseSystem", true);

export class CombatPhaseSystem {
  private grid: Grid;
  private ships: Ship[] = [];
  private projectiles: Projectile[] = [];
  private cannons: Cannon[] = [];
  private shipsDefeated: number = 0;
  private targetShipsPerWave: number = 5;

  constructor(grid: Grid) {
    this.grid = grid;
  }

  /**
   * Start combat phase
   */
  startCombatPhase(cannons: Cannon[]): void {
    this.cannons = [...cannons];
    this.ships = [];
    this.projectiles = [];
    this.shipsDefeated = 0;

    // Spawn initial wave of ships
    this.spawnShipWave();

    logger.event("CombatPhaseStarted", {
      cannons: this.cannons.length,
      targetShips: this.targetShipsPerWave,
    });
  }

  /**
   * Spawn a wave of ships along coastlines
   */
  private spawnShipWave(): void {
    const spawnPoints = this.findCoastlineSpawnPoints();

    for (let i = 0; i < this.targetShipsPerWave; i++) {
      if (spawnPoints.length === 0) break;

      // Pick random spawn point
      const spawnIndex = Math.floor(Math.random() * spawnPoints.length);
      const spawnPoint = spawnPoints[spawnIndex];

      // Generate path towards castles
      const path = this.generateShipPath(spawnPoint);

      const ship: Ship = {
        id: `ship_${Date.now()}_${i}`,
        position: { ...spawnPoint },
        health: 3,
        maxHealth: 3,
        speed: 0.5, // tiles per second
        path,
        pathIndex: 0,
        velocity: { x: 0, y: 0 },
        isAlive: true,
      };

      this.ships.push(ship);
    }

    logger.info(`Spawned ${this.ships.length} ships`);
  }

  /**
   * Find valid spawn points along coastlines (water next to land)
   */
  private findCoastlineSpawnPoints(): Position[] {
    const points: Position[] = [];
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();

    // Check edges of map for water tiles
    for (let y = 0; y < height; y++) {
      // Left edge
      const leftTile = this.grid.getTile(0, y);
      if (leftTile && leftTile.type === TileType.WATER) {
        points.push({ x: 0, y });
      }

      // Right edge
      const rightTile = this.grid.getTile(width - 1, y);
      if (rightTile && rightTile.type === TileType.WATER) {
        points.push({ x: width - 1, y });
      }
    }

    for (let x = 0; x < width; x++) {
      // Top edge
      const topTile = this.grid.getTile(x, 0);
      if (topTile && topTile.type === TileType.WATER) {
        points.push({ x, y: 0 });
      }

      // Bottom edge
      const bottomTile = this.grid.getTile(x, height - 1);
      if (bottomTile && bottomTile.type === TileType.WATER) {
        points.push({ x, y: height - 1 });
      }
    }

    return points;
  }

  /**
   * Generate a path for ship to follow (simple: move towards center)
   */
  private generateShipPath(start: Position): Position[] {
    const path: Position[] = [{ ...start }];
    const centerX = Math.floor(this.grid.getWidth() / 2);
    const centerY = Math.floor(this.grid.getHeight() / 2);

    let current = { ...start };
    const maxSteps = 50;

    for (let i = 0; i < maxSteps; i++) {
      if (current.x === centerX && current.y === centerY) break;

      const dx = centerX - current.x;
      const dy = centerY - current.y;

      // Move one step towards center
      if (Math.abs(dx) > Math.abs(dy)) {
        current.x += dx > 0 ? 1 : -1;
      } else {
        current.y += dy > 0 ? 1 : -1;
      }

      path.push({ ...current });
    }

    return path;
  }

  /**
   * Update combat phase (called every frame)
   */
  update(delta: number): void {
    const deltaSeconds = delta / 1000;

    // Update ships
    this.updateShips(deltaSeconds);

    // Update projectiles
    this.updateProjectiles(deltaSeconds);

    // Check collisions
    this.checkCollisions();
  }

  /**
   * Update all ships
   */
  private updateShips(deltaSeconds: number): void {
    for (const ship of this.ships) {
      if (!ship.isAlive) continue;

      // Move ship along path
      if (ship.pathIndex < ship.path.length - 1) {
        const target = ship.path[ship.pathIndex + 1];
        const dx = target.x - ship.position.x;
        const dy = target.y - ship.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.1) {
          // Reached waypoint, move to next
          ship.pathIndex++;
          ship.position = { ...target };
        } else {
          // Move towards waypoint
          ship.velocity.x = (dx / distance) * ship.speed;
          ship.velocity.y = (dy / distance) * ship.speed;
          ship.position.x += ship.velocity.x * deltaSeconds;
          ship.position.y += ship.velocity.y * deltaSeconds;
        }
      }

      // Ships fire at random intervals
      if (Math.random() < 0.002) {
        this.shipFireProjectile(ship);
      }
    }
  }

  /**
   * Ship fires a projectile at a random land tile
   */
  private shipFireProjectile(ship: Ship): void {
    // Find a random land tile to shoot at
    const landTiles: Position[] = [];
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.grid.getTile(x, y);
        if (tile && tile.type === TileType.LAND) {
          landTiles.push({ x, y });
        }
      }
    }

    if (landTiles.length === 0) return;

    const target = landTiles[Math.floor(Math.random() * landTiles.length)];
    const dx = target.x - ship.position.x;
    const dy = target.y - ship.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 5; // tiles per second

    const projectile: Projectile = {
      id: `proj_enemy_${Date.now()}_${Math.random()}`,
      position: { ...ship.position },
      velocity: {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed,
      },
      source: "enemy",
      damage: 1,
      isActive: true,
    };

    this.projectiles.push(projectile);
    logger.info("Ship fired projectile", { shipId: ship.id });
  }

  /**
   * Update all projectiles
   */
  private updateProjectiles(deltaSeconds: number): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isActive) continue;

      // Move projectile
      projectile.position.x += projectile.velocity.x * deltaSeconds;
      projectile.position.y += projectile.velocity.y * deltaSeconds;

      // Check if out of bounds
      const gridX = Math.floor(projectile.position.x);
      const gridY = Math.floor(projectile.position.y);
      const tile = this.grid.getTile(gridX, gridY);

      if (!tile) {
        projectile.isActive = false;
      }
    }

    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter((p) => p.isActive);
  }

  /**
   * Check collisions between projectiles and targets
   */
  private checkCollisions(): void {
    for (const projectile of this.projectiles) {
      if (!projectile.isActive) continue;

      const gridX = Math.floor(projectile.position.x);
      const gridY = Math.floor(projectile.position.y);

      if (projectile.source === "player") {
        // Check hit on ships
        for (const ship of this.ships) {
          if (!ship.isAlive) continue;

          const shipGridX = Math.floor(ship.position.x);
          const shipGridY = Math.floor(ship.position.y);

          if (shipGridX === gridX && shipGridY === gridY) {
            ship.health -= projectile.damage;
            projectile.isActive = false;

            if (ship.health <= 0) {
              ship.isAlive = false;
              this.shipsDefeated++;
              logger.event("ShipDestroyed", {
                shipId: ship.id,
                totalDefeated: this.shipsDefeated,
              });
            }

            break;
          }
        }
      } else {
        // Enemy projectile hits land/walls
        const tile = this.grid.getTile(gridX, gridY);
        if (tile && (tile.type === TileType.LAND || tile.type === TileType.WALL)) {
          // Create crater
          this.grid.setTile(gridX, gridY, TileType.CRATER);
          projectile.isActive = false;
          logger.event("CraterCreated", { position: { x: gridX, y: gridY } });
        }
      }
    }
  }

  /**
   * Fire cannon at target position
   */
  fireCannon(cannonId: string, targetPos: Position): void {
    const cannon = this.cannons.find((c) => c.id === cannonId);
    if (!cannon) {
      logger.warn("Fire cannon failed: Cannon not found", {
        cannonId,
        targetPos,
        availableCannons: this.cannons.length,
        cannonIds: this.cannons.map(c => c.id),
      });
      return;
    }

    const dx = targetPos.x - cannon.position.x;
    const dy = targetPos.y - cannon.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 8; // tiles per second

    const projectile: Projectile = {
      id: `proj_player_${Date.now()}_${Math.random()}`,
      position: { ...cannon.position },
      velocity: {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed,
      },
      source: "player",
      damage: 1,
      isActive: true,
    };

    this.projectiles.push(projectile);
    logger.event("CannonFired", {
      projectileId: projectile.id,
      cannonId,
      cannonPosition: cannon.position,
      target: targetPos,
      distance: distance.toFixed(2),
      velocity: projectile.velocity,
    });
  }

  /**
   * Get all ships
   */
  getShips(): Ship[] {
    return [...this.ships];
  }

  /**
   * Get all projectiles
   */
  getProjectiles(): Projectile[] {
    return [...this.projectiles];
  }

  /**
   * Get ships defeated count
   */
  getShipsDefeated(): number {
    return this.shipsDefeated;
  }

  /**
   * Check if combat phase is complete
   */
  isCombatComplete(): boolean {
    // Combat complete if all ships defeated or all ships reached end
    const aliveShips = this.ships.filter((s) => s.isAlive);
    return aliveShips.length === 0;
  }

  /**
   * Reset combat phase
   */
  reset(): void {
    this.ships = [];
    this.projectiles = [];
    this.cannons = [];
    this.shipsDefeated = 0;
  }
}
