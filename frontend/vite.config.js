import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy all API calls to the Flask backend — avoids CORS entirely
    proxy: {
      "/problems":  { target: "http://localhost:5000", changeOrigin: true },
      "/analytics": { target: "http://localhost:5000", changeOrigin: true },
      "/auth":      { target: "http://localhost:5000", changeOrigin: true },
      "/roadmap":   { target: "http://localhost:5000", changeOrigin: true },
      "/social":    { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});

