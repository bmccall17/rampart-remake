import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../core/GameConfig";

export interface ScoreBreakdown {
  shipsDestroyed: number;
  shipsPoints: number;
  territoriesHeld: number;
  territoriesPoints: number;
  levelBonus: number;
  totalScore: number;
}

export class LevelCompleteScreen {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(
    level: number,
    breakdown: ScoreBreakdown,
    onContinue: () => void
  ): void {
    const overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.7
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
    panel.setStrokeStyle(4, 0x44ff44);

    const title = this.scene.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 180,
      "LEVEL COMPLETE!",
      {
        fontSize: "48px",
        color: "#44ff44",
        fontStyle: "bold",
      }
    );
    title.setOrigin(0.5);

    const statsY = GAME_HEIGHT / 2 - 100;
    const lineHeight = 35;
    const elements: Phaser.GameObjects.GameObject[] = [overlay, panel, title];

    const levelLabel = this.scene.add.text(
      GAME_WIDTH / 2,
      statsY,
      `Level ${level} Complete`,
      {
        fontSize: "28px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    levelLabel.setOrigin(0.5);
    elements.push(levelLabel);

    const divider1 = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      statsY + lineHeight,
      300,
      2,
      0x666666
    );
    elements.push(divider1);

    const createStatLine = (
      label: string,
      value: string,
      yPos: number,
      valueColor: string = "#ffff00"
    ) => {
      const labelText = this.scene.add.text(
        GAME_WIDTH / 2 - 120,
        yPos,
        label,
        {
          fontSize: "20px",
          color: "#aaaaaa",
        }
      );
      labelText.setOrigin(0, 0.5);

      const valueText = this.scene.add.text(
        GAME_WIDTH / 2 + 120,
        yPos,
        value,
        {
          fontSize: "20px",
          color: valueColor,
          fontStyle: "bold",
        }
      );
      valueText.setOrigin(1, 0.5);

      elements.push(labelText, valueText);
    };

    let currentY = statsY + lineHeight * 1.5;

    createStatLine(
      `Ships Destroyed (${breakdown.shipsDestroyed})`,
      `+${breakdown.shipsPoints}`,
      currentY
    );
    currentY += lineHeight;

    createStatLine(
      `Territories Held (${breakdown.territoriesHeld})`,
      `+${breakdown.territoriesPoints}`,
      currentY
    );
    currentY += lineHeight;

    createStatLine(`Level Bonus`, `+${breakdown.levelBonus}`, currentY);
    currentY += lineHeight;

    const divider2 = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      currentY,
      300,
      2,
      0x666666
    );
    elements.push(divider2);
    currentY += lineHeight * 0.8;

    const totalLabel = this.scene.add.text(
      GAME_WIDTH / 2 - 120,
      currentY,
      "Total Score",
      {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      }
    );
    totalLabel.setOrigin(0, 0.5);

    const totalValue = this.scene.add.text(
      GAME_WIDTH / 2 + 120,
      currentY,
      breakdown.totalScore.toString(),
      {
        fontSize: "28px",
        color: "#44ff44",
        fontStyle: "bold",
      }
    );
    totalValue.setOrigin(1, 0.5);
    elements.push(totalLabel, totalValue);

    const buttonWidth = 200;
    const buttonHeight = 60;
    const buttonY = GAME_HEIGHT / 2 + 170;

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

    elements.push(continueButton, continueText);

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
