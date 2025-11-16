import * as Phaser from "phaser";
import { createLogger } from "../logging/Logger";
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from "./GameConfig";
import { Grid } from "../grid/Grid";
import { TileRenderer } from "../grid/TileRenderer";
import { getMapByLevel } from "../grid/MapData";
import { Castle, GamePhase, Cannon } from "../types";
import { PhaseManager } from "./PhaseManager";
import { HUD } from "./HUD";
import { BuildPhaseSystem } from "../systems/BuildPhaseSystem";
import { PieceRenderer } from "../systems/PieceRenderer";
import { DeployPhaseSystem } from "../systems/DeployPhaseSystem";
import { CannonRenderer } from "../systems/CannonRenderer";

const logger = createLogger("MainScene", true);

export class MainScene extends Phaser.Scene {
  private grid!: Grid;
  private tileRenderer!: TileRenderer;
  private phaseManager!: PhaseManager;
  private hud!: HUD;
  private buildSystem!: BuildPhaseSystem;
  private pieceRenderer!: PieceRenderer;
  private deploySystem!: DeployPhaseSystem;
  private cannonRenderer!: CannonRenderer;
  private castleSprites: Phaser.GameObjects.Graphics[] = [];
  private currentLevel: number = 1;
  private mapOffsetX: number = 0;
  private mapOffsetY: number = 0;
  private castles: Castle[] = [];
  private cannons: Cannon[] = [];
  private cannonCount: number = 0;
  private score: number = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private enclosedCastles: Castle[] = [];

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

    // Load and render the map
    this.loadMap(this.currentLevel);

    // Initialize build system
    this.buildSystem = new BuildPhaseSystem(this.grid);
    this.pieceRenderer = new PieceRenderer(this, TILE_SIZE);

    // Initialize deploy system
    this.deploySystem = new DeployPhaseSystem(this.grid);
    this.cannonRenderer = new CannonRenderer(this, TILE_SIZE);

    // Initialize Phase Manager
    this.initializePhaseManager();

    // Create HUD
    this.hud = new HUD(this);

    // Setup input controls
    this.setupControls();

    // Add version info
    this.add.text(
      10,
      GAME_HEIGHT - 30,
      "v0.5.0 - Deploy Phase & Cannon Placement",
      {
        fontSize: "14px",
        color: "#888888",
      }
    );

    // Add controls hint
    this.add.text(
      10,
      GAME_HEIGHT - 55,
      "BUILD: Arrows/R/Space | DEPLOY: Click to place cannons",
      {
        fontSize: "12px",
        color: "#888888",
      }
    );

    // Show initial phase transition
    this.hud.showPhaseTransition(GamePhase.BUILD);
  }

  private initializePhaseManager(): void {
    // Create phase manager starting with BUILD phase
    this.phaseManager = new PhaseManager(GamePhase.BUILD);

    // Set phase change callback
    this.phaseManager.setOnPhaseChange((event) => {
      logger.info("Phase transition", {
        fromPhase: event.fromPhase || "none",
        toPhase: event.toPhase,
        timestamp: event.timestamp,
      });

      // Show visual transition
      this.hud.showPhaseTransition(event.toPhase);

      // Handle phase-specific logic
      this.onPhaseChange(event.toPhase);
    });

    // Start the phase manager
    this.phaseManager.start(this.time.now);

    logger.info("PhaseManager initialized");
  }

  private setupControls(): void {
    // Setup keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    logger.info("Controls initialized");
  }

  private onPhaseChange(newPhase: GamePhase): void {
    switch (newPhase) {
      case GamePhase.BUILD:
        logger.info("Entering BUILD phase - Wall placement enabled");
        this.buildSystem.startBuildPhase();
        break;
      case GamePhase.DEPLOY:
        logger.info("Entering DEPLOY phase - Cannon placement enabled");
        this.deploySystem.startDeployPhase(this.enclosedCastles);
        break;
      case GamePhase.COMBAT:
        logger.info("Entering COMBAT phase - TODO: Spawn ships");
        // Finalize cannon deployment
        this.cannons = this.deploySystem.finalizeDeployment();
        break;
      case GamePhase.SCORING:
        logger.info("Entering SCORING phase - Validating territories");
        this.scorePhase();
        break;
    }
  }

  private scorePhase(): void {
    const result = this.buildSystem.validateTerritories(this.castles);

    if (!result.hasValidTerritory) {
      logger.warn("GAME OVER: No enclosed castles!");
      // TODO: Show game over screen
    } else {
      logger.info(`${result.enclosedCastles.length} castles enclosed`);
      // Store enclosed castles for next DEPLOY phase
      this.enclosedCastles = result.enclosedCastles;
      // Update cannon count based on enclosed castles
      this.cannonCount = result.enclosedCastles.reduce((count, castle) => {
        return count + (castle.isHome ? 2 : 1);
      }, 0);
    }
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

    // Store castles
    this.castles = mapDef.castles;

    // Calculate centering offset
    this.mapOffsetX = (GAME_WIDTH - mapDef.width * TILE_SIZE) / 2;
    this.mapOffsetY = (GAME_HEIGHT - mapDef.height * TILE_SIZE) / 2 + 70;

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

  update(time: number, delta: number) {
    // Update phase manager
    this.phaseManager.update(time);

    // Get current phase data
    const currentPhase = this.phaseManager.getCurrentPhase();
    const timeRemaining = this.phaseManager.getTimeRemainingFormatted(time);
    const progress = this.phaseManager.getPhaseProgress(time);

    // Handle phase-specific input
    if (currentPhase === GamePhase.BUILD) {
      this.handleBuildPhaseInput();
    } else if (currentPhase === GamePhase.DEPLOY) {
      this.handleDeployPhaseInput();
    }

    // Render current piece or cannons
    this.renderCurrentPiece();
    this.renderCannons();

    // Update HUD with current cannon counts
    const currentCannonCount = this.deploySystem.getCannons().length;

    this.hud.update(
      {
        phase: currentPhase,
        timeRemaining,
        castleCount: this.enclosedCastles.length || this.castles.length,
        cannonCount: currentCannonCount || this.cannons.length,
        score: this.score,
      },
      progress
    );
  }

  private handleBuildPhaseInput(): void {
    const currentPiece = this.buildSystem.getCurrentPiece();
    if (!currentPiece) return;

    // Move left
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.buildSystem.movePiece(-1, 0);
    }

    // Move right
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.buildSystem.movePiece(1, 0);
    }

    // Move up
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.buildSystem.movePiece(0, -1);
    }

    // Move down
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.buildSystem.movePiece(0, 1);
    }

    // Rotate
    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.buildSystem.rotatePiece(true);
    }

    // Place piece
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      if (this.buildSystem.placePiece()) {
        // Re-render map to show placed walls
        this.tileRenderer.clear();
        this.renderMap();
      }
    }
  }

  private handleDeployPhaseInput(): void {
    // Handle mouse click for cannon placement
    if (this.input.activePointer.isDown && this.input.activePointer.justDown) {
      const pointer = this.input.activePointer;

      // Convert screen position to grid position
      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      // Try to place cannon
      this.deploySystem.placeCannon({ x: gridX, y: gridY });
    }

    // Remove cannon with right click
    if (this.input.activePointer.rightButtonDown()) {
      const pointer = this.input.activePointer;

      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      this.deploySystem.removeCannon({ x: gridX, y: gridY });
    }
  }

  private renderCurrentPiece(): void {
    const currentPhase = this.phaseManager.getCurrentPhase();

    // Clear previous piece rendering
    this.pieceRenderer.clear();

    // Only render during BUILD phase
    if (currentPhase !== GamePhase.BUILD) return;

    const currentPiece = this.buildSystem.getCurrentPiece();
    if (!currentPiece) return;

    // Render the current piece
    this.pieceRenderer.renderPiece(
      currentPiece,
      this.mapOffsetX,
      this.mapOffsetY,
      false
    );
  }

  private renderCannons(): void {
    const currentPhase = this.phaseManager.getCurrentPhase();

    // Clear previous cannon rendering
    this.cannonRenderer.clear();

    // Render during DEPLOY and COMBAT phases
    if (currentPhase === GamePhase.DEPLOY) {
      const cannons = this.deploySystem.getCannons();
      this.cannonRenderer.renderCannons(
        cannons,
        this.mapOffsetX,
        this.mapOffsetY
      );

      // Show preview at mouse position
      const pointer = this.input.activePointer;
      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      const isValid = this.deploySystem.isValidCannonPosition({ x: gridX, y: gridY });
      const remaining = this.deploySystem.getRemainingCannonCount();

      if (remaining > 0) {
        this.cannonRenderer.renderCannonPreview(
          { x: gridX, y: gridY },
          this.mapOffsetX,
          this.mapOffsetY,
          isValid
        );
      }
    } else if (currentPhase === GamePhase.COMBAT || currentPhase === GamePhase.SCORING) {
      // Render finalized cannons
      this.cannonRenderer.renderCannons(
        this.cannons,
        this.mapOffsetX,
        this.mapOffsetY
      );
    }
  }
}
