// OfferLens SPA — Vite + Preact
// TailwindCSS v4 CSS pre-compiled via CLI (no Vite plugin to avoid native binding issues in Docker)
import { defineConfig } from "npm:vite@^6"
import preact from "npm:@preact/preset-vite@^2"

export default defineConfig({
  plugins: [preact()],
  root: "apps/web",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
})
