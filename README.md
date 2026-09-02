# JATA Ayurveda — MERN Stack

Full MERN conversion of the original Lovable-generated site (TanStack Start + Supabase). See `MIGRATION_PLAN.md` for the complete phase-by-phase history, architecture decisions, and known limitations.

## Stack
- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT auth, Cloudinary (media), ICICI Bank Payment Gateway + Cash on Delivery
- **Frontend:** React (Vite), React Router v6, Tailwind CSS v4, TanStack Query, Axios

## Prerequisites
- Node.js 18+
- A MongoDB database (local `mongod`, or a free MongoDB Atlas cluster)
- A Cloudinary account (free tier is fine) for image uploads
- ICICI Bank Payment Gateway UAT credentials for payment testing

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
- `ICICI_MERCHANT_ID` / `ICICI_AGGREGATOR_ID` / `ICICI_SECRET_KEY` — ICICI UAT credentials; keep the secret server-side only
- `ICICI_RETURN_URL` — public HTTPS endpoint receiving ICICI's browser POST callback
- `ICICI_START_URL` — public HTTPS bridge used by checkout before redirecting to ICICI
- `ICICI_ADVICE_URL` — public HTTPS endpoint configured with ICICI for Payment Advice
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — credentials for your first admin login

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000/api/v1` — check `GET /health`.

### ICICI UAT flow

The payment flow is ICICI Standard/Redirection Mode:

1. Backend creates the order and calls ICICI Initiate Sale.
2. Backend signs the request with HMAC-SHA256 and stores `merchantTxnNo`, `redirectURI` and `tranCtx`.
3. Checkout submits a short-lived per-order bridge signature to `/orders/icici/start`.
4. The backend redirects the customer to ICICI's hosted page with `tranCtx`.
5. ICICI POSTs the browser result to `/orders/icici/return`.
6. The backend verifies the callback signature and independently calls STATUS before marking the order paid.
7. ICICI Payment Advice is accepted at `/orders/icici/advice` as a server-to-server fallback/update path.

### UAT diagnostics

Admins can call:

```text
GET /api/v1/orders/icici/diagnostics
GET /api/v1/orders/icici/diagnostics?orderNumber=JATA-XXXXXXXX
```

The diagnostic endpoint reports configuration readiness without returning the secret key. When an order number is supplied, it performs a real, non-mutating ICICI STATUS request and reports the verified transaction result.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The site runs at `http://localhost:5173`. Admin panel is at `/admin`.

## 3. Images

The original project's images are hosted on Lovable's own CDN and weren't included in the export. See `frontend/src/assets/images.js` and the admin Media Library for the current image workflow.

## 4. Deploying

Both are standard Node/Vite apps. Set the same environment variables as `.env` in the deployment platform. For ICICI callbacks and Payment Advice, the backend must be publicly reachable over HTTPS and the configured callback/advice URLs must be registered with ICICI.

## Payment security

The ICICI secret is never sent to the frontend and must not be committed to Git. UAT credentials must only be used against ICICI's UAT endpoints. Before treating an order as paid, the backend verifies the signed return/advice and confirms the transaction independently through ICICI STATUS.
