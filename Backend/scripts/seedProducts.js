// scripts/seedProducts.js
// WHY THIS FILE EXISTS:
//   Before we can test pagination or filtering, we need data.
//   This script generates and inserts 200,000 fake products into MongoDB.
//   It is run ONCE manually (npm run seed) and never again in production.
//
// HOW IT CONNECTS:
//   → Reads MONGO_URI from .env
//   → Connects directly to MongoDB via Mongoose
//   → Uses the Product model to insert documents
//   → Exits when done (process.exit)
//
// WHY BATCH INSERT:
//   Inserting 200,000 documents one-by-one in a loop would take many minutes
//   because each insert is a separate network round-trip to the database.
//   Instead, we build arrays of 5,000 documents and insert each batch in one
//   network call — this is ~40 total calls instead of 200,000.

require("dotenv").config(); // go up one folder to find .env

const mongoose = require("mongoose");
const Product = require("../models/Product");

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const TOTAL_PRODUCTS = 200000; // total documents to create
const BATCH_SIZE = 5000;       // documents per insert call (safe sweet spot)

// Product categories our fake store sells
const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Books",
  "Home & Kitchen",
  "Sports",
  "Toys",
  "Beauty",
  "Automotive",
  "Grocery",
  "Furniture",
];

// Adjectives used to make product names sound more descriptive.
// Example: "Premium Camera", "Lightweight Laptop"
const ADJECTIVES = [
  "Premium", "Budget", "Lightweight", "Heavy-Duty",
  "Portable", "Smart", "Classic", "Deluxe",
  "Eco-Friendly", "Ultra",
];

// CATEGORY_PRODUCTS maps each category to a list of product names
// that actually belong in that category.
// This fixes the mismatch problem where "Clothing" could get "Camera".
//
// HOW IT WORKS:
//   When we generate a product, we first pick a random category,
//   then pick a random product name from THAT category's list.
//   This guarantees the name always matches the category.
const CATEGORY_PRODUCTS = {
  "Electronics":   ["Camera", "Laptop", "Headphones", "Keyboard", "Mouse", "Smart Watch"],
  "Clothing":      ["Shirt", "T-Shirt", "Jeans", "Jacket", "Hoodie", "Shoes"],
  "Books":         ["Novel", "Textbook", "Story Book", "Magazine", "Guide"],
  "Home & Kitchen":["Mixer", "Blender", "Plate Set", "Cookware", "Water Bottle"],
  "Sports":        ["Football", "Cricket Bat", "Tennis Racket", "Yoga Mat", "Dumbbell"],
  "Toys":          ["Toy Car", "Building Blocks", "Puzzle", "Teddy Bear"],
  "Beauty":        ["Face Wash", "Shampoo", "Lipstick", "Moisturizer"],
  "Automotive":    ["Helmet", "Car Cover", "Bike Mirror", "Seat Cover"],
  "Grocery":       ["Rice Pack", "Sugar Pack", "Tea Powder", "Coffee Pack"],
  "Furniture":     ["Chair", "Table", "Sofa", "Wardrobe", "Study Desk"],
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

// Returns a random item from any array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Generates one fake product object (NOT yet saved to DB)
function generateProduct(index) {
  // Step 1: Pick a random category first
  const category = randomItem(CATEGORIES);

  // Step 2: Pick a product name from THAT category's list
  // This guarantees the name always matches the category.
  // Example: category = "Clothing" → noun could be "Jacket" → "Premium Jacket #42"
  const noun = randomItem(CATEGORY_PRODUCTS[category]);

  // Step 3: Add a random adjective and a unique number to make each name distinct
  const name = `${randomItem(ADJECTIVES)} ${noun} #${index + 1}`;
  const price = parseFloat((Math.random() * 9990 + 10).toFixed(2)); // ₹10 to ₹9999

  // Spread createdAt over the past 2 years so we get a realistic date range.
  // This makes the cursor-based pagination more realistic to test.
  const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
  const createdAt = new Date(Date.now() - Math.random() * TWO_YEARS_MS);

  return { name, category, price, createdAt, updatedAt: createdAt };
}

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────
async function seedDatabase() {
  console.log("🌱 Starting seed script...");

  // Connect to MongoDB
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  // Delete all existing products so we start fresh.
  // This is safe for a seed script — never do this in production routes!
  await Product.deleteMany({});
  console.log("🗑️  Cleared existing products");

  // Insert products in batches
  let totalInserted = 0;

  for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
    // Figure out how many products to create in this batch.
    // The last batch might be smaller than BATCH_SIZE.
    const currentBatchSize = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - i);

    // Build an array of product objects (plain JS objects, not Mongoose docs)
    const batch = [];
    for (let j = 0; j < currentBatchSize; j++) {
      batch.push(generateProduct(i + j));
    }

    // insertMany() sends the entire array in ONE database call.
    // { ordered: false } means MongoDB inserts all documents even if some fail.
    // { timestamps: false } because we are setting createdAt/updatedAt manually.
    await Product.insertMany(batch, { ordered: false });

    totalInserted += currentBatchSize;
    console.log(`✅ Inserted ${totalInserted} / ${TOTAL_PRODUCTS} products`);
  }

  console.log(`\n🎉 Seed complete! ${totalInserted} products inserted.`);

  // Always disconnect cleanly after a script finishes
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB");
  process.exit(0);
}

// Run the function and catch any top-level errors
seedDatabase().catch((error) => {
  console.error("❌ Seed script failed:", error.message);
  process.exit(1);
});
