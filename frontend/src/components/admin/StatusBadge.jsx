import { cn } from "@/lib/utils";

// Note: the source app's first status was "pending_payment" — this backend's
// Order model (Phase 3) names it "created" instead. Everything else matches.
const MAP = {
  created: { label: "Pending payment", cls: "bg-amber-100 text-amber-900" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-900" },
  processing: { label: "Processing", cls: "bg-blue-100 text-blue-900" },
  shipped: { label: "Shipped", cls: "bg-indigo-100 text-indigo-900" },
  delivered: { label: "Delivered", cls: "bg-primary/15 text-primary" },
  cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
  refunded: { label: "Refunded", cls: "bg-rose-100 text-rose-900" },
};

export function StatusBadge({ status }) {
  const m = MAP[status] ?? { label: status, cls: "bg-muted text-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", m.cls)}>
      {m.label}
    </span>
  );
}
