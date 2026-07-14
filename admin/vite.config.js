import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT) || 8080,
    // Allow all hosts so Railway's healthcheck and custom domain both work.
    // This is an internal admin panel so host-header restriction adds no value.
    allowedHosts: "all"
  }
});
