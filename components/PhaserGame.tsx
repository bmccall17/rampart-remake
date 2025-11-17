"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { GameConfig } from "@/game/core/GameConfig";
import { createLogger, logger } from "@/game/logging/Logger";

const phaserLogger = createLogger("PhaserGame", true);

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !gameRef.current) {
      phaserLogger.info("Initializing Phaser game");
      phaserLogger.event("GameInitialized", { config: "MainScene" });

      // Add raw browser input instrumentation
      window.addEventListener("keydown", (event) => {
        logger.debug("Browser keydown", {
          channel: "INPUT",
          data: {
            code: event.code,
            key: event.key,
            repeat: event.repeat,
          },
        });
      });

      gameRef.current = new Phaser.Game(GameConfig);

      // Ensure canvas gets focus for keyboard input
      setTimeout(() => {
        const canvas = document.querySelector("canvas");
        if (canvas) {
          canvas.setAttribute("tabindex", "1");
          canvas.focus();
        }
      }, 100);
    }

    return () => {
      if (gameRef.current) {
        phaserLogger.info("Destroying Phaser game");
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} />;
}
