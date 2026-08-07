import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Minus, Plus, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Section } from "@/components/site/Section";
import { getProduct } from "@/lib/queries";
import { FALLBACK_PRODUCTS } from "@/lib/fallbackContent";
import { useCart } from "@/lib/cart";
import { formatINRFromPaise } from "@/lib/format";

export default function ProductDetail() {
  const { slug } = useParams();
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(null);
  const { add } = useCart();
  const navigate = useNavigate();

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug),
  });

  if (isLoading) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">Loading product…</h1>
        <p className="mt-2 text-muted-foreground">Please wait while we load the product details.</p>
      </Section>
    );
  }

  if (isError || !product) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">
          {isError ? "Something went wrong" : "Product not found"}
        </h1>
        {isError ? (
          <p className="mt-2 text-muted-foreground">{error?.message}</p>
        ) : (
          <Button asChild className="mt-6 rounded-full">
            <Link to="/products">Browse all products</Link>
          </Button>
        )}
      </Section>
    );
  }

  const related = product.relatedProducts || [];
  const featuredImage = product.featuredImageUrl || FALLBACK_PRODUCTS[0]?.featuredImageUrl;
  const gallery = [
    ...(featuredImage ? [{ url: featuredImage, alt: product.name }] : []),
    ...(product.images || []),
  ];
  const activeUrl = activeImage || featuredImage;
  const hasDiscount = product.discountPricePaise != null && product.discountPricePaise < product.pricePaise;
  const displayPrice = hasDiscount ? product.discountPricePaise : product.pricePaise;
  const discountPercent = hasDiscount
    ? Math.round(((product.pricePaise - product.discountPricePaise) / product.pricePaise) * 100)
    : 0;

  return (
    <>
      <Section className="pt-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[var(--shadow-soft)]">
              <img src={activeUrl} alt={product.name} className="aspect-square w-full object-cover" width={1200} height={1200} />
            </div>
            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {gallery.map((img, i) => (
                  <button
                    key={`${img.url}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(img.url)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 transition-colors ${
                      (activeImage || featuredImage) === img.url ? "border-primary" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={img.url} alt={img.alt || product.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-gold-foreground/80">{product.categoryLabel}</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.shortDescription}</p>

            <div className="mt-6 flex flex-wrap items-baseline gap-3">
              <p className="font-display text-4xl font-semibold text-primary">{formatINRFromPaise(displayPrice)}</p>
              {hasDiscount && (
                <>
                  <p className="text-lg text-muted-foreground line-through">{formatINRFromPaise(product.pricePaise)}</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    {discountPercent}% off
                  </span>
                </>
              )}
              <p className="w-full text-sm text-muted-foreground sm:w-auto">Inclusive of all taxes</p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-border bg-background">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease" className="grid h-11 w-11 place-items-center text-foreground hover:text-primary">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-8 text-center font-medium">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase" className="grid h-11 w-11 place-items-center text-foreground hover:text-primary">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  add(product, qty);
                  toast.success(`${product.name} added to cart`);
                }}
                className="rounded-full bg-primary px-7 py-6 text-base text-primary-foreground shadow-[var(--shadow-elegant)] hover:bg-primary/90"
              >
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to cart
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  add(product, qty);
                  navigate("/checkout");
                }}
                className="rounded-full border-primary/30 px-7 py-6 text-base text-primary hover:bg-primary/5"
              >
                Buy now
              </Button>
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              <li className="flex items-start gap-2"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Free shipping over ₹999</li>
              <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> GMP + AYUSH certified</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Physician-approved</li>
              <li className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> No preservatives</li>
            </ul>

            <Accordion type="multiple" className="mt-8">
              <AccordionItem value="benefits">
                <AccordionTrigger className="font-display text-lg">Benefits</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    {(product.benefits || []).map((b) => (
                      <li key={b} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {b}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="ingredients">
                <AccordionTrigger className="font-display text-lg">Ingredients</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-muted-foreground">
                    {(product.ingredients || []).map((i) => (
                      <li key={i} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {i}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="usage">
                <AccordionTrigger className="font-display text-lg">Usage & dosage</AccordionTrigger>
                <AccordionContent className="space-y-2 text-muted-foreground">
                  <p>{product.usageInstructions}</p>
                  <p className="text-sm text-muted-foreground/80">{product.dosage}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="safety">
                <AccordionTrigger className="font-display text-lg">Safety information</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.precautions}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </Section>

      {related.length > 0 && (
        <Section>
          <h2 className="font-display text-3xl text-foreground sm:text-4xl">You may also like</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to={`/products/${p.slug}`}
                className="group overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={p.featuredImageUrl || FALLBACK_PRODUCTS[0]?.featuredImageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="flex items-start justify-between gap-4 p-6">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-lg text-foreground">{p.name}</h3>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold text-primary">
                    {formatINRFromPaise(p.discountPricePaise ?? p.pricePaise)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
