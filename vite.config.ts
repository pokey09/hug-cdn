import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8082,
    hmr: {
      overlay: false,
    },
    allowedHosts: true as const,
    proxy: {
      '/api': 'http://localhost:3001',
      '/cdn': 'http://localhost:3001',
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));