# Backend Setup (Phase 1)

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary + Razorpay keys
npm run dev
```

Health check: `GET http://localhost:5000/api/v1/health`

Routes are not yet mounted (Phase 2/3 adds controllers + routes for every
entity — see `MIGRATION_PLAN.md` in the project root). This phase delivers the
foundation only: DB connection, all data models, JWT auth middleware,
role-based authorization, Cloudinary config, and error handling.

## ICICI Bank Payment Gateway (UAT)

The checkout integration uses ICICI Payment Gateway Standard/Redirection Mode (`payType=0`). The backend creates the Initiate Sale request, computes `secureHash` server-side, redirects the browser to ICICI's `redirectURI?tranCtx=...`, validates the signed browser return, and independently confirms the final state with the ICICI STATUS API. Payment Advice is also accepted at the server-to-server advice endpoint.

Set these backend environment variables before enabling ICICI checkout:

- `ICICI_ENV=uat`
- `ICICI_MERCHANT_ID`
- `ICICI_AGGREGATOR_ID`
- `ICICI_SECRET_KEY` — server-side only; never commit it
- `ICICI_RETURN_URL=https://<backend-host>/api/v1/orders/icici/return`
- `ICICI_FRONTEND_URL=https://<frontend-host>`
- `ICICI_ADVICE_URL=https://<backend-host>/api/v1/orders/icici/advice` (configure this URL with ICICI during onboarding)

The UAT API URLs are defined in `services/payments/icici.provider.js` and can be overridden with `ICICI_SALE_URL` and `ICICI_COMMAND_URL` when required by the merchant environment.

### UAT verification

Run the deterministic integration/unit tests with:

```bash
npm test
```

The test suite covers the documented ICICI hash algorithm, Standard Mode request construction, response hash verification, and final transaction-success rules. A real ICICI UAT payment must additionally be completed through the hosted payment page using the UAT test instruments supplied by ICICI and a publicly reachable HTTPS return URL.
