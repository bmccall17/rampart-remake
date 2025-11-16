export type LogLevel = "info" | "warn" | "error" | "event";

export interface LogEventPayload {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
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

  private log(level: LogLevel, message: string, payload?: LogEventPayload) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      payload,
    };

    // Store in session logs
    this.sessionLogs.push(entry);

    // Console output with context
    const prefix = `[${this.context}]`;
    const formattedMessage = payload
      ? `${prefix} ${message} ${JSON.stringify(payload)}`
      : `${prefix} ${message}`;

    switch (level) {
      case "info":
        console.log(formattedMessage);
        break;
      case "warn":
        console.warn(formattedMessage);
        break;
      case "error":
        console.error(formattedMessage);
        break;
      case "event":
        console.log(`📊 ${formattedMessage}`);
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

  info(message: string, payload?: LogEventPayload) {
    this.log("info", message, payload);
  }

  warn(message: string, payload?: LogEventPayload) {
    this.log("warn", message, payload);
  }

  error(message: string, payload?: LogEventPayload) {
    this.log("error", message, payload);
  }

  event(name: string, payload?: LogEventPayload) {
    this.log("event", name, payload);
  }

  getSessionLogs(): LogEntry[] {
    return [...this.sessionLogs];
  }

  clearSessionLogs() {
    this.sessionLogs = [];
  }
}

// Global logger instance
export const createLogger = (context: string, enableServerLogging = false) =>
  new Logger(context, enableServerLogging);
