# CodeVector Internship — Product Browsing Backend

A simple Node.js + Express + MongoDB backend for browsing ~200,000 products with cursor-based pagination and category filtering.

---

## Folder Structure

```
Backend/
├── server.js                  ← Entry point, starts the Express server
├── db.js                      ← MongoDB connection logic
├── .env                       ← Secret config values (not committed to Git)
├── .gitignore                 ← Tells Git to ignore node_modules and .env
├── package.json               ← Project metadata and dependencies
├── models/
│   └── Product.js             ← Mongoose schema/model for products
├── routes/
│   └── productRoutes.js       ← Maps URLs to controller functions
├── controllers/
│   └── productController.js   ← Business logic (what to do for each request)
└── scripts/
    └── seedProducts.js        ← One-time script to insert 200,000 products
```

---

## Setup Instructions

### 1. Install dependencies
```bash
cd Backend
npm install
```

### 2. Set up the database
Create a free MongoDB cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
Copy the connection string into `.env`:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/codevector
PORT=5000
```

### 3. Seed the database
```bash
npm run seed
```
This inserts 200,000 fake products. Takes about 30–60 seconds.

### 4. Start the server
```bash
npm run dev       # development (auto-restarts on save)
npm start         # production
```

---

## API Endpoints

### GET /api/products
Fetch products, newest first. Supports filtering and pagination.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category (e.g. `Electronics`) |
| `cursor` | ISO date string | Fetch products older than this date |
| `limit` | number | Products per page (default: 20, max: 100) |

**Example — First page:**
```
GET /api/products?limit=20
```

**Example — Filter by category:**
```
GET /api/products?category=Electronics&limit=20
```

**Example — Next page (paste nextCursor from previous response):**
```
GET /api/products?cursor=2024-01-15T10:30:00.000Z&limit=20
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "nextCursor": "2024-01-14T08:22:11.000Z",
  "data": [
    {
      "_id": "...",
      "name": "Premium Watch #1234",
      "category": "Electronics",
      "price": 2499.99,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```
When `nextCursor` is `null`, you have reached the last page.

---

### GET /api/products/categories
Returns all unique category names.

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": ["Electronics", "Clothing", "Books", ...]
}
```

---

## What I chose and why

**Why Node.js + Express?**
Lightweight, easy to set up, and I know it well from college MERN training.

**Why MongoDB?**
MongoDB Atlas has a generous free tier. Mongoose makes schema definition simple.

**Why cursor-based pagination?**
Offset pagination (SKIP + LIMIT) gets slower as you go deeper into the data — MongoDB still has to scan all the skipped documents. With 200,000 products, page 1000 would skip 20,000 rows.

Cursor pagination works by remembering *where you left off* (the createdAt timestamp of the last product you saw) and asking for products older than that. MongoDB uses an index to jump directly there — always fast regardless of page number. It also handles live inserts correctly: new products don't shift existing pages.

**Why batch inserts in the seed script?**
200,000 individual insert calls would each be a separate network trip to the DB — extremely slow. By building arrays of 5,000 and using `insertMany()`, we make only 40 network calls total.

**What I'd improve with more time:**
- Add a `GET /api/products/:id` endpoint to fetch a single product
- Add request validation (e.g. reject negative limit values)
- Add rate limiting to prevent API abuse
- Use `Promise.all()` to run multiple batch inserts in parallel (faster seeding)
- Add a `totalCount` to the response (requires a separate COUNT query)

---

## How I used AI

I used Claude to help structure the comments, verify the cursor pagination logic, and draft this README. I wrote and understood every line of code myself, cross-checking the Mongoose docs for the index syntax and `insertMany` options.

---

## Interview Q&A

### Q: What is cursor-based pagination? How is it different from offset pagination?

**Offset pagination** uses SKIP + LIMIT. To get page 500, MongoDB skips 9,980 documents and returns the next 20. It reads 10,000 documents to give you 20 — very wasteful.

**Cursor pagination** uses a "cursor" — the `createdAt` timestamp of the last product on the current page. The next query says: "give me products where `createdAt < cursor`". MongoDB uses the index and jumps directly to those documents. It's fast no matter which page you're on.

**Bonus point:** If new products are inserted while someone is browsing, offset pagination can show duplicates (items shift). Cursor pagination doesn't have this problem because it anchors on a real timestamp.

---

### Q: Why did you add indexes to the Product schema?

Without indexes, MongoDB does a **collection scan** — it reads every document to find matches. With 200,000 products, that's slow.

- `{ createdAt: -1 }` speeds up the default "newest first" sort
- `{ category: 1, createdAt: -1 }` is a **compound index** that speeds up "filter by category AND sort by date" — the most common query in this API

---

### Q: What does `.lean()` do in Mongoose?

By default, `.find()` returns **Mongoose documents** — objects that have extra methods attached (like `.save()`, `.toObject()`). We don't need those for a read-only GET endpoint.

`.lean()` tells Mongoose to return **plain JavaScript objects** instead. This uses less memory and is faster because Mongoose doesn't have to wrap each result.

---

### Q: Why do you have a separate controller file? Why not just put the logic in the route?

Two reasons:

1. **Single Responsibility** — the route file's only job is mapping URLs to functions. The controller's job is the actual logic. Easier to read and debug.
2. **Testability** — you can test the controller function directly without needing to make an HTTP request.

If I put all the logic inside the route, the route file would become hundreds of lines long.

---

### Q: Explain the seed script. Why batches of 5,000?

`insertMany()` sends an entire array to MongoDB in one network call. If we loop and insert one document at a time, that's 200,000 network round-trips — very slow.

With batches of 5,000 → only 40 network calls. The batch size of 5,000 is a safe choice: large enough to be efficient, small enough to not exceed MongoDB's 16MB document size limit per batch.

---

### Q: What does `process.exit(1)` mean in db.js?

`process.exit()` stops the Node.js process immediately.
- Exit code `0` = success (everything worked)
- Exit code `1` = failure (something went wrong)

We call it in db.js because if the database connection fails, there's no point running the server — every request would fail anyway.

---

### Q: What is CORS and why did you add it?

CORS = **Cross-Origin Resource Sharing**. By default, browsers block JavaScript from making HTTP requests to a different domain or port than the page it loaded from (security policy).

Our API is on port 5000. A React frontend on port 3000 is a "different origin". Without `cors()` middleware, the browser would block all requests. The `cors()` package adds the right headers to every response to allow this.

---

### Q: What does `{ timestamps: true }` do in the Mongoose schema?

It tells Mongoose to automatically manage two fields:
- `createdAt` — set to the current date/time when the document is first saved
- `updatedAt` — updated to the current date/time every time the document is saved

Without this, we'd have to set these fields manually in every create/update operation.

---

## Possible Live Modifications

### "Add a limit of minimum 1 on the limit query param"
In `productController.js`, change:
```js
const pageSize = Math.min(parseInt(limit) || 20, 100);
```
to:
```js
const pageSize = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
```
`Math.max(..., 1)` ensures the minimum is always 1.

---

### "Add a GET /api/products/:id endpoint"
In `productRoutes.js`:
```js
router.get("/:id", getSingleProduct);
```
In `productController.js`:
```js
async function getSingleProduct(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
}
```

---

### "Add price range filtering — ?minPrice=100&maxPrice=500"
In `productController.js`, inside `getProducts`, after building `filter`:
```js
if (req.query.minPrice || req.query.maxPrice) {
  filter.price = {};
  if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
  if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
}
```

---

### "Return the total count of products"
Add a count query before returning the response:
```js
const totalCount = await Product.countDocuments(filter);
res.json({ success: true, totalCount, count: products.length, nextCursor, data: products });
```
Note: this adds an extra DB call. For large datasets, it can be slow — explain this trade-off.

---

### "What if two products have the exact same createdAt timestamp?"
This is a real edge case with cursor pagination! If multiple products share the same `createdAt`, a `<` comparison might skip some.

**Fix:** Use a compound cursor: (createdAt, _id).
```js
// Cursor is now: { createdAt: "...", lastId: "..." }
filter.$or = [
  { createdAt: { $lt: cursorDate } },
  { createdAt: cursorDate, _id: { $lt: lastId } }
];
```
This ensures a strict total ordering even when timestamps collide.
(Mention you know about this; implementing it live shows strong understanding.)
