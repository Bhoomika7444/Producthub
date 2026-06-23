// src/App.jsx
// WHY THIS FILE EXISTS:
//   App.jsx is the main component — the "brain" of the frontend.
//   It manages all state (data, filters, loading, errors) and
//   coordinates the other components.
//
// HOW IT CONNECTS:
//   main.jsx renders <App /> into the HTML page.
//   App.jsx uses api.js to fetch data and renders ProductCard for each product.
//
// STATE EXPLAINED:
//   State is React's way of storing data that can change.
//   When state changes, React automatically re-renders the component.
//   We use useState() to create state variables.
//
// EFFECT EXPLAINED:
//   useEffect() runs code "after render". We use it to fetch data from
//   the backend whenever the selected category or search term changes.

import React, { useState, useEffect } from "react";
import { fetchProducts, fetchCategories } from "./api";
import ProductCard from "./components/ProductCard";

function App() {
  // ─── STATE VARIABLES ──────────────────────────────────────────────────────
  // products: the list of products currently shown on screen
  const [products, setProducts] = useState([]);

  // categories: list of all category names for the dropdown
  const [categories, setCategories] = useState([]);

  // selectedCategory: which category the user picked ("" = All)
  const [selectedCategory, setSelectedCategory] = useState("");

  // searchTerm: what the user typed in the search box
  const [searchTerm, setSearchTerm] = useState("");

  // nextCursor: the cursor value for fetching the NEXT page
  // null means we're on the first page OR there are no more pages
  const [nextCursor, setNextCursor] = useState(null);

  // loading: true while waiting for API response (shows spinner)
  const [loading, setLoading] = useState(false);

  // loadingMore: true specifically when "Load More" is clicked
  // We separate this from 'loading' so we don't hide existing products
  const [loadingMore, setLoadingMore] = useState(false);

  // error: stores error message if API call fails
  const [error, setError] = useState(null);

  // hasMore: true if there are more products to load
  const [hasMore, setHasMore] = useState(true);

  // ─── FETCH CATEGORIES ON FIRST LOAD ───────────────────────────────────────
  // The empty [] dependency array means "run this only once when App mounts"
  // "mount" = when React first puts this component on the screen
  useEffect(() => {
    async function loadCategories() {
      try {
        const result = await fetchCategories();
        // Sort categories alphabetically for a nicer dropdown
        setCategories(result.data.sort());
      } catch (err) {
        console.error("Could not load categories:", err.message);
        // Categories failing is not critical — the app still works without them
      }
    }

    loadCategories();
  }, []); // [] = run once on mount

  // ─── FETCH PRODUCTS WHEN FILTERS CHANGE ───────────────────────────────────
  // This effect runs whenever selectedCategory changes.
  // When a new category is selected:
  //   1. Clear all existing products
  //   2. Reset the cursor back to null (start from the beginning)
  //   3. Fetch the first page of the new category
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      setProducts([]); // clear old products
      setNextCursor(null);
      setHasMore(true);

      try {
        const result = await fetchProducts({
          category: selectedCategory,
          cursor: null, // always start from the first page
          limit: 20,
        });

        setProducts(result.data);
        setNextCursor(result.nextCursor);

        // If nextCursor is null, there are no more pages
        setHasMore(result.nextCursor !== null);
      } catch (err) {
        setError("Failed to load products. Please check if the backend is running.");
        console.error("Error loading products:", err.message);
      } finally {
        // 'finally' always runs, whether the try succeeded or failed
        setLoading(false);
      }
    }

    loadProducts();
  }, [selectedCategory]); // re-run whenever selectedCategory changes

  // ─── LOAD MORE FUNCTION ────────────────────────────────────────────────────
  // Called when the user clicks the "Load More" button.
  // Fetches the NEXT page using the current cursor value and
  // APPENDS the new products to the existing list (doesn't replace them).
  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const result = await fetchProducts({
        category: selectedCategory,
        cursor: nextCursor, // send the cursor we saved from the previous response
        limit: 20,
      });

      // Use the spread operator to add new products to the existing list
      // [...products, ...result.data] = combine old + new into one array
      setProducts((prevProducts) => [...prevProducts, ...result.data]);
      setNextCursor(result.nextCursor);
      setHasMore(result.nextCursor !== null);
    } catch (err) {
      setError("Failed to load more products. Please try again.");
      console.error("Error loading more:", err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  // ─── HANDLE CATEGORY CHANGE ───────────────────────────────────────────────
  // When user picks a category, reset search and update state.
  // The useEffect above will automatically re-fetch products.
  function handleCategoryChange(event) {
    setSelectedCategory(event.target.value);
    setSearchTerm(""); // clear search when category changes
  }

  // ─── CLIENT-SIDE SEARCH FILTER ────────────────────────────────────────────
  // We filter the already-fetched products in the browser.
  // This is simple and fast for searching within the current page.
  // For a full-text search across ALL 200k products, you'd add a backend search endpoint.
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true; // no search = show all
    return product.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // ─── RENDER ───────────────────────────────────────────────────────────────
  // JSX looks like HTML but it's actually JavaScript.
  // Inside {}, we can write JavaScript expressions.
  return (
    <div>
      {/* ── Header ── */}
      <header className="header">
        <h1>🛍️ ProductHub</h1>
        <p>Browse 200,000+ products — powered by CodeVector</p>
      </header>

      {/* ── Controls: Search + Category filter ── */}
      <div className="controls">
        {/* Search box — uses onChange to update searchTerm state */}
        <input
          type="text"
          className="search-input"
          placeholder="Search products by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Category dropdown */}
        <select
          className="category-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">All Categories</option>
          {/* Map over the categories array to create an <option> for each */}
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Show how many products are visible */}
        {!loading && (
          <span className="result-count">
            Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            {selectedCategory && ` in "${selectedCategory}"`}
          </span>
        )}
      </div>

      {/* ── Main content area ── */}
      <main className="main">

        {/* Loading spinner — shown when fetching the first page */}
        {loading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-box">
            <p>⚠️ {error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                // Retry: change category to same value to trigger useEffect
                setSelectedCategory((prev) => prev);
                setError(null);
              }}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state — no products found */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="empty-state">
            <h3>No products found</h3>
            <p>
              {searchTerm
                ? `No products match "${searchTerm}"`
                : "No products in this category"}
            </p>
          </div>
        )}

        {/* Product grid — shown once products are loaded */}
        {!loading && filteredProducts.length > 0 && (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              // key is required by React to efficiently update the list
              // We use product._id because MongoDB IDs are always unique
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Load More button — only shown if more pages exist */}
        {!loading && hasMore && filteredProducts.length > 0 && !searchTerm && (
          <div className="load-more-container">
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More Products"}
            </button>
          </div>
        )}

        {/* End of results message */}
        {!loading && !hasMore && products.length > 0 && (
          <p style={{ textAlign: "center", color: "#a0aec0", marginTop: "32px" }}>
            ✅ You've seen all products in this category ({products.length} total)
          </p>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>Built with React + Express + MongoDB · CodeVector Internship Task</p>
      </footer>
    </div>
  );
}

export default App;
