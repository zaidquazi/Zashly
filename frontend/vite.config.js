import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["localtest.me"],
    proxy: {
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5002",
        ws: true,
      },
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (
            id.includes("stream-chat") ||
            id.includes("@stream-io") ||
            id.includes("stream-chat-react")
          ) {
            return "stream";
          }
          if (id.includes("three")) return "three";
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@tanstack")) return "query";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/")
          ) {
            return "react-vendor";
          }
          return "vendor";
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});

