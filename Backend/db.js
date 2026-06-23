// db.js
// WHY THIS FILE EXISTS:
//   We keep the database connection code in its own file so that
//   server.js stays clean. If we ever switch databases, we only
//   change this one file.
//
// HOW IT CONNECTS:
//   server.js imports and calls connectDB() before starting the server.

const mongoose = require("mongoose");

// connectDB is an async function because connecting to MongoDB takes time.
// We use async/await instead of callbacks so the code reads top-to-bottom.
async function connectDB() {
  try {
    // mongoose.connect() returns a promise — we await it so we know
    // the connection succeeded before the server starts accepting requests.
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    // If connection fails, log the error and exit the process.
    // There is no point running the server without a database.
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // exit code 1 means "something went wrong"
  }
}

module.exports = connectDB;
