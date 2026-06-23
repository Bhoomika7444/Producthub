// vite.config.js
// WHY THIS FILE EXISTS:
//   Vite is the build tool that runs our React app in development.
//   This config tells Vite to use the React plugin so JSX works,
//   and sets up a proxy so we don't have CORS issues during development.
//
// PROXY EXPLAINED:
//   When React (on port 5173) calls /api/products, Vite forwards
//   that request to our Express backend (on port 5000) automatically.
//   This means we can write just "/api/products" in our code instead
//   of "http://localhost:5000/api/products".

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    // The proxy forwards API calls from the React dev server to our backend.
    // This only works in development. In production, set the full URL in .env.
    proxy: {
      "/api": {
        target: "http://localhost:5000", // our Express backend address
        changeOrigin: true,
      },
    },
  },
});
