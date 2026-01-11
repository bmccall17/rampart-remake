import { Grid } from "../grid/Grid";
import { TileType, Position, Ship, Cannon, Projectile, ShipType } from "../types";
import { createLogger } from "../logging/Logger";

const logger = createLogger("CombatPhaseSystem", true);

/**
 * Ship stats configuration - easy to balance
 */
export interface ShipStats {
  health: number;
  speed: number;
  fireRate: number;
  damage: number;
  points: number; // Points awarded for destroying this ship type
}

export const SHIP_STATS_CONFIG: Record<ShipType, ShipStats> = {
  scout: {
    health: 2,
    speed: 1.0,      // Fast
    fireRate: 0.004, // Fires often but weak
    damage: 1,
    points: 75,      // Less points (easier to kill)
  },
  frigate: {
    health: 3,
    speed: 0.5,      // Medium
    fireRate: 0.003,
    damage: 1,
    points: 100,     // Standard points
  },
  destroyer: {
    health: 5,
    speed: 0.3,      // Slow but tanky
    fireRate: 0.002, // Fires less often but harder
    damage: 2,
    points: 150,     // More points (harder to kill)
  },
  boss: {
    health: 15,      // Very tanky - requires focused fire
    speed: 0.2,      // Slow but menacing
    fireRate: 0.006, // Fires frequently
    damage: 3,       // High damage
    points: 500,     // Big reward
  },
};

/**
 * Critical hit configuration
 */
export const CRITICAL_HIT_CONFIG = {
  radius: 0.25,        // Distance from ship center (in tiles) for critical hit
  damageMultiplier: 2, // 2x damage on critical
  bonusPoints: 25,     // Extra points for critical hit
};

/**
 * Wave composition configuration by level range
 * weights: [scout, frigate, destroyer] - relative spawn probabilities
 * minShips/maxShips: ship count range for this level tier
 */
export interface WaveConfig {
  weights: [number, number, number]; // [scout, frigate, destroyer]
  minShips: number;
  maxShips: number;
}

export const WAVE_COMPOSITION_CONFIG: Record<string, WaveConfig> = {
  // Levels 1-2: Scouts and Frigates only (no destroyers)
  early: {
    weights: [0.6, 0.4, 0],    // 60% scout, 40% frigate, 0% destroyer
    minShips: 5,
    maxShips: 7,
  },
  // Levels 3-4: Introduce Destroyers
  mid: {
    weights: [0.35, 0.4, 0.25], // 35% scout, 40% frigate, 25% destroyer
    minShips: 7,
    maxShips: 10,
  },
  // Levels 5+: All ship types with larger waves
  late: {
    weights: [0.25, 0.4, 0.35], // 25% scout, 40% frigate, 35% destroyer
    minShips: 10,
    maxShips: 15,
  },
};

export type ShipDestroyedCallback = (ship: Ship, points: number, isCritical: boolean) => void;
export type ShipHitCallback = (ship: Ship, damage: number, isCritical: boolean) => void;
export type TerrainImpactCallback = (gridX: number, gridY: number) => void;
export type WaterSplashCallback = (gridX: number, gridY: number) => void;
export type BossSpawnCallback = (ship: Ship) => void;
export type PlayerWaterSplashCallback = (gridX: number, gridY: number) => void;
export type WallDestroyedCallback = (gridX: number, gridY: number) => void;

/**
 * Combat statistics tracked per round
 */
export interface CombatStats {
  scoutsDestroyed: number;
  frigatesDestroyed: number;
  destroyersDestroyed: number;
  bossesDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  wallsDestroyed: number;
  cratersCreated: number;
}

export class CombatPhaseSystem {
  private grid: Grid;
  private ships: Ship[] = [];
  private projectiles: Projectile[] = [];
  private cannons: Cannon[] = [];
  private shipsDefeated: number = 0;
  private targetShipsPerWave: number = 5;
  private currentLevel: number = 1;
  private onShipDestroyed: ShipDestroyedCallback | null = null;
  private onShipHit: ShipHitCallback | null = null;
  private onTerrainImpact: TerrainImpactCallback | null = null;
  private onWaterSplash: WaterSplashCallback | null = null;
  private onBossSpawn: BossSpawnCallback | null = null;
  private onPlayerWaterSplash: PlayerWaterSplashCallback | null = null;
  private onWallDestroyed: WallDestroyedCallback | null = null;

  // Combat statistics tracking
  private combatStats: CombatStats = {
    scoutsDestroyed: 0,
    frigatesDestroyed: 0,
    destroyersDestroyed: 0,
    bossesDestroyed: 0,
    shotsFired: 0,
    shotsHit: 0,
    wallsDestroyed: 0,
    cratersCreated: 0,
  };

  constructor(grid: Grid) {
    this.grid = grid;
  }

  setOnShipDestroyed(callback: ShipDestroyedCallback): void {
    this.onShipDestroyed = callback;
  }

  setOnShipHit(callback: ShipHitCallback): void {
    this.onShipHit = callback;
  }

  setOnTerrainImpact(callback: TerrainImpactCallback): void {
    this.onTerrainImpact = callback;
  }

  setOnWaterSplash(callback: WaterSplashCallback): void {
    this.onWaterSplash = callback;
  }

  setOnBossSpawn(callback: BossSpawnCallback): void {
    this.onBossSpawn = callback;
  }

  setOnPlayerWaterSplash(callback: PlayerWaterSplashCallback): void {
    this.onPlayerWaterSplash = callback;
  }

  setOnWallDestroyed(callback: WallDestroyedCallback): void {
    this.onWallDestroyed = callback;
  }

  /**
   * Get combat statistics for the current round
   */
  getCombatStats(): CombatStats {
    return { ...this.combatStats };
  }

  /**
   * Reset combat statistics for new round
   */
  resetCombatStats(): void {
    this.combatStats = {
      scoutsDestroyed: 0,
      frigatesDestroyed: 0,
      destroyersDestroyed: 0,
      bossesDestroyed: 0,
      shotsFired: 0,
      shotsHit: 0,
      wallsDestroyed: 0,
      cratersCreated: 0,
    };
  }

  /**
   * Check if this is a boss level (every 5 levels)
   */
  isBossLevel(): boolean {
    return this.currentLevel > 0 && this.currentLevel % 5 === 0;
  }

  /**
   * Get wave config for the current level
   */
  private getWaveConfig(): WaveConfig {
    if (this.currentLevel <= 2) {
      return WAVE_COMPOSITION_CONFIG.early;
    } else if (this.currentLevel <= 4) {
      return WAVE_COMPOSITION_CONFIG.mid;
    } else {
      return WAVE_COMPOSITION_CONFIG.late;
    }
  }

  /**
   * Set the current level for difficulty scaling
   */
  setLevel(level: number): void {
    this.currentLevel = level;
    const waveConfig = this.getWaveConfig();

    // Calculate ship count based on wave config + level scaling
    const levelBonus = Math.floor((level - 1) / 2); // +1 ship every 2 levels
    this.targetShipsPerWave = Math.min(
      waveConfig.maxShips,
      waveConfig.minShips + levelBonus
    );

    logger.info(`Level set to ${level}`, {
      tier: level <= 2 ? "early" : level <= 4 ? "mid" : "late",
      shipsPerWave: this.targetShipsPerWave,
      weights: waveConfig.weights,
    });
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
    const isBossLevel = this.isBossLevel();

    // Spawn regular ships
    for (let i = 0; i < this.targetShipsPerWave; i++) {
      if (spawnPoints.length === 0) break;

      // Pick random spawn point
      const spawnIndex = Math.floor(Math.random() * spawnPoints.length);
      const spawnPoint = spawnPoints[spawnIndex];

      // Generate path with spread offset based on ship index
      const spreadOffset = this.calculateSpreadOffset(i, this.targetShipsPerWave);
      const path = this.generateShipPath(spawnPoint, spreadOffset);

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

    // Spawn boss on boss levels (every 5 levels)
    if (isBossLevel && spawnPoints.length > 0) {
      const bossSpawnIndex = Math.floor(Math.random() * spawnPoints.length);
      const bossSpawnPoint = spawnPoints[bossSpawnIndex];
      const bossPath = this.generateShipPath(bossSpawnPoint, { x: 0, y: 0 }); // Boss goes to center
      const bossStats = this.getShipStats("boss");

      const bossShip: Ship = {
        id: `boss_${Date.now()}`,
        position: { ...bossSpawnPoint },
        health: bossStats.health,
        maxHealth: bossStats.health,
        speed: bossStats.speed,
        path: bossPath,
        pathIndex: 0,
        velocity: { x: 0, y: 0 },
        isAlive: true,
        shipType: "boss",
        fireRate: bossStats.fireRate,
        damage: bossStats.damage,
      };

      this.ships.push(bossShip);

      // Notify of boss spawn for sound/visual effects
      if (this.onBossSpawn) {
        this.onBossSpawn(bossShip);
      }

      logger.event("BossShipSpawned", {
        level: this.currentLevel,
        bossHealth: bossStats.health,
      });
    }

    logger.info(`Spawned ${this.ships.length} ships`, {
      types: this.ships.map(s => s.shipType),
      isBossLevel,
    });
  }

  /**
   * Calculate spread offset to prevent ships from clustering
   * Ships spread in a fan pattern around the center target
   */
  private calculateSpreadOffset(shipIndex: number, totalShips: number): Position {
    // Spread ships in a fan from -8 to +8 tiles offset from center
    const spreadRange = 8;
    const spreadStep = (2 * spreadRange) / Math.max(totalShips - 1, 1);
    const offset = -spreadRange + shipIndex * spreadStep;

    // Alternate X and Y offsets for 2D spread
    if (shipIndex % 2 === 0) {
      return { x: Math.floor(offset), y: 0 };
    } else {
      return { x: 0, y: Math.floor(offset) };
    }
  }

  /**
   * Get random ship type with weighted probabilities based on current level
   */
  private getRandomShipType(): ShipType {
    const waveConfig = this.getWaveConfig();
    const [scoutWeight, frigateWeight, destroyerWeight] = waveConfig.weights;
    const totalWeight = scoutWeight + frigateWeight + destroyerWeight;

    const roll = Math.random() * totalWeight;

    if (roll < scoutWeight) return "scout";
    if (roll < scoutWeight + frigateWeight) return "frigate";
    return "destroyer";
  }

  /**
   * Get stats for each ship type, scaled by current level
   */
  private getShipStats(type: ShipType): ShipStats {
    const baseStats = SHIP_STATS_CONFIG[type];
    const speedMultiplier = 1 + (this.currentLevel - 1) * 0.05; // +5% per level

    return {
      ...baseStats,
      speed: baseStats.speed * speedMultiplier,
    };
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
   * Generate a path for ship to follow with spread offset
   * Ships aim for offset points around the center to spread out
   */
  private generateShipPath(start: Position, spreadOffset: Position = { x: 0, y: 0 }): Position[] {
    const path: Position[] = [{ ...start }];
    const width = this.grid.getWidth();
    const height = this.grid.getHeight();

    // Target is center + spread offset, clamped to valid water tiles
    let targetX = Math.floor(width / 2) + spreadOffset.x;
    let targetY = Math.floor(height / 2) + spreadOffset.y;

    // Clamp to map bounds with some margin
    targetX = Math.max(2, Math.min(width - 3, targetX));
    targetY = Math.max(2, Math.min(height - 3, targetY));

    let current = { ...start };
    const maxSteps = 50;

    for (let i = 0; i < maxSteps; i++) {
      if (current.x === targetX && current.y === targetY) break;

      const dx = targetX - current.x;
      const dy = targetY - current.y;

      // Move one step towards target
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
   * Boss ships fire multiple projectiles in a spread
   */
  private shipFireProjectile(ship: Ship): void {
    // Only allow one projectile per ship at a time (or 3 for boss)
    const maxProjectiles = ship.shipType === "boss" ? 3 : 1;
    const activeCount = this.projectiles.filter(p => p.isActive && p.sourceId === ship.id).length;
    if (activeCount >= maxProjectiles) {
      return;
    }

    // Smart targeting: Find the best target
    const target = this.findSmartTarget(ship);
    if (!target) return;

    const startPos = { ...ship.position };
    const speed = 5; // tiles per second

    // Boss fires 3 projectiles in a spread, others fire 1
    const projectileCount = ship.shipType === "boss" ? 3 : 1;
    const spreadAngle = Math.PI / 8; // 22.5 degrees spread for boss

    for (let i = 0; i < projectileCount; i++) {
      // Calculate spread offset for boss (-1, 0, 1 for 3 projectiles)
      const spreadOffset = projectileCount > 1 ? (i - 1) * spreadAngle : 0;

      // Calculate direction to target with spread
      const dx = target.position.x - startPos.x;
      const dy = target.position.y - startPos.y;
      const baseAngle = Math.atan2(dy, dx);
      const finalAngle = baseAngle + spreadOffset;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Calculate spread target position
      const spreadTargetX = startPos.x + Math.cos(finalAngle) * distance;
      const spreadTargetY = startPos.y + Math.sin(finalAngle) * distance;

      const projectile: Projectile = {
        id: `proj_enemy_${Date.now()}_${Math.random()}`,
        position: { ...startPos },
        velocity: {
          x: Math.cos(finalAngle) * speed,
          y: Math.sin(finalAngle) * speed,
        },
        source: "enemy",
        sourceId: ship.id,
        damage: ship.damage,
        isActive: true,
        startPosition: startPos,
        targetPosition: { x: spreadTargetX, y: spreadTargetY },
        progress: 0,
      };

      this.projectiles.push(projectile);
    }

    logger.info("Ship fired projectile", {
      shipId: ship.id,
      shipType: ship.shipType,
      targetType: target.type,
      targetPos: target.position,
      projectileCount,
    });
  }

  /**
   * Count craters in area around a position (for crater avoidance AI)
   */
  private countCratersNear(pos: Position, radius: number): number {
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tile = this.grid.getTile(pos.x + dx, pos.y + dy);
        if (tile && tile.type === TileType.CRATER) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Find the best target for a ship using prioritized AI
   * - All ships prioritize cannons
   * - Destroyers focus on castles
   * - Ships avoid heavily cratered areas
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
            // Avoid areas with many craters (3+ craters within 2 tiles)
            if (this.countCratersNear({ x, y }, 2) < 3) {
              landTargets.push({ x, y });
            }
            break;
        }
      }
    }

    // Destroyers have special castle-focused targeting
    const isDestroyer = ship.shipType === "destroyer";

    // Prioritized targeting with some randomness
    // 70% chance to use priority system, 30% random for unpredictability
    const useSmartTargeting = Math.random() < 0.7;

    if (useSmartTargeting) {
      // Destroyers: Priority 1 is castles (60% chance)
      if (isDestroyer && castleTargets.length > 0 && Math.random() < 0.6) {
        const target = this.getClosestTarget(ship.position, castleTargets);
        return { position: target, type: "castle" };
      }

      // All ships: Priority 1 is cannons (50% chance if available)
      if (cannonTargets.length > 0 && Math.random() < 0.5) {
        const target = this.getClosestTarget(ship.position, cannonTargets);
        return { position: target, type: "cannon" };
      }

      // Priority 2: Walls (40% chance if available)
      if (wallTargets.length > 0 && Math.random() < 0.4) {
        const target = this.getClosestTarget(ship.position, wallTargets);
        return { position: target, type: "wall" };
      }

      // Priority 3: Castles (30% chance if available) - for non-destroyers
      if (!isDestroyer && castleTargets.length > 0 && Math.random() < 0.3) {
        const target = this.getClosestTarget(ship.position, castleTargets);
        return { position: target, type: "castle" };
      }
    }

    // Fallback: Random land tile (already filtered for crater avoidance)
    if (landTargets.length > 0) {
      const target = landTargets[Math.floor(Math.random() * landTargets.length)];
      return { position: target, type: "land" };
    }

    // Ultimate fallback: any land tile if all filtered out
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = this.grid.getTile(x, y);
        if (tile && tile.type === TileType.LAND) {
          return { position: { x, y }, type: "land" };
        }
      }
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
        // Player projectiles also use arc trajectory - only check at target
        if (projectile.progress < 0.95) {
          continue; // Still in flight
        }

        let hitShip = false;

        // Check hit on ships with critical hit detection
        for (const ship of this.ships) {
          if (!ship.isAlive) continue;

          const shipGridX = Math.floor(ship.position.x);
          const shipGridY = Math.floor(ship.position.y);

          if (shipGridX === gridX && shipGridY === gridY) {
            // Calculate distance from projectile to ship center for critical hit
            const dx = projectile.position.x - ship.position.x;
            const dy = projectile.position.y - ship.position.y;
            const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

            // Check for critical hit (projectile lands very close to ship center)
            const isCritical = distanceToCenter <= CRITICAL_HIT_CONFIG.radius;
            const damage = isCritical
              ? projectile.damage * CRITICAL_HIT_CONFIG.damageMultiplier
              : projectile.damage;

            ship.health -= damage;
            projectile.isActive = false;
            hitShip = true;

            // Track hit statistics
            this.combatStats.shotsHit++;

            // Fire hit callback (for sound/visual feedback)
            if (this.onShipHit) {
              this.onShipHit(ship, damage, isCritical);
            }

            if (ship.health <= 0) {
              ship.isAlive = false;
              this.shipsDefeated++;

              // Track ship destruction by type
              switch (ship.shipType) {
                case "scout": this.combatStats.scoutsDestroyed++; break;
                case "frigate": this.combatStats.frigatesDestroyed++; break;
                case "destroyer": this.combatStats.destroyersDestroyed++; break;
                case "boss": this.combatStats.bossesDestroyed++; break;
              }

              // Calculate points based on ship type + critical bonus
              const basePoints = SHIP_STATS_CONFIG[ship.shipType].points;
              const points = isCritical
                ? basePoints + CRITICAL_HIT_CONFIG.bonusPoints
                : basePoints;

              logger.event("ShipDestroyed", {
                shipId: ship.id,
                shipType: ship.shipType,
                isCritical,
                points,
                totalDefeated: this.shipsDefeated,
              });

              if (this.onShipDestroyed) {
                this.onShipDestroyed(ship, points, isCritical);
              }
            } else {
              logger.event("ShipHit", {
                shipId: ship.id,
                shipType: ship.shipType,
                damage,
                isCritical,
                remainingHealth: ship.health,
              });
            }

            break;
          }
        }

        // If player projectile didn't hit a ship, check for water splash
        if (!hitShip) {
          const tile = this.grid.getTile(gridX, gridY);
          if (tile && tile.type === TileType.WATER) {
            projectile.isActive = false;
            logger.event("PlayerWaterSplash", { position: { x: gridX, y: gridY } });
            if (this.onPlayerWaterSplash) {
              this.onPlayerWaterSplash(gridX, gridY);
            }
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

        // If didn't hit a cannon, check for land/walls/water
        if (!hitCannon) {
          const tile = this.grid.getTile(gridX, gridY);
          if (tile && tile.type === TileType.WALL) {
            // Wall hit - bursts into flames, then becomes crater
            this.grid.setTile(gridX, gridY, TileType.CRATER);
            projectile.isActive = false;
            this.combatStats.wallsDestroyed++;
            logger.event("WallDestroyed", { position: { x: gridX, y: gridY } });
            if (this.onWallDestroyed) {
              this.onWallDestroyed(gridX, gridY);
            }
          } else if (tile && tile.type === TileType.LAND) {
            // Land hit - create crater
            this.grid.setTile(gridX, gridY, TileType.CRATER);
            projectile.isActive = false;
            this.combatStats.cratersCreated++;
            logger.event("CraterCreated", { position: { x: gridX, y: gridY } });
            if (this.onTerrainImpact) {
              this.onTerrainImpact(gridX, gridY);
            }
          } else if (tile && tile.type === TileType.WATER) {
            // Water splash
            projectile.isActive = false;
            logger.event("WaterSplash", { position: { x: gridX, y: gridY } });
            if (this.onWaterSplash) {
              this.onWaterSplash(gridX, gridY);
            }
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
    this.combatStats.shotsFired++;
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
