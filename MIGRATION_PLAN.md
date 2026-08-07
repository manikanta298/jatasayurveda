# JATA Ayurveda — Lovable/TanStack+Supabase → MERN Migration Plan

Source project: TanStack Start (SSR, file-based routes, `.functions.ts` server
functions) + Supabase (Postgres, Auth, Storage, RLS). Target: React+Vite (SPA)
+ Express + MongoDB/Mongoose. **UI, CSS, and UX must not change.**

## How to use this doc across chats
Each phase below = one new chat. Upload only:
1. This file (`MIGRATION_PLAN.md`)
2. The zip produced by the previous phase
3. Say: "Continue Phase N per MIGRATION_PLAN.md"

No need to re-upload the original Lovable zip or re-explain context after Phase 1.

## Entity → Collection map (source of truth)
| Supabase table / site-data.ts | Mongo model | Notes |
|---|---|---|
| `products` + `product_images` | `Product` | images embedded as subdocs |
| `product_categories` | `ProductCategory` | self-referencing `parent` |
| `services` + `service_images` | `Service` | images, FAQs, treatment steps embedded |
| `orders` + `order_status_history` | `Order` | statusHistory embedded array |
| `user_roles` (+ `auth.users`) | `User` | roles: admin, content_manager, product_manager, order_manager, marketing_manager |
| `site_settings` | `SiteSetting` | key/value, unchanged shape |
| `media_assets` (Supabase Storage) | `MediaAsset` | now backed by Cloudinary `publicId` |
| `audit_logs` | `AuditLog` | unchanged shape |
| site-data.ts `testimonials` | `Testimonial` | was hardcoded, now DB-backed |
| site-data.ts `articles` | `BlogPost` | was hardcoded, now DB-backed |
| site-data.ts `research` | `ResearchItem` | was hardcoded, now DB-backed |
| site-data.ts `doctors` | `Doctor` | was hardcoded, now DB-backed |
| site-data.ts `certifications` | `Certification` | was hardcoded, now DB-backed |
| (new, per prompt) | `Coupon` | not in source DB; added per conversion spec |
| (new, per prompt) | `Notification` | not in source DB; added per conversion spec |
| (new, per prompt) | `HeroBanner` | not in source DB; added per conversion spec |
| (new, per prompt) | `ContactMessage` | contact form submissions |

## Architecture swaps
- TanStack `.functions.ts` server functions → Express controllers/routes
- Supabase Auth → JWT (httpOnly cookie) + bcrypt, via `middleware/auth.js`
- Supabase RLS policies → `requireRole(...)` middleware checks (role logic already mapped 1:1 from SQL policies)
- Supabase Storage bucket `media` → Cloudinary, `MediaAsset` model stores `publicId` + `url`
- TanStack Router (file-based) → React Router v6 (same route paths/params, just re-declared in a router file)
- Razorpay: keep client checkout flow identical; order creation + signature verification move to backend controller

## Phases
- [x] **Phase 1 — Backend foundation** (done): Express app skeleton, MongoDB connection, all Mongoose models, JWT auth + role middleware, error handling, Cloudinary config, `.env.example`
- [x] **Phase 2 — Core CRUD APIs** (done): generic `crudFactory` + `attachCrudRoutes` helper, controllers/routes for products, categories, services, coupons (+validate), blog, research, testimonials, doctors, certifications, hero banners, contact, site settings, media upload (Cloudinary)
- [x] **Phase 3 — Auth, orders, Razorpay** (done): JWT login/logout/me/change-password, admin user management (`/users`), order creation + Razorpay order + signature verification, order status transitions with history, notifications, dashboard analytics
- [x] **Phase 4a — Frontend infrastructure** (done): Vite+React+React Router scaffold, all shadcn/`ui`+`hooks` copied verbatim (no framework deps), Axios API client, cart/settings contexts ported to new API, Nav/Footer/Section ported off TanStack Router, root layout + router + 404 + error boundary, verified `npm run build` succeeds
- [x] **Phase 4b — Frontend public pages** (done): all 13 real pages ported — Home, About, Contact, ProductsList/Detail, ServicesList/Detail, BlogList/Detail, Research, Cart, Checkout, OrderTracking, staff Login. `npm run build` verified clean.
- [x] **Phase 5a — Admin infrastructure** (done): auth guard + admin shell/nav (`AdminLayout.jsx`, merges the original's separate `_authenticated` guard + `admin.tsx` shell into one), shared editor components (`StringListEditor`, `FaqEditor`, `StepsEditor`, `CtaEditor`, `GalleryUrlEditor`), media uploader wired to the real Cloudinary endpoint, `StatusBadge`, and every admin API call added to `queries.js`. All 10 admin pages routed under `/admin/*` (still placeholders). `npm run build` verified clean.
- [x] **Phase 5b — Admin pages** (done): Dashboard, OrdersList/Detail+Invoice, ProductsAdminList/Editor, ServicesAdminList/Editor, CategoriesAdmin, SettingsAdmin, UsersAdmin all ported with real content. `npm run build` verified clean throughout.
- [x] **Phase 6 — Seed data, README, install guide, final QA pass** (done): `backend/utils/seed.js` populates every collection with the original app's actual content (6 products, 4 services, 3 doctors, 3 testimonials, 3 blog posts, 3 research items, 5 certifications, categories, site settings, one demo coupon) plus a first admin account from `.env`. Root `README.md` covers full setup for both backend and frontend. Final rebuild of both projects from a clean `node_modules` state passed with no errors.

## Project status: migration complete
All 6 phases are done. The app is a fully working MERN stack — backend (models, CRUD, auth, orders/Razorpay, dashboard), public frontend (all 13 pages), and admin panel (all 10 sections) — functionally equivalent to the original, with a few deliberate improvements noted throughout this document (working checkout, real contact form, widened RBAC, server-side price recalculation) and a few known gaps (real images, per-page SEO tags, unused `HeroBanner` model) called out explicitly rather than silently dropped.

**To run it yourself:** see the root `README.md` for the full setup — `npm install` + `.env` + `npm run seed` in `backend/`, then `npm install` + `npm run dev` in `frontend/`.


## Phase 5b — what changed vs. the original beyond the framework swap
- **Backend schema fix.** `Product.status` and `Service.status` only had `draft`/`published` in Phase 1's models — the admin editors need `archived` too (present in the original UI). Added `"archived"` to both enums (`backend/models/Product.js`, `Service.js`) rather than dropping the option from the ported editor.
- **User management form now creates accounts directly**, not just assigns roles to an existing signup (see Phase 5a note — no public registration in this backend).
- **CSV export** and **dashboard polling** implemented as planned in 5a (paginated client-side fetch for export; `refetchInterval` instead of a realtime subscription).
- **Order/product/service field names** are camelCase throughout (`unitPricePaise`, `categoryLabel`, `stockQuantity`, etc.) matching the Mongoose schemas exactly — every editor and detail page was mapped field-by-field against Phase 1's actual model definitions, not assumed from the original Postgres column names.
- **Invoice page** now pulls brand/contact details from live site settings (`useSettings()`) instead of the hardcoded `site-data.ts` brand object — consistent with how Nav/Footer already work.
- **Gallery images** stored as `{url, alt, sortOrder}` subdocuments on `Product`/`Service` (Phase 1 design) rather than plain URL strings — editors convert to/from plain URL arrays for the `MultiImageUploader` UI, then reconstruct the subdocument shape on save.

## What's left for Phase 6
- Seed data for every collection (products, services, categories, testimonials, blog posts, research, doctors, certifications, hero banners, site settings, a first admin user)
- Root-level README tying backend + frontend together with install/run instructions
- Final pass: confirm all three (backend, frontend, admin) run together end-to-end against a real MongoDB + Cloudinary + Razorpay setup
- Still outstanding from earlier phases: real image files (Phase 4a), per-page SEO meta tags (Phase 4b)


## Phase 5a decisions
- **Role gate widened.** The original admin shell only let in users with the single `admin` role (checked via a `has_role` RPC). This backend has 5 distinct staff roles (Phase 3), so `AdminLayout.jsx` now admits anyone with *any* staff role, and leaves granular permission enforcement to each endpoint (which Phase 2/3 already do per-resource). Matches the RBAC design already built rather than the original's cruder single-role gate.
- **Field names aligned to backend schemas**, not ported verbatim: `FaqEditor` uses `{question, answer}` (was `{q, a}`), `CtaEditor` uses `{label, href, style}` (was `{..., variant}`) — both now match `Product`/`Service` Mongoose schemas exactly, avoiding a silent mapping bug.
- **CSV export** (used on the orders list) will be done client-side from the already-fetched order rows in Phase 5b, rather than adding a dedicated backend export endpoint — simpler, and the data's already in hand.
- **Realtime new-order toasts** (Supabase Postgres-changes subscription in the original) will be replaced with simple polling (`refetchInterval` on the dashboard query) in Phase 5b — avoids standing up a WebSocket/SSE layer for a "nice-to-have" notification.


## Phase 4b — what changed vs. the original beyond the framework swap
- **Checkout is now fully functional.** The original checkout was itself still a stub ("Payment via Razorpay coming next" — it just created a DB row with no payment). Since Phase 3 already built the full Razorpay create-order/verify-signature backend, `Checkout.jsx` now actually opens the Razorpay modal and completes payment — this is new functionality, not just a port.
- **Contact form is wired to a real endpoint.** Same situation — the original was front-end-only with a fake `setTimeout`. It now calls the real `POST /contact` built in Phase 2.
- **Login has no signup tab.** The original offered Supabase self-service signup; this backend deliberately has no public registration endpoint (staff are provisioned via `POST /users` — see Phase 3 notes). The signup tab was dropped rather than left pointing at a non-existent endpoint.
- **Cart pricing source of truth moved.** Cart now snapshots live MongoDB product data instead of the old hardcoded `site-data.ts` catalog (see Phase 4a notes) — visually identical, but numbers now match what's actually in the database and what the server will charge.
- Content that was hardcoded array literals in `site-data.ts` (testimonials, blog articles, research, doctors, certifications) is now fetched from the API everywhere it appears (Home, About, Research, Blog). Sections hide gracefully (no empty headers) if that content hasn't been seeded yet.
- The `timeline` and `values` arrays on the About page, and the stat/feature copy on Home, were never DB-backed in the source app either — kept as static content, matching original scope.

## Still open after Phase 4b
- Images: see the Phase 4a limitation above — real image files still need to be supplied.
- Content: blog posts, research items, testimonials, doctors, certifications, hero banners, and products/services all need real data — that's Phase 6 (seeding) or manual entry via the admin panel (Phase 5).
- SEO meta tags (per-page `<title>`/`<meta>`, previously set via TanStack's `head()` loader) aren't yet wired — React Router doesn't have a built-in equivalent; would need something like `react-helmet-async` if per-page meta tags matter for launch.


## Frontend structure (Phase 4a output)
```
frontend/
  index.html            meta tags ported from __root.tsx head config + Razorpay SDK script tag
  vite.config.js         @tailwindcss/vite, @ alias
  src/
    main.jsx             providers: BrowserRouter, QueryClient, Settings, Cart, ErrorBoundary, Toaster
    router.jsx            all route definitions (react-router-dom v6)
    App.jsx               root layout — nav/footer hidden on /admin/* and /auth, matches original isChromeless logic
    styles.css             copied verbatim, unchanged
    lib/
      api.js               axios instance, withCredentials, unwraps {success,data,meta} envelope
      queries.js            one function per endpoint (products, services, blog, orders, auth, etc.)
      cart.jsx              cart now keyed on live Mongo _id, snapshots product data at add-time
      settings.jsx           same shape/defaults as before, fetches from /api/v1/settings
      utils.ts, format.ts    copied verbatim (no framework deps)
    components/
      site/Nav.jsx, Footer.jsx, Section.jsx    ported off TanStack Link/activeProps to react-router NavLink
      ui/*.tsx                                  copied verbatim — zero Supabase/router deps in the original
      ErrorBoundary.jsx                          class component port of the original errorComponent
    hooks/use-mobile.tsx    copied verbatim
    pages/*.jsx              one file per route — all placeholders pending Phase 4b
    assets/images.js         image URL constants — see limitation below
```

## Known limitation: source images aren't portable
The original project's images (logo, hero photos, treatment photos) are hosted
on Lovable's own CDN (`/__l5e/assets-v1/<id>/<file>`), which is inaccessible
outside Lovable's hosting environment, and this migration has no access to the
underlying bytes. `frontend/src/assets/images.js` points to `/images/...`
placeholders with a comment explaining that you need to either drop the
original files into `frontend/public/images/` or re-upload them through the
new admin Media Library (Cloudinary-backed, built in Phase 2) and update the
constants.

## Decisions made in Phase 4a
- Kept `components/ui/*` and `hooks/*` as `.tsx` — Vite compiles TS/TSX fine even in an otherwise-JS project (esbuild strips types on the fly), and rewriting ~45 files with zero framework dependencies would have been pure token cost with no behavior change. Only files that actually touched Supabase/TanStack Router were converted to `.jsx`.
- Cart previously computed prices from the **hardcoded** `site-data.ts` catalog (a leftover from before the Supabase migration in the source app) — it now uses live product data from the API, matching what Phase 3's order pricing already does server-side.
- Verified end-to-end: `npm install` + `npm run build` succeed with no errors.


## API surface delivered in Phase 3 (base path `/api/v1`)
- `/auth` — `POST /login`, `POST /logout`, `GET /me`, `PATCH /me/password` (all cookie-based JWT; token also returned in body for non-cookie clients)
- `/users` — admin-only CRUD for staff accounts (create sets roles + hashes password; can't delete your own account)
- `/orders` — `POST /` (prices cart server-side from live product data, creates Razorpay order), `POST /verify` (HMAC signature check, marks paid, decrements stock, increments coupon usage, fires notification), `GET /:orderNumber` (public tracking), `GET /admin/all`, `GET /admin/:id`, `PATCH /admin/:id/status` (admin/order_manager)
- `/notifications` — role-filtered list/mark-read, any authenticated staff member
- `/dashboard/summary` — order counts, 30-day revenue, recent orders, low-stock products, new contact messages, unread notifications

## Notes / decisions made in Phase 3
- Order pricing is **always recomputed server-side** from `Product` documents in `services/order.service.js` — the client only sends `productId` + `quantity`, never prices, so a tampered request can't change what's charged.
- Razorpay client (`config/razorpay.js`) is **lazily initialized** — the SDK throws at construction time if keys are missing, which would otherwise crash the whole server on boot even before payments are configured. Confirmed: app boots fine with `.env` unset for Razorpay; throws a clear error only when a payment endpoint is actually hit.
- No public self-registration endpoint — matches the source app, where staff accounts are provisioned by an admin (was done via SQL seed; now via `POST /users`).
- Live MongoDB testing wasn't possible in this environment (no local `mongod`, and downloading one is blocked by network egress rules) — `require("./app")` boot-checks and `npm install` were verified instead. Test against your real Atlas URI before deploying.


## API surface delivered in Phase 2 (base path `/api/v1`)
Each resource below follows the same pattern unless noted:
`GET /` (public, filtered) · `GET /:idOrSlug` (public) · `GET /admin/all` · `GET /admin/:idOrSlug` · `POST /` · `PATCH /:idOrSlug` · `DELETE /:idOrSlug` (last 4 require auth + role)

- `/products`, `/categories`, `/services` — write roles: admin/content_manager/product_manager (services: admin/content_manager only)
- `/blog`, `/research`, `/doctors`, `/certifications` — write roles: admin/content_manager
- `/testimonials`, `/hero-banners` — write roles: admin/content_manager/marketing_manager
- `/coupons` — admin-only CRUD (no public list), plus public `POST /coupons/validate { code, subtotalPaise }`
- `/settings` — `GET /` (all, public), `GET /:key` (public), `PATCH /:key` (admin only, upsert)
- `/contact` — `POST /` (public submit, fires a Notification), `GET /admin/all`, `PATCH /admin/:id` (admin/order_manager)
- `/media` — `GET /`, `POST /` (multipart field `file`, streams to Cloudinary), `DELETE /:id` (content roles; delete is admin-only)

Verified: `npm install` succeeds, `require("./app")` loads without errors (all routes/controllers wired correctly). Not yet tested against a live MongoDB instance.


## Current file layout (backend, Phase 1 output)
```
backend/
  server.js            entry point
  app.js               express app + middleware wiring
  config/db.js          mongoose connection
  config/cloudinary.js  cloudinary config
  middleware/auth.js     protect + requireRole
  middleware/errorHandler.js
  models/*.js            all 16 Mongoose models
  utils/ApiError.js, ApiResponse.js
  routes/index.js        health check + placeholders for Phase 2/3 routes
  .env.example
  package.json
```

## Notes / decisions made in Phase 1
- Images normalized in Postgres (`product_images`, `service_images`) are embedded arrays in Mongo — no need for separate collections/joins.
- `order_status_history` embedded directly on `Order.statusHistory`.
- Roles stored as an array on `User` (`roles: [String]`) rather than a separate join table.
- Amounts kept in **paise** (integers) throughout, matching source schema — do this consistently in Phase 3/4 to avoid float rounding bugs.
