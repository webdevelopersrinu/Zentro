import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        /**
         * Vendor code changes rarely; splitting it keeps it cached across
         * deploys. Rolldown (Vite 8) requires the function form.
         */
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
          if (id.includes("@tanstack") || id.includes("axios")) return "data";
          if (id.includes("socket.io") || id.includes("engine.io")) return "realtime";
          return "vendor";
        },
      },
    },
  },

  test: {
    environment: "jsdom",
    globals: true,

    /**
     * Tests are centralised in tests/, mirroring src/, so the layout matches the
     * backend (tests/unit, tests/integration, e2e). src/ contains only source.
     */
    include: ["tests/**/*.test.{js,jsx}"],
    setupFiles: ["./tests/setup.js"],

    /**
     * Process CSS Modules only. Without this, `styles.button` is `undefined` in
     * tests and every className silently collapses to "" — hiding real bugs.
     * `non-scoped` keeps the readable name (`button`, not `_button_x7f2a`).
     * Plain CSS is still skipped: tests assert behaviour, not paint.
     */
    css: {
      include: [/\.module\.css$/],
      modules: { classNameStrategy: "non-scoped" },
    },

    coverage: {
      provider: "v8",
      reporter: ["text-summary", "lcov"],
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/main.jsx"],
    },
  },
});
