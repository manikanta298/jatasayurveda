import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";
import { getAdminOrder, updateOrderStatus as updateOrderStatusApi, updateOrderPaymentStatus } from "@/lib/queries";
import { formatINRFromPaise, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ORDER_STATUSES = ["created", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["admin-order", id], queryFn: () => getAdminOrder(id) });

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [collecting, setCollecting] = useState(false);

  async function handleUpdate() {
    if (!newStatus) return;
    setBusy(true);
    try {
      await updateOrderStatusApi(id, { status: newStatus, note: note || undefined });
      toast.success("Status updated");
      setNote("");
      setNewStatus("");
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (q.isLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (q.error) return <p className="p-8 text-destructive">{q.error.message}</p>;
  const order = q.data;
  const history = [...(order.statusHistory || [])].reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </Link>
          <h1 className="mt-1 font-display text-3xl">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <Button asChild variant="outline" className="rounded-full">
            <Link to={`/admin/orders/${id}/invoice`} target="_blank">
              <Printer className="mr-2 h-4 w-4" /> Print invoice
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Items">
            <div className="divide-y divide-border">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.slug} · Qty {it.quantity}</div>
                  </div>
                  <div>{formatINRFromPaise(it.unitPricePaise * it.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
              <Row label="Subtotal" value={formatINRFromPaise(order.subtotalPaise)} />
              <Row label="Shipping" value={formatINRFromPaise(order.shippingPaise)} />
              {order.discountPaise > 0 && <Row label="Discount" value={`-${formatINRFromPaise(order.discountPaise)}`} />}
              <Row label="Total" value={formatINRFromPaise(order.totalPaise)} bold />
            </div>
          </Card>

          <Card title="Update status">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.filter((s) => s !== order.status).map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleUpdate} disabled={!newStatus || busy} className="rounded-full">
                {busy ? "Updating…" : "Apply"}
              </Button>
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note (tracking number, reason, etc.)" className="mt-3" rows={2} />
          </Card>

          <Card title="Status history">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No changes yet.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="border-l-2 border-primary/40 pl-3 text-sm">
                    <div className="flex items-center gap-2">
                      {h.fromStatus && <StatusBadge status={h.fromStatus} />}
                      <span className="text-muted-foreground">→</span>
                      <StatusBadge status={h.toStatus} />
                      <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(h.changedAt)}</span>
                    </div>
                    {h.note && <p className="mt-1 text-muted-foreground">{h.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
          </Card>
          <Card title="Shipping address">
            <p className="text-sm">{order.shippingAddress?.line1}</p>
            {order.shippingAddress?.line2 && <p className="text-sm">{order.shippingAddress.line2}</p>}
            <p className="text-sm">{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
            <p className="text-sm">{order.shippingAddress?.country}</p>
          </Card>
          <Card title="Payment">
            <Row label="Method" value={order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod} small />
            <Row label="Payment status" value={order.paymentStatus === "collected" ? "Collected" : order.paymentStatus === "paid" ? "Online Payment - Paid" : "Online Payment - Pending"} small />
            <Row label="Razorpay Order" value={order.razorpayOrderId ?? "—"} small />
            <Row label="Razorpay Payment" value={order.razorpayPaymentId ?? "—"} small />
            <Row label="Paid at" value={order.paidAt ? formatDateTime(order.paidAt) : "—"} small />
            {order.paymentMethod === "cod" && order.paymentStatus !== "collected" && (
              <Button
                className="mt-3 w-full rounded-full"
                disabled={collecting}
                onClick={async () => {
                  setCollecting(true);
                  try {
                    await updateOrderPaymentStatus(id, "collected");
                    toast.success("Cash marked as Collected");
                    qc.invalidateQueries({ queryKey: ["admin-order", id] });
                    qc.invalidateQueries({ queryKey: ["admin-orders"] });
                  } catch (e) {
                    toast.error(e.message || "Could not update payment status");
                  } finally {
                    setCollecting(false);
                  }
                }}
              >
                {collecting ? "Saving…" : "Mark COD as Collected"}
              </Button>
            )}
          </Card>
          {order.notes && (
            <Card title="Customer notes">
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="pb-2 font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, value, bold, small }) {
  return (
    <div className={`flex items-center justify-between gap-2 ${small ? "text-xs" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
