import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../core/GameConfig";

export class LevelCompleteScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show level complete screen
   */
  show(
    level: number,
    score: number,
    shipsDestroyed: number,
    onContinue: () => void
  ): void {
    // Create dark overlay
    const overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
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
    panel.setStrokeStyle(4, 0x44ff44);

    // Level Complete title
    const title = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 150,
      "LEVEL COMPLETE!",
      {
        fontSize: "56px",
        color: "#44ff44",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5);

    // Stats
    const statsY = GAME_HEIGHT / 2 - 50;
    const statsText = [
      `Level ${level} Complete`,
      `Score: ${score}`,
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

    // Continue button
    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonY = GAME_HEIGHT / 2 + 120;

    const continueButton = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x44ff44,
      1
    );
    continueButton.setStrokeStyle(3, 0x228822);
    continueButton.setInteractive({ useHandCursor: true });

    const continueText = this.scene.add.text(
      GAME_WIDTH / 2,
      buttonY,
      "CONTINUE",
      {
        fontSize: "28px",
        color: "#000000",
        fontStyle: "bold",
      }
    );
    continueText.setOrigin(0.5);

    // Button hover effects
    continueButton.on("pointerover", () => {
      continueButton.setFillStyle(0x55ff55);
    });

    continueButton.on("pointerout", () => {
      continueButton.setFillStyle(0x44ff44);
    });

    continueButton.on("pointerdown", () => {
      this.hide();
      onContinue();
    });

    // Create container
    this.container = this.scene.add.container(0, 0);
    this.container.add([
      overlay,
      panel,
      title,
      ...statTexts,
      continueButton,
      continueText,
    ]);
    this.container.setDepth(1000);
  }

  /**
   * Hide level complete screen
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
