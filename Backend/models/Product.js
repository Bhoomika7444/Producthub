// models/Product.js
// WHY THIS FILE EXISTS:
//   A Mongoose "model" is the blueprint for every product document
//   stored in MongoDB. It defines what fields exist, their data types,
//   and any validation rules.
//
// HOW IT CONNECTS:
//   The controller imports this model to read/write products in the DB.

const mongoose = require("mongoose");

// A "Schema" describes the shape of each document in the collection.
const productSchema = new mongoose.Schema(
  {
    // Product name — e.g. "Wireless Mouse", "Running Shoes"
    name: {
      type: String,
      required: true, // MongoDB will reject a document without a name
    },

    // Category — e.g. "Electronics", "Clothing", "Books"
    category: {
      type: String,
      required: true,
    },

    // Price in rupees/dollars — stored as a decimal number
    price: {
      type: Number,
      required: true,
    },
  },
  {
    // { timestamps: true } tells Mongoose to automatically add
    // two fields to every document:
    //   createdAt — set once when the document is first saved
    //   updatedAt — updated every time the document is saved
    // This saves us from writing that logic ourselves.
    timestamps: true,
  }
);

// INDEX — this is important for performance!
// We sort products by createdAt (newest first) in almost every query.
// Without an index, MongoDB scans ALL 200,000 documents every time.
// With this index, it jumps straight to the right documents.
// The -1 means "descending" (newest first).
productSchema.index({ createdAt: -1 });

// Compound index: speeds up queries that filter by category AND sort by date.
// E.g. "give me all Electronics, newest first" uses this index.
productSchema.index({ category: 1, createdAt: -1 });

// mongoose.model() creates a Model class called "Product".
// Mongoose automatically looks for a collection called "products" (lowercase plural).
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
