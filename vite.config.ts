import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

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
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
