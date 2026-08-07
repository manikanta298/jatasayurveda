# JATA Ayurveda — MERN Stack

Full MERN conversion of the original Lovable-generated site (TanStack Start +
Supabase). See `MIGRATION_PLAN.md` for the complete phase-by-phase history,
architecture decisions, and known limitations.

## Stack
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT auth, Cloudinary (media), Razorpay (payments)
- **Frontend:** React (Vite), React Router v6, Tailwind CSS v4, TanStack Query, Axios

## Prerequisites
- Node.js 18+
- A MongoDB database (local `mongod`, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A [Cloudinary](https://cloudinary.com) account (free tier is fine) for image uploads
- A [Razorpay](https://razorpay.com) account (test mode keys are fine) for checkout

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET` — any long random string
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — from your Cloudinary dashboard
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from your Razorpay dashboard (test mode keys work)
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials for your first admin login

Populate the database with the original site's content (products, services,
categories, doctors, testimonials, blog posts, research, certifications) plus
your first admin account:

```bash
npm run seed
```

This is safe to re-run — it upserts everything by slug/code/key, so it won't
create duplicates.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000/api/v1` — check `GET /health`.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL should point at your backend
npm run dev
```

The site runs at `http://localhost:5173`. Admin panel is at `/admin` (sign in
at `/auth` with the `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` you set above).

## 3. Images (important)

The original project's images are hosted on Lovable's own CDN and weren't
included in the export. See `frontend/src/assets/images.js` — drop the actual
files into `frontend/public/images/` with the documented filenames, or
re-upload them via the admin Media Library (Settings → any editor with an
image field) and update product/service records to point at the new
Cloudinary URLs.

## 4. Deploying

Both are standard Node/Vite apps:
- **Backend:** deploy as any Node.js service (Render, Railway, Fly.io, a VPS, etc). Set the same env vars as `.env`.
- **Frontend:** `npm run build` produces a static `dist/` folder — deploy to any static host (Vercel, Netlify, Cloudflare Pages) or serve it from the backend. Set `VITE_API_URL` to your deployed backend's URL at build time.

## What's not done yet
See "Still open" notes throughout `MIGRATION_PLAN.md`, in short:
- Real images (above)
- Per-page SEO meta tags (React Router has no built-in equivalent to the original's TanStack `head()` loader — would need `react-helmet-async` or similar if this matters for launch)
- Hero banners have a backend model (`HeroBanner`) but aren't wired to the homepage — the original's hero section was static, not DB-driven, and the port preserved that
- No automated tests were part of this migration
