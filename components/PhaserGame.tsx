"use client";

import { useEffect, useRef } from "react";
import * as Phaser from "phaser";
import { GameConfig } from "@/game/core/GameConfig";
import { createLogger } from "@/game/logging/Logger";

const logger = createLogger("PhaserGame", true);

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && !gameRef.current) {
      logger.info("Initializing Phaser game");
      logger.event("GameInitialized", { config: "MainScene" });

      gameRef.current = new Phaser.Game(GameConfig);
    }

    return () => {
      if (gameRef.current) {
        logger.info("Destroying Phaser game");
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return null;
}
