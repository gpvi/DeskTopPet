import net from "node:net";
import process from "node:process";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEFAULT_PORT = Number.parseInt(process.env.TAURI_DEV_PORT ?? "10000", 10);
const MAX_PORT = Number.parseInt(process.env.TAURI_DEV_PORT_MAX ?? "10100", 10);
const WINDOWS_TARGETS = [
  "x86_64-pc-windows-msvc",
  "x86_64-pc-windows-gnu",
];

function canUsePort(port) {
  return new Promise((resolve) => {
    const probeClient = net.createConnection({ port, host: "::1" });
    probeClient.once("connect", () => {
      probeClient.destroy();
      resolve(false);
    });
    probeClient.once("error", () => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close(() => resolve(true));
      });
      server.listen({ port, host: "0.0.0.0", exclusive: true });
    });
  });
}

async function selectPort() {
  for (let port = DEFAULT_PORT; port <= MAX_PORT; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }
  throw new Error(`No available dev port in range ${DEFAULT_PORT}-${MAX_PORT}`);
}

function runTauriDev(port) {
  const hmrPort = port + 1;
  const tauriArgs = process.argv.slice(2);
  const hasExplicitTarget = tauriArgs.some((arg, index, args) => {
    if (arg === "--target" || arg === "-t") {
      return typeof args[index + 1] === "string" && args[index + 1].length > 0;
    }
    return arg.startsWith("--target=");
  });
  const defaultWindowsTarget =
    process.platform === "win32" &&
    !hasExplicitTarget &&
    !process.env.CARGO_BUILD_TARGET
      ? resolveWindowsTarget()
      : null;
  const resolvedTauriArgs = defaultWindowsTarget
    ? ["--target", defaultWindowsTarget, ...tauriArgs]
    : tauriArgs;

  if (defaultWindowsTarget) {
    console.warn(
      `[T039] No explicit target detected; defaulting to ${defaultWindowsTarget} for tauri dev.`,
    );
  }
  const overrideConfig = {
    build: {
      devUrl: `http://localhost:${port}`,
      beforeDevCommand: `npm run dev -- --port ${port} --strictPort`,
    },
  };
  const configDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "desktop-pet-tauri-dev-"),
  );
  const configFilePath = path.join(configDirectory, "tauri.dev.override.json");
  fs.writeFileSync(configFilePath, JSON.stringify(overrideConfig), "utf8");
  const npxExecutable = process.platform === "win32" ? "npx.cmd" : "npx";

  const child = spawn(
    npxExecutable,
    ["tauri", "dev", "--config", configFilePath, ...resolvedTauriArgs],
    {
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        TAURI_DEV_PORT: String(port),
        TAURI_DEV_HMR_PORT: String(hmrPort),
      },
    },
  );

  child.on("error", () => {
    fs.rmSync(configDirectory, { recursive: true, force: true });
  });

  child.on("exit", (code) => {
    fs.rmSync(configDirectory, { recursive: true, force: true });
    process.exit(code ?? 1);
  });
}

function resolveWindowsTarget() {
  if (process.env.TAURI_DEV_TARGET) {
    return process.env.TAURI_DEV_TARGET;
  }

  const installedTargets = getInstalledRustTargets();
  for (const target of WINDOWS_TARGETS) {
    if (installedTargets.has(target)) {
      return target;
    }
  }

  return WINDOWS_TARGETS[0];
}

function getInstalledRustTargets() {
  try {
    const output = execFileSync("rustup", ["target", "list", "--installed"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

async function main() {
  const selectedPort = await selectPort();
  if (selectedPort !== DEFAULT_PORT) {
    console.warn(
      `[T039] Port ${DEFAULT_PORT} is in use; fallback to port ${selectedPort}.`,
    );
  }
  runTauriDev(selectedPort);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[T039] Failed to start tauri dev: ${message}`);
  process.exit(1);
});
