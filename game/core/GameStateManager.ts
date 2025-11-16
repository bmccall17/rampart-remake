import { createLogger } from "../logging/Logger";

const logger = createLogger("GameStateManager", true);

export enum GameState {
  PLAYING = "PLAYING",
  GAME_OVER = "GAME_OVER",
  LEVEL_COMPLETE = "LEVEL_COMPLETE",
  VICTORY = "VICTORY",
}

export interface GameStats {
  level: number;
  score: number;
  lives: number;
  shipsDestroyed: number;
  totalShipsDestroyed: number;
  territoriesHeld: number;
  currentWave: number;
}

export class GameStateManager {
  private gameState: GameState = GameState.PLAYING;
  private stats: GameStats;
  private readonly MAX_LIVES = 3;
  private readonly STARTING_LIVES = 3;

  constructor() {
    this.stats = {
      level: 1,
      score: 0,
      lives: this.STARTING_LIVES,
      shipsDestroyed: 0,
      totalShipsDestroyed: 0,
      territoriesHeld: 0,
      currentWave: 1,
    };

    logger.info("GameStateManager initialized", {
      level: this.stats.level,
      score: this.stats.score,
      lives: this.stats.lives,
    });
  }

  /**
   * Start a new game
   */
  startNewGame(): void {
    this.stats = {
      level: 1,
      score: 0,
      lives: this.STARTING_LIVES,
      shipsDestroyed: 0,
      totalShipsDestroyed: 0,
      territoriesHeld: 0,
      currentWave: 1,
    };
    this.gameState = GameState.PLAYING;

    logger.event("NewGameStarted", {
      level: this.stats.level,
      score: this.stats.score,
      lives: this.stats.lives,
    });
  }

  /**
   * Continue to next level
   */
  nextLevel(): void {
    this.stats.level++;
    this.stats.shipsDestroyed = 0;
    this.stats.currentWave = 1;
    this.gameState = GameState.PLAYING;

    logger.event("NextLevel", { level: this.stats.level });
  }

  /**
   * Award points
   */
  addScore(points: number, reason: string): void {
    this.stats.score += points;
    logger.info("Score awarded", { points, reason, totalScore: this.stats.score });
  }

  /**
   * Ship destroyed - award points
   */
  shipDestroyed(): void {
    this.stats.shipsDestroyed++;
    this.stats.totalShipsDestroyed++;
    const points = 100;
    this.addScore(points, "Ship destroyed");

    logger.event("ShipDestroyed", {
      shipsDestroyed: this.stats.shipsDestroyed,
      totalShipsDestroyed: this.stats.totalShipsDestroyed,
    });
  }

  /**
   * Territory held successfully - award points
   */
  territoryHeld(territoryCount: number): void {
    this.stats.territoriesHeld = territoryCount;
    const points = territoryCount * 50;
    this.addScore(points, `${territoryCount} territories held`);

    logger.event("TerritoryHeld", {
      territories: territoryCount,
      points,
    });
  }

  /**
   * Castle damaged or destroyed - lose life
   */
  castleDamaged(): void {
    this.stats.lives--;
    logger.event("CastleDamaged", {
      livesRemaining: this.stats.lives,
    });

    if (this.stats.lives <= 0) {
      this.setGameOver();
    }
  }

  /**
   * No valid territories - lose life
   */
  noValidTerritory(): void {
    this.stats.lives--;
    logger.event("NoValidTerritory", {
      livesRemaining: this.stats.lives,
    });

    if (this.stats.lives <= 0) {
      this.setGameOver();
    }
  }

  /**
   * Level complete
   */
  setLevelComplete(): void {
    this.gameState = GameState.LEVEL_COMPLETE;
    logger.event("LevelComplete", {
      level: this.stats.level,
      score: this.stats.score,
    });
  }

  /**
   * Game over
   */
  setGameOver(): void {
    this.gameState = GameState.GAME_OVER;
    logger.event("GameOver", {
      finalScore: this.stats.score,
      level: this.stats.level,
      totalShipsDestroyed: this.stats.totalShipsDestroyed,
    });
  }

  /**
   * Victory (completed all levels)
   */
  setVictory(): void {
    this.gameState = GameState.VICTORY;
    logger.event("Victory", {
      finalScore: this.stats.score,
      totalShipsDestroyed: this.stats.totalShipsDestroyed,
    });
  }

  /**
   * Get current game state
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get game stats
   */
  getStats(): GameStats {
    return { ...this.stats };
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameState === GameState.GAME_OVER;
  }

  /**
   * Check if level is complete
   */
  isLevelComplete(): boolean {
    return this.gameState === GameState.LEVEL_COMPLETE;
  }

  /**
   * Check if game is won
   */
  isVictory(): boolean {
    return this.gameState === GameState.VICTORY;
  }

  /**
   * Check if game is playing
   */
  isPlaying(): boolean {
    return this.gameState === GameState.PLAYING;
  }

  /**
   * Get lives remaining
   */
  getLives(): number {
    return this.stats.lives;
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.stats.score;
  }

  /**
   * Get current level
   */
  getLevel(): number {
    return this.stats.level;
  }

  /**
   * Reset for restart
   */
  reset(): void {
    this.startNewGame();
  }
}
