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
   * Spawn ships early (for visibility during DEPLOY phase)
   * Ships will be visible but won't move or fire until combat starts
   */
  spawnShipsForPreview(): void {
    this.ships = [];
    this.projectiles = [];
    this.shipsDefeated = 0;

    // Spawn ships so player can see them during DEPLOY
    this.spawnShipWave();

    logger.event("ShipsSpawnedForPreview", {
      shipCount: this.ships.length,
    });
  }

  /**
   * Start combat phase
   */
  startCombatPhase(cannons: Cannon[]): void {
    this.cannons = [...cannons];
    this.projectiles = [];
    this.shipsDefeated = 0;

    // If ships weren't already spawned during preview, spawn them now
    if (this.ships.length === 0) {
      this.spawnShipWave();
    }

    logger.event("CombatPhaseStarted", {
      cannons: this.cannons.length,
      targetShips: this.targetShipsPerWave,
    });
  }

  /**
   * Spawn a wave of ships along coastlines with varied ship types
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

      // Randomly assign ship type with weighted probabilities
      const shipType = this.getRandomShipType();
      const shipStats = this.getShipStats(shipType);

      const ship: Ship = {
        id: `ship_${Date.now()}_${i}`,
        position: { ...spawnPoint },
        health: shipStats.health,
        maxHealth: shipStats.health,
        speed: shipStats.speed,
        path,
        pathIndex: 0,
        velocity: { x: 0, y: 0 },
        isAlive: true,
        shipType: shipType,
        fireRate: shipStats.fireRate,
        damage: shipStats.damage,
      };

      this.ships.push(ship);
    }

    logger.info(`Spawned ${this.ships.length} ships`, {
      types: this.ships.map(s => s.shipType),
    });
  }

  /**
   * Get random ship type with weighted probabilities
   */
  private getRandomShipType(): "scout" | "destroyer" | "frigate" {
    const roll = Math.random();
    if (roll < 0.4) return "scout";      // 40% scouts
    if (roll < 0.75) return "frigate";   // 35% frigates
    return "destroyer";                   // 25% destroyers
  }

  /**
   * Get stats for each ship type
   */
  private getShipStats(type: "scout" | "destroyer" | "frigate"): {
    health: number;
    speed: number;
    fireRate: number;
    damage: number;
  } {
    switch (type) {
      case "scout":
        return { health: 2, speed: 0.8, fireRate: 0.004, damage: 1 };
      case "destroyer":
        return { health: 5, speed: 0.3, fireRate: 0.002, damage: 2 };
      case "frigate":
      default:
        return { health: 3, speed: 0.5, fireRate: 0.003, damage: 1 };
    }
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

      // Ships fire based on their fire rate
      if (Math.random() < ship.fireRate) {
        this.shipFireProjectile(ship);
      }
    }
  }

  /**
   * Check if a source (cannon or ship) has an active projectile in flight
   */
  private hasActiveProjectile(sourceId: string): boolean {
    return this.projectiles.some(p => p.isActive && p.sourceId === sourceId);
  }

  /**
   * Ship fires a projectile using smart targeting AI
   * Priority: Cannons > Walls > Castles > Random Land
   */
  private shipFireProjectile(ship: Ship): void {
    // Only allow one projectile per ship at a time
    if (this.hasActiveProjectile(ship.id)) {
      return;
    }

    // Smart targeting: Find the best target
    const target = this.findSmartTarget(ship);
    if (!target) return;

    const startPos = { ...ship.position };
    const dx = target.position.x - startPos.x;
    const dy = target.position.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 5; // tiles per second

    const projectile: Projectile = {
      id: `proj_enemy_${Date.now()}_${Math.random()}`,
      position: { ...startPos },
      velocity: {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed,
      },
      source: "enemy",
      sourceId: ship.id,
      damage: ship.damage,
      isActive: true,
      startPosition: startPos,
      targetPosition: { ...target.position },
      progress: 0,
    };

    this.projectiles.push(projectile);
    logger.info("Ship fired projectile", {
      shipId: ship.id,
      shipType: ship.shipType,
      targetType: target.type,
      targetPos: target.position,
    });
  }

  /**
   * Find the best target for a ship using prioritized AI
   */
  private findSmartTarget(ship: Ship): { position: Position; type: string } | null {
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();

    // Collect potential targets by priority
    const cannonTargets: Position[] = [];
    const wallTargets: Position[] = [];
    const castleTargets: Position[] = [];
    const landTargets: Position[] = [];

    // Check cannons first (highest priority)
    for (const cannon of this.cannons) {
      cannonTargets.push({ ...cannon.position });
    }

    // Scan grid for walls, castles, and land
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.grid.getTile(x, y);
        if (!tile) continue;

        switch (tile.type) {
          case TileType.WALL:
            wallTargets.push({ x, y });
            break;
          case TileType.CASTLE:
            castleTargets.push({ x, y });
            break;
          case TileType.LAND:
            landTargets.push({ x, y });
            break;
        }
      }
    }

    // Prioritized targeting with some randomness
    // 70% chance to use priority system, 30% random for unpredictability
    const useSmartTargeting = Math.random() < 0.7;

    if (useSmartTargeting) {
      // Priority 1: Cannons (50% chance if available)
      if (cannonTargets.length > 0 && Math.random() < 0.5) {
        const target = this.getClosestTarget(ship.position, cannonTargets);
        return { position: target, type: "cannon" };
      }

      // Priority 2: Walls (40% chance if available)
      if (wallTargets.length > 0 && Math.random() < 0.4) {
        const target = this.getClosestTarget(ship.position, wallTargets);
        return { position: target, type: "wall" };
      }

      // Priority 3: Castles (30% chance if available)
      if (castleTargets.length > 0 && Math.random() < 0.3) {
        const target = this.getClosestTarget(ship.position, castleTargets);
        return { position: target, type: "castle" };
      }
    }

    // Fallback: Random land tile
    if (landTargets.length > 0) {
      const target = landTargets[Math.floor(Math.random() * landTargets.length)];
      return { position: target, type: "land" };
    }

    return null;
  }

  /**
   * Get the closest target from a list of positions
   */
  private getClosestTarget(shipPos: Position, targets: Position[]): Position {
    let closest = targets[0];
    let minDist = Number.MAX_VALUE;

    for (const target of targets) {
      const dx = target.x - shipPos.x;
      const dy = target.y - shipPos.y;
      const dist = dx * dx + dy * dy; // Skip sqrt for comparison
      if (dist < minDist) {
        minDist = dist;
        closest = target;
      }
    }

    return closest;
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

      // Calculate arc progress (0 to 1)
      const totalDx = projectile.targetPosition.x - projectile.startPosition.x;
      const totalDy = projectile.targetPosition.y - projectile.startPosition.y;
      const totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

      const traveledDx = projectile.position.x - projectile.startPosition.x;
      const traveledDy = projectile.position.y - projectile.startPosition.y;
      const traveledDistance = Math.sqrt(traveledDx * traveledDx + traveledDy * traveledDy);

      projectile.progress = Math.min(1, traveledDistance / totalDistance);

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
        // Enemy projectile - only check collision when projectile reaches target
        // This simulates the cannonball arcing OVER terrain and landing at target
        if (projectile.progress < 0.95) {
          continue; // Still in flight, arcing over terrain
        }

        // Projectile has reached target - check for hits
        let hitCannon = false;
        for (let i = this.cannons.length - 1; i >= 0; i--) {
          const cannon = this.cannons[i];
          const cannonGridX = Math.floor(cannon.position.x);
          const cannonGridY = Math.floor(cannon.position.y);

          if (cannonGridX === gridX && cannonGridY === gridY) {
            cannon.health -= projectile.damage;
            projectile.isActive = false;
            hitCannon = true;

            logger.event("CannonHit", {
              cannonId: cannon.id,
              remainingHealth: cannon.health,
              position: cannon.position,
            });

            if (cannon.health <= 0) {
              // Destroy cannon - remove from array and create debris
              this.cannons.splice(i, 1);
              this.grid.setTile(gridX, gridY, TileType.DEBRIS);
              logger.event("CannonDestroyed", {
                cannonId: cannon.id,
                position: cannon.position,
              });
            }
            break;
          }
        }

        // If didn't hit a cannon, check for land/walls
        if (!hitCannon) {
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
  }

  /**
   * Fire cannon at target position
   */
  fireCannon(cannonId: string, targetPos: Position): boolean {
    const cannon = this.cannons.find((c) => c.id === cannonId);
    if (!cannon) {
      logger.warn("Fire cannon failed: Cannon not found", {
        cannonId,
        targetPos,
        availableCannons: this.cannons.length,
        cannonIds: this.cannons.map(c => c.id),
      });
      return false;
    }

    // Only allow one projectile per cannon at a time
    if (this.hasActiveProjectile(cannonId)) {
      logger.info("Fire cannon blocked: Projectile already in flight", { cannonId });
      return false;
    }

    const startPos = { ...cannon.position };
    const dx = targetPos.x - startPos.x;
    const dy = targetPos.y - startPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 8; // tiles per second

    const projectile: Projectile = {
      id: `proj_player_${Date.now()}_${Math.random()}`,
      position: { ...startPos },
      velocity: {
        x: (dx / distance) * speed,
        y: (dy / distance) * speed,
      },
      source: "player",
      sourceId: cannonId,
      damage: 1,
      isActive: true,
      startPosition: startPos,
      targetPosition: { ...targetPos },
      progress: 0,
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
    return true;
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
