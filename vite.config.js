import { defineConfig } from "vite";

// React islands (src/islands.jsx) use the automatic JSX runtime — no plugin required.
export default defineConfig({
  esbuild: { jsx: "automatic" },
  build: { chunkSizeWarningLimit: 900 }
});
