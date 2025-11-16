import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../core/GameConfig";

export class GameOverScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show game over screen
   */
  show(score: number, level: number, shipsDestroyed: number, onRestart: () => void): void {
    // Create dark overlay
    const overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8
    );

    // Create panel background
    const panelWidth = 500;
    const panelHeight = 400;
    const panel = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      panelWidth,
      panelHeight,
      0x1a1a2e,
      1
    );
    panel.setStrokeStyle(4, 0xff4444);

    // Game Over title
    const title = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 150,
      "GAME OVER",
      {
        fontSize: "64px",
        color: "#ff4444",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5);

    // Stats
    const statsY = GAME_HEIGHT / 2 - 50;
    const statsText = [
      `Final Score: ${score}`,
      `Level Reached: ${level}`,
      `Ships Destroyed: ${shipsDestroyed}`,
    ];

    const statTexts: Phaser.GameObjects.Text[] = [];
    statsText.forEach((text, index) => {
      const stat = this.scene.add.text(
        GAME_WIDTH / 2,
        statsY + index * 40,
        text,
        {
          fontSize: "24px",
          color: "#ffffff",
        }
      );
      stat.setOrigin(0.5);
      statTexts.push(stat);
    });

    // Restart button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonY = GAME_HEIGHT / 2 + 120;

    const restartButton = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x44ff44,
      1
    );
    restartButton.setStrokeStyle(3, 0x228822);
    restartButton.setInteractive({ useHandCursor: true });

    const restartText = this.scene.add.text(
      GAME_WIDTH / 2,
      buttonY,
      "RESTART",
      {
        fontSize: "28px",
        color: "#000000",
        fontStyle: "bold",
      }
    );
    restartText.setOrigin(0.5);

    // Button hover effects
    restartButton.on("pointerover", () => {
      restartButton.setFillStyle(0x55ff55);
    });

    restartButton.on("pointerout", () => {
      restartButton.setFillStyle(0x44ff44);
    });

    restartButton.on("pointerdown", () => {
      this.hide();
      onRestart();
    });

    // Create container
    this.container = this.scene.add.container(0, 0);
    this.container.add([
      overlay,
      panel,
      title,
      ...statTexts,
      restartButton,
      restartText,
    ]);
    this.container.setDepth(1000);
  }

  /**
   * Hide game over screen
   */
  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.container !== null;
  }
}
