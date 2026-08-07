# Backend Setup (Phase 1)

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Cloudinary + Razorpay keys
npm run dev
```

Health check: `GET http://localhost:5000/api/v1/health`

Routes are not yet mounted (Phase 2/3 adds controllers + routes for every
entity — see `MIGRATION_PLAN.md` in the project root). This phase delivers
the foundation only: DB connection, all data models, JWT auth middleware,
role-based authorization, Cloudinary config, and error handling.
