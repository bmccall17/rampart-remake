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
import { CombatPhaseSystem } from "../systems/CombatPhaseSystem";
import { ShipRenderer } from "../systems/ShipRenderer";
import { ProjectileRenderer } from "../systems/ProjectileRenderer";
import { GameStateManager, GameState } from "./GameStateManager";
import { GameOverScreen } from "../ui/GameOverScreen";
import { LevelCompleteScreen } from "../ui/LevelCompleteScreen";
import { InputDebugDisplay } from "../ui/InputDebugDisplay";

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
  private combatSystem!: CombatPhaseSystem;
  private shipRenderer!: ShipRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private gameStateManager!: GameStateManager;
  private gameOverScreen!: GameOverScreen;
  private levelCompleteScreen!: LevelCompleteScreen;
  private inputDebugDisplay!: InputDebugDisplay;
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
  private lastClickTime: number = 0;

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

    // Initialize combat system
    this.combatSystem = new CombatPhaseSystem(this.grid);
    this.shipRenderer = new ShipRenderer(this, TILE_SIZE);
    this.projectileRenderer = new ProjectileRenderer(this, TILE_SIZE);

    // Initialize game state manager
    this.gameStateManager = new GameStateManager();
    this.gameOverScreen = new GameOverScreen(this);
    this.levelCompleteScreen = new LevelCompleteScreen(this);

    // Initialize input debug display
    this.inputDebugDisplay = new InputDebugDisplay(this);
    this.inputDebugDisplay.setVisible(true); // Always visible for debugging

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
      "v0.7.1 - Input Debug Display",
      {
        fontSize: "14px",
        color: "#888888",
      }
    );

    // Add controls hint
    this.add.text(
      10,
      GAME_HEIGHT - 55,
      "BUILD: Arrows/R/Space | DEPLOY: Click cannons | COMBAT: Click to fire",
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

    // Setup mouse controls with event listeners
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const currentPhase = this.phaseManager.getCurrentPhase();

      const now = this.time.now;
      if (now - this.lastClickTime < 200) return; // Debounce
      this.lastClickTime = now;

      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      if (currentPhase === GamePhase.DEPLOY) {
        if (pointer.leftButtonDown()) {
          // Place cannon
          this.deploySystem.placeCannon({ x: gridX, y: gridY });
        } else if (pointer.rightButtonDown()) {
          // Remove cannon
          this.deploySystem.removeCannon({ x: gridX, y: gridY });
        }
      } else if (currentPhase === GamePhase.COMBAT) {
        if (pointer.leftButtonDown()) {
          // Find nearest cannon and fire at click position
          this.fireNearestCannon({ x: gridX, y: gridY });
        }
      }
    });

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
        logger.info("Entering COMBAT phase - Ships spawning");
        // Finalize cannon deployment
        this.cannons = this.deploySystem.finalizeDeployment();
        // Start combat phase
        this.combatSystem.startCombatPhase(this.cannons);
        break;
      case GamePhase.SCORING:
        logger.info("Entering SCORING phase - Validating territories");
        this.scorePhase();
        break;
    }
  }

  private scorePhase(): void {
    const result = this.buildSystem.validateTerritories(this.castles);

    // Award points for ships destroyed
    const shipsDestroyed = this.combatSystem.getShipsDefeated();
    for (let i = 0; i < shipsDestroyed; i++) {
      this.gameStateManager.shipDestroyed();
    }

    // Award points for territories held
    if (result.hasValidTerritory) {
      this.gameStateManager.territoryHeld(result.enclosedCastles.length);
    }

    if (!result.hasValidTerritory) {
      logger.warn("No enclosed castles - Life lost!");
      this.gameStateManager.noValidTerritory();

      // Check if game over
      if (this.gameStateManager.isGameOver()) {
        this.showGameOver();
      }
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

  private showGameOver(): void {
    const stats = this.gameStateManager.getStats();
    this.gameOverScreen.show(
      stats.score,
      stats.level,
      stats.totalShipsDestroyed,
      () => this.restartGame()
    );
  }

  private showLevelComplete(): void {
    const stats = this.gameStateManager.getStats();
    this.levelCompleteScreen.show(
      stats.level,
      stats.score,
      stats.shipsDestroyed,
      () => this.nextLevel()
    );
  }

  private restartGame(): void {
    this.gameStateManager.reset();
    this.scene.restart();
  }

  private nextLevel(): void {
    this.gameStateManager.nextLevel();
    // For now, just restart (future: load different map)
    this.scene.restart();
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
    } else if (currentPhase === GamePhase.COMBAT) {
      this.combatSystem.update(delta);
    }

    // Render current piece or cannons
    this.renderCurrentPiece();
    this.renderCannons();
    this.renderCombat();

    // Update HUD with current game stats
    const currentCannonCount = this.deploySystem.getCannons().length;
    const stats = this.gameStateManager.getStats();

    this.hud.update(
      {
        phase: currentPhase,
        timeRemaining,
        castleCount: this.enclosedCastles.length || this.castles.length,
        cannonCount: currentCannonCount || this.cannons.length,
        score: stats.score,
        lives: stats.lives,
        level: stats.level,
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
    // Mouse input now handled via event listeners in setupControls()
    // This method is kept for future keyboard-based cannon controls if needed
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

  private renderCombat(): void {
    const currentPhase = this.phaseManager.getCurrentPhase();

    // Clear previous rendering
    this.shipRenderer.clear();
    this.projectileRenderer.clear();

    // Only render during COMBAT phase
    if (currentPhase !== GamePhase.COMBAT) return;

    // Render ships
    const ships = this.combatSystem.getShips();
    this.shipRenderer.renderShips(ships, this.mapOffsetX, this.mapOffsetY);

    // Render projectiles
    const projectiles = this.combatSystem.getProjectiles();
    this.projectileRenderer.renderProjectiles(
      projectiles,
      this.mapOffsetX,
      this.mapOffsetY
    );
  }

  private fireNearestCannon(targetPos: { x: number; y: number }): void {
    if (this.cannons.length === 0) return;

    // Find nearest cannon to target
    let nearestCannon = this.cannons[0];
    let minDistance = Number.MAX_VALUE;

    for (const cannon of this.cannons) {
      const dx = targetPos.x - cannon.position.x;
      const dy = targetPos.y - cannon.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearestCannon = cannon;
      }
    }

    // Fire cannon at target
    this.combatSystem.fireCannon(nearestCannon.id, targetPos);
    logger.info("Cannon fired", { cannonId: nearestCannon.id, target: targetPos });
  }
}
