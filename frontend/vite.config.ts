import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import runtimeEnv from "vite-plugin-runtime-env";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runtimeEnv()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
