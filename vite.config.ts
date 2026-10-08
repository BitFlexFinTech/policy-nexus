import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    // ONE DEV PORT PER PROJECT (global rule `unique-dev-port-per-project.md`). This project OWNS 5180, so
    // two `npm run dev` servers never collide and one project's page can never appear at another's
    // address. `strictPort` makes the server STOP with a clear message instead of silently sliding to a
    // port another project expects.
    port: 5180,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
