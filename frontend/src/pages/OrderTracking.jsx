import { useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderByNumber } from "@/lib/queries";
import { formatINRFromPaise } from "@/lib/format";

const STATUS_MESSAGES = {
  created: "Awaiting payment confirmation.",
  paid: "Payment received — we're preparing your order.",
  processing: "Your order is being prepared for dispatch.",
  shipped: "Your order is on its way.",
  delivered: "Your order has been delivered.",
  cancelled: "This order was cancelled.",
  refunded: "This order was refunded.",
};

export default function OrderTracking() {
  const { orderNumber } = useParams();
  const location = useLocation();
  // Right after checkout, Checkout.jsx hands us the customer's email via
  // router state so this page can show full details without another step.
  // On a fresh visit (e.g. a bookmarked/shared link, or a page refresh) that
  // state is gone, so we fall back to asking for it — the backend only
  // returns customer PII when the email matches this order.
  const [email, setEmail] = useState(location.state?.email || "");
  const [emailInput, setEmailInput] = useState("");

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ["order", orderNumber, email],
    queryFn: () => getOrderByNumber(orderNumber, email ? { email } : {}),
  });

  if (isLoading) return null;

  if (isError || !order) {
    return (
      <Section className="py-24 text-center">
        <h1 className="font-display text-3xl text-foreground">
          {isError ? "Something went wrong" : "Order not found"}
        </h1>
        {isError && <p className="mt-2 text-muted-foreground">{error?.message}</p>}
        <Button asChild className="mt-6 rounded-full">
          <Link to="/products">Continue shopping</Link>
        </Button>
      </Section>
    );
  }

  const items = order.items ?? [];
  // The backend only includes these fields once the email has been verified
  // against the order — their absence means we're looking at the masked,
  // status-only view.
  const verified = Boolean(order.customerName);

  return (
    <Section className="pt-14 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-9 w-9 text-primary" />
          </div>
          {verified ? (
            <>
              <h1 className="mt-6 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Thank you, {order.customerName.split(" ")[0]}!
              </h1>
              <p className="mt-3 text-muted-foreground">
                Your order is confirmed. A copy has been sent to{" "}
                <span className="text-foreground">{order.customerEmail}</span>.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-6 font-display text-3xl font-semibold text-foreground sm:text-4xl">
                Order {order.orderNumber}
              </h1>
              <p className="mt-3 text-muted-foreground">
                Status: <span className="font-medium text-foreground capitalize">{order.status.replace(/_/g, " ")}</span>
              </p>
              <form
                className="mx-auto mt-6 flex max-w-sm gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEmail(emailInput.trim());
                }}
              >
                <Input
                  type="email"
                  required
                  placeholder="Enter the email used at checkout"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <Button type="submit" className="shrink-0 rounded-full">
                  Verify
                </Button>
              </form>
            </>
          )}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Package className="h-4 w-4" />
            Order <span className="font-semibold">{order.orderNumber}</span>
          </div>
        </div>

        {verified && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-lg text-foreground">Shipping to</h2>
              <address className="mt-3 not-italic text-sm leading-relaxed text-muted-foreground">
                <span className="block text-foreground">{order.customerName}</span>
                {order.shippingAddress?.line1}<br />
                {order.shippingAddress?.line2 && (<>{order.shippingAddress.line2}<br /></>)}
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
                {order.shippingAddress?.country}<br />
                <span className="mt-2 block">{order.customerPhone}</span>
              </address>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="font-display text-lg text-foreground">Payment</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Order status: <span className="font-medium text-foreground capitalize">{order.status.replace(/_/g, " ")}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Payment: <span className="font-medium text-foreground">
                  {order.paymentStatus === "collected"
                    ? "Collected"
                    : order.paymentMethod === "cod"
                      ? "Cash on Delivery"
                      : order.paymentStatus === "paid"
                        ? "Online Payment - Paid"
                        : "Online Payment - Pending"}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {STATUS_MESSAGES[order.status] || "Our team will reach out with any updates."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-7">
          <h2 className="font-display text-lg text-foreground">Order summary</h2>
          <ul className="mt-4 divide-y divide-border/60">
            {items.map((it) => (
              <li key={it.slug} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {it.quantity} · {formatINRFromPaise(it.unitPricePaise)}</p>
                </div>
                <p className="text-sm font-medium text-foreground">{formatINRFromPaise(it.quantity * it.unitPricePaise)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            {verified && (
              <>
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINRFromPaise(order.subtotalPaise)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{order.shippingPaise === 0 ? "Free" : formatINRFromPaise(order.shippingPaise)}</dd></div>
              </>
            )}
            <div className="flex justify-between border-t border-border pt-3">
              <dt className="font-display text-lg text-foreground">Total</dt>
              <dd className="font-display text-xl font-semibold text-primary">{formatINRFromPaise(order.totalPaise)}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/products">Continue shopping <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-primary/30 text-primary">
            <Link to="/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
