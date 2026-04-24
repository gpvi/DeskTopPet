import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const devPort = Number.parseInt(process.env.TAURI_DEV_PORT ?? "1420", 10);
const hmrPort = Number.parseInt(process.env.TAURI_DEV_HMR_PORT ?? String(devPort + 1), 10);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("lottie-react") || id.includes("lottie-web")) {
            return "vendor-lottie";
          }
          if (id.includes("sql.js")) {
            return "vendor-sqljs";
          }
          if (id.includes("/openai/") || id.includes("\\openai\\")) {
            return "vendor-openai";
          }
          if (
            id.includes("/react/") ||
            id.includes("\\react\\") ||
            id.includes("react-dom")
          ) {
            return "vendor-react";
          }

          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  clearScreen: false,
  server: {
    port: devPort,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: hmrPort,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
