import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/queries";
import { formatINRFromPaise, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default function Dashboard() {
  // Polling instead of the original's Supabase realtime subscription for new
  // orders — see MIGRATION_PLAN.md, Phase 5a notes.
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getDashboardSummary,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const toFulfil = (data?.ordersByStatus?.paid || 0) + (data?.ordersByStatus?.processing || 0);
  const awaitingPayment = data?.ordersByStatus?.created || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the last 30 days and the fulfilment queue.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Orders (30 days)" value={data?.last30Days?.orderCount ?? "—"} />
        <Stat label="Revenue (30 days)" value={data ? formatINRFromPaise(data.last30Days.revenuePaise) : "—"} />
        <Stat label="To fulfil" value={data ? toFulfil : "—"} />
        <Stat label="Awaiting payment" value={data ? awaitingPayment : "—"} />
      </div>

      {data?.lowStockProducts?.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-display text-lg text-amber-900">Low stock</h2>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {data.lowStockProducts.map((p) => (
              <li key={p._id} className="flex justify-between">
                <Link to={`/admin/products/${p._id}`} className="hover:underline">{p.name}</Link>
                <span>{p.stockQuantity} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between pb-3">
          <h2 className="font-display text-xl">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (data?.recentOrders?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Placed</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id} className="border-t border-border">
                    <td className="px-2 py-2">
                      <Link to={`/admin/orders/${o._id}`} className="font-medium text-primary hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-2 py-2">{o.customerName}</td>
                    <td className="px-2 py-2">{formatINRFromPaise(o.totalPaise)}</td>
                    <td className="px-2 py-2"><StatusBadge status={o.status} /></td>
                    <td className="px-2 py-2 text-muted-foreground">{formatDateTime(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl text-foreground">{value}</p>
    </div>
  );
}
