import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatINRFromPaise } from "@/lib/format";

export default function Cart() {
  const { items, subtotalPaise, shippingPaise, totalPaise, updateQty, remove, count } = useCart();

  return (
    <Section className="pt-14 pb-24">
      <Eyebrow>Cart</Eyebrow>
      <h1 className="mt-4 font-display text-4xl font-semibold text-foreground sm:text-5xl">
        Your cart{count > 0 && <span className="text-muted-foreground"> · {count} item{count > 1 ? "s" : ""}</span>}
      </h1>

      {items.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-border bg-card p-10 text-center shadow-[var(--shadow-soft)]">
          <ShoppingBag className="mx-auto h-10 w-10 text-primary/60" />
          <p className="mt-4 font-display text-2xl text-foreground">Your cart is empty</p>
          <p className="mt-2 text-muted-foreground">Discover our small-batch Ayurvedic formulations.</p>
          <Button asChild className="mt-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/products">Browse products</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <ul className="space-y-4">
            {items.map((l) => (
              <li key={l.productId} className="flex gap-4 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] sm:p-5">
                <Link to={`/products/${l.slug}`} className="block h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-28 sm:w-28">
                  <img src={l.image} alt={l.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wider text-gold-foreground/70">{l.categoryLabel}</p>
                      <Link to={`/products/${l.slug}`} className="mt-0.5 block truncate font-display text-lg text-foreground hover:text-primary sm:text-xl">
                        {l.name}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">{formatINRFromPaise(l.unitPricePaise)} each</p>
                    </div>
                    <button
                      onClick={() => remove(l.productId)}
                      aria-label="Remove"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-border bg-background">
                      <button onClick={() => updateQty(l.productId, l.qty - 1)} aria-label="Decrease" className="grid h-10 w-10 place-items-center text-foreground hover:text-primary">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center font-medium">{l.qty}</span>
                      <button onClick={() => updateQty(l.productId, l.qty + 1)} aria-label="Increase" className="grid h-10 w-10 place-items-center text-foreground hover:text-primary">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-display text-lg font-semibold text-primary">{formatINRFromPaise(l.unitPricePaise * l.qty)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="sticky top-24 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-2xl text-foreground">Order summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium text-foreground">{formatINRFromPaise(subtotalPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="font-medium text-foreground">{shippingPaise === 0 ? "Free" : formatINRFromPaise(shippingPaise)}</dd>
              </div>
              {shippingPaise > 0 && <p className="text-xs text-muted-foreground">Free shipping on orders over ₹999.</p>}
            </dl>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-display text-lg text-foreground">Total</span>
              <span className="font-display text-2xl font-semibold text-primary">{formatINRFromPaise(totalPaise)}</span>
            </div>
            <Button asChild size="lg" className="w-full rounded-full bg-primary py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90">
              <Link to="/checkout">
                Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full border-primary/30 text-primary">
              <Link to="/products">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </Section>
  );
}
