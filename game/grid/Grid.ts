import { Tile, TileType } from "../types";
import { MapDefinition } from "./MapData";

export class Grid {
  private tiles: Tile[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = this.createEmptyGrid();
  }

  private createEmptyGrid(): Tile[][] {
    const grid: Tile[][] = [];
    for (let y = 0; y < this.height; y++) {
      grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        grid[y][x] = {
          type: TileType.EMPTY,
          x,
          y,
        };
      }
    }
    return grid;
  }

  /**
   * Load a map definition into the grid
   */
  loadMap(mapDef: MapDefinition): void {
    if (mapDef.width !== this.width || mapDef.height !== this.height) {
      throw new Error(
        `Map dimensions (${mapDef.width}x${mapDef.height}) don't match grid (${this.width}x${this.height})`
      );
    }

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x].type = mapDef.tiles[y][x];
      }
    }
  }

  getTile(x: number, y: number): Tile | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y][x];
  }

  setTile(x: number, y: number, type: TileType): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.tiles[y][x].type = type;
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getAllTiles(): Tile[][] {
    return this.tiles;
  }
}
