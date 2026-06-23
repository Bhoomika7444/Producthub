// src/components/ProductCard.jsx
// WHY THIS FILE EXISTS:
//   A "component" is a reusable piece of UI. The ProductCard component
//   displays one product's details. We reuse it for every product in the grid.
//
// HOW IT CONNECTS:
//   App.jsx maps over the products array and renders one <ProductCard> per product.
//   It passes the product object as a "prop" (short for property).
//
// WHAT IS A PROP?
//   Props are how a parent component passes data to a child component.
//   Like a function parameter: <ProductCard product={item} /> passes item as product.

import React from "react";

// Helper function to format the price nicely
// Example: 2499.5 → "₹2,499.50"
function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

// Helper function to format the date nicely
// Example: "2024-01-15T10:30:00.000Z" → "Jan 15, 2024"
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ProductCard is a functional component (just a function that returns JSX).
// { product } is "destructuring" — it's the same as writing (props) then using props.product.
function ProductCard({ product }) {
  return (
    <div className="product-card">
      {/* Category badge */}
      <span className="product-category">{product.category}</span>

      {/* Product name */}
      <h3 className="product-name">{product.name}</h3>

      {/* Footer: price on left, date on right */}
      <div className="product-footer">
        <span className="product-price">{formatPrice(product.price)}</span>
        <span className="product-date">
          {formatDate(product.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default ProductCard;
