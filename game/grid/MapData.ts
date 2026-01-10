import { TileType, Castle } from "../types";

export interface MapDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[][];
  castles: Castle[];
  startingCastleId: string;
}

// Map dimensions (doubled from original 24x18)
const MAP_WIDTH = 48;
const MAP_HEIGHT = 36;

/**
 * Create a map grid filled with a default tile type
 */
function createEmptyMap(
  width: number,
  height: number,
  fillType: TileType = TileType.EMPTY
): TileType[][] {
  const map: TileType[][] = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = fillType;
    }
  }
  return map;
}

/**
 * Simple seeded random number generator for reproducible maps
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Map preset types
export type MapPreset = "small" | "large" | "archipelago";

/**
 * Get map preset for a given level (cycles through presets)
 */
function getPresetForLevel(level: number): MapPreset {
  const presets: MapPreset[] = ["small", "large", "archipelago"];
  return presets[(level - 1) % presets.length];
}

/**
 * Generate a random island using noise-like algorithm
 * Supports different presets for variety
 */
function generateIsland(
  width: number,
  height: number,
  rng: SeededRandom,
  preset: MapPreset = "large"
): TileType[][] {
  const map = createEmptyMap(width, height, TileType.WATER);

  // Adjust parameters based on preset
  let baseRadiusX: number;
  let baseRadiusY: number;
  let numInlets: number;

  switch (preset) {
    case "small":
      baseRadiusX = width * 0.25;
      baseRadiusY = height * 0.25;
      numInlets = 4;
      break;
    case "large":
      baseRadiusX = width * 0.42;
      baseRadiusY = height * 0.42;
      numInlets = 10;
      break;
    case "archipelago":
    default:
      baseRadiusX = width * 0.35;
      baseRadiusY = height * 0.35;
      numInlets = 8;
      break;
  }

  // Define island center and size
  const centerX = width / 2;
  const centerY = height / 2;

  // Generate random offset points for irregular coastline
  const numPoints = 12;
  const radiusOffsets: number[] = [];
  for (let i = 0; i < numPoints; i++) {
    radiusOffsets.push(0.7 + rng.next() * 0.6); // 0.7 to 1.3 multiplier
  }

  // Fill in land based on distance from center with irregular edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (x - centerX) / baseRadiusX;
      const dy = (y - centerY) / baseRadiusY;

      // Calculate angle to determine which radius offset to use
      const angle = Math.atan2(dy, dx);
      const normalizedAngle = (angle + Math.PI) / (2 * Math.PI); // 0 to 1
      const pointIndex = Math.floor(normalizedAngle * numPoints) % numPoints;
      const nextPointIndex = (pointIndex + 1) % numPoints;

      // Interpolate between points for smooth coastline
      const t = (normalizedAngle * numPoints) % 1;
      const radiusMultiplier =
        radiusOffsets[pointIndex] * (1 - t) + radiusOffsets[nextPointIndex] * t;

      const distance = Math.sqrt(dx * dx + dy * dy);

      // Add some noise to the coastline
      const noise = (rng.next() - 0.5) * 0.15;

      if (distance < radiusMultiplier + noise) {
        map[y][x] = TileType.LAND;
      }
    }
  }

  // Ensure water border around the map (at least 2 tiles)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
        map[y][x] = TileType.WATER;
      }
    }
  }

  // Add some coastal inlets and variation
  for (let i = 0; i < numInlets; i++) {
    const inletX = rng.nextInt(6, width - 6);
    const inletY = rng.nextInt(6, height - 6);
    const inletSize = rng.nextInt(2, 4);

    // Only create inlet if it's near the coast
    if (map[inletY][inletX] === TileType.LAND) {
      let nearWater = false;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (
            inletY + dy >= 0 &&
            inletY + dy < height &&
            inletX + dx >= 0 &&
            inletX + dx < width &&
            map[inletY + dy][inletX + dx] === TileType.WATER
          ) {
            nearWater = true;
            break;
          }
        }
        if (nearWater) break;
      }

      if (nearWater) {
        for (let dy = -inletSize; dy <= inletSize; dy++) {
          for (let dx = -inletSize; dx <= inletSize; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (
              dist <= inletSize &&
              inletY + dy >= 2 &&
              inletY + dy < height - 2 &&
              inletX + dx >= 2 &&
              inletX + dx < width - 2
            ) {
              map[inletY + dy][inletX + dx] = TileType.WATER;
            }
          }
        }
      }
    }
  }

  return map;
}

/**
 * Generate an archipelago map with multiple smaller islands
 */
function generateArchipelago(
  width: number,
  height: number,
  rng: SeededRandom
): TileType[][] {
  const map = createEmptyMap(width, height, TileType.WATER);

  // Generate 3-5 islands at different positions
  const numIslands = rng.nextInt(3, 5);
  const islands: { cx: number; cy: number; rx: number; ry: number }[] = [];

  // Generate island positions (spread across the map)
  for (let i = 0; i < numIslands; i++) {
    let cx: number, cy: number;
    let attempts = 0;
    const maxAttempts = 20;

    do {
      cx = rng.nextInt(8, width - 8);
      cy = rng.nextInt(8, height - 8);
      attempts++;

      // Check distance from other islands
      let tooClose = false;
      for (const island of islands) {
        const dist = Math.sqrt(
          Math.pow(cx - island.cx, 2) + Math.pow(cy - island.cy, 2)
        );
        if (dist < 12) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) break;
    } while (attempts < maxAttempts);

    // Island size varies
    const rx = rng.nextInt(5, 9);
    const ry = rng.nextInt(5, 9);
    islands.push({ cx, cy, rx, ry });
  }

  // Generate each island
  for (const island of islands) {
    const numPoints = 8;
    const radiusOffsets: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      radiusOffsets.push(0.6 + rng.next() * 0.8);
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = (x - island.cx) / island.rx;
        const dy = (y - island.cy) / island.ry;

        const angle = Math.atan2(dy, dx);
        const normalizedAngle = (angle + Math.PI) / (2 * Math.PI);
        const pointIndex = Math.floor(normalizedAngle * numPoints) % numPoints;
        const nextPointIndex = (pointIndex + 1) % numPoints;
        const t = (normalizedAngle * numPoints) % 1;
        const radiusMultiplier =
          radiusOffsets[pointIndex] * (1 - t) + radiusOffsets[nextPointIndex] * t;

        const distance = Math.sqrt(dx * dx + dy * dy);
        const noise = (rng.next() - 0.5) * 0.1;

        if (distance < radiusMultiplier + noise) {
          // Don't overwrite existing land at edges
          if (x >= 2 && x < width - 2 && y >= 2 && y < height - 2) {
            map[y][x] = TileType.LAND;
          }
        }
      }
    }
  }

  // Ensure water border
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
        map[y][x] = TileType.WATER;
      }
    }
  }

  return map;
}

/**
 * Find valid positions for castles (on land, not too close to edges or each other)
 */
function placeCastles(
  map: TileType[][],
  width: number,
  height: number,
  numCastles: number,
  rng: SeededRandom
): Castle[] {
  const castles: Castle[] = [];
  const minDistanceBetweenCastles = 8;
  const minDistanceFromEdge = 5;

  // Find all valid land positions
  const validPositions: { x: number; y: number }[] = [];
  for (let y = minDistanceFromEdge; y < height - minDistanceFromEdge; y++) {
    for (let x = minDistanceFromEdge; x < width - minDistanceFromEdge; x++) {
      if (map[y][x] === TileType.LAND) {
        // Check surrounding tiles are also land (not at coast edge)
        let allLand = true;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (map[y + dy][x + dx] !== TileType.LAND) {
              allLand = false;
              break;
            }
          }
          if (!allLand) break;
        }
        if (allLand) {
          validPositions.push({ x, y });
        }
      }
    }
  }

  if (validPositions.length < numCastles) {
    console.warn("Not enough valid positions for castles");
    return castles;
  }

  // Place home castle first (near center)
  const centerX = width / 2;
  const centerY = height / 2;

  // Sort by distance to center and pick from the closest ones
  validPositions.sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.x - centerX, 2) + Math.pow(a.y - centerY, 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.x - centerX, 2) + Math.pow(b.y - centerY, 2)
    );
    return distA - distB;
  });

  // Pick home castle from the 5 closest to center
  const homeIndex = rng.nextInt(0, Math.min(4, validPositions.length - 1));
  const homePos = validPositions[homeIndex];

  castles.push({
    id: "home_castle",
    position: { x: homePos.x, y: homePos.y },
    isHome: true,
    enclosed: false,
  });

  map[homePos.y][homePos.x] = TileType.CASTLE;

  // Remove positions too close to home castle
  const remainingPositions = validPositions.filter((pos) => {
    const dist = Math.sqrt(
      Math.pow(pos.x - homePos.x, 2) + Math.pow(pos.y - homePos.y, 2)
    );
    return dist >= minDistanceBetweenCastles;
  });

  // Place additional castles
  for (let i = 1; i < numCastles && remainingPositions.length > 0; i++) {
    // Pick a random position from remaining
    const index = rng.nextInt(0, remainingPositions.length - 1);
    const pos = remainingPositions[index];

    castles.push({
      id: `castle_${i + 1}`,
      position: { x: pos.x, y: pos.y },
      isHome: false,
      enclosed: false,
    });

    map[pos.y][pos.x] = TileType.CASTLE;

    // Remove positions too close to this castle
    const toRemove: number[] = [];
    for (let j = 0; j < remainingPositions.length; j++) {
      const p = remainingPositions[j];
      const dist = Math.sqrt(
        Math.pow(p.x - pos.x, 2) + Math.pow(p.y - pos.y, 2)
      );
      if (dist < minDistanceBetweenCastles) {
        toRemove.push(j);
      }
    }
    // Remove in reverse order to maintain indices
    for (let j = toRemove.length - 1; j >= 0; j--) {
      remainingPositions.splice(toRemove[j], 1);
    }
  }

  return castles;
}

/**
 * Generate a random map with optional preset
 */
export function generateRandomMap(seed?: number, preset?: MapPreset): MapDefinition {
  const actualSeed = seed ?? Date.now();
  const rng = new SeededRandom(actualSeed);

  const width = MAP_WIDTH;
  const height = MAP_HEIGHT;

  // Generate terrain based on preset
  let tiles: TileType[][];
  let mapName: string;
  let numCastles: number;

  const actualPreset = preset ?? "large";

  switch (actualPreset) {
    case "small":
      tiles = generateIsland(width, height, rng, "small");
      mapName = "Small Island";
      numCastles = rng.nextInt(3, 4);
      break;
    case "archipelago":
      tiles = generateArchipelago(width, height, rng);
      mapName = "Archipelago";
      numCastles = rng.nextInt(4, 6);
      break;
    case "large":
    default:
      tiles = generateIsland(width, height, rng, "large");
      mapName = "Large Island";
      numCastles = rng.nextInt(5, 7);
      break;
  }

  const castles = placeCastles(tiles, width, height, numCastles, rng);

  return {
    id: `${actualPreset}_${actualSeed}`,
    name: mapName,
    width,
    height,
    tiles,
    castles,
    startingCastleId: castles.length > 0 ? castles[0].id : "",
  };
}

/**
 * Level 1: Now generates a random map
 */
export function getLevel1(): MapDefinition {
  return generateRandomMap(undefined, "small");
}

/**
 * Get map by level number
 * Cycles through presets: Level 1=small, Level 2=large, Level 3=archipelago, then repeats
 */
export function getMapByLevel(level: number): MapDefinition {
  const preset = getPresetForLevel(level);
  return generateRandomMap(undefined, preset);
}

/**
 * Legacy static map (kept for reference)
 */
export const LEVEL_1_STATIC: MapDefinition = {
  id: "level_1_static",
  name: "First Island (Static)",
  width: 24,
  height: 18,
  tiles: (() => {
    const map = createEmptyMap(24, 18, TileType.WATER);

    // Create a land island in the center
    for (let y = 4; y < 14; y++) {
      for (let x = 6; x < 18; x++) {
        if ((y === 4 || y === 13) && (x < 8 || x > 15)) {
          continue;
        }
        map[y][x] = TileType.LAND;
      }
    }

    map[5][7] = TileType.WATER;
    map[12][16] = TileType.WATER;
    map[6][17] = TileType.WATER;
    map[11][6] = TileType.WATER;
    map[9][12] = TileType.CASTLE;
    map[6][10] = TileType.CASTLE;
    map[11][14] = TileType.CASTLE;

    return map;
  })(),
  castles: [
    {
      id: "home_castle",
      position: { x: 12, y: 9 },
      isHome: true,
      enclosed: false,
    },
    {
      id: "castle_2",
      position: { x: 10, y: 6 },
      isHome: false,
      enclosed: false,
    },
    {
      id: "castle_3",
      position: { x: 14, y: 11 },
      isHome: false,
      enclosed: false,
    },
  ],
  startingCastleId: "home_castle",
};

/**
 * All available maps
 */
export const ALL_MAPS = [LEVEL_1_STATIC];
