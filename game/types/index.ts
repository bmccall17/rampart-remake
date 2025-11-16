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
}

export interface Ship {
  id: string;
  position: Position;
  health: number;
  speed: number;
  path: Position[];
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
