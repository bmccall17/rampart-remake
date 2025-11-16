import Phaser from "phaser";
import { GamePhase } from "../types";
import { GAME_WIDTH, GAME_HEIGHT } from "./GameConfig";

export interface HUDData {
  phase: GamePhase;
  timeRemaining: string;
  castleCount: number;
  cannonCount: number;
  score: number;
}

export class HUD {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  // Text elements
  private phaseText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private castleText!: Phaser.GameObjects.Text;
  private cannonText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;

  // Graphics elements
  private phaseBanner!: Phaser.GameObjects.Rectangle;
  private phaseProgressBar!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0);

    // Phase banner at top center
    this.createPhaseBanner();

    // Timer display
    this.createTimerDisplay();

    // Stats panel (right side)
    this.createStatsPanel();

    // Progress bar
    this.createProgressBar();
  }

  private createPhaseBanner(): void {
    const bannerWidth = 300;
    const bannerHeight = 50;
    const x = GAME_WIDTH / 2;
    const y = 20;

    // Banner background
    this.phaseBanner = this.scene.add.rectangle(
      x,
      y,
      bannerWidth,
      bannerHeight,
      0x16213e,
      0.9
    );

    // Border
    const border = this.scene.add.rectangle(
      x,
      y,
      bannerWidth,
      bannerHeight,
      0x00d9ff,
      0
    );
    border.setStrokeStyle(2, 0x00d9ff, 1);

    // Phase text
    this.phaseText = this.scene.add.text(x, y, "BUILD PHASE", {
      fontSize: "24px",
      color: "#00d9ff",
      fontStyle: "bold",
    });
    this.phaseText.setOrigin(0.5);

    this.container.add([this.phaseBanner, border, this.phaseText]);
  }

  private createTimerDisplay(): void {
    const x = GAME_WIDTH / 2;
    const y = 60;

    this.timerText = this.scene.add.text(x, y, "0:30", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.timerText.setOrigin(0.5);

    this.container.add(this.timerText);
  }

  private createStatsPanel(): void {
    const panelX = GAME_WIDTH - 150;
    const panelY = 20;
    const lineHeight = 30;

    // Panel background
    const panelBg = this.scene.add.rectangle(
      panelX,
      panelY + 60,
      140,
      120,
      0x16213e,
      0.8
    );

    // Stats labels and values
    const createStatLine = (label: string, y: number) => {
      const labelText = this.scene.add.text(panelX - 60, y, label, {
        fontSize: "14px",
        color: "#aaaaaa",
      });

      const valueText = this.scene.add.text(panelX + 50, y, "0", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      });
      valueText.setOrigin(1, 0);

      return { labelText, valueText };
    };

    const castleStat = createStatLine("🏰 Castles:", panelY + 20);
    this.castleText = castleStat.valueText;

    const cannonStat = createStatLine("⚔️ Cannons:", panelY + 20 + lineHeight);
    this.cannonText = cannonStat.valueText;

    const scoreStat = createStatLine("⭐ Score:", panelY + 20 + lineHeight * 2);
    this.scoreText = scoreStat.valueText;

    this.container.add([
      panelBg,
      castleStat.labelText,
      castleStat.valueText,
      cannonStat.labelText,
      cannonStat.valueText,
      scoreStat.labelText,
      scoreStat.valueText,
    ]);
  }

  private createProgressBar(): void {
    this.phaseProgressBar = this.scene.add.graphics();
    this.container.add(this.phaseProgressBar);
  }

  /**
   * Update HUD with current game data
   */
  update(data: HUDData, progress: number = 0): void {
    // Update phase display
    this.updatePhaseDisplay(data.phase);

    // Update timer
    this.timerText.setText(data.timeRemaining);

    // Update timer color based on urgency
    const urgency = this.getTimeUrgency(data.timeRemaining);
    if (urgency === "critical") {
      this.timerText.setColor("#ff4444");
    } else if (urgency === "warning") {
      this.timerText.setColor("#ffaa00");
    } else {
      this.timerText.setColor("#ffffff");
    }

    // Update stats
    this.castleText.setText(data.castleCount.toString());
    this.cannonText.setText(data.cannonCount.toString());
    this.scoreText.setText(data.score.toString());

    // Update progress bar
    this.updateProgressBar(progress, data.phase);
  }

  private updatePhaseDisplay(phase: GamePhase): void {
    const phaseInfo = this.getPhaseInfo(phase);

    this.phaseText.setText(phaseInfo.text);
    this.phaseText.setColor(phaseInfo.color);
    this.phaseBanner.setFillStyle(phaseInfo.bgColor, 0.9);
  }

  private getPhaseInfo(phase: GamePhase): {
    text: string;
    color: string;
    bgColor: number;
  } {
    switch (phase) {
      case GamePhase.BUILD:
        return {
          text: "BUILD PHASE",
          color: "#00d9ff",
          bgColor: 0x16213e,
        };
      case GamePhase.DEPLOY:
        return {
          text: "DEPLOY CANNONS",
          color: "#ffaa00",
          bgColor: 0x3d2a1e,
        };
      case GamePhase.COMBAT:
        return {
          text: "COMBAT!",
          color: "#ff4444",
          bgColor: 0x3d1e1e,
        };
      case GamePhase.SCORING:
        return {
          text: "SCORING",
          color: "#44ff44",
          bgColor: 0x1e3d1e,
        };
      default:
        return {
          text: "UNKNOWN",
          color: "#ffffff",
          bgColor: 0x16213e,
        };
    }
  }

  private updateProgressBar(progress: number, phase: GamePhase): void {
    const barWidth = 300;
    const barHeight = 6;
    const x = GAME_WIDTH / 2 - barWidth / 2;
    const y = 95;

    this.phaseProgressBar.clear();

    // Background
    this.phaseProgressBar.fillStyle(0x333333, 0.8);
    this.phaseProgressBar.fillRect(x, y, barWidth, barHeight);

    // Progress fill
    const phaseInfo = this.getPhaseInfo(phase);
    const fillColor = parseInt(phaseInfo.color.replace("#", ""), 16);
    this.phaseProgressBar.fillStyle(fillColor, 1);
    this.phaseProgressBar.fillRect(x, y, barWidth * progress, barHeight);

    // Border
    this.phaseProgressBar.lineStyle(1, 0x666666, 1);
    this.phaseProgressBar.strokeRect(x, y, barWidth, barHeight);
  }

  private getTimeUrgency(timeStr: string): "normal" | "warning" | "critical" {
    if (timeStr === "∞") return "normal";

    const [mins, secs] = timeStr.split(":").map(Number);
    const totalSeconds = mins * 60 + secs;

    if (totalSeconds <= 5) return "critical";
    if (totalSeconds <= 10) return "warning";
    return "normal";
  }

  /**
   * Show a phase transition effect
   */
  showPhaseTransition(newPhase: GamePhase, callback?: () => void): void {
    const phaseInfo = this.getPhaseInfo(newPhase);

    // Create large announcement text
    const announcement = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      phaseInfo.text,
      {
        fontSize: "64px",
        color: phaseInfo.color,
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6,
      }
    );
    announcement.setOrigin(0.5);
    announcement.setAlpha(0);
    announcement.setScale(0.5);

    // Animate in
    this.scene.tweens.add({
      targets: announcement,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: "Back.easeOut",
      onComplete: () => {
        // Hold for a moment
        this.scene.time.delayedCall(800, () => {
          // Animate out
          this.scene.tweens.add({
            targets: announcement,
            alpha: 0,
            scale: 1.2,
            duration: 300,
            ease: "Back.easeIn",
            onComplete: () => {
              announcement.destroy();
              if (callback) callback();
            },
          });
        });
      },
    });
  }

  /**
   * Destroy the HUD
   */
  destroy(): void {
    this.container.destroy();
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
}
