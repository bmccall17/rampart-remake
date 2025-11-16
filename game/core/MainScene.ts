import Phaser from "phaser";
import { createLogger } from "../logging/Logger";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "./GameConfig";
import { Grid } from "../grid/Grid";
import { TileRenderer } from "../grid/TileRenderer";
import { getMapByLevel, LEVEL_1 } from "../grid/MapData";
import { Castle } from "../types";

const logger = createLogger("MainScene", true);

export class MainScene extends Phaser.Scene {
  private grid!: Grid;
  private tileRenderer!: TileRenderer;
  private titleText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private castleSprites: Phaser.GameObjects.Graphics[] = [];
  private currentLevel: number = 1;
  private mapOffsetX: number = 0;
  private mapOffsetY: number = 0;

  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    logger.info("MainScene created");
    logger.event("SceneCreated", { scene: "MainScene" });

    // Create background
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x0f3460
    );

    // Create title
    this.titleText = this.add.text(GAME_WIDTH / 2, 30, "RAMPART REMAKE", {
      fontSize: "36px",
      color: "#00d9ff",
      fontStyle: "bold",
    });
    this.titleText.setOrigin(0.5);

    // Create info text
    this.infoText = this.add.text(
      GAME_WIDTH / 2,
      70,
      "Phase 2: Level 1 - First Island",
      {
        fontSize: "20px",
        color: "#ffffff",
      }
    );
    this.infoText.setOrigin(0.5);

    // Load and render the map
    this.loadMap(this.currentLevel);

    // Add version info
    this.add.text(
      10,
      GAME_HEIGHT - 30,
      "v0.2.0 - Grid System & Map Rendering",
      {
        fontSize: "14px",
        color: "#888888",
      }
    );

    // Add legend
    this.createLegend();
  }

  private loadMap(level: number): void {
    logger.info(`Loading level ${level}`);

    // Get map definition
    const mapDef = getMapByLevel(level);

    // Create grid and tile renderer
    this.grid = new Grid(mapDef.width, mapDef.height);
    this.tileRenderer = new TileRenderer(this, TILE_SIZE);

    // Load map data into grid
    this.grid.loadMap(mapDef);

    // Calculate centering offset
    this.mapOffsetX = (GAME_WIDTH - mapDef.width * TILE_SIZE) / 2;
    this.mapOffsetY = (GAME_HEIGHT - mapDef.height * TILE_SIZE) / 2 + 50;

    // Render the map
    this.renderMap();

    // Render castles
    this.renderCastles(mapDef.castles);

    logger.event("MapLoaded", {
      level,
      mapId: mapDef.id,
      mapName: mapDef.name,
      width: mapDef.width,
      height: mapDef.height,
      castleCount: mapDef.castles.length,
    });
  }

  private renderMap(): void {
    const tiles = this.grid.getAllTiles();
    const height = this.grid.getHeight();
    const width = this.grid.getWidth();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.tileRenderer.renderTile(
          x,
          y,
          tiles[y][x].type,
          this.mapOffsetX,
          this.mapOffsetY
        );
      }
    }

    logger.info("Map rendered", { width, height });
  }

  private renderCastles(castles: Castle[]): void {
    castles.forEach((castle) => {
      const x = this.mapOffsetX + castle.position.x * TILE_SIZE;
      const y = this.mapOffsetY + castle.position.y * TILE_SIZE;

      // Create castle graphics
      const castleGraphics = this.add.graphics();

      // Castle flag/tower
      if (castle.isHome) {
        // Home castle - larger with flag
        castleGraphics.fillStyle(0xff4444, 1);
        castleGraphics.fillRect(
          x + TILE_SIZE / 2 - 4,
          y + 4,
          8,
          TILE_SIZE - 8
        );

        // Flag
        castleGraphics.fillStyle(0xffaa00, 1);
        castleGraphics.fillTriangle(
          x + TILE_SIZE / 2 + 4,
          y + 6,
          x + TILE_SIZE / 2 + 4,
          y + 16,
          x + TILE_SIZE / 2 + 14,
          y + 11
        );
      } else {
        // Regular castle - tower only
        castleGraphics.fillStyle(0x888888, 1);
        castleGraphics.fillRect(
          x + TILE_SIZE / 2 - 3,
          y + 6,
          6,
          TILE_SIZE - 12
        );

        // Small flag
        castleGraphics.fillStyle(0xaaaaaa, 1);
        castleGraphics.fillTriangle(
          x + TILE_SIZE / 2 + 3,
          y + 8,
          x + TILE_SIZE / 2 + 3,
          y + 14,
          x + TILE_SIZE / 2 + 9,
          y + 11
        );
      }

      // Castle label (optional for debugging)
      const labelText = this.add.text(x + TILE_SIZE / 2, y - 8, castle.isHome ? "HOME" : "⚑", {
        fontSize: "10px",
        color: castle.isHome ? "#ff4444" : "#888888",
        fontStyle: "bold",
      });
      labelText.setOrigin(0.5);

      this.castleSprites.push(castleGraphics);
    });

    logger.info(`Rendered ${castles.length} castles`);
  }

  private createLegend(): void {
    const legendX = 20;
    const legendY = 110;
    const lineHeight = 20;

    this.add.text(legendX, legendY, "Legend:", {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    });

    const items = [
      { color: 0x6b8e23, label: "Land" },
      { color: 0x1e5f8c, label: "Water" },
      { color: 0xff4444, label: "Home Castle" },
      { color: 0x888888, label: "Castle" },
    ];

    items.forEach((item, index) => {
      const y = legendY + (index + 1) * lineHeight;

      // Color box
      const box = this.add.rectangle(legendX + 8, y + 8, 12, 12, item.color);

      // Label
      this.add.text(legendX + 20, y, item.label, {
        fontSize: "12px",
        color: "#cccccc",
      });
    });
  }

  update(time: number, delta: number) {
    // No animation needed for Phase 2
    // Future phases will add game loop logic here
  }
}
