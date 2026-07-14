import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/admin",
  plugins: [react()],
  server: {
    port: 4173
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT) || 8080,
    allowedHosts: true
  }
});
