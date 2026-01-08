import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../core/GameConfig";

export class GameOverScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(
    score: number,
    level: number,
    shipsDestroyed: number,
    highScore: number,
    isNewHighScore: boolean,
    onRestart: () => void
  ): void {
    const overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8
    );

    const panelWidth = 500;
    const panelHeight = 450;
    const panel = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      panelWidth,
      panelHeight,
      0x1a1a2e,
      1
    );
    panel.setStrokeStyle(4, 0xff4444);

    const title = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 170,
      "GAME OVER",
      {
        fontSize: "64px",
        color: "#ff4444",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5);

    const elements: Phaser.GameObjects.GameObject[] = [overlay, panel, title];

    const statsY = GAME_HEIGHT / 2 - 80;
    const statsText = [
      `Final Score: ${score}`,
      `Level Reached: ${level}`,
      `Ships Destroyed: ${shipsDestroyed}`,
    ];

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
      elements.push(stat);
    });

    const highScoreY = statsY + 140;
    const divider = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      highScoreY - 10,
      300,
      2,
      0x666666
    );
    elements.push(divider);

    if (isNewHighScore) {
      const newHighLabel = this.scene.add.text(
        GAME_WIDTH / 2,
        highScoreY + 20,
        "🏆 NEW HIGH SCORE! 🏆",
        {
          fontSize: "28px",
          color: "#ffff00",
          fontStyle: "bold",
        }
      );
      newHighLabel.setOrigin(0.5);
      elements.push(newHighLabel);
    } else {
      const highScoreLabel = this.scene.add.text(
        GAME_WIDTH / 2,
        highScoreY + 20,
        `High Score: ${highScore}`,
        {
          fontSize: "24px",
          color: "#aaaaaa",
        }
      );
      highScoreLabel.setOrigin(0.5);
      elements.push(highScoreLabel);
    }

    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonY = GAME_HEIGHT / 2 + 160;

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

    elements.push(restartButton, restartText);

    this.container = this.scene.add.container(0, 0);
    this.container.add(elements);
    this.container.setDepth(1000);
  }

  hide(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  isVisible(): boolean {
    return this.container !== null;
  }
}
