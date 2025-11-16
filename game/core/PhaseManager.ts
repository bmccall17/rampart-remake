import { GamePhase } from "../types";
import { createLogger } from "../logging/Logger";

const logger = createLogger("PhaseManager", true);

export interface PhaseConfig {
  duration: number; // in milliseconds (0 = infinite)
  canSkip: boolean;
}

export type PhaseConfigs = {
  [key in GamePhase]: PhaseConfig;
};

export interface PhaseChangeEvent {
  fromPhase: GamePhase | null;
  toPhase: GamePhase;
  timestamp: number;
}

export class PhaseManager {
  private currentPhase: GamePhase;
  private phaseStartTime: number = 0;
  private phaseConfigs: PhaseConfigs;
  private onPhaseChange?: (event: PhaseChangeEvent) => void;
  private isPaused: boolean = false;

  constructor(
    initialPhase: GamePhase = GamePhase.BUILD,
    phaseConfigs?: Partial<PhaseConfigs>
  ) {
    this.currentPhase = initialPhase;

    // Default phase configurations (in milliseconds)
    this.phaseConfigs = {
      [GamePhase.BUILD]: {
        duration: 30000, // 30 seconds
        canSkip: false,
      },
      [GamePhase.DEPLOY]: {
        duration: 15000, // 15 seconds
        canSkip: true,
      },
      [GamePhase.COMBAT]: {
        duration: 25000, // 25 seconds
        canSkip: false,
      },
      [GamePhase.SCORING]: {
        duration: 3000, // 3 seconds
        canSkip: false,
      },
      ...phaseConfigs,
    };

    logger.info("PhaseManager initialized", { initialPhase });
  }

  /**
   * Start the phase manager with the current time
   */
  start(currentTime: number): void {
    this.phaseStartTime = currentTime;
    logger.event("PhaseStarted", {
      phase: this.currentPhase,
      duration: this.phaseConfigs[this.currentPhase].duration,
    });
  }

  /**
   * Update the phase manager (call this every frame)
   */
  update(currentTime: number): void {
    if (this.isPaused) return;

    const elapsed = currentTime - this.phaseStartTime;
    const config = this.phaseConfigs[this.currentPhase];

    // Auto-advance if time expired (duration > 0 means timed phase)
    if (config.duration > 0 && elapsed >= config.duration) {
      this.advanceToNextPhase(currentTime);
    }
  }

  /**
   * Get the current phase
   */
  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }

  /**
   * Get time remaining in current phase (in milliseconds)
   */
  getTimeRemaining(currentTime: number): number {
    const elapsed = currentTime - this.phaseStartTime;
    const duration = this.phaseConfigs[this.currentPhase].duration;

    if (duration === 0) return 0; // Infinite duration

    const remaining = Math.max(0, duration - elapsed);
    return remaining;
  }

  /**
   * Get time remaining formatted as MM:SS
   */
  getTimeRemainingFormatted(currentTime: number): string {
    const remaining = this.getTimeRemaining(currentTime);

    if (remaining === 0 && this.phaseConfigs[this.currentPhase].duration === 0) {
      return "∞";
    }

    const seconds = Math.ceil(remaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  /**
   * Get elapsed time in current phase (in milliseconds)
   */
  getElapsedTime(currentTime: number): number {
    return currentTime - this.phaseStartTime;
  }

  /**
   * Get progress through current phase (0.0 to 1.0)
   */
  getPhaseProgress(currentTime: number): number {
    const duration = this.phaseConfigs[this.currentPhase].duration;

    if (duration === 0) return 0; // Infinite duration

    const elapsed = currentTime - this.phaseStartTime;
    return Math.min(1, elapsed / duration);
  }

  /**
   * Manually change to a specific phase
   */
  changePhase(newPhase: GamePhase, currentTime: number): void {
    const oldPhase = this.currentPhase;

    if (oldPhase === newPhase) {
      logger.warn("Attempted to change to same phase", { phase: newPhase });
      return;
    }

    this.currentPhase = newPhase;
    this.phaseStartTime = currentTime;

    const event: PhaseChangeEvent = {
      fromPhase: oldPhase,
      toPhase: newPhase,
      timestamp: currentTime,
    };

    logger.event("PhaseChanged", event);

    if (this.onPhaseChange) {
      this.onPhaseChange(event);
    }
  }

  /**
   * Advance to the next phase in sequence
   */
  advanceToNextPhase(currentTime: number): void {
    const nextPhase = this.getNextPhase(this.currentPhase);
    this.changePhase(nextPhase, currentTime);
  }

  /**
   * Get the next phase in the cycle
   */
  private getNextPhase(currentPhase: GamePhase): GamePhase {
    switch (currentPhase) {
      case GamePhase.BUILD:
        return GamePhase.DEPLOY;
      case GamePhase.DEPLOY:
        return GamePhase.COMBAT;
      case GamePhase.COMBAT:
        return GamePhase.SCORING;
      case GamePhase.SCORING:
        return GamePhase.BUILD;
      default:
        return GamePhase.BUILD;
    }
  }

  /**
   * Set callback for phase changes
   */
  setOnPhaseChange(callback: (event: PhaseChangeEvent) => void): void {
    this.onPhaseChange = callback;
  }

  /**
   * Pause the phase timer
   */
  pause(): void {
    this.isPaused = true;
    logger.info("PhaseManager paused");
  }

  /**
   * Resume the phase timer
   */
  resume(currentTime: number): void {
    if (this.isPaused) {
      // Adjust start time to account for paused duration
      const elapsed = this.getElapsedTime(currentTime);
      this.phaseStartTime = currentTime - elapsed;
      this.isPaused = false;
      logger.info("PhaseManager resumed");
    }
  }

  /**
   * Check if current phase can be skipped
   */
  canSkipCurrentPhase(): boolean {
    return this.phaseConfigs[this.currentPhase].canSkip;
  }

  /**
   * Skip current phase if allowed
   */
  skipPhase(currentTime: number): boolean {
    if (this.canSkipCurrentPhase()) {
      logger.info("Skipping phase", { phase: this.currentPhase });
      this.advanceToNextPhase(currentTime);
      return true;
    }
    return false;
  }

  /**
   * Update phase configuration
   */
  updatePhaseConfig(phase: GamePhase, config: Partial<PhaseConfig>): void {
    this.phaseConfigs[phase] = {
      ...this.phaseConfigs[phase],
      ...config,
    };
    logger.info("Phase config updated", { phase, config });
  }

  /**
   * Reset to initial phase
   */
  reset(currentTime: number): void {
    this.changePhase(GamePhase.BUILD, currentTime);
    this.isPaused = false;
    logger.info("PhaseManager reset");
  }
}
