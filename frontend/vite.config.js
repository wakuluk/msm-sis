import process from "node:process";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiProxyTarget = process.env.VITE_PROXY_TARGET || "http://msm-sis-api:8080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/opensis": {
        target: process.env.VITE_OPENSIS_TARGET,
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/opensis/, ""),
      },
    },
  },
});
