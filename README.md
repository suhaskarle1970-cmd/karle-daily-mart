# Karke Daily Mart

Full-stack MERN e-commerce catalogue + WhatsApp ordering for a local grocery store, with an admin panel for product/category/hero-slider management and CSV bulk import.

## What this is (and isn't)

- Customers browse products, add to cart, and place orders by having WhatsApp open with a pre-filled message. **No payment gateway, no customer accounts.**
- Admin manages products, categories, and the homepage hero slider, and can bulk-import products from a CSV export.
- Order records are logged to MongoDB as a lightweight reference — this is not an order management system (no status workflow, no tracking).

## Tech stack

- **Frontend:** React + Vite, React Router, plain CSS (no framework)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcrypt
- **Images:** Cloudinary

## Folder structure

```
karke-daily-mart/
├── client/          React + Vite frontend (customer site + admin panel)
├── server/          Express API
├── README.md
└── .gitignore
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local, or free-tier MongoDB Atlas)
- A Cloudinary account (free tier is enough)

## Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `MONGODB_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Long random string — used to sign login tokens |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From your Cloudinary dashboard |
| `WHATSAPP_NUMBER` | Store's WhatsApp number in E.164 without `+`, e.g. `919876543210` |
| `STORE_NAME`, `STORE_PHONE`, `STORE_ADDRESS`, `STORE_EMAIL` | Shown on the site |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Used once, to create the first admin login |

Create the first admin account:

```bash
npm run seed:admin
```

Run the API:

```bash
npm run dev      # auto-restarts on changes
# or
npm start
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
```

Edit `client/.env` if your API isn't on `http://localhost:5000`:

```
VITE_API_URL=http://localhost:5000/api
```

Run it:

```bash
npm run dev
```

Visit `http://localhost:5173` for the store, and `http://localhost:5173/admin/login` for the admin panel.

## MongoDB setup

Any MongoDB 6+ instance works. Easiest path: create a free MongoDB Atlas cluster, add a database user, allow your IP (or `0.0.0.0/0` for early testing — lock this down before going live), and copy the connection string into `MONGODB_URI`. The app creates collections automatically on first write — no manual schema setup needed.

## Cloudinary setup

Sign up at cloudinary.com, and from the dashboard copy your **Cloud name**, **API key**, and **API secret** into the server `.env`. Images are uploaded server-side (never from the browser directly), auto-resized to a 1200px max, and served with automatic format/quality optimization. Deleting or replacing a product/slide image also deletes the old Cloudinary asset.

## CSV bulk import

From Admin → Bulk Import, upload a CSV with these columns:

```csv
name,barcode,price,category,description
Tata Salt,8901030,28,Grocery,Iodised salt 1kg
Aashirvaad Atta,8901234,250,Grocery,Whole wheat flour 5kg
```

- `name`, `price`, `category` are required per row; `barcode` and `description` are optional.
- Rows matched by `barcode` to an existing product are **updated**; everything else is **inserted**.
- Categories that don't exist yet are created automatically.
- One bad row never aborts the import — you get a summary (`total` / `imported` / `updated` / `failed`) plus a per-row error list.
- The import expects a CSV, not XLSX. If your billing software only exports Excel, save as CSV first (Excel: File → Save As → CSV UTF-8).

## Admin setup

1. Run `npm run seed:admin` in `server/` (see above) — creates one admin account from your `.env` credentials.
2. Log in at `/admin/login`.
3. Change the seed password to something you haven't shared anywhere, if it was ever written down or sent over chat.

## Deployment notes

- Deploy `server/` anywhere that runs Node (Render, Railway, a VPS). Set all env vars from `.env.example` in the platform's dashboard — never commit `.env`.
- Deploy `client/` as a static build: `npm run build` produces `client/dist/`, deployable to Vercel, Netlify, or any static host. Set `VITE_API_URL` to your deployed API's URL before building.
- Update `CLIENT_URL` in the server's env to your deployed frontend URL (CORS depends on it).
- Set `NODE_ENV=production` on the server — this suppresses internal error details from API responses.

## Common issues

- **"MONGODB_URI is not set"** — you didn't copy `.env.example` to `.env`, or forgot to fill it in.
- **Login fails with "Invalid email or password"** — check you ran `npm run seed:admin`, and that you're using the exact `SEED_ADMIN_EMAIL` from when you ran it (email is case-insensitive, stored lowercase).
- **Image upload fails** — double check all three `CLOUDINARY_*` variables; a typo'd API secret fails silently until upload time.
- **CORS errors in the browser console** — `CLIENT_URL` in the server's `.env` must exactly match the URL the frontend is actually running on (including port).
- **Product search returns nothing for terms that should match** — search uses MongoDB text indexes; if you seeded data by inserting directly into Mongo (bypassing the API), the text index may need a moment to build, or a manual `db.products.createIndex(...)` if it was dropped.

## What I verified vs. what I didn't

- Every backend file passed a syntax check, and I booted the actual Express app and confirmed the full route tree resolves (imports, middleware order, controller wiring) by making a real HTTP request against it.
- The frontend build (`npm run build`) completes cleanly with no import or compile errors — this run also caught and fixed one missing CSS file.
- **Not verified**: no live MongoDB or Cloudinary connection was available in the build environment, so the actual database writes, image uploads, and the CSV import's database side were not exercised end-to-end. Test these yourself against real credentials before treating this as client-ready. The WhatsApp link generation was checked by reading the code against the exact message format in the spec, not by clicking through a live WhatsApp handoff.
