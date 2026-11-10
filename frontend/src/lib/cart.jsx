import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { validateCoupon } from "./queries";

const STORAGE_KEY = "jata:cart:v1";

// A cart line stores a snapshot of the product at the time it was added
// (name/image/price) so the cart page and nav badge can render instantly
// without extra API calls. The backend always re-fetches live product data
// and re-computes pricing at checkout — this snapshot is for display only.
const noop = () => {};
const defaultCtx = {
  items: [],
  count: 0,
  subtotalPaise: 0,
  discountPaise: 0,
  coupon: null,
  totalPaise: 0,
  applyCoupon: async () => {},
  removeCoupon: noop,
  add: noop,
  updateQty: noop,
  remove: noop,
  clear: noop,
};

const Ctx = createContext(defaultCtx);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [coupon, setCoupon] = useState(null); // { code, discountPaise } — display only; server re-validates

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed localStorage content
    }
    setHydrated(true);
  }, []);

  useEffect(() => { setCoupon(null); }, [items]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage may be unavailable (private browsing, quota) — cart still works in-memory
    }
  }, [items, hydrated]);

  const value = useMemo(() => {
    const subtotalPaise = items.reduce((s, i) => s + i.unitPricePaise * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);

    return {
      items,
      count,
      subtotalPaise,
      coupon,
      discountPaise: coupon ? Math.min(coupon.discountPaise, subtotalPaise) : 0,
      totalPaise: subtotalPaise - (coupon ? Math.min(coupon.discountPaise, subtotalPaise) : 0),
      applyCoupon: async (code) => {
        const r = await validateCoupon(code, subtotalPaise);
        setCoupon({ code: r.code, discountPaise: r.discountPaise });
        return r;
      },
      removeCoupon: () => setCoupon(null),
      // product: the full product object from the API (needs _id, slug, name, featuredImageUrl, pricePaise, discountPricePaise)
      add: (product, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.productId === product._id);
          if (existing) {
            return prev.map((p) => (p.productId === product._id ? { ...p, qty: p.qty + qty } : p));
          }
          return [
            ...prev,
            {
              productId: product._id,
              slug: product.slug,
              name: product.name,
              image: product.featuredImageUrl,
              categoryLabel: product.categoryLabel,
              unitPricePaise: product.discountPricePaise ?? product.pricePaise,
              qty,
            },
          ];
        }),
      updateQty: (productId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.productId !== productId)
            : prev.map((p) => (p.productId === productId ? { ...p, qty } : p))
        ),
      remove: (productId) => setItems((prev) => prev.filter((p) => p.productId !== productId)),
      clear: () => { setItems([]); setCoupon(null); },
    };
  }, [items, coupon]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  return useContext(Ctx);
}
