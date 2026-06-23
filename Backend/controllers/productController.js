// controllers/productController.js
// WHY THIS FILE EXISTS:
//   The controller holds the actual business logic — what to do when
//   a request comes in. We separate this from routes so that each file
//   has one clear job: routes decide "which URL triggers what", and
//   controllers decide "what actually happens".
//
// HOW IT CONNECTS:
//   productRoutes.js imports these functions and maps them to URLs.

const Product = require("../models/Product");

// ─────────────────────────────────────────────────────────────────────────────
// UNDERSTANDING CURSOR-BASED PAGINATION
// ─────────────────────────────────────────────────────────────────────────────
//
// Problem with OFFSET pagination (the naive approach):
//   Page 1 = SKIP 0,  LIMIT 20   ← fast
//   Page 2 = SKIP 20, LIMIT 20   ← fast
//   Page 500 = SKIP 10000, LIMIT 20  ← MongoDB scans 10,020 rows! Very slow.
//   Also: if new products are inserted while you browse, items shift and
//   you'll see duplicates or miss products.
//
// Solution — Cursor-based pagination:
//   A "cursor" is just the createdAt timestamp of the LAST product you saw.
//   Next page = "give me products where createdAt < cursor, newest first"
//   MongoDB can use the index to jump directly there — always O(log n) fast.
//   And because we anchor on a real timestamp, new inserts don't shift results.
//
// ─────────────────────────────────────────────────────────────────────────────

// getProducts — handles GET /api/products
// Query params the client can send:
//   ?category=Electronics   → filter by category
//   ?cursor=<ISO date>      → fetch products older than this date (next page)
//   ?limit=20               → how many products per page (default 20)
async function getProducts(req, res) {
  try {
    // --- Read query parameters from the URL ---
    const { category, cursor, limit } = req.query;

    // Convert limit to a number. Default to 20 if not provided.
    // Math.min caps it at 100 so clients can't ask for 10,000 at once.
    const pageSize = Math.min(parseInt(limit) || 20, 100);

    // --- Build the filter object for MongoDB ---
    // We start with an empty filter (match everything).
    const filter = {};

    // If the client sent ?category=Electronics, add it to the filter.
    if (category) {
      filter.category = category;
    }

    // If the client sent a cursor, add a condition:
    // "only return products created BEFORE this timestamp"
    // This is what makes pagination work without SKIP.
    if (cursor) {
      // The cursor is an ISO date string like "2024-01-15T10:30:00.000Z"
      // We convert it to a Date object so MongoDB can compare it.
      filter.createdAt = { $lt: new Date(cursor) };
    }

    // --- Query the database ---
    // .find(filter)    → apply our filters
    // .sort(...)       → newest first; -1 = descending
    // .limit(pageSize) → only fetch this many documents
    // .lean()          → returns plain JS objects instead of Mongoose objects
    //                    (faster, uses less memory — good for read-only data)
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .lean();

    // --- Build the next cursor ---
    // If we got a full page of results, there might be more products.
    // The next cursor is the createdAt of the LAST product in this batch.
    // The client sends this cursor back to get the next page.
    let nextCursor = null;
    if (products.length === pageSize) {
      const lastProduct = products[products.length - 1];
      nextCursor = lastProduct.createdAt;
    }
    // If products.length < pageSize, we've reached the last page.
    // nextCursor stays null, telling the client there are no more pages.

    // --- Send the response ---
    res.json({
      success: true,
      count: products.length,    // how many products in THIS response
      nextCursor: nextCursor,    // send this as ?cursor= in the next request
      data: products,            // the actual product list
    });
  } catch (error) {
    console.error("Error in getProducts:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
}


// getCategories — handles GET /api/products/categories
// Returns a list of all unique category values in the database.
// Useful for building filter dropdowns in a frontend UI.
async function getCategories(req, res) {
  try {
    // .distinct("category") asks MongoDB:
    // "Give me one of each unique value in the category field"
    // This is much simpler than GROUP BY in SQL.
    const categories = await Product.distinct("category");

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error("Error in getCategories:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
    });
  }
}


module.exports = { getProducts, getCategories };
