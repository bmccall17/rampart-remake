export type LogLevel = "debug" | "info" | "warn" | "error" | "event";

export interface LogEventPayload {
  [key: string]: unknown;
}

export interface LogOptions {
  channel?: string;
  data?: unknown;
}

// Debug configuration for channel filtering
const DEBUG_CONFIG = {
  enabled: true,
  channels: {
    INPUT: true,
    PHASER: true,
    BUILD: true,
    GENERAL: true,
  } as Record<string, boolean>,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  channel?: string;
  message: string;
  payload?: LogEventPayload;
}

export class Logger {
  private context: string;
  private sessionLogs: LogEntry[] = [];
  private enableServerLogging: boolean;

  constructor(context: string, enableServerLogging: boolean = false) {
    this.context = context;
    this.enableServerLogging = enableServerLogging;
  }

  private log(level: LogLevel, message: string, options: LogOptions = {}) {
    if (!DEBUG_CONFIG.enabled) return;

    const channel = options.channel ?? this.context;
    if (DEBUG_CONFIG.channels[channel] === false) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      channel,
      message,
      payload: options.data as LogEventPayload,
    };

    // Store in session logs
    this.sessionLogs.push(entry);

    // Console output with channel
    const prefix = `[${channel}]`;
    const formattedMessage = options.data
      ? `${prefix} ${message}`
      : `${prefix} ${message}`;

    switch (level) {
      case "debug":
        console.debug(formattedMessage, options.data ?? "");
        break;
      case "info":
        console.info(formattedMessage, options.data ?? "");
        break;
      case "warn":
        console.warn(formattedMessage, options.data ?? "");
        break;
      case "error":
        console.error(formattedMessage, options.data ?? "");
        break;
      case "event":
        console.log(`📊 ${formattedMessage}`, options.data ?? "");
        break;
    }

    // Send to server if enabled
    if (this.enableServerLogging && typeof window !== "undefined") {
      this.sendToServer(entry);
    }
  }

  private async sendToServer(entry: LogEntry) {
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error("Failed to send log to server:", error);
    }
  }

  debug(message: string, options?: LogOptions) {
    this.log("debug", message, options);
  }

  info(message: string, options?: LogOptions) {
    this.log("info", message, options);
  }

  warn(message: string, options?: LogOptions) {
    this.log("warn", message, options);
  }

  error(message: string, options?: LogOptions) {
    this.log("error", message, options);
  }

  event(name: string, options?: LogOptions) {
    this.log("event", name, options);
  }

  getSessionLogs(): LogEntry[] {
    return [...this.sessionLogs];
  }

  clearSessionLogs() {
    this.sessionLogs = [];
  }
}

// Global logger instance matching the spec
const defaultLogger = new Logger("GENERAL", false);

export const logger = {
  debug: (msg: string, opts?: LogOptions) => defaultLogger.debug(msg, opts),
  info: (msg: string, opts?: LogOptions) => defaultLogger.info(msg, opts),
  warn: (msg: string, opts?: LogOptions) => defaultLogger.warn(msg, opts),
  error: (msg: string, opts?: LogOptions) => defaultLogger.error(msg, opts),
  config: DEBUG_CONFIG,
};

// Factory function for creating context-specific loggers
export const createLogger = (context: string, enableServerLogging = false) =>
  new Logger(context, enableServerLogging);
