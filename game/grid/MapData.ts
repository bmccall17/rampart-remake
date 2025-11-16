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
 * Level 1: Beginner island map
 * Features:
 * - Small island in center
 * - Water around edges
 * - One home castle in the middle
 * - Two additional castles to potentially claim
 */
export const LEVEL_1: MapDefinition = {
  id: "level_1",
  name: "First Island",
  width: 24,
  height: 18,
  tiles: (() => {
    const map = createEmptyMap(24, 18, TileType.WATER);

    // Create a land island in the center
    for (let y = 4; y < 14; y++) {
      for (let x = 6; x < 18; x++) {
        // Create irregular coastline
        if (
          (y === 4 || y === 13) &&
          (x < 8 || x > 15)
        ) {
          // Keep as water for interesting coastline
          continue;
        }
        map[y][x] = TileType.LAND;
      }
    }

    // Add some coastal variation
    map[5][7] = TileType.WATER;
    map[12][16] = TileType.WATER;
    map[6][17] = TileType.WATER;
    map[11][6] = TileType.WATER;

    // Place castle markers (will be rendered separately)
    // Home castle in center
    map[9][12] = TileType.CASTLE;

    // Two additional castles
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
 * Level 2: Larger island with more castles (for future)
 */
export const LEVEL_2: MapDefinition = {
  id: "level_2",
  name: "Twin Peaks",
  width: 24,
  height: 18,
  tiles: createEmptyMap(24, 18, TileType.LAND), // Placeholder
  castles: [],
  startingCastleId: "",
};

/**
 * Get map by level number
 */
export function getMapByLevel(level: number): MapDefinition {
  switch (level) {
    case 1:
      return LEVEL_1;
    case 2:
      return LEVEL_2;
    default:
      return LEVEL_1;
  }
}

/**
 * All available maps
 */
export const ALL_MAPS = [LEVEL_1, LEVEL_2];
