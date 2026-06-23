// server.js
// WHY THIS FILE EXISTS:
//   This is the entry point — the first file Node.js runs.
//   It sets up Express, connects middleware, registers routes,
//   and starts listening for incoming HTTP requests.
//
// HOW IT CONNECTS:
//   → Calls db.js to connect to MongoDB
//   → Registers routes from routes/productRoutes.js
//   → All product requests flow through here first

// Load environment variables from .env file into process.env
// Must be the FIRST line so all other files can access process.env.MONGO_URI etc.
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const productRoutes = require("./routes/productRoutes");

// Create the Express application
const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
// Middleware runs on EVERY request before it reaches our route handlers.

// cors() allows frontend apps (running on a different port/domain) to call our API.
// Without this, browsers block cross-origin requests for security reasons.
app.use(cors());

// express.json() reads the request body and parses JSON automatically.
// Without this, req.body would be undefined for POST/PUT requests.
app.use(express.json());

// ─── ROUTES ───────────────────────────────────────────────────────────────────
// Any request starting with /api/products is handled by productRoutes.
// Example: GET /api/products → productRoutes handles it
app.use("/api/products", productRoutes);

// ─── ROOT ROUTE ───────────────────────────────────────────────────────────────
// A simple health-check so we know the server is running when we open the URL.
app.get("/", (req, res) => {
  res.json({ message: "CodeVector Product API is running 🚀" });
});

// ─── 404 HANDLER ──────────────────────────────────────────────────────────────
// If no route matched, send a clean 404 JSON response.
// This runs only if none of the routes above matched.
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ─── START SERVER ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// Connect to the database FIRST, then start listening.
// We don't want to accept requests if the DB isn't ready.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
