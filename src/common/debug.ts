const debugFilePath = "/tmp/freelens-credential-explorer-debug.log";

function appendToFile(line: string): void {
  try {
    if (typeof require !== "function") {
      return;
    }

    const fs = require("node:fs") as typeof import("node:fs");
    fs.appendFileSync(debugFilePath, `${line}\n`, "utf8");
  } catch {
    // Best-effort debug logging only.
  }
}

export function debugLog(scope: string, message: string, data?: unknown): void {
  const payload = data === undefined ? "" : ` ${JSON.stringify(data)}`;
  const line = `[${new Date().toISOString()}] [credential-explorer:${scope}] ${message}${payload}`;

  console.info(line);
  appendToFile(line);
}

export function getDebugFilePath(): string {
  return debugFilePath;
}
