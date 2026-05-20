import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "classic",
    }),
  ],

  resolve: {
    alias: {
      components: fileURLToPath(new URL("./src/components", import.meta.url)),
      api: fileURLToPath(new URL("./src/api", import.meta.url)),
      store: fileURLToPath(new URL("./src/store", import.meta.url)),
      context: fileURLToPath(new URL("./src/context", import.meta.url)),
      hooks: fileURLToPath(new URL("./src/hooks", import.meta.url)),
      utils: fileURLToPath(new URL("./src/utils", import.meta.url)),
      i18n: fileURLToPath(new URL("./src/i18n", import.meta.url)),
    },
  },

  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
