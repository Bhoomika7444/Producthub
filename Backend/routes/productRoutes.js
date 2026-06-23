// routes/productRoutes.js
// WHY THIS FILE EXISTS:
//   Routes are like a table of contents for our API.
//   They map URLs (endpoints) to the right controller function.
//   Keeping routes separate from controllers keeps each file focused.
//
// HOW IT CONNECTS:
//   server.js imports this router and "mounts" it at /api/products.
//   The controller functions are imported from productController.js.

const express = require("express");

// express.Router() creates a mini-app that handles a group of related routes.
const router = express.Router();

const { getProducts, getCategories } = require("../controllers/productController");

// GET /api/products/categories
// Must be defined BEFORE GET /api/products/:id style routes (if any),
// otherwise Express might treat "categories" as a product ID.
router.get("/categories", getCategories);

// GET /api/products
// Supports optional query params: ?category=X  ?cursor=DATE  ?limit=N
router.get("/", getProducts);

module.exports = router;
