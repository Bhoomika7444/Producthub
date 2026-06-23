# CodeVector — Full Stack Product Browser

A full-stack app built for the CodeVector internship task.  
Backend: **Node.js + Express + MongoDB** | Frontend: **React + Vite**

---

## Project Structure

```
project-root/
├── Backend/
│   ├── server.js              ← Express server entry point
│   ├── db.js                  ← MongoDB connection
│   ├── .env                   ← Backend secrets (MONGO_URI, PORT)
│   ├── models/Product.js      ← Mongoose schema with indexes
│   ├── routes/productRoutes.js
│   ├── controllers/productController.js
│   └── scripts/seedProducts.js
│
├── Frontend/
│   ├── index.html             ← HTML shell
│   ├── vite.config.js         ← Vite + proxy config
│   ├── .env                   ← VITE_API_URL
│   ├── package.json
│   └── src/
│       ├── main.jsx           ← React entry point
│       ├── index.css          ← All global styles
│       ├── App.jsx            ← Main component (state + logic)
│       ├── api.js             ← All API call functions (axios)
│       └── components/
│           └── ProductCard.jsx
│
└── README.md                  ← This file
```

---

## How to Run Both Together

### Step 1 — Set up the Backend

```bash
cd Backend
npm install
```

Edit `Backend/.env` with your MongoDB Atlas connection string:
```
MONGO_URI=mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/codevector
PORT=5000
```

Seed 200,000 products (run once):
```bash
npm run seed
```

Start the backend:
```bash
npm run dev
```
→ Backend runs on **http://localhost:5000**

---

### Step 2 — Set up the Frontend

Open a **new terminal**:
```bash
cd Frontend
npm install
npm run dev
```
→ Frontend runs on **http://localhost:5173**

---

### Step 3 — Open in browser

Go to: **http://localhost:5173**

The Vite dev server proxies `/api` calls to `localhost:5000` automatically.  
So the frontend talks to the backend without any CORS issues in development.

---

## API Endpoints (Backend)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products` | Get products (newest first) |
| GET | `/api/products?category=Electronics` | Filter by category |
| GET | `/api/products?cursor=<date>&limit=20` | Next page |
| GET | `/api/products/categories` | All unique categories |

---

## Frontend Features

- **Search** — client-side filter by product name (instant, no API call)
- **Category filter** — re-fetches from backend with category param
- **Load More** — cursor-based pagination (no duplicates, always fast)
- **Loading indicator** — spinner while fetching
- **Error handling** — shows message + retry button if API fails
- **Responsive** — works on mobile and desktop

---

## For Production Deployment

### Backend (Render)
1. Push `Backend/` folder to GitHub
2. Create a new Web Service on Render pointing to it
3. Add `MONGO_URI` and `PORT=10000` in Render's environment variables
4. Set start command: `node server.js`

### Frontend (Vercel / Netlify)
1. Push `Frontend/` folder to GitHub
2. Create a new project, set build command: `npm run build`, output: `dist`
3. Add environment variable:  
   `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy — no proxy needed in production (full URL used directly)

---

## How the Frontend Works (Interview Explanation)

### File-by-file

**`main.jsx`** — Mounts React to the `<div id="root">` in index.html. Think of it as plugging in the power cable.

**`api.js`** — All axios calls in one place. If the backend URL changes, we only change it here.

**`App.jsx`** — The main component. Uses:
- `useState` to store: products, categories, cursor, loading, error
- `useEffect` to auto-fetch when category changes
- `handleLoadMore()` to append next page to the list

**`ProductCard.jsx`** — Displays one product. Receives the product as a prop.

**`index.css`** — All the styling. No external UI library needed.

### How cursor pagination works on the frontend

1. First load → call `fetchProducts({ cursor: null })` → get page 1 + `nextCursor`
2. Save `nextCursor` in state
3. User clicks "Load More" → call `fetchProducts({ cursor: nextCursor })` → get page 2
4. Spread new products into existing array: `[...oldProducts, ...newProducts]`
5. Update `nextCursor` again
6. When `nextCursor` is null → hide "Load More" button

This means users never see duplicates even if new products are added to the DB between clicks.
