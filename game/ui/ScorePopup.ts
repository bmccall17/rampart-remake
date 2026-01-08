import * as Phaser from "phaser";

interface PopupData {
  text: Phaser.GameObjects.Text;
  startY: number;
  startTime: number;
}

export class ScorePopup {
  private scene: Phaser.Scene;
  private popups: PopupData[] = [];
  private readonly POPUP_DURATION = 1500;
  private readonly RISE_AMOUNT = 40;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(x: number, y: number, points: number, reason: string): void {
    const displayText = `+${points} ${reason}`;
    const color = points >= 100 ? "#ffff00" : "#ffffff";

    const text = this.scene.add.text(x, y, displayText, {
      fontSize: points >= 100 ? "20px" : "16px",
      color: color,
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
    });
    text.setOrigin(0.5);
    text.setDepth(900);

    this.popups.push({
      text,
      startY: y,
      startTime: this.scene.time.now,
    });
  }

  update(): void {
    const now = this.scene.time.now;
    const toRemove: number[] = [];

    this.popups.forEach((popup, index) => {
      const elapsed = now - popup.startTime;
      const progress = elapsed / this.POPUP_DURATION;

      if (progress >= 1) {
        popup.text.destroy();
        toRemove.push(index);
      } else {
        const newY = popup.startY - this.RISE_AMOUNT * progress;
        popup.text.setY(newY);
        popup.text.setAlpha(1 - progress * 0.5);
      }
    });

    for (let i = toRemove.length - 1; i >= 0; i--) {
      this.popups.splice(toRemove[i], 1);
    }
  }

  clear(): void {
    this.popups.forEach((popup) => popup.text.destroy());
    this.popups = [];
  }
}
