import * as Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "../core/GameConfig";

export class InputDebugDisplay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private debugText: Phaser.GameObjects.Text;
  private inputHistory: string[] = [];
  private readonly MAX_HISTORY = 10;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create background panel
    const panel = this.scene.add.rectangle(
      150,
      GAME_HEIGHT / 2,
      280,
      400,
      0x000000,
      0.8
    );
    panel.setStrokeStyle(2, 0x00ff00);

    // Create title
    const title = this.scene.add.text(150, GAME_HEIGHT / 2 - 180, "INPUT DEBUG", {
      fontSize: "18px",
      color: "#00ff00",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);

    // Create debug text
    this.debugText = this.scene.add.text(
      20,
      GAME_HEIGHT / 2 - 150,
      "Waiting for input...",
      {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        wordWrap: { width: 260 },
      }
    );

    // Create container
    this.container = this.scene.add.container(0, 0);
    this.container.add([panel, title, this.debugText]);
    this.container.setDepth(2000); // Above everything

    // Setup input listeners
    this.setupListeners();
  }

  private setupListeners(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) {
      this.addInput("ERROR: Keyboard not available!");
      return;
    }

    // Log keyboard initialization
    this.addInput("Keyboard initialized");

    // Listen to ALL key events
    keyboard.on("keydown", (event: KeyboardEvent) => {
      this.addInput(`⌨️ KeyDown: ${event.key} (${event.code})`);
      console.log("KeyDown Event:", event.key, event.code, event);
    });

    keyboard.on("keyup", (event: KeyboardEvent) => {
      this.addInput(`⌨️ KeyUp: ${event.key} (${event.code})`);
      console.log("KeyUp Event:", event.key, event.code, event);
    });

    // Listen to mouse events
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const button = pointer.leftButtonDown()
        ? "LEFT"
        : pointer.rightButtonDown()
        ? "RIGHT"
        : "OTHER";
      this.addInput(`🖱️ Mouse: ${button} at (${Math.floor(pointer.x)}, ${Math.floor(pointer.y)})`);
      console.log("Pointer Down:", button, pointer.x, pointer.y, pointer);
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      // Log pointer move less frequently (every 100ms)
      const now = Date.now();
      if (!this.lastPointerMoveLog || now - this.lastPointerMoveLog > 100) {
        console.log("Pointer Move:", pointer.x, pointer.y);
        this.lastPointerMoveLog = now;
      }
    });

    console.log("Input listeners attached to scene:", this.scene.scene.key);
  }

  private lastPointerMoveLog: number = 0;

  private addInput(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${message}`;

    this.inputHistory.unshift(entry);
    if (this.inputHistory.length > this.MAX_HISTORY) {
      this.inputHistory.pop();
    }

    this.updateDisplay();

    // Also log to console
    console.log("INPUT DEBUG:", message);
  }

  private updateDisplay(): void {
    const displayText = this.inputHistory.join("\n\n");
    this.debugText.setText(displayText || "No input received");
  }

  /**
   * Show or hide the debug display
   */
  setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }

  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.container.visible;
  }

  /**
   * Destroy the debug display
   */
  destroy(): void {
    this.container.destroy();
  }
}
