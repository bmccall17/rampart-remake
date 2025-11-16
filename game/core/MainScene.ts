import Phaser from "phaser";
import { createLogger } from "../logging/Logger";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "./GameConfig";

const logger = createLogger("MainScene", true);

export class MainScene extends Phaser.Scene {
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private infoText!: Phaser.GameObjects.Text;
  private animatedSquare!: Phaser.GameObjects.Rectangle;
  private squareVelocity = { x: 2, y: 1.5 };

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
    this.titleText = this.add.text(GAME_WIDTH / 2, 60, "RAMPART REMAKE", {
      fontSize: "48px",
      color: "#00d9ff",
      fontStyle: "bold",
    });
    this.titleText.setOrigin(0.5);

    // Create info text
    this.infoText = this.add.text(
      GAME_WIDTH / 2,
      120,
      "Phase 1: Foundation Complete",
      {
        fontSize: "24px",
        color: "#ffffff",
      }
    );
    this.infoText.setOrigin(0.5);

    // Draw a simple grid to demonstrate rendering
    this.drawGrid();

    // Create an animated square to show the game loop is running
    this.animatedSquare = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      40,
      40,
      0xff6b6b
    );

    // Add version info
    const versionText = this.add.text(
      10,
      GAME_HEIGHT - 30,
      "v0.1.0 - Phaser.js + Next.js + TypeScript",
      {
        fontSize: "14px",
        color: "#888888",
      }
    );

    logger.event("GridRendered", {
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      tileSize: TILE_SIZE,
    });
  }

  drawGrid() {
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.lineStyle(1, 0x16213e, 0.5);

    const gridWidth = 20;
    const gridHeight = 15;
    const startX = (GAME_WIDTH - gridWidth * TILE_SIZE) / 2;
    const startY = (GAME_HEIGHT - gridHeight * TILE_SIZE) / 2 + 40;

    // Draw grid lines
    for (let i = 0; i <= gridWidth; i++) {
      this.gridGraphics.lineBetween(
        startX + i * TILE_SIZE,
        startY,
        startX + i * TILE_SIZE,
        startY + gridHeight * TILE_SIZE
      );
    }

    for (let j = 0; j <= gridHeight; j++) {
      this.gridGraphics.lineBetween(
        startX,
        startY + j * TILE_SIZE,
        startX + gridWidth * TILE_SIZE,
        startY + j * TILE_SIZE
      );
    }

    // Fill some sample tiles to show different colors
    const colors = [0x16a085, 0x2980b9, 0x8e44ad, 0xc0392b];
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * gridWidth);
      const y = Math.floor(Math.random() * gridHeight);
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.gridGraphics.fillStyle(color, 0.6);
      this.gridGraphics.fillRect(
        startX + x * TILE_SIZE + 1,
        startY + y * TILE_SIZE + 1,
        TILE_SIZE - 2,
        TILE_SIZE - 2
      );
    }
  }

  update(time: number, delta: number) {
    // Animate the square to show the game loop is running
    this.animatedSquare.x += this.squareVelocity.x;
    this.animatedSquare.y += this.squareVelocity.y;

    // Bounce off edges
    if (
      this.animatedSquare.x <= 20 ||
      this.animatedSquare.x >= GAME_WIDTH - 20
    ) {
      this.squareVelocity.x *= -1;
    }
    if (
      this.animatedSquare.y <= 180 ||
      this.animatedSquare.y >= GAME_HEIGHT - 60
    ) {
      this.squareVelocity.y *= -1;
    }
  }
}
