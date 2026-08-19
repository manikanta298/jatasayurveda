import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Section, Eyebrow } from "@/components/site/Section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/queries";
import { FALLBACK_PRODUCTS } from "@/lib/fallbackContent";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { formatINRFromPaise } from "@/lib/format";

export default function ProductsList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const { add } = useCart();
  const navigate = useNavigate();

  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const activeProducts = products.length > 0 ? products : FALLBACK_PRODUCTS;

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(activeProducts.map((p) => p.categoryLabel).filter(Boolean)))],
    [activeProducts]
  );
  const filtered = useMemo(() => {
    return activeProducts.filter((p) => {
      const q = query.toLowerCase();
      const matchesQuery =
        query.trim() === "" || p.name.toLowerCase().includes(q) || p.shortDescription?.toLowerCase().includes(q);
      const matchesCategory = category === "All" || p.categoryLabel === category;
      return matchesQuery && matchesCategory;
    });
  }, [activeProducts, query, category]);

  return (
    <>
      <Section className="pt-16 pb-4">
        <div className="max-w-3xl">
          <Eyebrow>Shop</Eyebrow>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl md:text-6xl">
            Pharmacy-grade Ayurveda, <span className="italic text-primary">shipped to you</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Small-batch, standardised and physician-approved formulations.
          </p>
        </div>
      </Section>

      <Section className="pt-4">
        <div className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="h-12 rounded-full border-border bg-background pl-11"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground/70 hover:border-primary/40 hover:text-primary"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const hasDiscount = p.discountPricePaise != null && p.discountPricePaise < p.pricePaise;
            const displayPrice = hasDiscount ? p.discountPricePaise : p.pricePaise;
            const discountPercent = hasDiscount
              ? Math.round(((p.pricePaise - p.discountPricePaise) / p.pricePaise) * 100)
              : 0;
            return (
            <div
              key={p.slug}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <Link to={`/products/${p.slug}`} className="block">
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img src={p.featuredImageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {hasDiscount && (
                    <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      {discountPercent}% off
                    </span>
                  )}
                </div>
                <div className="p-6 pb-2">
                  <p className="text-xs uppercase tracking-wider text-gold-foreground/70">{p.categoryLabel}</p>
                  <h3 className="mt-1 font-display text-xl text-foreground">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.shortDescription}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="font-display text-xl font-semibold text-primary">
                      {formatINRFromPaise(displayPrice)}
                    </p>
                    {hasDiscount && (
                      <p className="text-sm text-muted-foreground line-through">{formatINRFromPaise(p.pricePaise)}</p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="mt-auto flex flex-col gap-2 p-6 pt-3 sm:flex-row">
                <Button
                  onClick={() => {
                    add(p, 1);
                    toast.success(`${p.name} added to cart`);
                  }}
                  variant="outline"
                  className="flex-1 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
                </Button>
                <Button
                  onClick={() => {
                    add(p, 1);
                    navigate("/checkout");
                  }}
                  className="flex-1 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Buy now
                </Button>
              </div>
            </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-muted-foreground">No products match your filters.</p>
          )}
        </div>
      </Section>
    </>
  );
}
