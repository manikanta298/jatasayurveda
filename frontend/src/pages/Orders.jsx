import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { Section, Eyebrow } from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { useCustomerAuth } from "@/lib/customerAuth";
import { listMyOrders } from "@/lib/queries";
import { formatINRFromPaise, formatDateTime } from "@/lib/format";

const orderMessages = {
  created: "Order created",
  paid: "Payment received",
  processing: "Preparing your order",
  shipped: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function paymentLabel(order) {
  if (order.paymentMethod === "cod" || order.paymentStatus === "collected") return order.paymentStatus === "collected" ? "Collected" : "Cash on Delivery";
  return order.paymentStatus === "paid" ? "Online Payment - Paid" : "Online Payment - Pending";
}

export default function Orders() {
  const { customer, loading: authLoading } = useCustomerAuth();
  const q = useQuery({ queryKey: ["my-orders"], queryFn: listMyOrders, enabled: Boolean(customer) });

  if (authLoading || q.isLoading) {
    return <Section className="py-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></Section>;
  }

  if (!customer) {
    return (
      <Section className="py-24 text-center">
        <Eyebrow>Orders</Eyebrow>
        <h1 className="mt-3 font-display text-3xl">Sign in to view your orders</h1>
        <Button asChild className="mt-6 rounded-full"><Link to="/auth">Sign in</Link></Button>
      </Section>
    );
  }

  const orders = q.data || [];

  return (
    <Section className="pt-14 pb-24">
      <Eyebrow>Your account</Eyebrow>
      <h1 className="mt-3 font-display text-4xl font-semibold">Order history</h1>
      <p className="mt-2 text-muted-foreground">Track past orders and see their payment status clearly.</p>

      <div className="mx-auto mt-10 max-w-4xl space-y-4">
        {orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl">No orders yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your completed purchases will appear here.</p>
            <Button asChild className="mt-5 rounded-full"><Link to="/products">Shop products</Link></Button>
          </div>
        ) : orders.map((order) => (
          <article key={order._id} className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{order.orderNumber}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-semibold text-primary">{formatINRFromPaise(order.totalPaise)}</p>
                <p className={`mt-1 text-xs font-medium ${order.paymentStatus === "collected" || order.paymentStatus === "paid" ? "text-primary" : "text-muted-foreground"}`}>
                  {paymentLabel(order)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <div>
                <span className="text-sm font-medium">{orderMessages[order.status] || order.status}</span>
                <span className="ml-2 text-xs text-muted-foreground">{order.items?.length || 0} item(s)</span>
              </div>
              <Button asChild variant="outline" className="rounded-full">
                <Link to={`/order/${order.orderNumber}`} state={{ email: customer.email }}>View order <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
