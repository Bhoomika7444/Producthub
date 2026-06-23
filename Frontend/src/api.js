// src/api.js
// WHY THIS FILE EXISTS:
//   We keep all API calls in one place so that if the backend URL
//   ever changes, we only update it here — not in every component.
//   This is called "separation of concerns".
//
// HOW IT CONNECTS:
//   App.jsx imports fetchProducts and fetchCategories from this file.
//
// ABOUT AXIOS:
//   axios is like fetch() but easier to use. It automatically:
//   - Parses JSON responses
//   - Throws errors for non-200 responses
//   - Sets Content-Type headers

import axios from "axios";

// The base URL comes from our .env file.
// In development: /api  →  Vite proxies to http://localhost:5000/api
// In production: https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

// ─── fetchProducts ────────────────────────────────────────────────────────────
// Calls: GET /api/products
// Params:
//   category  (string)  — filter by category, empty string means "all"
//   cursor    (string)  — ISO date string for next page; null means first page
//   limit     (number)  — how many products per page
//
// Returns: { data, nextCursor, count }

export async function fetchProducts({ category = "", cursor = null, limit = 20 } = {}) {
  // Build the query parameters object
  // We only add a parameter if it has a value
  const params = { limit };

  if (category) {
    params.category = category;
  }

  if (cursor) {
    params.cursor = cursor;
  }

  // axios.get() sends a GET request and returns a promise.
  // The { params } option automatically builds the query string:
  //   ?limit=20&category=Electronics&cursor=2024-01-15T...
  const response = await axios.get(`${BASE_URL}/products`, { params });

  // axios puts the actual response body in response.data
  return response.data;
}

// ─── fetchCategories ──────────────────────────────────────────────────────────
// Calls: GET /api/products/categories
// Returns: { data: ["Electronics", "Clothing", ...] }

export async function fetchCategories() {
  const response = await axios.get(`${BASE_URL}/products/categories`);
  return response.data;
}
