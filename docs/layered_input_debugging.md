**Title:** Implement layered input debugging (central logger + browser/Phaser key tracing)

I’d like to add a simple debug system to trace what happens when we press keys during gameplay, especially in the BUILD phase.

**Goal**

Let me see, for every keypress:

1. What the **browser** receives
2. What **Phaser** receives
3. What **MainScene** decides to do with it

For now, we can ignore rendering and systems; I just want solid visibility for 0 & 1 in the input chain.

---

### Task 1 – Add a central `logger` utility

Create a `logger` we can use across the codebase with:

* Log levels: `debug | info | warn | error`
* Channels: at least `INPUT`, `PHASER`, `BUILD` (more later is fine)
* Ability to toggle channels on/off via a simple config object

**Implementation sketch (TypeScript):**

```ts
// src/utils/logger.ts (or similar)

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
  channel?: string;   // e.g. "INPUT", "PHASER", "BUILD"
  data?: unknown;     // optional structured payload
}

const DEBUG_CONFIG = {
  enabled: true,
  channels: {
    INPUT: true,
    PHASER: true,
    BUILD: true,
  } as Record<string, boolean>,
};

function log(level: LogLevel, message: string, options: LogOptions = {}) {
  if (!DEBUG_CONFIG.enabled) return;

  const channel = options.channel ?? "GENERAL";
  if (DEBUG_CONFIG.channels[channel] === false) return;

  const payload = options.data;

  switch (level) {
    case "debug":
      console.debug(`[${channel}]`, message, payload ?? "");
      break;
    case "info":
      console.info(`[${channel}]`, message, payload ?? "");
      break;
    case "warn":
      console.warn(`[${channel}]`, message, payload ?? "");
      break;
    case "error":
      console.error(`[${channel}]`, message, payload ?? "");
      break;
  }
}

export const logger = {
  debug: (msg: string, opts?: LogOptions) => log("debug", msg, opts),
  info:  (msg: string, opts?: LogOptions) => log("info", msg, opts),
  warn:  (msg: string, opts?: LogOptions) => log("warn", msg, opts),
  error: (msg: string, opts?: LogOptions) => log("error", msg, opts),
  config: DEBUG_CONFIG,
};
```

**Acceptance criteria:**

* I can import `logger` anywhere and call `logger.debug("message", { channel: "INPUT", data: {...} })`.
* If we set `logger.config.channels.INPUT = false`, those logs stop appearing.

---

### Task 2 – Instrument raw browser input

In the **entry point** where we create the Phaser game, add a raw `window` key listener using the logger:

```ts
import { logger } from "./utils/logger";

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
```

**Acceptance criteria:**

* When I press any key with the game open in the browser, I see a log like:

  ```text
  [INPUT] Browser keydown { code: "ArrowLeft", key: "ArrowLeft", repeat: false }
  ```

---

### Task 3 – Instrument Phaser keyboard input in `MainScene`

In `MainScene` (or equivalent), inside `create()` or `setupControls()` where we configure input, add a Phaser keyboard listener:

```ts
import { logger } from "../utils/logger";
import { GamePhase } from "../core/GamePhase"; // adjust import as needed

// inside create() or setupControls()
this.input.keyboard!.on("keydown", (event: KeyboardEvent) => {
  logger.debug("Phaser keydown", {
    channel: "PHASER",
    data: { code: event.code, key: event.key },
  });

  const currentPhase = this.phaseManager.getCurrentPhase();

  if (currentPhase === GamePhase.BUILD) {
    logger.debug("Keydown in BUILD phase", {
      channel: "BUILD",
      data: { code: event.code },
    });

    // (no need to wire full movement yet if that’s out of scope,
    //  just make sure we can see the event get this far)
  }
});
```

**Acceptance criteria:**

With DevTools console open:

* Press ArrowLeft (or any key) → see both:

  * `[INPUT] Browser keydown ...`
  * `[PHASER] Phaser keydown ...`
* When in BUILD phase, I also see:

  * `[BUILD] Keydown in BUILD phase { code: "ArrowLeft" }`

---

If you can get these three tasks in place, I’ll have a clear, layered view of input: browser → Phaser → scene/phase, and we can then extend logging deeper into the systems and rendering once we verify this chain.
