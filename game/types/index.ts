// Core game enums and types

export enum GamePhase {
  BUILD = "BUILD",
  DEPLOY = "DEPLOY",
  COMBAT = "COMBAT",
  SCORING = "SCORING",
}

export enum TileType {
  EMPTY = 0,
  LAND = 1,
  WATER = 2,
  WALL = 3,
  CASTLE = 4,
  CRATER = 5,
  DEBRIS = 6,
  CANNON = 7,
}

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  x: number;
  y: number;
}

export interface Castle {
  id: string;
  position: Position;
  isHome: boolean;
  enclosed: boolean;
}

export interface Cannon {
  id: string;
  position: Position;
  angle: number;
  health: number;
  maxHealth: number;
}

export interface Ship {
  id: string;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  path: Position[];
  pathIndex: number;
  velocity: { x: number; y: number };
  isAlive: boolean;
}

export interface Projectile {
  id: string;
  position: Position;
  velocity: { x: number; y: number };
  source: "player" | "enemy";
  sourceId: string; // ID of the cannon or ship that fired this projectile
  damage: number;
  isActive: boolean;
  // Arc tracking for 3D lofted effect
  startPosition: Position;
  targetPosition: Position;
  progress: number; // 0 to 1, where 0.5 is apex of arc
}

export interface GameState {
  phase: GamePhase;
  level: number;
  score: number;
  castles: Castle[];
  cannons: Cannon[];
  ships: Ship[];
  grid: Tile[][];
}
