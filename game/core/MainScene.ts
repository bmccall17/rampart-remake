import * as Phaser from "phaser";
import { createLogger, logger } from "../logging/Logger";
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

const sceneLogger = createLogger("MainScene", true);

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
  private territoryTiles: { x: number; y: number }[] = [];
  private enclosingWalls: { x: number; y: number }[] = [];
  private lastClickTime: number = 0;
  private lastLoggedPhase: GamePhase | null = null;
  private debugPieceIndicator: Phaser.GameObjects.Text | null = null;
  private frameCount: number = 0;
  private lastLogicAction: string = "None";
  // Crosshair and target marker system
  private crosshairGraphics!: Phaser.GameObjects.Graphics;
  private targetMarkers: Map<string, { x: number; y: number }> = new Map(); // projectileId -> target position
  private isMouseDown: boolean = false;

  constructor() {
    super({ key: "MainScene" });
  }

  create() {
    sceneLogger.info("MainScene created");
    sceneLogger.event("SceneCreated", { scene: "MainScene" });

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

    // Initialize crosshair graphics (for COMBAT phase)
    this.crosshairGraphics = this.add.graphics();
    this.crosshairGraphics.setDepth(1000); // Always on top

    // Initialize game state manager
    this.gameStateManager = new GameStateManager();
    this.gameOverScreen = new GameOverScreen(this);
    this.levelCompleteScreen = new LevelCompleteScreen(this);

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
      "v0.8.0 - Input & Map Overhaul",
      {
        fontSize: "14px",
        color: "#888888",
      }
    );

    // Add controls hint
    this.add.text(
      10,
      GAME_HEIGHT - 55,
      "BUILD: Mouse move + LClick place + RClick rotate | DEPLOY: Click | COMBAT: Click | ESC: Restart",
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
      sceneLogger.info("Phase transition", {
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

    // Handle initial phase since phase change callback only triggers on changes
    this.onPhaseChange(GamePhase.BUILD);

    sceneLogger.info("PhaseManager initialized");
  }

  private setupControls(): void {
    // Setup keyboard controls
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keySpace = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Explicitly capture ESC key for restart
    const keyEsc = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    keyEsc.on('down', () => {
      sceneLogger.info("ESC key pressed - Restarting game");
      this.scene.restart();
    });

    // ALTERNATIVE: Listen to raw keyboard events directly
    // This ensures we catch keyboard events even if Phaser's JustDown isn't working
    const handleInput = (code: string, source: string = "PHASER") => {
      // Add Phaser input instrumentation as per specification
      sceneLogger.debug("Input received", {
        channel: "INPUT",
        data: { code, source },
      });

      const currentPhase = this.phaseManager.getCurrentPhase();

      if (currentPhase === GamePhase.BUILD) {
        logger.debug("Input in BUILD phase", {
          channel: "BUILD",
          data: { code },
        });
      }

      // DEBUG: Press ESC to restart game and go back to BUILD phase
      if (code === "Escape") {
        sceneLogger.info("ESC pressed - Restarting game");
        this.scene.restart();
        return;
      }

      if (currentPhase === GamePhase.BUILD) {
        const currentPiece = this.buildSystem.getCurrentPiece();
        if (!currentPiece) {
          sceneLogger.warn("No piece available for keyboard input");
          this.lastLogicAction = "No Piece!";
          return;
        }

        switch (code) {
          case "ArrowLeft":
          case "KeyA":
            sceneLogger.info("LEFT input - moving piece");
            this.buildSystem.movePiece(-1, 0);
            this.lastLogicAction = "Move Left";
            break;
          case "ArrowRight":
          case "KeyD":
            sceneLogger.info("RIGHT input - moving piece");
            this.buildSystem.movePiece(1, 0);
            this.lastLogicAction = "Move Right";
            break;
          case "ArrowUp":
          case "KeyW":
            sceneLogger.info("UP input - moving piece");
            this.buildSystem.movePiece(0, -1);
            this.lastLogicAction = "Move Up";
            break;
          case "ArrowDown":
          case "KeyS":
            sceneLogger.info("DOWN input - moving piece");
            this.buildSystem.movePiece(0, 1);
            this.lastLogicAction = "Move Down";
            break;
          case "KeyR":
          case "KeyE": // E can also rotate
            sceneLogger.info("Rotate input - rotating piece");
            this.buildSystem.rotatePiece(true);
            this.lastLogicAction = "Rotate";
            break;
          case "Space":
          case "Enter":
            sceneLogger.info("Action input - placing piece");
            if (this.buildSystem.placePiece()) {
              sceneLogger.info("Piece placed successfully");
              this.tileRenderer.clear();
              this.renderMap();
              this.lastLogicAction = "Placed";
            } else {
              this.lastLogicAction = "Place Failed";
            }
            break;
          default:
            sceneLogger.info(`Ignored input code: ${code}`);
            this.lastLogicAction = `Ignored (${code})`;
            break;
        }
      } else {
        this.lastLogicAction = `Wrong Phase (${currentPhase})`;
      }
    };

    // Phaser Keyboard Listener (single handler to avoid duplicate processing)
    this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
      handleInput(event.code);
    });

    // Prevent browser context menu on right-click
    this.input.mouse!.disableContextMenu();

    // Setup mouse movement tracking for BUILD phase
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      const currentPhase = this.phaseManager.getCurrentPhase();
      if (currentPhase !== GamePhase.BUILD) return;

      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      // Move piece to follow mouse cursor
      this.buildSystem.setPosition(gridX, gridY);
    });

    // Setup mouse controls with event listeners
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const currentPhase = this.phaseManager.getCurrentPhase();

      const now = this.time.now;
      const timeSinceLastClick = now - this.lastClickTime;
      if (timeSinceLastClick < 200) {
        sceneLogger.info("Mouse click debounced (too rapid)", {
          timeSinceLastClick: timeSinceLastClick.toFixed(0) + "ms",
          debounceThreshold: "200ms",
        });
        return; // Debounce
      }
      this.lastClickTime = now;

      const gridX = Math.floor((pointer.x - this.mapOffsetX) / TILE_SIZE);
      const gridY = Math.floor((pointer.y - this.mapOffsetY) / TILE_SIZE);

      sceneLogger.info("Mouse click received", {
        phase: currentPhase,
        screenPos: { x: Math.floor(pointer.x), y: Math.floor(pointer.y) },
        gridPos: { x: gridX, y: gridY },
        button: pointer.leftButtonDown() ? "LEFT" : pointer.rightButtonDown() ? "RIGHT" : "OTHER",
      });

      if (currentPhase === GamePhase.BUILD) {
        if (pointer.leftButtonDown()) {
          // Left-click to place piece
          sceneLogger.info("Left-click - placing piece");
          if (this.buildSystem.placePiece()) {
            sceneLogger.info("Piece placed successfully via left-click");
            this.tileRenderer.clear();
            this.renderMap();
            this.lastLogicAction = "Placed (Mouse)";
          } else {
            this.lastLogicAction = "Place Failed (Mouse)";
          }
        } else if (pointer.rightButtonDown()) {
          // Right-click to rotate piece
          sceneLogger.info("Right-click - rotating piece");
          this.buildSystem.rotatePiece(true);
          this.lastLogicAction = "Rotate (Mouse)";
        }
      } else if (currentPhase === GamePhase.DEPLOY) {
        if (pointer.leftButtonDown()) {
          // Place cannon
          this.deploySystem.placeCannon({ x: gridX, y: gridY });
        } else if (pointer.rightButtonDown()) {
          // Remove cannon
          this.deploySystem.removeCannon({ x: gridX, y: gridY });
        }
      } else if (currentPhase === GamePhase.COMBAT) {
        if (pointer.leftButtonDown()) {
          // Fire closest available cannon at click position
          const firedProjectileId = this.fireClosestAvailableCannon({ x: gridX, y: gridY });
          if (firedProjectileId) {
            // Store target position for marker
            this.targetMarkers.set(firedProjectileId, { x: gridX, y: gridY });
          }
        }
      } else {
        sceneLogger.info("Mouse click ignored - wrong phase for mouse input", {
          currentPhase,
          clickPosition: { x: gridX, y: gridY },
        });
      }
    });

    // Track mouse down state for crosshair animation
    this.input.on("pointerdown", () => {
      this.isMouseDown = true;
    });
    this.input.on("pointerup", () => {
      this.isMouseDown = false;
    });

    sceneLogger.info("Controls initialized");
  }

  private onPhaseChange(newPhase: GamePhase): void {
    switch (newPhase) {
      case GamePhase.BUILD:
        logger.info("Entering BUILD phase - Wall placement enabled");
        // Restore default cursor
        this.input.setDefaultCursor("default");
        // Clear any previous territory visualization
        this.tileRenderer.clearTerritory();
        this.buildSystem.startBuildPhase();
        const piece = this.buildSystem.getCurrentPiece();
        if (piece) {
          logger.info(`BUILD phase started with piece: ${piece.name} at (${piece.position.x}, ${piece.position.y})`);
        } else {
          logger.error("BUILD phase started but NO PIECE was spawned!");
        }
        break;
      case GamePhase.DEPLOY:
        logger.info("Entering DEPLOY phase - Cannon placement enabled");
        // Validate territories before starting deploy phase to calculate cannon allocation
        const territoryResult = this.buildSystem.validateTerritories(this.castles);
        if (territoryResult.hasValidTerritory) {
          this.enclosedCastles = territoryResult.enclosedCastles;
          this.territoryTiles = territoryResult.territoryTiles;
          this.enclosingWalls = territoryResult.enclosingWalls;
          logger.info(`Territory validation: ${territoryResult.enclosedCastles.length} castles enclosed, ${territoryResult.territoryTiles.length} tiles, ${territoryResult.enclosingWalls.length} walls`);

          // Render the enclosed territory with green overlay and border
          this.tileRenderer.renderTerritory(
            this.territoryTiles,
            this.enclosingWalls,
            this.mapOffsetX,
            this.mapOffsetY
          );
        } else {
          this.enclosedCastles = [];
          this.territoryTiles = [];
          this.enclosingWalls = [];
          logger.warn("No castles enclosed - player will have 0 cannons!");
        }
        this.deploySystem.startDeployPhase(this.enclosedCastles);
        break;
      case GamePhase.COMBAT:
        logger.info("Entering COMBAT phase - Ships spawning");
        // Finalize cannon deployment
        this.cannons = this.deploySystem.finalizeDeployment();
        // Start combat phase
        this.combatSystem.startCombatPhase(this.cannons);
        // Hide default cursor for custom crosshair
        this.input.setDefaultCursor("none");
        // Clear target markers from previous combat
        this.targetMarkers.clear();
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

    // Handle phase-specific updates
    if (currentPhase === GamePhase.DEPLOY) {
      this.handleDeployPhaseInput();
    } else if (currentPhase === GamePhase.COMBAT) {
      this.combatSystem.update(delta);
    }

    // Debug: Log phase changes (only when phase changes)
    if (this.lastLoggedPhase !== currentPhase) {
      logger.info(`Phase active in update loop: ${currentPhase}`);
      this.lastLoggedPhase = currentPhase;
    }

    // Render current piece or cannons
    this.renderCurrentPiece();
    this.renderCannons();
    this.renderCombat();

    // Draw crosshair and target markers during COMBAT
    this.drawCrosshair();

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

  private handleDeployPhaseInput(): void {
    // Mouse input now handled via event listeners in setupControls()
    // This method is kept for future keyboard-based cannon controls if needed
  }

  private renderCurrentPiece(): void {
    const currentPhase = this.phaseManager.getCurrentPhase();

    // Clear previous piece rendering
    this.pieceRenderer.clear();

    // Only render during BUILD phase
    if (currentPhase !== GamePhase.BUILD) {
      if (this.debugPieceIndicator) {
        this.debugPieceIndicator.setVisible(false);
      }
      return;
    }

    const currentPiece = this.buildSystem.getCurrentPiece();
    if (!currentPiece) {
      return; // No piece to render, skip rendering
    }

    const piecePos = currentPiece.position;
    const pieceName = currentPiece.name;

    // Get invalid tiles for visual feedback
    const invalidTiles = this.buildSystem.getInvalidTiles();

    logger.info(`Rendering piece: ${pieceName} at position (${piecePos.x}, ${piecePos.y}), invalid tiles: ${invalidTiles.length}`);

    // Render the current piece with invalid tile highlighting
    this.pieceRenderer.renderPiece(
      currentPiece,
      this.mapOffsetX,
      this.mapOffsetY,
      false,
      invalidTiles
    );

    // Add debug indicator
    if (!this.debugPieceIndicator) {
      this.debugPieceIndicator = this.add.text(
        GAME_WIDTH / 2,
        50,
        "",
        {
          fontSize: "24px",
          color: "#00ff00",
          fontStyle: "bold",
          backgroundColor: "#000000",
          padding: { x: 10, y: 5 },
        }
      );
      this.debugPieceIndicator.setOrigin(0.5);
      this.debugPieceIndicator.setDepth(3000);
    }

    this.frameCount++;
    this.debugPieceIndicator.setText(
      `PHASE: ${currentPhase} | PIECE: ${pieceName}\nACTION: ${this.lastLogicAction} | FRAME: ${this.frameCount}\nARROWS/WASD to Move`
    );
    this.debugPieceIndicator.setVisible(true);
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

  private fireClosestAvailableCannon(targetPos: { x: number; y: number }): string | null {
    if (this.cannons.length === 0) {
      logger.warn("Fire attempt failed: No cannons available", {
        targetPos,
        currentPhase: this.phaseManager.getCurrentPhase(),
      });
      return null;
    }

    // Sort cannons by distance to target (closest first)
    const sortedCannons = [...this.cannons].sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(targetPos.x - a.position.x, 2) +
        Math.pow(targetPos.y - a.position.y, 2)
      );
      const distB = Math.sqrt(
        Math.pow(targetPos.x - b.position.x, 2) +
        Math.pow(targetPos.y - b.position.y, 2)
      );
      return distA - distB;
    });

    // Try to fire cannons in order of distance (closest first)
    // Skip any that already have a projectile in flight
    for (const cannon of sortedCannons) {
      const projectilesBefore = this.combatSystem.getProjectiles().length;
      const fired = this.combatSystem.fireCannon(cannon.id, targetPos);
      if (fired) {
        // Get the newly created projectile ID
        const projectiles = this.combatSystem.getProjectiles();
        const newProjectile = projectiles[projectiles.length - 1];

        logger.info("Fired closest available cannon", {
          cannonId: cannon.id,
          cannonPosition: cannon.position,
          target: targetPos,
          projectileId: newProjectile?.id,
        });
        return newProjectile?.id || null;
      }
    }

    logger.info("No cannons available to fire (all have projectiles in flight)", {
      target: targetPos,
      totalCannons: this.cannons.length,
    });
    return null;
  }

  /**
   * Draw crosshair cursor during COMBAT phase
   */
  private drawCrosshair(): void {
    this.crosshairGraphics.clear();

    const currentPhase = this.phaseManager.getCurrentPhase();
    if (currentPhase !== GamePhase.COMBAT) {
      return;
    }

    const pointer = this.input.activePointer;
    const x = pointer.x;
    const y = pointer.y;

    // Crosshair size based on mouse state
    const baseSize = this.isMouseDown ? 8 : 16;
    const lineWidth = this.isMouseDown ? 3 : 2;
    const color = 0xff6600;
    const alpha = this.isMouseDown ? 1.0 : 0.8;

    this.crosshairGraphics.lineStyle(lineWidth, color, alpha);

    // Draw X-shaped crosshair (rotated 45 degrees)
    // Top-left to bottom-right
    this.crosshairGraphics.beginPath();
    this.crosshairGraphics.moveTo(x - baseSize, y - baseSize);
    this.crosshairGraphics.lineTo(x + baseSize, y + baseSize);
    this.crosshairGraphics.strokePath();

    // Top-right to bottom-left
    this.crosshairGraphics.beginPath();
    this.crosshairGraphics.moveTo(x + baseSize, y - baseSize);
    this.crosshairGraphics.lineTo(x - baseSize, y + baseSize);
    this.crosshairGraphics.strokePath();

    // Draw target markers for active projectiles
    this.drawTargetMarkers();
  }

  /**
   * Draw target markers where cannons are aimed
   */
  private drawTargetMarkers(): void {
    const projectiles = this.combatSystem.getProjectiles();
    const activeProjectileIds = new Set(projectiles.filter(p => p.isActive && p.source === "player").map(p => p.id));

    // Clean up markers for projectiles that no longer exist
    for (const [projId] of this.targetMarkers) {
      if (!activeProjectileIds.has(projId)) {
        this.targetMarkers.delete(projId);
      }
    }

    // Draw remaining markers
    for (const [, target] of this.targetMarkers) {
      const screenX = this.mapOffsetX + target.x * TILE_SIZE + TILE_SIZE / 2;
      const screenY = this.mapOffsetY + target.y * TILE_SIZE + TILE_SIZE / 2;

      // Draw faint target marker
      this.crosshairGraphics.lineStyle(1, 0xff6600, 0.4);

      // Small X marker
      const markerSize = 6;
      this.crosshairGraphics.beginPath();
      this.crosshairGraphics.moveTo(screenX - markerSize, screenY - markerSize);
      this.crosshairGraphics.lineTo(screenX + markerSize, screenY + markerSize);
      this.crosshairGraphics.strokePath();

      this.crosshairGraphics.beginPath();
      this.crosshairGraphics.moveTo(screenX + markerSize, screenY - markerSize);
      this.crosshairGraphics.lineTo(screenX - markerSize, screenY + markerSize);
      this.crosshairGraphics.strokePath();

      // Circle around target
      this.crosshairGraphics.strokeCircle(screenX, screenY, markerSize + 2);
    }
  }
}
