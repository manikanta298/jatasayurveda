# Frontend Setup (Phase 4a — infrastructure)

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your backend
npm run dev
```

## What's in this phase
- Vite + React (JS) + React Router v6 + Tailwind v4, `@` path alias preserved
- All shadcn/radix `components/ui/*` and `hooks/` copied **unchanged** — they have
  zero Supabase/TanStack dependencies, so there was nothing to convert
- `src/lib/api.js` — Axios client (cookie-based JWT, replaces the Supabase client)
- `src/lib/queries.js` — one function per API call, replaces `catalog-public.functions.ts` / `orders.functions.ts`
- `src/lib/cart.jsx`, `src/lib/settings.jsx` — ported to the new API (cart now keys off live MongoDB `_id`s instead of the old hardcoded `site-data.ts` catalog)
- `src/components/site/Nav.jsx`, `Footer.jsx`, `Section.jsx` — ported from TanStack `Link`/`activeProps` to `react-router-dom` `NavLink`
- Root layout, router, 404 page, and error boundary all ported and working
- `npm run build` verified to succeed

## Known limitation — images
The original project's images (logo, hero photos, etc.) are hosted on Lovable's
own CDN and aren't included in the export. `src/assets/images.js` points to
`/images/...` placeholders — see the comment in that file for how to supply
the real files.

## Not yet done (next phase)
Every page in `src/pages/` is currently a placeholder. Phase 4b ports the real
content from the original route files (Home, About, Contact, Products,
Services, Blog, Research, Cart, Checkout, Order tracking, staff Login) onto
the infrastructure built here.
