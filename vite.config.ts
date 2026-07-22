import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)([\\/]|$)/,
            },
            {
              name: "vendor-recharts",
              test: /node_modules[\\/](recharts|victory|d3-|internmap|delaunator|robust-predicates)/,
            },
            {
              name: "vendor-supabase",
              test: /node_modules[\\/]@supabase/,
            },
            {
              name: "vendor-icons",
              test: /node_modules[\\/]@phosphor-icons/,
            },
          ],
        },
      },
    },
  },
});
